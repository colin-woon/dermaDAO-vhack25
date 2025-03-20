import { useState, useEffect } from 'react';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';
import LandingPage from '../components/LandingPage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export default function Home() {
	const [isDonorAuthenticated, setIsDonorAuthenticated] = useState(false);
	// To verify Firestore connection
	const [testData, setTestData] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const docRef = doc(db, 'users', 'RVIlAPLwdyw0roSCHlar');
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					setTestData(docSnap.data().test);
					console.log("Retrieved test value:", docSnap.data().test);
				} else {
					console.log("No such document!");
				}
			} catch (error) {
				console.error("Error fetching document:", error);
			}
		};

		fetchData();
	}, []);

	const handleDonorLogin = () => {
		setIsDonorAuthenticated(true);
	};
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
			{!isDonorAuthenticated ? (
				<LandingPage onAuthSuccess={handleDonorLogin} />
			) : (
				<DonorDashboard />
			)}
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
