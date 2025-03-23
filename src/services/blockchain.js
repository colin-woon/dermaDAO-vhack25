const { ethers } = require('ethers');

// Import ABI files
const DermaCoinABI = require('../contracts/DermaCoin.json');
const CharityPlatformABI = require('../contracts/CharityPlatform.json');

// Contract addresses
const DERMACOIN_ADDRESS = process.env.DERMACOIN_ADDRESS;
const CHARITY_PLATFORM_ADDRESS = process.env.CHARITY_PLATFORM_ADDRESS;

// Provider
const provider = new ethers.JsonRpcProvider(process.env.SCROLL_SEPOLIA_RPC_URL);

// Contract instances (read-only)
const dermaCoin = new ethers.Contract(DERMACOIN_ADDRESS, DermaCoinABI, provider);
const charityPlatform = new ethers.Contract(CHARITY_PLATFORM_ADDRESS, CharityPlatformABI, provider);

/**
 * Get a signer with the provided private key
 * @param {string} privateKey - Private key for the wallet
 * @returns {ethers.Wallet} - Signer instance
 */
const getSigner = (privateKey) => {
  return new ethers.Wallet(privateKey, provider);
};

/**
 * Get contract instances with a signer for write operations
 * @param {ethers.Signer} signer - Signer for transactions
 * @returns {Object} - Contract instances with signer
 */
const getSignedContracts = (signer) => {
  return {
    dermaCoin: dermaCoin.connect(signer),
    charityPlatform: charityPlatform.connect(signer)
  };
};

// READ FUNCTIONS (View functions that don't require signing)

/**
 * Get charity details from blockchain
 * @param {number} charityId - Blockchain charity ID
 * @returns {Promise<Object>} - Charity details
 */
const getCharity = async (charityId) => {
  try {
    return await charityPlatform.charities(charityId);
  } catch (error) {
    console.error('Error fetching charity:', error);
    throw new Error('Failed to fetch charity from blockchain');
  }
};

/**
 * Get project details from blockchain
 * @param {number} projectId - Blockchain project ID
 * @returns {Promise<Object>} - Project details
 */
const getProject = async (projectId) => {
  try {
    return await charityPlatform.projects(projectId);
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project from blockchain');
  }
};

/**
 * Get current round ID
 * @returns {Promise<number>} - Current round ID
 */
const getCurrentRoundId = async () => {
  try {
    return await charityPlatform.getCurrentRoundId();
  } catch (error) {
    console.error('Error fetching current round ID:', error);
    throw new Error('Failed to fetch current round ID from blockchain');
  }
};

/**
 * Get round details
 * @param {number} roundId - Round ID
 * @returns {Promise<Object>} - Round details
 */
const getRound = async (roundId) => {
  try {
    return await charityPlatform.rounds(roundId);
  } catch (error) {
    console.error('Error fetching round:', error);
    throw new Error('Failed to fetch round from blockchain');
  }
};

/**
 * Get proposal details
 * @param {number} proposalId - Proposal ID
 * @returns {Promise<Object>} - Proposal details
 */
const getProposal = async (proposalId) => {
  try {
    return await charityPlatform.proposals(proposalId);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    throw new Error('Failed to fetch proposal from blockchain');
  }
};

/**
 * Get transaction details
 * @param {number} transactionId - Transaction ID
 * @returns {Promise<Object>} - Transaction details
 */
const getTransaction = async (transactionId) => {
  try {
    return await charityPlatform.transactions(transactionId);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw new Error('Failed to fetch transaction from blockchain');
  }
};

/**
 * Get project wallet balance
 * @param {number} projectId - Project ID
 * @returns {Promise<string>} - Balance in token units
 */
const getProjectWalletBalance = async (projectId) => {
  try {
    const balanceWei = await charityPlatform.getProjectWalletBalance(projectId);
    return ethers.formatUnits(balanceWei, 2); // Using 2 decimals for DermaCoin
  } catch (error) {
    console.error('Error fetching project wallet balance:', error);
    throw new Error('Failed to fetch project wallet balance');
  }
};

/**
 * Get project wallet address
 * @param {number} projectId - Project ID
 * @returns {Promise<string>} - Project wallet address
 */
const getProjectWalletAddress = async (projectId) => {
  try {
    return await charityPlatform.getProjectWalletAddress(projectId);
  } catch (error) {
    console.error('Error fetching project wallet address:', error);
    throw new Error('Failed to fetch project wallet address');
  }
};

