import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CharityAdminDashboardNavBar from './CharityAdminDashboardNavBar';
import Footer from './Footer';
import CardCharityAdminDashboard from './CardCharityAdminDashboard';

const CharityAdminDashboard = () => {
	const [score, setScore] = useState(null);
	const [explanation, setExplanation] = useState('');
	const [loading, setLoading] = useState(false);

	const onDrop = async (acceptedFiles) => {
		const file = acceptedFiles[0];
		if (!file) return;

		setLoading(true);
		const formData = new FormData();
		formData.append('pdf', file);

		try {
			// First upload the PDF
			const uploadResponse = await fetch('/api/upload-proposal', {
				method: 'POST',
				body: formData,
			});

			const { text } = await uploadResponse.json();

			// Then analyze with Gemini
			const analyzeResponse = await fetch('/api/analyze-proposal', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ text }),
			});

			const { score, explanation } = await analyzeResponse.json();
			setScore(score);
			setExplanation(explanation);
		} catch (error) {
			console.error('Error processing proposal:', error);
		} finally {
			setLoading(false);
		}
	};

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept: {
			'application/pdf': ['.pdf'],
		},
		maxFiles: 1,
	});

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
			<div
				{...getRootProps()}
				className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
			>
				<input {...getInputProps()} />
				<p>Drop your proposal PDF here, or click to select</p>
			</div>

			{loading && (
				<div className="mt-4 text-center">
					<p>Analyzing proposal...</p>
				</div>
			)}

			{score !== null && (
				<div className="mt-6 p-4 bg-gray-100 rounded-lg">
					<h2 className="font-bold mb-2">Proposal Score:</h2>
					<div className="text-3xl font-bold text-blue-600 mb-4">{score}/100</div>

					<h3 className="font-bold mb-2">Analysis:</h3>
					<div className="whitespace-pre-line text-gray-700">
						{explanation}
					</div>
				</div>
			)}
			<Footer />
		</div>
	);
};

export default CharityAdminDashboard;
