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
		return await charityPlatform.charities(charityId);
	} catch (error) {
		console.error('Error fetching charity:', error);
		throw new Error('Failed to fetch charity from blockchain');
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
 */
export const donate = async (signer, projectId, amount) => {
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
