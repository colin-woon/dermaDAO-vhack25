import { useState } from 'react';
import Table from './Table';

const Card = ({ onClick, isSelected, cardId, mockTableData }) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);

	const handleDonate = (e) => {
        e.stopPropagation();
        console.log('Donating:', donationAmount);
        setIsModalOpen(false);
        setDonationAmount('');
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
    };

    const handleTransactionsClick = (e) => {
        e.stopPropagation();
        setIsTableModalOpen(true);
    };

	return (
		<div className={`card bg-purple-950/90 w-1/4 rounded-3xl`}  onClick={onClick}>
			<figure>
				<img
					src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
					alt="Shoes" />
			</figure>
			<div class="card-body">
				<h2 class="card-title">Project Name</h2>
				<p>Estimated amount: </p>
				<p>Distributed Funds: </p>
				<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.</p>
				<div className="card-actions flex justify-between items-center w-full gap-1">
                <button
                    className="btn btn-accent btn-sm w-[32%] text-xs"
                    onClick={handleTransactionsClick}
                >
                    Transactions
                </button>
                <button
                    className="btn btn-secondary btn-sm w-[32%] text-xs"
                    onClick={handleButtonClick}
                >
                    Proposals
                </button>
                <button
                    className="btn btn-primary btn-sm w-[32%] text-xs"
                    onClick={(e) => {
                        handleButtonClick(e);
                        setIsModalOpen(true);
                    }}
                >
                    Donate
                </button>
            </div>
			 {/* Donation Modal */}
				<dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`} onClick={handleButtonClick}>
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

				  {/* Transactions Table Modal */}
				  <dialog className={`modal ${isTableModalOpen ? 'modal-open' : ''}`}>
                <div className="modal-box bg-gray-800 w-11/12 max-w-5xl">
                    <h3 className="font-bold text-lg mb-4 text-white">
                        Transactions for Card {cardId}
                    </h3>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <Table data={mockTableData} />
                    </div>
                    <div className="modal-action">
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsTableModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setIsTableModalOpen(false)}>close</button>
                </form>
            </dialog>
			</div>
		</div>
	);
}

// const Card = ({ proposal }) => {
// 	return (
// 		<div className="card w-96 bg-base-100 shadow-xl">
// 			<div className="card-body">
// 				<h2 className="card-title">{proposal?.title || 'Loading...'}</h2>
// 				<p>{proposal?.description || 'No description available'}</p>
// 				{proposal && (
// 					<>
// 						<p>Funding Goal: {proposal.funding_goal} ETH</p>
// 						<p>Status: {proposal.status}</p>
// 						<p>Duration: {proposal.duration} days</p>
// 					</>
// 				)}
// 				<div className="card-actions justify-end">
// 					<button className="btn btn-primary">View Details</button>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

export default Card;