/**
 * Get charity's projects
 * @param {number} charityId - Charity ID
 * @returns {Promise<number[]>} - Array of project IDs
 */
const getCharityProjects = async (charityId) => {
  try {
    return (await charityPlatform.getCharityProjects(charityId)).map(id => Number(id));
  } catch (error) {
    console.error('Error fetching charity projects:', error);
    throw new Error('Failed to fetch charity projects');
  }
};

/**
 * Get project's proposals
 * @param {number} projectId - Project ID
 * @returns {Promise<number[]>} - Array of proposal IDs
 */
const getProjectProposals = async (projectId) => {
  try {
    return (await charityPlatform.getProjectProposals(projectId)).map(id => Number(id));
  } catch (error) {
    console.error('Error fetching project proposals:', error);
    throw new Error('Failed to fetch project proposals');
  }
};

/**
 * Get project's transactions
 * @param {number} projectId - Project ID
 * @returns {Promise<number[]>} - Array of transaction indices
 */
const getProjectTransactions = async (projectId) => {
  try {
    return (await charityPlatform.getProjectTransactions(projectId)).map(id => Number(id));
  } catch (error) {
    console.error('Error fetching project transactions:', error);
    throw new Error('Failed to fetch project transactions');
  }
};

/**
 * Get current round project statistics
 * @returns {Promise<Object[]>} - Project stats with IDs, unique donors, and donation amounts
 */
const getCurrentRoundProjectStats = async () => {
  try {
    const [projectIds, uniqueDonors, donationAmounts] = await charityPlatform.getCurrentRoundProjectStats();
    return projectIds.map((id, index) => ({
      projectId: Number(id),
      uniqueDonors: Number(uniqueDonors[index]),
      donationAmount: ethers.formatUnits(donationAmounts[index], 2) // Use 2 for DermaCoin decimals
    }));
  } catch (error) {
    console.error('Error fetching project stats:', error);
    throw new Error('Failed to fetch project statistics from blockchain');
  }
};

/**
 * Get token balance
 * @param {string} address - Wallet address
 * @returns {Promise<string>} - Balance in token units
 */
const getTokenBalance = async (address) => {
  try {
    const balance = await dermaCoin.balanceOf(address);
    return ethers.formatUnits(balance, 2);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw new Error('Failed to fetch token balance');
  }
};

/**
 * Verify the signature from MetaMask
 * @param {string} message - Original message
 * @param {string} signature - Signature
 * @param {string} address - Address claiming to have signed
 * @returns {boolean} - True if signature is valid
 */
const verifySignature = (message, signature, address) => {
  try {
    const signerAddr = ethers.verifyMessage(message, signature);
    return signerAddr.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

// WRITE FUNCTIONS (Functions that modify state and require signing)

/**
 * Register a new charity
 * @param {ethers.Signer} signer - Signer for the transaction
 * @param {string} name - Charity name
 * @param {string} description - Charity description
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const registerCharity = async (signer, name, description) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.registerCharity(name, description);
    return await tx.wait();
  } catch (error) {
    console.error('Error registering charity:', error);
    throw new Error('Failed to register charity');
  }
};

/**
 * Verify a charity (admin only)
 * @param {ethers.Signer} signer - Admin signer
 * @param {number} charityId - Charity ID
 * @param {boolean} verified - Verification status
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const verifyCharity = async (signer, charityId, verified) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.verifyCharity(charityId, verified);
    return await tx.wait();
  } catch (error) {
    console.error('Error verifying charity:', error);
    throw new Error('Failed to verify charity');
  }
};

/**
 * Create a new project
 * @param {ethers.Signer} signer - Charity admin signer
 * @param {number} charityId - Charity ID
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @param {string} ipfsHash - IPFS hash for additional data
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const createProject = async (signer, charityId, name, description, ipfsHash) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.createProject(charityId, name, description, ipfsHash);
    return await tx.wait();
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
};

/**
 * Donate to a project
 * @param {ethers.Signer} signer - Donor signer
 * @param {number} projectId - Project ID
 * @param {string} amount - Amount to donate (in token units)
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const donate = async (signer, projectId, amount) => {
  try {
    const { dermaCoin: signedDermaCoin, charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    
    // Convert amount from token units to wei
    const amountWei = ethers.parseUnits(amount, 2); // Use 2 for DermaCoin decimals
    
    // Approve tokens for the charity platform to spend
    const approveTx = await signedDermaCoin.approve(CHARITY_PLATFORM_ADDRESS, amountWei);
    await approveTx.wait();
    
    // Make the donation
    const donateTx = await signedCharityPlatform.donate(projectId, amountWei);
    return await donateTx.wait();
  } catch (error) {
    console.error('Error making donation:', error);
    throw new Error('Failed to make donation');
  }
};

/**
 * Distribute funds for the current round (admin only)
 * @param {ethers.Signer} signer - Admin signer
 * @returns {Promise<Object>} - Distribution results
 */
const distributeRoundFunds = async (signer) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.distributeRoundFunds();
    const receipt = await tx.wait();
    
    // Parse result from events
    const distributionResults = receipt.logs
      .filter(log => {
        try {
          return charityPlatform.interface.parseLog(log).name === 'ProjectFundingAllocated';
        } catch (e) {
          return false;
        }
      })
      .map(log => {
        const parsedLog = charityPlatform.interface.parseLog(log);
        return {
          roundId: Number(parsedLog.args.roundId),
          projectId: Number(parsedLog.args.projectId),
          amount: ethers.formatUnits(parsedLog.args.amount, 2)
        };
      });
      
    return distributionResults;
  } catch (error) {
    console.error('Error distributing round funds:', error);
    throw new Error('Failed to distribute round funds');
  }
};

