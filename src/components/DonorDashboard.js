import DonorDashboardNavBar from './DonorDashboardNavBar';
import Footer from './Footer';
import Table from './Table';
import Card from './Card';
import { useState } from 'react';
import { FlickeringGrid } from './magicui/flickering-grid';

const DonorDashboard = () => {
    const [selectedCard, setSelectedCard] = useState(null);

    // Mock data for the table
    const mockTableData = [
        { id: 1, date: '2025-03-24', amount: '1000 DERMA', status: 'Completed', recipient: '0x1234...5678' },
        { id: 2, date: '2025-03-23', amount: '500 DERMA', status: 'Pending', recipient: '0x8765...4321' },
        { id: 3, date: '2025-03-22', amount: '750 DERMA', status: 'Completed', recipient: '0x2468...1357' },
    ];

    const handleCardClick = (cardId) => {
        setSelectedCard(cardId);
    };

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
		<div className='relative flex flex-col justify-between min-h-screen bg-gray-950'>
		 <div className="fixed inset-0 ">
                <FlickeringGrid
                    color="rgb(80, 5, 255)"
                    maxOpacity={0.5}
                    className="w-full h-full"
                    squareSize={3}
                    gridGap={3}
                    flickerChance={0.7}
                />
            </div>
			<div className="relative z-10">
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
				{[1, 2, 3, 4, 5, 6].map((cardId) => (
                        <Card 
                            key={cardId}
                            cardId={cardId}
                            onClick={() => handleCardClick(cardId)}
                            isSelected={selectedCard === cardId}
                            mockTableData={mockTableData}
                        />
                    ))}                
					</div>
			</div>
			<Footer />
			</div>
		</div>
	);
}

export default DonorDashboard;
