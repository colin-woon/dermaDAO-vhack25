import DonorDashboardNavBar from './DonorDashboardNavBar';
import Footer from './Footer';
import Table from './Table';
import Card from './Card';
import { useState } from 'react';

const DonorDashboard = () => {
	// To verify getCharities API working
	// const [charities, setCharities] = useState([]);

	// const fetchCharities = async () => {
	// 	try {
	// 		const response = await fetch('/api/charities');
	// 		const data = await response.json();

	// 		if (data.success) {
	// 			console.log('Fetched charities:', data.data);
	// 			setCharities(data.data);
	// 		} else {
	// 			console.error('Failed to fetch charities:', data.message);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching charities:', error);
	// 	}
	// };

	return (
		<div className='flex flex-col justify-between min-h-screen bg-gray-950'>
			{/* <h1>Donor Dashboard</h1> */}
			<DonorDashboardNavBar />
			<div className='flex flex-col justify-around min-h-screen p-10 space-y-12'>
				{/* <button
					className="btn btn-primary w-fit"
					onClick={fetchCharities}
				>
					Test Get Charities
				</button> */}
				<div className='flex flex-row flex-wrap justify-evenly gap-8 w-full'>
					<Card />
					<Card />
					<Card />
					<Card />
					<Card />
					<Card />
				</div>
				<Table />
			</div>
			<Footer />
		</div>
	);
}

export default DonorDashboard;
