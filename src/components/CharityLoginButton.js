import React, { useState } from 'react';

const CharityLoginButton = ({ onLoginSuccess }) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleLogin = () => {
		// Hardcoded credentials
		if (username === 'charity123' && password === 'password123') {
			onLoginSuccess();
			setIsModalOpen(false);
			// Clear form after successful login
			setUsername('');
			setPassword('');
		} else {
			alert('Invalid credentials');
		}
	};

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
				className='btn btn-active btn-secondary'
			>
				Login as Charity
			</button>

			{/* Modal Dialog */}
			<dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
				<div className="modal-box">
					<h3 className="font-bold text-lg mb-4">Charity Login</h3>
					<form className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Username</span>
							</label>
							<input
								type="text"
								className="input input-bordered w-full"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Password</span>
							</label>
							<input
								type="password"
								className="input input-bordered w-full"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</form>
					<div className="modal-action">
						<button
							className="btn btn-primary"
							onClick={handleLogin}
						>
							Login
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
		</>
	);
};

export default CharityLoginButton;
