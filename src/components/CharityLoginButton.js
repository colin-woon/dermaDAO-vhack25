import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const CharityLoginButton = ({ onLoginSuccess }) => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isModalOpen, setIsModalOpen] = useState('');
	const [error, setError] = useState('');

	const handleLogin = async () => {
		try {
			const db = getFirestore();
			const usersRef = collection(db, 'users');
			const q = query(
				usersRef,
				where('username', '==', username),
				where('password', '==', password)
			);

			const querySnapshot = await getDocs(q);
			// Replace the console.log line with:
			console.log('Query results:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0];
				const userId = userDoc.id;
				onLoginSuccess(userId);
				setIsModalOpen(false);
				// Clear form after successful login
				setUsername('');
				setPassword('');
				setError('');
			} else {
				setError('Invalid credentials');
			}
		} catch (error) {
			console.error('Login error:', error);
			setError('An error occurred during login');
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
					{error && (
						<div className="alert alert-error mb-4">
							<span>{error}</span>
						</div>
					)}
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