/**
 * Submit a proposal to claim funds
 * @param {ethers.Signer} signer - Charity admin signer
 * @param {number} projectId - Project ID
 * @param {string} description - Proposal description
 * @param {string} ipfsHash - IPFS hash for additional data
 * @param {string} requestedAmount - Amount requested (in token units)
 * @param {string} destinationAddress - Destination address for funds
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const submitProposal = async (signer, projectId, description, ipfsHash, requestedAmount, destinationAddress) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    
    // Convert amount from token units to wei
    const amountWei = ethers.parseUnits(requestedAmount, 2); // Use 2 for DermaCoin decimals
    
    const tx = await signedCharityPlatform.submitProposal(
      projectId,
      description,
      ipfsHash,
      amountWei,
      destinationAddress
    );
    return await tx.wait();
  } catch (error) {
    console.error('Error submitting proposal:', error);
    throw new Error('Failed to submit proposal');
  }
};

/**
 * Approve a proposal (anyone can call after AI validation)
 * @param {ethers.Signer} signer - Signer for approving
 * @param {number} proposalId - Proposal ID
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const approveProposal = async (signer, proposalId) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.approveProposal(proposalId);
    return await tx.wait();
  } catch (error) {
    console.error('Error approving proposal:', error);
    throw new Error('Failed to approve proposal');
  }
};

/**
 * Claim funds after proposal approval (charity admin only)
 * @param {ethers.Signer} signer - Charity admin signer
 * @param {number} proposalId - Proposal ID
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const claimFunds = async (signer, proposalId) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.claimFunds(proposalId);
    return await tx.wait();
  } catch (error) {
    console.error('Error claiming funds:', error);
    throw new Error('Failed to claim funds');
  }
};

/**
 * Set the fee wallet address (admin only)
 * @param {ethers.Signer} signer - Admin signer
 * @param {string} feeWalletAddress - New fee wallet address
 * @returns {Promise<ethers.TransactionReceipt>} - Transaction receipt
 */
const setFeeWallet = async (signer, feeWalletAddress) => {
  try {
    const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
    const tx = await signedCharityPlatform.setFeeWallet(feeWalletAddress);
    return await tx.wait();
  } catch (error) {
    console.error('Error setting fee wallet:', error);
    throw new Error('Failed to set fee wallet');
  }
};

// Export all functions
module.exports = {
  // Contract instances
  provider,
  dermaCoin,
  charityPlatform,
  
  // Helper functions
  getSigner,
  getSignedContracts,
  verifySignature,
  
  // Read functions
  getCharity,
  getProject,
  getProposal,
  getTransaction,
  getCurrentRoundId,
  getRound,
  getTokenBalance,
  getProjectWalletBalance,
  getProjectWalletAddress,
  getCharityProjects,
  getProjectProposals,
  getProjectTransactions,
  getCurrentRoundProjectStats,
  
  // Write functions
  registerCharity,
  verifyCharity,
  createProject,
  donate,
  distributeRoundFunds,
  submitProposal,
  approveProposal,
  claimFunds,
  setFeeWallet
};