import { ethers } from 'ethers';
import DermaCoinABI from '@/contracts/DermaCoin.json';
import CharityPlatformABI from '@/contracts/CharityPlatform.json';

// Contract addresses
const DERMACOIN_ADDRESS = process.env.NEXT_PUBLIC_DERMACOIN_ADDRESS;
const CHARITY_PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_CHARITY_PLATFORM_ADDRESS;

// Provider and contracts (declared but initialized only on client side)
let provider;
let dermaCoin;
let charityPlatform;

// Initialize only on client side
if (typeof window !== 'undefined') {
	try {
		// Initialize provider
		provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SCROLL_SEPOLIA_RPC_URL);

		// Initialize contract instances (read-only)
		dermaCoin = new ethers.Contract(DERMACOIN_ADDRESS, DermaCoinABI, provider);
		charityPlatform = new ethers.Contract(CHARITY_PLATFORM_ADDRESS, CharityPlatformABI, provider);
	} catch (error) {
		console.error('Failed to initialize blockchain service:', error);
	}
}

/**
 * AVAILABLE SMART CONTRACT FUNCTIONS
 *
 * Authentication:
 * - connectWallet(): Connect MetaMask wallet
 * - verifySignature(message, signature, address): Verify MetaMask signature
 *
 * Read Functions:
 * - getCharity(charityId): Get charity details
 * - getProject(projectId): Get project details
 * - getCurrentRoundId(): Get current funding round ID
 * - getRound(roundId): Get round details
 * - getProposal(proposalId): Get proposal details
 * - getTransaction(transactionId): Get transaction details
 * - getProjectWalletBalance(projectId): Get project's wallet balance
 * - getProjectWalletAddress(projectId): Get project's wallet address
 * - getCharityProjects(charityId): Get all projects for a charity
 * - getProjectProposals(projectId): Get all proposals for a project
 * - getProjectTransactions(projectId): Get all transactions for a project
 * - getCurrentRoundProjectStats(): Get current round statistics
 * - getTokenBalance(address): Get DermaCoin balance
 *
 * Write Functions (Require Signer):
 * - registerCharity(signer, name, description): Register new charity
 * - verifyCharity(signer, charityId, verified): Verify a charity (admin only)
 * - createProject(signer, charityId, name, description, ipfsHash): Create new project
 * - donate(signer, projectId, amount): Donate to a project
 * - distributeRoundFunds(signer): Distribute round funds (admin only)
 * - submitProposal(signer, projectId, description, ipfsHash, requestedAmount, destinationAddress): Submit funding proposal
 * - approveProposal(signer, proposalId): Approve a proposal
 * - claimFunds(signer, proposalId): Claim approved funds
 * - setFeeWallet(signer, feeWalletAddress): Set fee wallet (admin only)
 *
 * Utilities:
 * - getSignedContracts(signer): Get contract instances with signer
 * - utils.formatUnits(amount): Format token amounts
 * - utils.parseUnits(amount): Parse token amounts
 */

// HELPER FUNCTIONS

/**
 * Connect wallet using MetaMask or similar provider
 */
export const connectWallet = async () => {
	if (typeof window === 'undefined') {
		throw new Error('Cannot connect wallet in server-side code');
	}

	if (!window.ethereum) {
		throw new Error('MetaMask not installed');
	}

	try {
		const provider = new ethers.BrowserProvider(window.ethereum);
		const accounts = await provider.send('eth_requestAccounts', []);
		const signer = await provider.getSigner();
		return { signer, address: accounts[0] };
	} catch (error) {
		console.error('Error connecting wallet:', error);
		throw new Error('Failed to connect wallet');
	}
};

/**
 * Get contract instances with a signer for write operations
 */
export const getSignedContracts = (signer) => {
	return {
		dermaCoin: dermaCoin.connect(signer),
		charityPlatform: charityPlatform.connect(signer)
	};
};

/**
 * Verify the signature from MetaMask
 */
