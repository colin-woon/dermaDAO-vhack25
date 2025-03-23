import { ethers } from 'ethers';
import DermaCoinContractABI from '@/contracts/DermaCoin.json';
import CharityPlatformContractABI from '@/contracts/CharityPlatform.json';

// Contract addresses (fallback to env variables if not in contract JSON)
const DERMACOIN_ADDRESS = process.env.DERMACOIN_ADDRESS;
const CHARITY_PLATFORM_ADDRESS = process.env.CHARITY_PLATFORM_ADDRESS;

// Provider initialization
let provider;
let dermaCoin;
let charityPlatform;

try {
	provider = new ethers.JsonRpcProvider(process.env.SCROLL_SEPOLIA_RPC_URL);

	// Initialize contract instances
	dermaCoin = new ethers.Contract(DERMACOIN_ADDRESS, DermaCoinContractABI, provider);
	charityPlatform = new ethers.Contract(CHARITY_PLATFORM_ADDRESS, CharityPlatformContractABI, provider);
} catch (error) {
	console.error('Failed to initialize blockchain service:', error);
}

// Utility Functions
export const getSigner = async () => {
	try {
		if (typeof window === 'undefined') {
			throw new Error('Window object not available');
		}

		if (!window.ethereum) {
			throw new Error('MetaMask not installed');
		}

		const provider = new ethers.BrowserProvider(window.ethereum);
		return await provider.getSigner();
	} catch (error) {
		console.error('Error getting signer:', error);
		throw new Error('Failed to get signer');
	}
};

// Read Functions
export const getCharity = async (charityId) => {
	try {
		return await charityPlatform.charities(charityId);
	} catch (error) {
		console.error('Error fetching charity:', error);
		throw new Error('Failed to fetch charity from blockchain');
	}
};

export const getProject = async (projectId) => {
	try {
		return await charityPlatform.projects(projectId);
	} catch (error) {
		console.error('Error fetching project:', error);
		throw new Error('Failed to fetch project from blockchain');
	}
};

export const getCurrentRoundId = async () => {
	try {
		return await charityPlatform.getCurrentRoundId();
	} catch (error) {
		console.error('Error fetching current round ID:', error);
		throw new Error('Failed to fetch current round ID');
	}
};

// Write Functions
export const createProposal = async (signer, proposalData) => {
	try {
		const connectedPlatform = charityPlatform.connect(signer);
		const tx = await connectedPlatform.createProposal(
			proposalData.title,
			proposalData.description,
			proposalData.fundingGoal,
			proposalData.duration
		);
		return await tx.wait();
	} catch (error) {
		console.error('Error creating proposal:', error);
		throw new Error('Failed to create proposal');
	}
};

export const donate = async (signer, projectId, amount) => {
	try {
		const connectedToken = dermaCoin.connect(signer);
		const tx = await connectedToken.donate(projectId, amount);
		return await tx.wait();
	} catch (error) {
		console.error('Error making donation:', error);
		throw new Error('Failed to process donation');
	}
};

// Export contract instances for direct access
export const contracts = {
	dermaCoin,
	charityPlatform,
	provider
};
