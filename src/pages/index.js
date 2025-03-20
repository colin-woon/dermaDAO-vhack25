import { useState, useEffect } from 'react';
import CharityAdminDashboard from '../components/CharityAdminDashboard';
import DonorDashboard from '../components/DonorDashboard';
import CharityLoginButton from '../components/CharityLoginButton';
import LandingPage from '../components/LandingPage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

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

	return (
		<div>
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
		</div>
	);
}
