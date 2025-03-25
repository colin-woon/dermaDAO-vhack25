import { useState } from 'react';
import { connectWallet, donate, getCurrentRoundId } from '@/services/blockchain';

const CardDonorDashboard = ({ project }) => {
	const [showDonateModal, setShowDonateModal] = useState(false);
	const [donationAmount, setDonationAmount] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleDonate = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				throw new Error('Please connect your wallet first');
			}

			const amount = parseFloat(donationAmount);
			if (isNaN(amount) || amount <= 0) {
				throw new Error('Please enter a valid donation amount');
			}

			// Connect wallet and get signer
			const { signer } = await connectWallet();

			// Get current round ID from blockchain and convert BigInt to string
			const currentRoundId = (await getCurrentRoundId()).toString();

			// Convert amount to string with 2 decimal places for DermaCoin
			const amountString = amount.toFixed(2);

			// Make donation on blockchain
			const receipt = await donate(signer, project.blockchain_id, amountString);

			// Save donation to database
			const response = await fetch('/api/donations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({
					projectId: project.id,
					amount: amount,
					transactionHash: receipt.hash,
					blockchainProjectId: project.blockchain_id,
					currentRoundId: currentRoundId
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save donation to database');
			}

			alert('Donation successful!');
			setShowDonateModal(false);
			setDonationAmount('');
		} catch (error) {
			console.error('Error making donation:', error);
			setError(error.message);
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
				<p>Goal Amount: {project.goal_amount} DMC</p>
				<p>Distributed Funds: {project.allocated_funds || 0} DMC</p>
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
						{error && (
							<div className="alert alert-error mb-4">
								<span>{error}</span>
							</div>
						)}
						<form onSubmit={handleDonate}>
							<div className="form-control">
								<label className="label">
									<span className="label-text">Amount (DMC)</span>
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
									onClick={() => {
										setShowDonateModal(false);
										setError(null);
									}}
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
						<button onClick={() => {
							setShowDonateModal(false);
							setError(null);
						}}>close</button>
					</form>
				</dialog>
			</div>
		</div>
	);
}

export default CardDonorDashboard;
