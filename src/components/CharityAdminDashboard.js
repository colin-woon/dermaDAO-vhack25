import React, { useState } from 'react';
import CharityAdminDashboardNavBar from './CharityAdminDashboardNavBar';
import Footer from './Footer';
import CardCharityAdminDashboard from './CardCharityAdminDashboard';
import { FlickeringGrid } from './magicui/flickering-grid';

const CharityAdminDashboard = () => {
	return (
		<div className="flex flex-col justify-between min-h-screen bg-gray-950">
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

			<CharityAdminDashboardNavBar />
			<div className='flex flex-row flex-wrap justify-evenly gap-8 w-full mt-10 mb-10'>
				<CardCharityAdminDashboard mockAmount={5000}/>
				<CardCharityAdminDashboard mockAmount={3000}/>
				<CardCharityAdminDashboard mockAmount={6000}/>
				<CardCharityAdminDashboard mockAmount={8000}/>
				<CardCharityAdminDashboard mockAmount={9000}/>
			</div>
			<Footer />
					</div>
		</div>
	);
};

export default CharityAdminDashboard;
