import { useState, useRef } from 'react';

const CardCharityAdminDashboard = () => {
	const [isResultModalOpen, setIsResultModalOpen] = useState(false);
	const [score, setScore] = useState(null);
	const [explanation, setExplanation] = useState('');
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef(null);

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
							<h3 className="font-bold mb-2">Score: {score}/100</h3>
							<p className="text-sm opacity-90">{explanation}</p>
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
