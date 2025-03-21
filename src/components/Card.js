import { useState } from 'react';

const Card = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [donationAmount, setDonationAmount] = useState('');

	const handleDonate = () => {
		// Handle donation logic here
		console.log('Donating:', donationAmount);
		setIsModalOpen(false);
		setDonationAmount('');
	};
	return (
		<div class="card bg-purple-950/40 w-1/4 shadow-sm rounded-3xl">
			<figure>
				<img
					src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
					alt="Shoes" />
			</figure>
			<div class="card-body">
				<h2 class="card-title">Card Title</h2>
				<p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
				<div className="card-actions justify-end">
					<button
						className="btn btn-primary"
						onClick={() => setIsModalOpen(true)}
					>
						Donate
					</button>
				</div>
				<dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
					<div className="modal-box bg-violet-950/90">
						<h3 className="font-bold text-lg mb-4">Enter Donation Amount</h3>
						<input
							type="number"
							placeholder="Amount in ETH"
							className="input input-bordered w-full"
							value={donationAmount}
							onChange={(e) => setDonationAmount(e.target.value)}
						/>
						<div className="modal-action">
							<button
								className="btn btn-primary"
								onClick={handleDonate}
							>
								Confirm Donation
							</button>
							<button
								className="btn"
								onClick={() => setIsModalOpen(false)}
							>
								Cancel
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setIsModalOpen(false)}>close</button>
					</form>
				</dialog>

			</div>
		</div>
	);
}

export default Card;
