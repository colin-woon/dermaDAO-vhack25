const { ethers } = require('ethers');

// Import ABI files
const DermaCoinABI = require('../contracts/DermaCoin.json');
const CharityPlatformABI = require('../contracts/CharityPlatform.json');

// Contract addresses
const DERMACOIN_ADDRESS = process.env.DERMACOIN_ADDRESS;
const CHARITY_PLATFORM_ADDRESS = process.env.CHARITY_PLATFORM_ADDRESS;

// Provider
const provider = new ethers.JsonRpcProvider(process.env.SCROLL_SEPOLIA_RPC_URL);

// Contract instances
const dermaCoin = new ethers.Contract(DERMACOIN_ADDRESS, DermaCoinABI, provider);
const charityPlatform = new ethers.Contract(CHARITY_PLATFORM_ADDRESS, CharityPlatformABI, provider);

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
 * Get current round project statistics
 * @returns {Promise<Object>} - Project stats with IDs, unique donors, and donation amounts
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

module.exports = {
	getCharity,
	getProject,
	getCurrentRoundId,
	getRound,
	verifySignature,
	getTokenBalance,
	provider,
	dermaCoin,
	charityPlatform
};
