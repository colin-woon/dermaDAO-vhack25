import DonorDashboardNavBar from './DonorDashboardNavBar';
import Footer from './Footer';
import Table from './Table';
import Card from './Card';
import { useState } from 'react';

const DonorDashboard = () => {
	// // To verify getCharities API working
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

	// // Test getProposals
	// const [proposals, setProposals] = useState([]);

	// const fetchProposals = async () => {
	// 	try {
	// 		const token = localStorage.getItem('authToken');
	// 		const response = await fetch('/api/proposals', {
	// 			headers: {
	// 				'Authorization': `Bearer ${token}`
	// 			}
	// 		});
	// 		const data = await response.json();

	// 		if (data.success) {
	// 			console.log('Fetched proposals:', data.data);
	// 			setProposals(data.data);
	// 		} else {
	// 			console.error('Failed to fetch proposals:', data.message);
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching proposals:', error);
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
				{/* <button
					className="btn btn-primary w-fit"
					onClick={fetchProposals}
				>
					Test Get Proposals
				</button> */}
				<div className='flex flex-row flex-wrap justify-evenly gap-8 w-full'>
					<Card />
					<Card />
					<Card />
					<Card />
					<Card />
					<Card />
					{/* {proposals.length > 0 ?
						proposals.map((proposal, index) => (
							<Card key={proposal.id || index} proposal={proposal} />
						))
						:
						Array(6).fill(null).map((_, index) => (
							<Card key={index} />
						))
					} */}
				</div>
				<Table />
			</div>
			<Footer />
		</div>
	);
}

export default DonorDashboard;
