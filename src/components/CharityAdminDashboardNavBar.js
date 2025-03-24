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

const CharityAdminDashboardNavBar = () => {
	const [showCharityDialog, setShowCharityDialog] = useState(false);
const [charityFormData, setCharityFormData] = useState({
    name: '',
    description: '',
    additionalInfo: ''
});
	const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [authToken, setAuthToken] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [signer, setSigner] = useState(null);
	const [projectData, setProjectData] = useState({
		name: '',
		description: '',
		goalAmount: '',
		documents: null,
	  });
	const [loading, setLoading] = useState(false);

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
							}
						} catch (error) {
							console.error('Error verifying charity on blockchain:', error);
							// If we can't verify on blockchain but have database record,
							// we might want to handle this differently
							if (userData.user.charity.is_verified) {
								console.log('Charity is verified in database, proceeding despite blockchain error');
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
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        if (!signer) {
            throw new Error('Please connect your wallet first');
        }

        // Validate goal amount
        const goalAmountNumber = parseFloat(projectData.goalAmount);
        if (isNaN(goalAmountNumber) || goalAmountNumber <= 0) {
            throw new Error('Please enter a valid positive goal amount');
        }

        // Get user data including charity information
        console.log('Fetching user data...');
        const userResponse = await fetch('/api/auth/getUser', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = await userResponse.json();
        console.log('User data from backend:', userData);

        if (!userData.user?.charity?.blockchain_id) {
            throw new Error('No charity found. Please register a charity first.');
        }

        const charityId = parseInt(userData.user.charity.blockchain_id);
        console.log('Using charity ID:', charityId);

        // Verify charity exists and user is admin
        console.log('Verifying charity on blockchain...');
        const charity = await getCharity(charityId);
        console.log('Charity data from blockchain:', charity);

        if (!charity || charity.admin.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('You are not authorized to create projects for this charity');
        }

        // The IPFS hash could come from documents upload process
        const ipfsHash = ""; // TODO: Implement IPFS upload

        console.log('Creating project with params:', {
            signer,
            charityId,
            name: projectData.name,
            description: projectData.description,
            ipfsHash
        });

        const blockchainResult = await createProject(
            signer,
            charityId,
            projectData.name,
            projectData.description,
            ipfsHash
        );

        console.log('Project created on blockchain:', blockchainResult);
        console.log('Transaction logs:', blockchainResult.logs);

        // Get the project ID from the blockchain event
        const projectCreatedEvent = blockchainResult.logs[0]; // The first log should be our ProjectCreated event
        console.log('Project created event:', projectCreatedEvent);

        if (!projectCreatedEvent) {
            throw new Error('Project created on blockchain but no event found');
        }

        // The project ID is the second topic (index 1) in the event
        const blockchainProjectId = parseInt(projectCreatedEvent.topics[1], 16).toString();
        console.log('Project ID from blockchain:', blockchainProjectId);

        // Store in backend with blockchain reference
        const formattedProjectData = {
            ...projectData,
            goalAmount: goalAmountNumber,
            blockchainId: blockchainProjectId,
            charityId: userData.user.charity.id // Use the database charity ID here
        };

        console.log('Storing project in backend:', formattedProjectData);
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formattedProjectData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to store project in database');
        }

        const data = await response.json();

        if (data.success) {
            alert('Project created successfully!');
            setShowDialog(false);
            setProjectData({
                name: '',
                description: '',
                goalAmount: '',
                documents: null
            });
        } else {
            throw new Error(data.message || 'Failed to store project in database');
        }
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
		<div className="navbar bg-violet-950/80 shadow-sm">
			<div className="navbar-start">
				<div className="dropdown">
					<div tabIndex="0" role="button" className="btn btn-ghost lg:hidden">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
						</svg>
					</div>
				</div>
				<a className="btn btn-ghost normal-case flex items-center gap-1">
					<img src="/dermaDAOlogo.png" alt="DermaDAO Logo" className="h-10 w-10 -mr-2" />
					<span className="text-xl">DermaDAO</span>
				</a>
			</div>
			<div className="navbar-center hidden lg:flex">
			</div>
			<div className="navbar-end">
			<button
                className="btn btn-accent"
                onClick={() => setShowDialog(true)}
                disabled={!isConnected || showCharityDialog}
            >
                Create Project
            </button>
				<button
					className="btn btn-primary ml-2"
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
			  <div className="bg-gray-950 p-6 rounded-lg w-full max-w-md">
				<h2 className="text-xl font-bold mb-4">Create New Project</h2>
				<form onSubmit={handleCreateProject}>
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
        placeholder="Describe your project"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Goal Amount (DRMA)</label>
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
      <p className="mt-1 text-sm text-gray-400">Amount in DermaCoin (DRMA)</p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300">Supporting Documents</label>
      <input
        type="file"
        className="mt-1 block w-full text-gray-300"
        onChange={(e) => setProjectData({...projectData, documents: e.target.files[0]})}
        accept=".pdf,.doc,.docx,.txt"
      />
      <p className="mt-1 text-sm text-gray-400">Upload documents to be stored on IPFS</p>
    </div>
  </div>

  <div className="mt-6 flex justify-end space-x-3">
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
          Creating Project...
        </span>
      ) : 'Create Project'}
    </button>
  </div>
</form>
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
