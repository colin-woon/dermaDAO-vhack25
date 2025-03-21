import DonorDashboardNavBar from './DonorDashboardNavBar';
import Footer from './Footer';
import Table from './Table';
import Card from './Card';

const DonorDashboard = () => {
	return (
		<div className='flex flex-col justify-between min-h-screen bg-gray-950'>
			{/* <h1>Donor Dashboard</h1> */}
			<DonorDashboardNavBar />
			<div className='flex flex-col justify-around min-h-screen p-10 space-y-12'>
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
