import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const DonorDashboardNavBar = () => {
	const [walletAddress, setWalletAddress] = useState('');
	const [isConnected, setIsConnected] = useState(false);

	const connectWallet = async () => {
		try {
			if (typeof window.ethereum !== 'undefined') {
				const provider = new ethers.BrowserProvider(window.ethereum);
				// Request account access
				const accounts = await provider.send("eth_requestAccounts", []);
				setWalletAddress(accounts[0]);
				setIsConnected(true);
			} else {
				alert('Please install MetaMask!');
			}
		} catch (error) {
			console.error('Error connecting wallet:', error);
		}
	};

	return (
		<div className="navbar bg-violet-950 shadow-sm">
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
					className="btn btn-primary"
					onClick={connectWallet}
				>
					{isConnected ?
						`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` :
						'Connect Wallet'}
				</button>
			</div>
		</div>
	);
}

export default DonorDashboardNavBar;
