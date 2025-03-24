import { useState, useEffect } from 'react';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';
import LandingPage from '../components/LandingPage';
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

	const handleCharityLogin = (charityId) => {
		setAuthState({
			isDonorAuthenticated: false,
			isCharityAuthenticated: true,
			userId: charityId
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
		<div>
			{/* <div className={`db-status ${dbStatus.isConnected ? 'success' : 'error'}`}>
				<p>{dbStatus.message}</p>
			</div> */}
			{/* <DonorDashboard /> */}
			{!authState.isDonorAuthenticated && !authState.isCharityAuthenticated ? (
					<LandingPage
						onDonorAuthSuccess={handleDonorLogin}
						onCharityAuthSuccess={handleCharityLogin}
					/>
				) : authState.isDonorAuthenticated ? (
					<DonorDashboard />
				) : (
					<CharityAdminDashboard charityId={authState.userId} />
				)}
			{/* <CharityAdminDashboard charityId={authState.userId} /> */}
		</div>
	);
}

