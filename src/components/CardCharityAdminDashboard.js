import { useState, useRef } from 'react';

const CardCharityAdminDashboard = () => {
	const [isResultModalOpen, setIsResultModalOpen] = useState(false);
	const [score, setScore] = useState(null);
	const [explanation, setExplanation] = useState('');
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef(null);

	const renderScoreIcon = (score) => {
		if (score >= 80) {
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
			const uploadResponse = await fetch('/api/upload-proposal', {
				method: 'POST',
				body: formData,
			});
			const { text } = await uploadResponse.json();

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
			setIsResultModalOpen(true);
		} catch (error) {
			console.error('Error processing proposal:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card bg-purple-950/40 w-1/4 shadow-sm rounded-3xl">
			<figure>
				<img
					src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
					alt="Project" />
			</figure>
			<div className="card-body">
				<h2 className="card-title">Project Name</h2>
				<p>Upload your project proposal to get it analyzed</p>
				<div className="card-actions justify-end">
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept=".pdf"
						onChange={handleFileUpload}
					/>
					<button
						className="btn btn-primary"
						onClick={() => fileInputRef.current.click()}
						disabled={loading}
					>
						{loading ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : (
							'Upload Proposal'
						)}
					</button>
				</div>

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

							{/* Additional actions for successful proposals
							{score >= 80 && (
								<div className="mt-4 border-t border-violet-800 pt-4">
									<h4 className="font-semibold mb-2">Next Steps:</h4>
									<div className="space-y-2">
										<button className="btn btn-success btn-sm w-full">
											Submit for Final Review
										</button>
										<button className="btn btn-primary btn-sm w-full">
											Generate Smart Contract
										</button>
										<button className="btn btn-info btn-sm w-full">
											Schedule Presentation
										</button>
									</div>
								</div>
							)} */}
						</div>
						<div className="modal-action">
							<button
								className="btn btn-primary"
								onClick={() => setIsResultModalOpen(false)}
							>
								Close
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setIsResultModalOpen(false)}>close</button>
					</form>
				</dialog>
			</div>
		</div>
	);
}

export default CardCharityAdminDashboard;
