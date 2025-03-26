import { useState, useRef } from 'react';

const CardCharityAdminDashboard = ({ project, isPending = false }) => {
	const [isResultModalOpen, setIsResultModalOpen] = useState(false);
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
	const [isTransactionHistoryModalOpen, setIsTransactionHistoryModalOpen] = useState(false);
	const [showClaimModal, setShowClaimModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [score, setScore] = useState(null);
	const [explanation, setExplanation] = useState('');
	const [loading, setLoading] = useState(false);
	const [transactionData, setTransactionData] = useState({
		recipientAddress: '',
		amount: '',
		description: ''
	});
	const fileInputRef = useRef(null);

    // Get mock image URL based on project ID or use default
    const getMockImageUrl = (projectId) => {
        const mockImages = [
            "/pictures/1.jpg", // Default
            "/pictures/1.jpg", // Project 1
            "/pictures/2.jpg", // Project 2
            "/pictures/3.jpg", // Project 3
            "/pictures/4.jpg", // Project 4
        ];
        return mockImages[projectId % mockImages.length] || mockImages[0];
    };

	// Mock data for demonstration
	const mockDistributedFunds = project.id === 'projectA' ? 10 : 10; // 10 DMC for Project A, 10 DMC for Project B
	const mockThresholdScore = 80;

	// Mock transaction history data
	const mockTransactionHistory = [
		{
			id: 1,
			date: '2024-03-25',
			recipient: '0x1234...5678',
			amount: '5 DMC',
			status: 'Completed',
			description: 'Initial distribution'
		},
		{
			id: 2,
			date: '2024-03-26',
			recipient: '0x8765...4321',
			amount: '3 DMC',
			status: 'Pending',
			description: 'Equipment purchase'
		}
	];

	const renderScoreIcon = (score) => {
		if (score >= mockThresholdScore) {
			return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
				<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
			</svg>;
		}
		return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
			<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
		</svg>;
	};

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		setLoading(true);
		const formData = new FormData();
		formData.append('pdf', file);

		try {
			// Mock API call for demonstration
			await new Promise(resolve => setTimeout(resolve, 1500));
			const mockScore = 85; // Mock score above threshold
			setScore(mockScore);
			setExplanation('The transaction request has been approved. The proposal demonstrates clear purpose and proper fund allocation.');
			setIsResultModalOpen(true);
		} catch (error) {
			console.error('Error processing proposal:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleTransactionSubmit = (e) => {
		e.preventDefault();
		// Mock transaction submission
		console.log('Transaction submitted:', transactionData);
		setIsTransactionModalOpen(false);
	};

	const renderStatusBadge = (status) => {
		const statusColors = {
			'Completed': 'bg-green-500/20 text-green-400',
			'Pending': 'bg-yellow-500/20 text-yellow-400',
			'Failed': 'bg-red-500/20 text-red-400'
		};
		return (
			<span className={`px-2 py-1 rounded-full text-xs ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
				{status}
			</span>
		);
	};

	const renderActionButtons = () => {
		if (isPending) {
			return (
				<div className="card-actions flex justify-center w-full mt-4">
					<button
						className="btn btn-accent btn-sm w-full"
						onClick={() => setShowDetailsModal(true)}
					>
						View Details
					</button>
				</div>
			);
		}

		return (
			<div className="card-actions flex justify-between items-center w-full gap-1 mt-4">
				<button
					className="btn btn-accent btn-sm w-[32%]"
					onClick={() => setIsTransactionHistoryModalOpen(true)}
				>
					Transactions
				</button>
				<button
					className="btn btn-secondary btn-sm w-[32%]"
					onClick={() => fileInputRef.current.click()}
					disabled={loading}
				>
					{loading ? (
						<span className="loading loading-spinner loading-sm"></span>
					) : (
						'Request Transaction'
					)}
				</button>
				<button
					className="btn btn-primary btn-sm w-[32%]"
					onClick={() => setShowEditModal(true)}
				>
					Status
				</button>
			</div>
		);
	};

	return (
		<div className="card bg-purple-950/90 w-full h-[500px] shadow-lg rounded-3xl">
			<figure className="h-64">
				<img
					src={project?.id ? getMockImageUrl(project.id) : "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"}
					alt={project.name || "Project"}
					className="w-full h-full object-cover"
				/>
			</figure>
			<div className="card-body">
				<div className="flex justify-between items-start">
					<h2 className="card-title text-2xl">{project.name}</h2>
					{isPending && (
						<span className="badge badge-warning text-xs text-center font-bold px-3 py-4">Pending Approval</span>
					)}
				</div>
				<div className="space-y-2 flex-grow">
					<p className="text-lg">Goal Amount: <span className="text-violet-400">{project.goal_amount} DMC</span></p>
					{!isPending && (
						<p className="text-lg">Distributed Funds: <span className="text-green-400">{project.allocated_funds || 0} DMC</span></p>
					)}
					<p className="text-gray-300">{project.description}</p>
				</div>
				{renderActionButtons()}
			</div>

			{/* Details Modal for Pending Projects */}
			{showDetailsModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-gray-950 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
						<h2 className="text-2xl font-bold mb-6 sticky top-0 bg-gray-950 py-2 z-10 border-b border-gray-800">Project Details</h2>
						<div className="overflow-y-auto flex-1 pr-2">
							<div className="space-y-6">
								{/* Basic Project Info */}
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-violet-400">Project Information</h3>
										<p className="text-gray-300 mt-2"><span className="font-medium">Name:</span> {project.name}</p>
										<p className="text-gray-300 mt-2"><span className="font-medium">Description:</span> {project.description}</p>
										<p className="text-gray-300 mt-2"><span className="font-medium">Goal Amount:</span> {project.goal_amount} DMC</p>
									</div>
								</div>

								{/* Proposal Details */}
								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-violet-400">Proposal Details</h3>

									<div>
										<h4 className="font-medium text-gray-200">Impact & Significance</h4>
										<p className="text-gray-300 mt-1">{project.proposal.impact}</p>
									</div>

									<div>
										<h4 className="font-medium text-gray-200">Methodology & Approach</h4>
										<p className="text-gray-300 mt-1">{project.proposal.methodology}</p>
									</div>

									<div>
										<h4 className="font-medium text-gray-200">Sustainability & Long-term Impact</h4>
										<p className="text-gray-300 mt-1">{project.proposal.sustainability}</p>
									</div>

									<div>
										<h4 className="font-medium text-gray-200">Budget Breakdown</h4>
										<p className="text-gray-300 mt-1">{project.proposal.budget_breakdown}</p>
									</div>

									<div>
										<h4 className="font-medium text-gray-200">Timeline & Milestones</h4>
										<p className="text-gray-300 mt-1">{project.proposal.timeline}</p>
									</div>
								</div>

								{/* AI and Donor Scores */}
								<div className="space-y-4">
									<h3 className="text-lg font-semibold text-violet-400">Evaluation Scores</h3>
									<div className="bg-purple-900/50 p-4 rounded-lg">
										<p className="text-gray-200">
											<span className="font-medium">AI Score:</span>{' '}
											<span className={project.proposal.ai_score >= 80 ? 'text-green-400' : 'text-yellow-400'}>
												{project.proposal.ai_score}/100
											</span>
										</p>
										{project.proposal.donor_scores && project.proposal.donor_scores.length > 0 && (
											<p className="text-gray-200 mt-2">
												<span className="font-medium">Donor Scores:</span>{' '}
												{project.proposal.donor_scores.map((score, index) => (
													<span key={index} className="text-violet-400">
														{score}/5{index < project.proposal.donor_scores.length - 1 ? ', ' : ''}
													</span>
												))}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
						<div className="flex justify-end mt-6 pt-4 border-t border-gray-800">
							<button
								className="btn btn-primary"
								onClick={() => setShowDetailsModal(false)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Results Dialog */}
			<dialog className={`modal ${isResultModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box bg-violet-950/90">
					<h3 className="font-bold text-lg mb-4">Proposal Analysis Results</h3>
					<div className="bg-violet-900/50 p-4 rounded-lg">
						<div className="flex items-center mb-2">
							<h3 className="font-bold mr-1">Score: {score}/100</h3>
							{renderScoreIcon(score)}
						</div>
						<p className="text-sm opacity-90">{explanation}</p>
					</div>
					<div className="modal-action">
						<button
							className="btn btn-primary"
							onClick={() => {
								setIsResultModalOpen(false);
								if (score >= mockThresholdScore) {
									setIsTransactionModalOpen(true);
								}
							}}
						>
							{score >= mockThresholdScore ? 'Proceed to Transaction' : 'Close'}
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setIsResultModalOpen(false)}>close</button>
				</form>
			</dialog>

			{/* Transaction History Dialog */}
			<dialog className={`modal ${isTransactionHistoryModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box bg-violet-950/90 max-w-4xl">
					<h3 className="font-bold text-lg mb-4">Transaction History</h3>
					<div className="overflow-x-auto">
						<table className="table w-full">
							<thead>
								<tr>
									<th>Date</th>
									<th>Recipient</th>
									<th>Amount</th>
									<th>Description</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{mockTransactionHistory.map((tx) => (
									<tr key={tx.id}>
										<td>{tx.date}</td>
										<td className="font-mono text-sm">{tx.recipient}</td>
										<td>{tx.amount}</td>
										<td>{tx.description}</td>
										<td>{renderStatusBadge(tx.status)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="modal-action">
						<button
							className="btn"
							onClick={() => setIsTransactionHistoryModalOpen(false)}
						>
							Close
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setIsTransactionHistoryModalOpen(false)}>close</button>
				</form>
			</dialog>

			{/* Transaction Request Dialog */}
			<dialog className={`modal ${isTransactionModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box bg-purple-950/90">
					<h2 className="text-2xl font-semibold mb-8">Transaction Request</h2>
					<form onSubmit={handleTransactionSubmit} className="space-y-6">
						<div className="form-control">
							<label className="text-gray-300 text-lg mb-2">
								Recipient Address
							</label>
							<input
								type="text"
								className="input input-bordered bg-purple-900/50 w-full h-12 text-white placeholder-gray-400"
								value={transactionData.recipientAddress}
								onChange={(e) => setTransactionData({...transactionData, recipientAddress: e.target.value})}
								placeholder="0x..."
							/>
						</div>
						<div className="form-control">
							<label className="text-gray-300 text-lg mb-2">
								Amount (DMC)
							</label>
							<input
								type="number"
								className="input input-bordered bg-purple-900/50 w-full h-12 text-white placeholder-gray-400"
								value={transactionData.amount}
								onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
								placeholder="Enter amount"
							/>
						</div>
						<div className="form-control">
							<label className="text-gray-300 text-lg mb-2">
								Description
							</label>
							<textarea
								className="textarea textarea-bordered bg-purple-900/50 w-full min-h-[100px] text-white placeholder-gray-400 resize-none"
								value={transactionData.description}
								onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
								placeholder="Describe the purpose of this transaction"
							/>
						</div>
						<div className="modal-action flex justify-end gap-3 mt-8">
							<button type="button" className="btn btn-ghost hover:bg-purple-800" onClick={() => setIsTransactionModalOpen(false)}>
								Cancel
							</button>
							<button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0">
								Submit Request
							</button>
						</div>
					</form>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setIsTransactionModalOpen(false)}>close</button>
				</form>
			</dialog>

			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept=".pdf"
				onChange={handleFileUpload}
			/>
		</div>
	);
}

export default CardCharityAdminDashboard;
