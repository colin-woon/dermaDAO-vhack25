import React, { useState, useEffect } from 'react';
import CharityAdminDashboardNavBar from './CharityAdminDashboardNavBar';
import Footer from './Footer';
import CardCharityAdminDashboard from './CardCharityAdminDashboard';
import { FlickeringGrid } from './magicui/flickering-grid';

const CharityAdminDashboard = () => {
	const [projects, setProjects] = useState([]);
	const [pendingProjects, setPendingProjects] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [charityId, setCharityId] = useState(null);
	const [activeTab, setActiveTab] = useState('projects');

	// Mock pending project data
	const mockPendingProject = {
		id: 'pending-1',
		name: 'Dermatology Research Initiative',
		description: 'A groundbreaking research project focusing on innovative treatments for chronic skin conditions.',
		goal_amount: 50.00,
		allocated_funds: 0,
		image_url: 'https://example.com/project-image.jpg',
		proposal: {
			impact: 'This research aims to develop new treatments that could benefit millions of patients worldwide.',
			methodology: 'Using cutting-edge technology and clinical trials to validate new treatment approaches.',
			sustainability: 'Results will be published open-source and methodology will be shared with other institutions.',
			budget_breakdown: 'Research equipment: 60%, Clinical trials: 30%, Documentation: 10%',
			timeline: '12-month project with quarterly milestones and regular progress reports.',
			ai_score: 85,
			donor_scores: [4.2, 4.5]
		},
		status: 'pending'
	};

	const fetchProjects = async () => {
		if (!charityId) return;

		setLoading(true);
		setError(null);
		try {
			// Fetch active projects
			const activeResponse = await fetch(`/api/projects?charityId=${charityId}&status=active`);
			if (!activeResponse.ok) {
				throw new Error('Failed to fetch active projects');
			}
			const activeData = await activeResponse.json();
			setProjects(Array.isArray(activeData) ? activeData : activeData.data || []);

			// For now, use mock pending project
			setPendingProjects([mockPendingProject]);

		} catch (err) {
			setError(err.message);
			setProjects([]);
			setPendingProjects([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (charityId) {
			fetchProjects();
		} else {
			// For demonstration, show mock pending project even without charity ID
			setPendingProjects([mockPendingProject]);
		}
	}, [charityId]);

	const handleWalletConnected = (id) => {
		setCharityId(id);
	};

	const handleProjectCreated = () => {
		fetchProjects();
	};

	return (
		<div className="flex flex-col min-h-screen bg-gray-950">
			<div className="fixed inset-0">
				<FlickeringGrid
					color="rgb(80, 5, 255)"
					maxOpacity={0.5}
					className="w-full h-full"
					squareSize={3}
					gridGap={3}
					flickerChance={0.7}
				/>
			</div>
			<div className="relative z-10 flex flex-col min-h-screen">
				<CharityAdminDashboardNavBar
					onWalletConnected={handleWalletConnected}
					onProjectCreated={handleProjectCreated}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
				<main className='flex-1 overflow-auto p-8'>
					<div className='grid grid-cols-3 gap-8 max-w-[1800px] mx-auto'>
						{loading ? (
							<div className="flex items-center justify-center w-full col-span-3">
								<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
							</div>
						) : error ? (
							<div className="text-red-500 text-center w-full col-span-3">{error}</div>
						) : activeTab === 'projects' ? (
							projects.length === 0 ? (
								<div className="text-gray-400 text-center w-full col-span-3">No active projects found</div>
							) : (
								projects.map((project) => (
									<CardCharityAdminDashboard key={project.id} project={project} />
								))
							)
						) : (
							pendingProjects.length === 0 ? (
								<div className="text-gray-400 text-center w-full col-span-3">No pending projects found</div>
							) : (
								pendingProjects.map((project) => (
									<CardCharityAdminDashboard key={project.id} project={project} isPending={true} />
								))
							)
						)}
					</div>
				</main>
				<Footer />
			</div>
		</div>
	);
};

export default CharityAdminDashboard;
