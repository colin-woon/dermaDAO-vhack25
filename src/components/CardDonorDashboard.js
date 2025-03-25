import { useState } from 'react';

const CardDonorDashboard = ({ project }) => {
	const [showDonateModal, setShowDonateModal] = useState(false);
	const [donationAmount, setDonationAmount] = useState('');
	const [loading, setLoading] = useState(false);

	const handleDonate = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				throw new Error('Please connect your wallet first');
			}

			const amount = parseFloat(donationAmount);
			if (isNaN(amount) || amount <= 0) {
				throw new Error('Please enter a valid donation amount');
			}

			const response = await fetch('/api/donations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					projectId: project.id,
					amount: amount
				})
			});

			if (!response.ok) {
				throw new Error('Failed to process donation');
			}

			alert('Donation successful!');
			setShowDonateModal(false);
			setDonationAmount('');
		} catch (error) {
			console.error('Error making donation:', error);
			alert('Error making donation: ' + error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card bg-purple-950/90 w-1/4 shadow-sm rounded-3xl">
			<figure>
				<img
					src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
					alt="Project" />
			</figure>
			<div className="card-body">
				<h2 className="card-title">{project.name}</h2>
				<p>Goal Amount: {project.goal_amount} DRMA</p>
				<p>Distributed Funds: {project.allocated_funds || 0} DRMA</p>
				<p>Description: {project.description}</p>
				<div className="card-actions flex justify-between items-center w-full gap-1">
					<button
						className="btn btn-accent btn-sm w-[32%] text-xs"
					>
						Transactions
					</button>
					<button
						className="btn btn-secondary btn-sm w-[32%] text-xs"
					>
						Proposals
					</button>
					<button
						className="btn btn-primary btn-sm w-[32%] text-xs"
						onClick={() => setShowDonateModal(true)}
					>
						Donate
					</button>
				</div>

				{/* Donate Modal */}
				<dialog className={`modal ${showDonateModal ? 'modal-open' : ''}`}>
					<div className="modal-box bg-violet-950/90">
						<h3 className="font-bold text-lg mb-4">Donate to Project</h3>
						<form onSubmit={handleDonate}>
							<div className="form-control">
								<label className="label">
									<span className="label-text">Amount (DRMA)</span>
								</label>
								<input
									type="number"
									step="0.01"
									min="0"
									required
									className="input input-bordered bg-gray-800"
									value={donationAmount}
									onChange={(e) => setDonationAmount(e.target.value)}
									placeholder="Enter amount"
								/>
							</div>
							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setShowDonateModal(false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="btn btn-primary"
									disabled={loading}
								>
									{loading ? (
										<span className="flex items-center">
											<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Processing...
										</span>
									) : 'Donate'}
								</button>
							</div>
						</form>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setShowDonateModal(false)}>close</button>
					</form>
				</dialog>
			</div>
		</div>
	);
}

export default CardDonorDashboard;
