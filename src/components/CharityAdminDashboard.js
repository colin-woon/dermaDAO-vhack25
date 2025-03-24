import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CharityAdminDashboardNavBar from './CharityAdminDashboardNavBar';
import Footer from './Footer';
import CardCharityAdminDashboard from './CardCharityAdminDashboard';

const CharityAdminDashboard = () => {
	return (
		<div className="flex flex-col justify-between min-h-screen bg-gray-950">
			<CharityAdminDashboardNavBar />
			<div className='flex flex-row flex-wrap justify-evenly gap-8 w-full mt-10 mb-10'>
				<CardCharityAdminDashboard />
				<CardCharityAdminDashboard />
				<CardCharityAdminDashboard />
				<CardCharityAdminDashboard />
				<CardCharityAdminDashboard />
				<CardCharityAdminDashboard />
			</div>
			<Footer />
		</div>
	);
};

export default CharityAdminDashboard;
