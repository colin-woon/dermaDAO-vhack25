import { useState, useEffect } from 'react';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';
import LandingPage from '../components/LandingPage';
import BlockchainTest from '../components/BlockchainTest';
import { motion, AnimatePresence } from 'framer-motion';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../utils/firebase';

export default function Home() {
	const [authState, setAuthState] = useState({
		isDonorAuthenticated: false,
		isCharityAuthenticated: false,
		userId: null
	});

	const handleDonorLogin = () => {
		setAuthState({
			isDonorAuthenticated: true,
			isCharityAuthenticated: false,
			userId: null
		});
	};

	const handleCharityLogin = () => {
		setAuthState({
			isDonorAuthenticated: false,
			isCharityAuthenticated: true,
			userId: null
		});
	};

	const [dbStatus, setDbStatus] = useState({
		isConnected: false,
		message: 'Checking database connection...'
	});

	// // Test database connection via API route
	// useEffect(() => {
	// 	const testConnection = async () => {
	// 		try {
	// 			const response = await fetch('/api/dbConnection');
	// 			const data = await response.json();

	// 			setDbStatus({
	// 				isConnected: data.success,
	// 				message: data.message
	// 			});
	// 		} catch (error) {
	// 			console.error('Database connection error:', error);
	// 			setDbStatus({
	// 				isConnected: false,
	// 				message: `Failed to connect to database: ${error.message}`
	// 			});
	// 		}
	// 	};

	// 	testConnection();
	// }, []);

	return (
		<AnimatePresence mode="wait">
			{!authState.isDonorAuthenticated && !authState.isCharityAuthenticated ? (
				<motion.div
					key="landing"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
				>
					<LandingPage
						onDonorAuthSuccess={handleDonorLogin}
						onCharityAuthSuccess={handleCharityLogin}
					/>
				</motion.div>
			) : authState.isDonorAuthenticated ? (
				<motion.div
					key="donor"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
				>
					<DonorDashboard />
				</motion.div>
			) : (
				<motion.div
					key="charity"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
				>
					<CharityAdminDashboard />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
