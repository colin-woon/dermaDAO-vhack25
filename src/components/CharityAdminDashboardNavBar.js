import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import {
	connectWallet,
	verifySignature,
	createProject,
	registerCharity,
	getCharity
  } from '@/services/blockchain';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CharityAdminDashboardNavBar = ({ onWalletConnected, onProjectCreated, activeTab, onTabChange }) => {
	const [showCharityDialog, setShowCharityDialog] = useState(false);
	const [showDialog, setShowDialog] = useState(false);
	const [loading, setLoading] = useState(false);
	const [proposalScore, setProposalScore] = useState(null);
	const [proposalFeedback, setProposalFeedback] = useState('');
	const [charityFormData, setCharityFormData] = useState({
		name: '',
		description: '',
		additionalInfo: ''
	});
	const [projectData, setProjectData] = useState({
		name: '',
		description: '',
		goalAmount: '',
		proposal: {
			impact: '',
			methodology: '',
			sustainability: '',
			budget_breakdown: '',
			timeline: ''
		}
	});
	const [walletAddress, setWalletAddress] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const [authToken, setAuthToken] = useState('');
	const [signer, setSigner] = useState(null);

	// Mock AI scoring function
	const scoreProposal = async (proposal) => {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Criteria and weights
		const criteria = {
			impact: 0.3,
			methodology: 0.2,
			sustainability: 0.2,
			budget: 0.15,
			timeline: 0.15
		};

		// Mock scoring logic (in reality, this would be done by AI)
		const scores = {
			impact: proposal.impact.length > 100 ? 90 : 70,
			methodology: proposal.methodology.length > 100 ? 85 : 65,
			sustainability: proposal.sustainability.length > 100 ? 88 : 68,
			budget: proposal.budget_breakdown.length > 50 ? 92 : 72,
			timeline: proposal.timeline.length > 50 ? 87 : 67
		};

		// Calculate weighted score
		const totalScore = Object.entries(scores).reduce((acc, [key, score]) => {
			return acc + (score * criteria[key]);
		}, 0);

		// Generate feedback
		const feedback = [];
		Object.entries(scores).forEach(([key, score]) => {
			if (score < 80) {
				feedback.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: Needs more detail and clarity.`);
			} else {
				feedback.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: Well explained and comprehensive.`);
			}
		});

		return {
			score: Math.round(totalScore),
			feedback: feedback.join('\n')
		};
	};

	const handleConnectWallet = async () => {
		try {
			const { signer, address } = await connectWallet();
			setWalletAddress(address);
			setSigner(signer);
			setIsConnected(true);

			// After connecting wallet, sign message for authentication
			const token = await handleLogin(address, signer);

			if (token) {
				try {
					// Check if user already has a charity
					const decodedToken = jwt.decode(token);
					console.log('Decoded token after wallet connection:', decodedToken);

					// Get user data to check charity status
					const userResponse = await fetch('/api/auth/getUser', {
						headers: {
							'Authorization': `Bearer ${token}`
						}
					});
					const userData = await userResponse.json();
					console.log('User data after connection:', userData);

					if (!userData.user?.charity) {
						// No charity found in database, show creation dialog
						console.log('No charity found in database, showing creation dialog');
						setShowCharityDialog(true);
					} else {
						// Charity exists in database, try to verify on blockchain
						console.log('Found charity in database:', userData.user.charity);
						try {
							if (!userData.user.charity.blockchain_id) {
								console.log('No blockchain ID found for charity, showing creation dialog');
								setShowCharityDialog(true);
								return;
							}

							const blockchainId = parseInt(userData.user.charity.blockchain_id);
							console.log('Attempting to fetch charity from blockchain with ID:', blockchainId);

							const charity = await getCharity(blockchainId);
							console.log('Charity data from blockchain:', charity);

							if (!charity || charity.admin.toLowerCase() !== address.toLowerCase()) {
								console.log('Charity validation failed:', {
									exists: !!charity,
									chainAdmin: charity?.admin,
									userAddress: address
								});
								setShowCharityDialog(true);
							} else {
								console.log('Charity validated successfully on blockchain');
								// Notify parent that wallet is connected and charity is verified
								onWalletConnected?.(userData.user.charity.id);
							}
						} catch (error) {
							console.error('Error verifying charity on blockchain:', error);
							// If we can't verify on blockchain but have database record,
							// we might want to handle this differently
							if (userData.user.charity.is_verified) {
								console.log('Charity is verified in database, proceeding despite blockchain error');
								onWalletConnected?.(userData.user.charity.id);
							} else {
								console.log('Charity not verified, showing creation dialog');
								setShowCharityDialog(true);
							}
						}
					}
				} catch (error) {
					console.error('Error checking charity status:', error);
					setShowCharityDialog(true);
				}
			}
		} catch (error) {
			console.error('Error connecting wallet:', error);
			alert('Error connecting wallet: ' + error.message);
		}
	};

	const handleLogin = async (address, signer) => {
		try {
			// Create message to sign
			const message = `Login to DermaDAO: ${new Date().toISOString()}`;

			// Get signature using the signer
			const signature = await signer.signMessage(message);

			// Verify signature (optional client-side verification)
			const isValidSignature = verifySignature(message, signature, address);
			if (!isValidSignature) {
				throw new Error('Invalid signature');
			}

			// Send to backend
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					walletAddress: address,
					signature,
					message,
					role: 'charity'
				})
			});

			const data = await response.json();
			console.log('Login response:', data); // Debug log

			if (data.token) {
				// Verify token contains necessary data
				const decodedToken = jwt.decode(data.token);
				console.log('Decoded token after login:', decodedToken); // Debug log

				setAuthToken(data.token);
				localStorage.setItem('authToken', data.token);
				console.log('Login successful!');
				return data.token;
			} else {
				console.error('Login failed:', data.message);
				return null;
			}
		} catch (error) {
			console.error('Login error:', error);
			return null;
		}
	};

	const handleCreateProject = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			// First, score the proposal
			const { score, feedback } = await scoreProposal(projectData.proposal);
			setProposalScore(score);
			setProposalFeedback(feedback);

			// Store proposal in database for donor scoring
			const token = localStorage.getItem('authToken');
			const proposalResponse = await fetch('/api/proposals', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					projectName: projectData.name,
					description: projectData.description,
					goalAmount: projectData.goalAmount,
					proposal: projectData.proposal,
					aiScore: score
				})
			});

			if (!proposalResponse.ok) {
				throw new Error('Failed to submit proposal');
			}

			alert('Proposal submitted successfully! Once it receives donor scores and meets the threshold, the project will be created on the blockchain.');
			setShowDialog(false);
			setProjectData({
				name: '',
				description: '',
				goalAmount: '',
				proposal: {
					impact: '',
					methodology: '',
					sustainability: '',
					budget_breakdown: '',
					timeline: ''
				}
			});
		} catch (error) {
			console.error('Error creating project:', error);
			alert('Error creating project: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateCharity = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const token = localStorage.getItem('authToken');
			if (!token || !signer) {
				throw new Error('Authentication required');
			}

			if (!charityFormData.name || !charityFormData.description) {
				throw new Error('Please fill in all required fields');
			}

			console.log('Starting charity registration...'); // Debug log

			// Register charity on blockchain
			console.log('Registering charity with data:', charityFormData); // Debug log
			const receipt = await registerCharity(
				signer,
				charityFormData.name,
				charityFormData.description
			);

			console.log('Transaction receipt:', receipt); // Debug log
			console.log('Transaction logs:', receipt.logs); // Debug log

			// Extract charity ID from event
			const charityId = receipt.logs[0].topics[1]; // The first topic is the event signature, second topic should be the charity ID
			console.log('Raw charity ID from logs:', charityId); // Debug log

			// Convert from hex to decimal
			const charityIdDecimal = parseInt(charityId, 16).toString();
			console.log('Converted charity ID:', charityIdDecimal); // Debug log

			if (!charityIdDecimal) {
				throw new Error('Failed to get charity ID from transaction');
			}

			// Register in backend
			console.log('Registering charity in backend with data:', {
				blockchainId: charityIdDecimal,
				name: charityFormData.name,
				description: charityFormData.description,
				ownerAddress: walletAddress
			}); // Debug log

			const response = await fetch('/api/charities', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					blockchainId: charityIdDecimal,
					name: charityFormData.name,
					description: charityFormData.description,
					ownerAddress: walletAddress
				})
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('Backend registration failed:', {
					status: response.status,
					statusText: response.statusText,
					error: errorData
				});
				throw new Error(`Failed to register charity in backend: ${errorData}`);
			}

			const responseData = await response.json();
			console.log('Backend registration successful:', responseData);

			// Clear form data
			setCharityFormData({
				name: '',
				description: '',
				additionalInfo: ''
			});

			setShowCharityDialog(false);

			// Refresh the token to include the new charity ID
			console.log('Refreshing authentication token...'); // Debug log
			await handleLogin(walletAddress, signer);

			alert('Charity registered successfully!');
		} catch (error) {
			console.error('Error creating charity:', error);
			alert(`Error creating charity: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
		<div className="navbar bg-purple-950/90 p-4">
			<div className="navbar-start">
				<a className="btn btn-ghost normal-case text-xl flex items-center gap-1">
					<img src="/dermaDAOlogo.png" alt="DermaDAO Logo" className="h-10 w-10 -mr-2" />
					<span>DermaDAO</span>
				</a>
			</div>
			<div className="navbar-center">
				<Tabs value={activeTab} onValueChange={onTabChange}>
					<TabsList className="bg-purple-900/50">
						<TabsTrigger value="projects">Active Projects</TabsTrigger>
						<TabsTrigger value="pending">Pending Projects</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			<div className="navbar-end space-x-4">
				<button
					className="btn btn-accent"
					onClick={() => setShowDialog(true)}
					disabled={!isConnected || showCharityDialog}
				>
					Create Project
				</button>
				<button
					className="btn btn-primary"
					onClick={handleConnectWallet}
				>
					{isConnected ?
						`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` :
						'Connect Wallet'}
				</button>
			</div>
		</div>

		{showDialog && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-gray-950 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
					<h2 className="text-2xl font-bold mb-6 sticky top-0 bg-gray-950 py-2 z-10 border-b border-gray-800">Create New Project</h2>
					<div className="overflow-y-auto flex-1 pr-2">
						<form onSubmit={handleCreateProject} className="space-y-6">
							{/* Basic Project Info */}
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-300">Project Name</label>
									<input
										type="text"
										required
										className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
										value={projectData.name}
										onChange={(e) => setProjectData({...projectData, name: e.target.value})}
										placeholder="Enter project name"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300">Description</label>
									<textarea
										required
										className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
										rows="3"
										value={projectData.description}
										onChange={(e) => setProjectData({...projectData, description: e.target.value})}
										placeholder="Brief description of your project"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-300">Goal Amount (DMC)</label>
									<input
										type="number"
										step="0.01"
										min="0"
										required
										className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
										value={projectData.goalAmount}
										onChange={(e) => setProjectData({...projectData, goalAmount: e.target.value})}
										placeholder="0.00"
									/>
									<p className="mt-1 text-sm text-gray-400">Amount in DermaCoin (DMC)</p>
								</div>
							</div>

							{/* Project Proposal */}
							<div className="border-t border-gray-700 pt-6">
								<h3 className="text-lg font-semibold mb-4">Project Proposal</h3>
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-300">Impact & Significance</label>
										<textarea
											required
											className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
											rows="3"
											value={projectData.proposal.impact}
											onChange={(e) => setProjectData({
												...projectData,
												proposal: {...projectData.proposal, impact: e.target.value}
											})}
											placeholder="Describe the expected impact and significance of your project"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300">Methodology & Approach</label>
										<textarea
											required
											className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
											rows="3"
											value={projectData.proposal.methodology}
											onChange={(e) => setProjectData({
												...projectData,
												proposal: {...projectData.proposal, methodology: e.target.value}
											})}
											placeholder="Explain your methodology and approach"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300">Sustainability & Long-term Impact</label>
										<textarea
											required
											className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
											rows="3"
											value={projectData.proposal.sustainability}
											onChange={(e) => setProjectData({
												...projectData,
												proposal: {...projectData.proposal, sustainability: e.target.value}
											})}
											placeholder="Describe how the project will maintain long-term impact"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300">Budget Breakdown</label>
										<textarea
											required
											className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
											rows="3"
											value={projectData.proposal.budget_breakdown}
											onChange={(e) => setProjectData({
												...projectData,
												proposal: {...projectData.proposal, budget_breakdown: e.target.value}
											})}
											placeholder="Provide a detailed breakdown of how funds will be used"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300">Timeline & Milestones</label>
										<textarea
											required
											className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
											rows="3"
											value={projectData.proposal.timeline}
											onChange={(e) => setProjectData({
												...projectData,
												proposal: {...projectData.proposal, timeline: e.target.value}
											})}
											placeholder="Outline project timeline and key milestones"
										/>
									</div>
								</div>
							</div>

							{proposalScore && (
								<div className={`p-4 rounded-lg ${proposalScore >= 80 ? 'bg-green-900/50' : 'bg-yellow-900/50'}`}>
									<h4 className="font-semibold mb-2">AI Evaluation Score: {proposalScore}/100</h4>
									<pre className="whitespace-pre-wrap text-sm">{proposalFeedback}</pre>
								</div>
							)}

							<div className="flex justify-end space-x-3 pt-6">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setShowDialog(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn btn-primary"
									disabled={loading}
								>
									{loading ? (
										<span className="flex items-center">
											<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											{proposalScore ? 'Submitting Proposal...' : 'Evaluating Proposal...'}
										</span>
									) : 'Submit Proposal'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		)}

		{showCharityDialog && (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-gray-950 p-6 rounded-lg w-full max-w-md">
					<h2 className="text-xl font-bold mb-4">Register Your Charity</h2>
					<p className="text-sm text-gray-400 mb-4">You need to register your charity before you can create projects.</p>
					<form onSubmit={handleCreateCharity}>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300">Charity Name</label>
								<input
									type="text"
									required
									className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
									value={charityFormData.name}
									onChange={(e) => setCharityFormData({...charityFormData, name: e.target.value})}
									placeholder="Enter charity name"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300">Description</label>
								<textarea
									required
									className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-violet-500 focus:ring-violet-500"
									rows="3"
									value={charityFormData.description}
									onChange={(e) => setCharityFormData({...charityFormData, description: e.target.value})}
									placeholder="Describe your charity's mission"
								/>
							</div>
						</div>

						<div className="mt-6 flex justify-end">
							<button
								type="submit"
								className="btn btn-primary w-full"
								disabled={loading}
							>
								{loading ? 'Registering...' : 'Register Charity'}
							</button>
						</div>
					</form>
				</div>
			</div>
		)}
		</>
	);
}

export default CharityAdminDashboardNavBar;