export const verifySignature = (message, signature, address) => {
	try {
		const signerAddr = ethers.verifyMessage(message, signature);
		return signerAddr.toLowerCase() === address.toLowerCase();
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
};

// READ FUNCTIONS

/**
 * Get charity details from blockchain
 */
export const getCharity = async (charityId) => {
	try {
		console.log('Fetching charity from blockchain with ID:', charityId);
		console.log('Using contract address:', CHARITY_PLATFORM_ADDRESS);

		// Validate charity ID
		if (!charityId || isNaN(charityId)) {
			throw new Error(`Invalid charity ID: ${charityId}`);
		}

		// Log contract state
		console.log('Contract instance:', {
			address: charityPlatform.target,
			interface: charityPlatform.interface.format()
		});

		// Attempt to call the contract
		const charity = await charityPlatform.charities(charityId);
		console.log('Raw charity data from blockchain:', charity);

		// If we get here, the call was successful
		return charity;
	} catch (error) {
		console.error('Detailed error in getCharity:', {
			message: error.message,
			code: error.code,
			data: error.data,
			transaction: error.transaction
		});

		if (error.code === 'CALL_EXCEPTION') {
			throw new Error(`Charity ID ${charityId} does not exist on the blockchain`);
		}

		throw new Error(`Failed to fetch charity: ${error.message}`);
	}
};

/**
 * Get project details from blockchain
 */
export const getProject = async (projectId) => {
	try {
		return await charityPlatform.projects(projectId);
	} catch (error) {
		console.error('Error fetching project:', error);
		throw new Error('Failed to fetch project from blockchain');
	}
};

/**
 * Get current round ID
 */
export const getCurrentRoundId = async () => {
	try {
		return await charityPlatform.getCurrentRoundId();
	} catch (error) {
		console.error('Error fetching current round ID:', error);
		throw new Error('Failed to fetch current round ID from blockchain');
	}
};

/**
 * Get round details
 */
export const getRound = async (roundId) => {
	try {
		return await charityPlatform.rounds(roundId);
	} catch (error) {
		console.error('Error fetching round:', error);
		throw new Error('Failed to fetch round from blockchain');
	}
};

/**
 * Get proposal details
 */
export const getProposal = async (proposalId) => {
	try {
		return await charityPlatform.proposals(proposalId);
	} catch (error) {
		console.error('Error fetching proposal:', error);
		throw new Error('Failed to fetch proposal from blockchain');
	}
};

/**
 * Get transaction details
 */
export const getTransaction = async (transactionId) => {
	try {
		return await charityPlatform.transactions(transactionId);
	} catch (error) {
		console.error('Error fetching transaction:', error);
		throw new Error('Failed to fetch transaction from blockchain');
	}
};

/**
 * Get project wallet balance
 */
export const getProjectWalletBalance = async (projectId) => {
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
 */
export const getProjectWalletAddress = async (projectId) => {
	try {
		return await charityPlatform.getProjectWalletAddress(projectId);
	} catch (error) {
		console.error('Error fetching project wallet address:', error);
		throw new Error('Failed to fetch project wallet address');
	}
};

/**
 * Get charity's projects
 */
export const getCharityProjects = async (charityId) => {
	try {
		return (await charityPlatform.getCharityProjects(charityId)).map(id => Number(id));
	} catch (error) {
		console.error('Error fetching charity projects:', error);
		throw new Error('Failed to fetch charity projects');
	}
};

/**
 * Get project's proposals
 */
export const getProjectProposals = async (projectId) => {
	try {
		return (await charityPlatform.getProjectProposals(projectId)).map(id => Number(id));
	} catch (error) {
		console.error('Error fetching project proposals:', error);
		throw new Error('Failed to fetch project proposals');
	}
};

/**
 * Get project's transactions
 */
export const getProjectTransactions = async (projectId) => {
	try {
		return (await charityPlatform.getProjectTransactions(projectId)).map(id => Number(id));
	} catch (error) {
		console.error('Error fetching project transactions:', error);
		throw new Error('Failed to fetch project transactions');
	}
};

/**
 * Get current round project statistics
 */
export const getCurrentRoundProjectStats = async () => {
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
 */
export const getTokenBalance = async (address) => {
	try {
		const balance = await dermaCoin.balanceOf(address);
		return ethers.formatUnits(balance, 2);
	} catch (error) {
		console.error('Error fetching token balance:', error);
		throw new Error('Failed to fetch token balance');
	}
};

// WRITE FUNCTIONS

/**
 * Register a new charity
 */
export const registerCharity = async (signer, name, description) => {
	try {
		console.log('Getting signed contracts...'); // Debug log
		const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);

		console.log('Registering charity with params:', { name, description }); // Debug log
		const tx = await signedCharityPlatform.registerCharity(name, description);
		console.log('Transaction submitted:', tx); // Debug log

		console.log('Waiting for transaction confirmation...'); // Debug log
		const receipt = await tx.wait();
		console.log('Transaction receipt:', receipt); // Debug log

		return receipt;
	} catch (error) {
		console.error('Error in registerCharity:', error); // Detailed error log
		throw new Error(`Failed to register charity: ${error.message}`);
	}
};

/**
 * Verify a charity (admin only)
 */
export const verifyCharity = async (signer, charityId, verified) => {
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
 */
export const createProject = async (signer, charityId, name, description, ipfsHash) => {
	try {
		console.log('Creating project with params:', {
			charityId,
			name,
			description,
			ipfsHash
		});

		// Get signed contract
		console.log('Getting signed contract...');
		const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
		console.log('Contract address:', signedCharityPlatform.target);

		// Estimate gas for the transaction
		console.log('Estimating gas...');
		const gasEstimate = await signedCharityPlatform.createProject.estimateGas(
			charityId,
			name,
			description,
			ipfsHash
		);
		console.log('Gas estimate:', gasEstimate.toString());

		// Add 20% buffer to gas estimate
		const gasLimit = Math.floor(gasEstimate.toString() * 1.2);
		console.log('Using gas limit:', gasLimit);

		// Submit transaction with gas limit
		console.log('Submitting transaction...');
		const tx = await signedCharityPlatform.createProject(
			charityId,
			name,
			description,
			ipfsHash,
			{ gasLimit }
		);
		console.log('Transaction submitted:', tx);

		console.log('Waiting for transaction confirmation...');
		const receipt = await tx.wait();
		console.log('Transaction receipt:', receipt);

		return receipt;
	} catch (error) {
		console.error('Detailed error in createProject:', {
			message: error.message,
			code: error.code,
			data: error.data,
			transaction: error.transaction,
			reason: error.reason,
			method: error.method,
			transaction: error.transaction,
			receipt: error.receipt
		});

		if (error.code === 'CALL_EXCEPTION') {
			throw new Error(`Contract call failed: ${error.reason || 'Unknown reason'}`);
		} else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
			throw new Error('Failed to estimate gas. The transaction may revert.');
		} else if (error.code === -32603) {
			throw new Error('Internal JSON-RPC error. Check if you have enough gas and proper permissions.');
		}

		throw new Error(`Failed to create project: ${error.message}`);
	}
};

/**
 * Donate to a project
 */
export const donate = async (signer, projectId, amount) => {
	try {
		const { dermaCoin: signedDermaCoin, charityPlatform: signedCharityPlatform } = getSignedContracts(signer);

		// Convert amount from token units to wei (using 2 decimals for DermaCoin)
		const amountWei = ethers.parseUnits(amount.toString(), 2);

		// Approve tokens for the charity platform to spend
		const approveTx = await signedDermaCoin.approve(CHARITY_PLATFORM_ADDRESS, amountWei);
		await approveTx.wait();

		// Make the donation
		const donateTx = await signedCharityPlatform.donate(projectId, amountWei);
		const receipt = await donateTx.wait();

		return receipt;
	} catch (error) {
		console.error('Error making donation:', error);
		throw new Error('Failed to make donation');
	}
};

/**
 * Distribute funds for the current round (admin only)
 */
export const distributeRoundFunds = async (signer) => {
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
 */
export const submitProposal = async (signer, projectId, description, ipfsHash, requestedAmount, destinationAddress) => {
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
 */
export const approveProposal = async (signer, proposalId) => {
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
 */
export const claimFunds = async (signer, proposalId) => {
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
 */
export const setFeeWallet = async (signer, feeWalletAddress) => {
	try {
		const { charityPlatform: signedCharityPlatform } = getSignedContracts(signer);
		const tx = await signedCharityPlatform.setFeeWallet(feeWalletAddress);
		return await tx.wait();
	} catch (error) {
		console.error('Error setting fee wallet:', error);
		throw new Error('Failed to set fee wallet');
	}
};

// Export contracts and utils
export const contracts = {
	provider,
	dermaCoin,
	charityPlatform
};

export const utils = {
	formatUnits: (amount) => ethers.formatUnits(amount, 2),
	parseUnits: (amount) => ethers.parseUnits(amount.toString(), 2)
};
