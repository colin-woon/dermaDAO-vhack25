// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title ProjectWallet
 * @dev Smart contract wallet for each charity project
 */
contract ProjectWallet {
    address public platform;
    address public charityAdmin;
    uint256 public projectId;
    IERC20 public token;
    
    event FundsReceived(uint256 amount, uint256 timestamp);
    event FundsSent(address destination, uint256 amount, uint256 proposalId, uint256 timestamp);
    
    constructor() {
        // Do not set platform in constructor since clones don't execute constructor
    }
    
    function initialize(address _token, address _charityAdmin, uint256 _projectId) external {
        // Allow initialization only if not yet initialized
        require(charityAdmin == address(0), "Already initialized");
        
        // Set the initializer as the platform
        platform = msg.sender;
        token = IERC20(_token);
        charityAdmin = _charityAdmin;
        projectId = _projectId;
    }
    
    function transferFunds(address _destination, uint256 _amount, uint256 _proposalId) external {
        require(msg.sender == platform, "Only platform can transfer funds");
        require(_destination != address(0), "Destination cannot be zero address");
        require(_amount > 0, "Amount must be greater than 0");
        
        bool success = token.transfer(_destination, _amount);
        require(success, "Transfer failed");
        
        emit FundsSent(_destination, _amount, _proposalId, block.timestamp);
    }
    
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}

/**
 * @title CharityPlatform
 * @dev Main contract for the Charity Platform that enables quadratic funding for charity projects
 */
