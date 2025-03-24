import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CharityAdminDashboardNavBar = () => {
	const [walletAddress, setWalletAddress] = useState('');
	const [isConnected, setIsConnected] = useState(false);
	const [authToken, setAuthToken] = useState('');

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
					role: 'donor' // Default role for now
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

	return (
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
				{/* <button
					className="btn btn-secondary ml-2"
					onClick={async () => {
						const token = localStorage.getItem('authToken');
						if (!token) {
							console.log('No auth token found');
							return;
						}

						try {
							console.log('Using token:', token.substring(0, 20) + '...'); // Log partial token for debugging

							const response = await fetch('/api/auth/getUser', {
								method: 'GET',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${token}`
								}
							});

							if (!response.ok) {
								const errorData = await response.json();
								console.error('Auth error:', {
									status: response.status,
									statusText: response.statusText,
									data: errorData
								});
								throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
							}

							const data = await response.json();
							console.log('User profile:', data);
						} catch (error) {
							console.error('Auth test failed:', error.message);
						}
					}}
				>
					Test Auth
				</button> */}
			</div>
		</div>
	);
}

export default CharityAdminDashboardNavBar;
