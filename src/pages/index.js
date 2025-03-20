import { useState } from 'react';
import WorldcoinLogin from '../components/WorldCoinLogin';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';
import LandingPage from '../components/LandingPage';

export default function Home() {
	// const [isCharityAuthenticated, setIsCharityAuthenticated] = useState(false);
	// const [isDonorAuthenticated, setIsDonorAuthenticated] = useState(false);

	// const handleCharityLogin = () => {
	// 	setIsCharityAuthenticated(true);
	// };

	// const handleDonorLogin = () => {
	// 	setIsDonorAuthenticated(true);
	// };

	return (
		<div>
			<LandingPage />
			{/* <CharityAdminDashboard /> */}
			{/* <DonorDashboard /> */}
		</div>
		// <div>
		// 	{!isCharityAuthenticated && !isDonorAuthenticated && (
		// 		<div>
		// 			<h1 className="text-2xl font-bold mb-4">Choose Login Method</h1>
		// 			<WorldcoinLogin onLoginSuccess={handleDonorLogin} />
		// 			<CharityLoginButton onLoginSuccess={handleCharityLogin} />
		// 		</div>
		// 	)}

		// 	{isCharityAuthenticated && <CharityAdminDashboard />}
		// 	{isDonorAuthenticated && <DonorDashboard />}
		// </div>
	);
}