contract CharityPlatform is Ownable, ReentrancyGuard {
    // DermaCoin token instance
    IERC20 public dermaCoin;
    
    // Project wallet implementation for cloning
    address public projectWalletImplementation;
    
    // Platform fee (1%)
    uint256 public constant PLATFORM_FEE = 100; // 1% = 100/10000
    
    // Minimum donation amount to prevent dust attacks and rounding issues
    uint256 public constant MINIMUM_DONATION = 100; // Set a reasonable minimum based on token decimals
    
    // Charity organization structure
    struct Charity {
        string name;
        string description;
        address admin;
        bool isVerified;
    }
    
    // Project structure
    struct Project {
        string name;
        string description;
        string ipfsHash; // For additional data
        uint256 charityId;
        uint256 allocatedFunds; // Funds allocated through quadratic funding
        bool isActive;
        address projectWallet; // Address of the project's dedicated wallet
    }
    
    // Proposal structure
    struct Proposal {
        uint256 projectId;
        string description;
        string ipfsHash; // For proposal details
        uint256 requestedAmount;
        address destinationAddress; // Where funds will be sent if approved
        bool isApproved;
        bool isClaimed;
    }
    
    // Transaction record for transparency
    struct Transaction {
        uint256 projectId;
        uint256 proposalId;
        address destination;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Round structure for quadratic funding
    struct Round {
        uint256 startTime;
        uint256 endTime;
        bool isDistributed;
        uint256 totalPoolAmount;
    }
    
    // Donation record
    struct Donation {
        address donor;
        uint256 projectId;
        uint256 amount;
        uint256 roundId;
    }
    
    // State variables
    Charity[] public charities;
    Project[] public projects;
    Proposal[] public proposals;
    Round[] public rounds;
    Donation[] public donations;
    Transaction[] public transactions;
    
    // Mappings for easier access
    mapping(address => bool) public isCharityAdmin;
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public donationsByDonorAndProject; // roundId => donor => projectId => amount
    mapping(uint256 => mapping(uint256 => uint256)) public totalDonationsByProject; // roundId => projectId => total donations
    mapping(uint256 => mapping(uint256 => uint256)) public uniqueDonorsByProject; // roundId => projectId => unique donors count
    
    // Platform wallet for fees
    address public feeWallet;
    
    // Events
    event CharityRegistered(uint256 indexed charityId, string name, address admin);
    event CharityVerified(uint256 indexed charityId, bool verified);
    event ProjectCreated(uint256 indexed projectId, uint256 indexed charityId, string name, address projectWallet);
    event DonationReceived(address indexed donor, uint256 indexed projectId, uint256 amount, uint256 indexed roundId);
    event RoundCreated(uint256 indexed roundId, uint256 startTime, uint256 endTime);
    event FundsDistributed(uint256 indexed roundId);
    event ProjectFundingAllocated(uint256 indexed roundId, uint256 indexed projectId, uint256 amount);
    event ProposalSubmitted(uint256 indexed proposalId, uint256 indexed projectId, uint256 requestedAmount, address destinationAddress);
    event ProposalApproved(uint256 indexed proposalId);
    event FundsClaimed(uint256 indexed proposalId, uint256 projectId, address destination, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _dermaCoin Address of the DermaCoin token
     * @param initialOwner Address of the initial owner
     */
    constructor(address _dermaCoin, address initialOwner) Ownable(initialOwner) {
        dermaCoin = IERC20(_dermaCoin);
        feeWallet = initialOwner; // Initially set fee wallet to owner
        
        // Deploy the project wallet implementation
        projectWalletImplementation = address(new ProjectWallet());
        
        // Create the first round
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 30 days;
        rounds.push(Round(startTime, endTime, false, 0));
        emit RoundCreated(0, startTime, endTime);
    }
    
    /**
     * @dev Set the wallet to receive platform fees
     * @param _feeWallet The address to receive fees
     */
    function setFeeWallet(address _feeWallet) external onlyOwner {
        require(_feeWallet != address(0), "Fee wallet cannot be zero address");
        feeWallet = _feeWallet;
    }
    
    /**
     * @dev Register a new charity (to be verified by admin)
     * @param _name Name of the charity
     * @param _description Description of the charity
     */
    function registerCharity(string memory _name, string memory _description) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        charities.push(Charity({
            name: _name,
            description: _description,
            admin: msg.sender,
            isVerified: false
        }));
        
        emit CharityRegistered(charities.length - 1, _name, msg.sender);
    }
    
    /**
     * @dev Admin verifies a charity
     * @param _charityId ID of the charity to verify
     * @param _verified Verification status to set
     */
    function verifyCharity(uint256 _charityId, bool _verified) external onlyOwner {
        require(_charityId < charities.length, "Charity does not exist");
        
        Charity storage charity = charities[_charityId];
        charity.isVerified = _verified;
        
        if (_verified) {
            isCharityAdmin[charity.admin] = true;
        } else {
            isCharityAdmin[charity.admin] = false;
        }
        
        emit CharityVerified(_charityId, _verified);
    }
    
    /**
     * @dev Charity admin creates a new project with its own wallet
     * @param _charityId ID of the charity creating the project
     * @param _name Name of the project
     * @param _description Description of the project
     * @param _ipfsHash IPFS hash for additional project data
     */
    function createProject(
        uint256 _charityId, 
        string memory _name, 
        string memory _description, 
        string memory _ipfsHash
    ) external {
        require(_charityId < charities.length, "Charity does not exist");
        require(charities[_charityId].isVerified, "Charity is not verified");
        require(charities[_charityId].admin == msg.sender, "Not the charity admin");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        
        // Create a unique salt for the project wallet
        bytes32 salt = keccak256(abi.encodePacked(_charityId, projects.length, block.timestamp, msg.sender));
        
        // Clone the project wallet implementation
        address projectWallet = Clones.cloneDeterministic(projectWalletImplementation, salt);
        
        // Initialize the project wallet
        ProjectWallet(projectWallet).initialize(address(dermaCoin), msg.sender, projects.length);
        
        // Create the project with its wallet
        projects.push(Project({
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            charityId: _charityId,
            allocatedFunds: 0,
            isActive: true,
            projectWallet: projectWallet
        }));
        
        emit ProjectCreated(projects.length - 1, _charityId, _name, projectWallet);
    }
    
    /**
     * @dev Donate to a specific project
     * @param _projectId ID of the project to donate to
     * @param _amount Amount of DermaCoins to donate
     */
    function donate(uint256 _projectId, uint256 _amount) external nonReentrant {
        require(_projectId < projects.length, "Project does not exist");
        require(projects[_projectId].isActive, "Project is not active");
        require(_amount >= MINIMUM_DONATION, "Donation amount too small");
        
        // Get the current round
        uint256 currentRoundId = getCurrentRoundId();
        Round storage round = rounds[currentRoundId];
        
        // Check if the round is still active
        require(block.timestamp >= round.startTime && block.timestamp <= round.endTime, "Round is not active");
        
        // Calculate platform fee
        uint256 fee = (_amount * PLATFORM_FEE) / 10000;
        uint256 donationAmount = _amount - fee;
        
        // Transfer DermaCoin from donor to the contract
        bool transferSuccess = dermaCoin.transferFrom(msg.sender, address(this), _amount);
        require(transferSuccess, "Transfer failed");
        
        // Transfer fee to the fee wallet
        if (fee > 0) {
            bool feeTransferSuccess = dermaCoin.transfer(feeWallet, fee);
            require(feeTransferSuccess, "Fee transfer failed");
        }
        
        // Update donation records
        if (donationsByDonorAndProject[currentRoundId][msg.sender][_projectId] == 0) {
            uniqueDonorsByProject[currentRoundId][_projectId]++;
        }
        
        donationsByDonorAndProject[currentRoundId][msg.sender][_projectId] += donationAmount;
        totalDonationsByProject[currentRoundId][_projectId] += donationAmount;
        round.totalPoolAmount += donationAmount;
        
        // Record the donation
        donations.push(Donation({
            donor: msg.sender,
            projectId: _projectId,
            amount: donationAmount,
            roundId: currentRoundId
        }));
        
        emit DonationReceived(msg.sender, _projectId, donationAmount, currentRoundId);
    }
    
    /**
     * @dev Get the current round ID
     * @return The ID of the current active round
     */
    function getCurrentRoundId() public view returns (uint256) {
        return rounds.length - 1;
    }
    
    /**
     * @dev Create a new round (automatically called when distributing funds)
     */
    function createNewRound() internal {
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 30 days;
        rounds.push(Round(startTime, endTime, false, 0));
        emit RoundCreated(rounds.length - 1, startTime, endTime);
    }
    
    /**
     * @dev Admin function to distribute funds using quadratic funding
     * @return An array of project IDs and their allocated funding amounts
     */
    function distributeRoundFunds() external onlyOwner returns (uint256[] memory, uint256[] memory) {
        uint256 currentRoundId = getCurrentRoundId();
        Round storage round = rounds[currentRoundId];
        
        // Check if the round is already distributed
        require(!round.isDistributed, "Round already distributed");
        
        // Calculate quadratic funding allocation
        (uint256[] memory projectIds, uint256[] memory allocations) = calculateQuadraticFunding(currentRoundId);
        
        // Transfer funds to project wallets
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (allocations[i] > 0) {
                uint256 projectId = projectIds[i];
                Project storage project = projects[projectId];
                
                // Transfer funds to project wallet
                bool transferSuccess = dermaCoin.transfer(project.projectWallet, allocations[i]);
                require(transferSuccess, "Transfer to project wallet failed");
            }
        }
        
        // Mark round as distributed
        round.isDistributed = true;
        
        // Create a new round
        createNewRound();
        
        emit FundsDistributed(currentRoundId);
        return (projectIds, allocations);
    }
    
    /**
     * @dev Calculate quadratic funding allocation
     * @param _roundId ID of the round to calculate funding for
     * @return projectIds Array of project IDs that received funding
     * @return allocations Array of funding amounts corresponding to projectIds
     */
    function calculateQuadraticFunding(uint256 _roundId) internal returns (uint256[] memory, uint256[] memory) {
        Round storage round = rounds[_roundId];
        uint256 totalPoolAmount = round.totalPoolAmount;
        
        // Count active projects
        uint256 activeProjectCount = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].isActive && totalDonationsByProject[_roundId][i] > 0) {
                activeProjectCount++;
            }
        }
        
        // Initialize return arrays
        uint256[] memory projectIds = new uint256[](activeProjectCount);
        uint256[] memory allocations = new uint256[](activeProjectCount);
        
        if (totalPoolAmount == 0 || activeProjectCount == 0) {
            return (projectIds, allocations); // No donations or active projects in this round
        }
        
        // Calculate each project's quadratic contribution
        uint256[] memory projectQuadraticContributions = new uint256[](projects.length);
        uint256 totalQuadraticContribution = 0;
        
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].isActive && totalDonationsByProject[_roundId][i] > 0) {
                // Square root of sum of squares of contributions
                uint256 sumOfSquareRoots = 0;
                
                // Get all donations for this project in this round
                for (uint256 j = 0; j < donations.length; j++) {
                    if (donations[j].roundId == _roundId && donations[j].projectId == i) {
                        // Add square root of donation amount
                        sumOfSquareRoots += sqrt(donations[j].amount);
                    }
                }
                
                // Square the sum of square roots
                uint256 quadraticContribution = sumOfSquareRoots * sumOfSquareRoots;
                projectQuadraticContributions[i] = quadraticContribution;
                totalQuadraticContribution += quadraticContribution;
            }
        }
        
        // Allocate funds based on quadratic contribution
        uint256 projectIndex = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].isActive && totalDonationsByProject[_roundId][i] > 0 && totalQuadraticContribution > 0) {
                uint256 allocation = (totalPoolAmount * projectQuadraticContributions[i]) / totalQuadraticContribution;
                projects[i].allocatedFunds += allocation;
                
                projectIds[projectIndex] = i;
                allocations[projectIndex] = allocation;
                projectIndex++;
                
                emit ProjectFundingAllocated(_roundId, i, allocation);
            }
        }
        
        return (projectIds, allocations);
    }
    
    /**
     * @dev Submit a proposal to claim funds
     * @param _projectId ID of the project to claim funds for
     * @param _description Description of the proposal
     * @param _ipfsHash IPFS hash for additional proposal details
     * @param _requestedAmount Amount of funds requested
     * @param _destinationAddress Address where funds will be sent if approved
     */
    function submitProposal(
        uint256 _projectId, 
        string memory _description, 
        string memory _ipfsHash, 
        uint256 _requestedAmount,
        address _destinationAddress
    ) external {
        require(_projectId < projects.length, "Project does not exist");
        require(projects[_projectId].isActive, "Project is not active");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_destinationAddress != address(0), "Destination address cannot be zero");
        
        uint256 charityId = projects[_projectId].charityId;
        require(charities[charityId].admin == msg.sender, "Not the charity admin");
        
        // Check project wallet balance
        uint256 projectBalance = ProjectWallet(projects[_projectId].projectWallet).getBalance();
        require(_requestedAmount <= projectBalance, "Requested amount exceeds project wallet balance");
        require(_requestedAmount > 0, "Requested amount must be greater than 0");
        
        proposals.push(Proposal({
            projectId: _projectId,
            description: _description,
            ipfsHash: _ipfsHash,
            requestedAmount: _requestedAmount,
            destinationAddress: _destinationAddress,
            isApproved: false,
            isClaimed: false
        }));
        
        emit ProposalSubmitted(proposals.length - 1, _projectId, _requestedAmount, _destinationAddress);
    }
    
    /**
     * @dev Approve a proposal (any user can approve after AI validation)
     * @param _proposalId ID of the proposal to approve
     */
    function approveProposal(uint256 _proposalId) external {
        require(_proposalId < proposals.length, "Proposal does not exist");
        require(!proposals[_proposalId].isApproved, "Proposal already approved");
        require(!proposals[_proposalId].isClaimed, "Proposal already claimed");
        
        Proposal storage proposal = proposals[_proposalId];
        proposal.isApproved = true;
        
        emit ProposalApproved(_proposalId);
    }
    
    /**
     * @dev Claim funds after proposal is approved
     * @param _proposalId ID of the approved proposal to claim funds for
     */
    function claimFunds(uint256 _proposalId) external nonReentrant {
        require(_proposalId < proposals.length, "Proposal does not exist");
        require(proposals[_proposalId].isApproved, "Proposal not approved");
        require(!proposals[_proposalId].isClaimed, "Proposal already claimed");
        
        Proposal storage proposal = proposals[_proposalId];
        uint256 projectId = proposal.projectId;
        uint256 charityId = projects[projectId].charityId;
        
        require(charities[charityId].admin == msg.sender, "Not the charity admin");
        
        // Check project wallet balance
        uint256 projectBalance = ProjectWallet(projects[projectId].projectWallet).getBalance();
        require(proposal.requestedAmount <= projectBalance, "Insufficient funds in project wallet");
        
        // Mark proposal as claimed
        proposal.isClaimed = true;
        
        // Transfer funds from project wallet to destination
        ProjectWallet(projects[projectId].projectWallet).transferFunds(
            proposal.destinationAddress,
            proposal.requestedAmount,
            _proposalId
        );
        
        // Record the transaction
        transactions.push(Transaction({
            projectId: projectId,
            proposalId: _proposalId,
            destination: proposal.destinationAddress,
            amount: proposal.requestedAmount,
            timestamp: block.timestamp
        }));
        
        emit FundsClaimed(_proposalId, projectId, proposal.destinationAddress, proposal.requestedAmount);
    }
    
    /**
     * @dev Get project wallet balance
     * @param _projectId ID of the project
     * @return The balance of the project wallet
     */
    function getProjectWalletBalance(uint256 _projectId) external view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return ProjectWallet(projects[_projectId].projectWallet).getBalance();
    }
    
    /**
     * @dev Get project wallet address
     * @param _projectId ID of the project
     * @return The address of the project wallet
     */
    function getProjectWalletAddress(uint256 _projectId) external view returns (address) {
        require(_projectId < projects.length, "Project does not exist");
        return projects[_projectId].projectWallet;
    }
    
    /**
     * @dev Get a charity's projects
     * @param _charityId ID of the charity
     * @return Array of project IDs belonging to the charity
     */
    function getCharityProjects(uint256 _charityId) external view returns (uint256[] memory) {
        require(_charityId < charities.length, "Charity does not exist");
        
        // Count projects
        uint256 count = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].charityId == _charityId) {
                count++;
            }
        }
        
        // Get project IDs
        uint256[] memory projectIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].charityId == _charityId) {
                projectIds[index] = i;
                index++;
            }
        }
        
        return projectIds;
    }
    
    /**
     * @dev Get a project's proposals
     * @param _projectId ID of the project
     * @return Array of proposal IDs belonging to the project
     */
    function getProjectProposals(uint256 _projectId) external view returns (uint256[] memory) {
        require(_projectId < projects.length, "Project does not exist");
        
        // Count proposals
        uint256 count = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].projectId == _projectId) {
                count++;
            }
        }
        
        // Get proposal IDs
        uint256[] memory proposalIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].projectId == _projectId) {
                proposalIds[index] = i;
                index++;
            }
        }
        
        return proposalIds;
    }
    
    /**
     * @dev Get project transactions for transparency
     * @param _projectId ID of the project
     * @return Array of transaction indices for the project
     */
    function getProjectTransactions(uint256 _projectId) external view returns (uint256[] memory) {
        require(_projectId < projects.length, "Project does not exist");
        
        // Count transactions
        uint256 count = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].projectId == _projectId) {
                count++;
            }
        }
        
        // Get transaction indices
        uint256[] memory transactionIndices = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].projectId == _projectId) {
                transactionIndices[index] = i;
                index++;
            }
        }
        
        return transactionIndices;
    }
    
    /**
     * @dev Get information about active projects in the current round
     * @return projectIds Array of active project IDs
     * @return uniqueDonors Array of unique donor counts for each project
     * @return donationAmounts Array of total donation amounts for each project
     */
    function getCurrentRoundProjectStats() external view returns (
        uint256[] memory, 
        uint256[] memory, 
        uint256[] memory
    ) {
        uint256 currentRoundId = getCurrentRoundId();
        
        // Count active projects
        uint256 activeProjectCount = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].isActive) {
                activeProjectCount++;
            }
        }
        
        uint256[] memory projectIds = new uint256[](activeProjectCount);
        uint256[] memory uniqueDonors = new uint256[](activeProjectCount);
        uint256[] memory donationAmounts = new uint256[](activeProjectCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < projects.length; i++) {
            if (projects[i].isActive) {
                projectIds[index] = i;
                uniqueDonors[index] = uniqueDonorsByProject[currentRoundId][i];
                donationAmounts[index] = totalDonationsByProject[currentRoundId][i];
                index++;
            }
        }
        
        return (projectIds, uniqueDonors, donationAmounts);
    }
    
    /**
     * @dev Helper function: Square root calculation (Babylonian method)
     * @param x The number to calculate the square root of
     * @return y The square root of x
     */
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }
}