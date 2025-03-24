import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const CharityAdminDashboardNavBar = () => {
	const [walletAddress, setWalletAddress] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const [authToken, setAuthToken] = useState('');
	const [showDialog, setShowDialog] = useState(false);
	const [projectData, setProjectData] = useState({
		name: '',
		description: '',
		goalAmount: '',
		documents: null,
		blockchainId: '' // Optional, can be null
	  });
	const [loading, setLoading] = useState(false);

	const connectWallet = async () => {
		try {
			if (typeof window.ethereum !== 'undefined') {
				const provider = new ethers.BrowserProvider(window.ethereum);
				// Request account access
				const accounts = await provider.send("eth_requestAccounts", []);
				const address = accounts[0];
				setWalletAddress(address);
				setIsConnected(true);

				// After connecting wallet, sign message for authentication
				await handleLogin(address, provider);
			} else {
				alert('Please install MetaMask!');
			}
		} catch (error) {
			console.error('Error connecting wallet:', error);
		}
	};

	const handleLogin = async (address, provider) => {
		try {
			// Create message to sign
			const message = `Login to DermaDAO: ${new Date().toISOString()}`;

			// Get signer and signature
			const signer = await provider.getSigner();
			const signature = await signer.signMessage(message);

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
					role: 'charity' //
				})
			});

			const data = await response.json();

			if (data.token) {
				setAuthToken(data.token);
				localStorage.setItem('authToken', data.token);
				console.log('Token stored:', {
					token: data.token.substring(0, 20) + '...',
					length: data.token.length
				});
				console.log('Login successful!', data);
			} else {
				console.error('Login failed:', data.message);
			}
		} catch (error) {
			console.error('Login error:', error);
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
	
			// Validate goal amount
			if (!projectData.goalAmount || isNaN(projectData.goalAmount)) {
				throw new Error('Please enter a valid goal amount');
			}
	
			// Create a new object with formatted data
			const formattedProjectData = {
				...projectData,
				goalAmount: Math.floor(parseFloat(projectData.goalAmount) * 1e18) // Convert ETH to Wei and ensure integer
			};
	
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(formattedProjectData)
			});
	
			const data = await response.json();
	
			if (data.success) {
				alert('Project created successfully!');
				setShowDialog(false);
				setProjectData({
					name: '',
					description: '',
					goalAmount: '',
					documents: null,
					blockchainId: ''
				});
			} else {
				throw new Error(data.message || 'Failed to create project');
			}
		} catch (error) {
			console.error('Error creating project:', error);
			alert('Error creating project: ' + error.message);
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
          >
            Create Project
          </button>
				<button
					className="btn btn-primary ml-2"
					onClick={connectWallet}
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
    <label className="block text-sm font-medium text-gray-700">Project Name</label>
    <input
      type="text"
      required
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
      value={projectData.name}
      onChange={(e) => setProjectData({...projectData, name: e.target.value})}
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Description</label>
    <textarea
      required
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
      rows="3"
      value={projectData.description}
      onChange={(e) => setProjectData({...projectData, description: e.target.value})}
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Goal Amount (ETH)</label>
    <input
      type="number"
      step="0.01"
      required
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
      value={projectData.goalAmount}
      onChange={(e) => setProjectData({...projectData, goalAmount: e.target.value})}
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Documents</label>
    <input
      type="file"
      className="mt-1 block w-full"
      onChange={(e) => setProjectData({...projectData, documents: e.target.files[0]})}
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Blockchain ID (Optional)</label>
    <input
      type="text"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
      value={projectData.blockchainId}
      onChange={(e) => setProjectData({...projectData, blockchainId: e.target.value})}
    />
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
					  {loading ? 'Creating...' : 'Create Project'}
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
