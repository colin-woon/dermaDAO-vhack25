import { auth } from '@/middleware/auth';
import { pool as db } from '@/utils/postgresConnection'; // Make sure this import exists

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		// Apply auth middleware
		const decoded = await auth(req, res);
		console.log('Auth successful, user:', decoded); // Debug log

		if (!db) {
			console.error('Database connection not initialized');
			return res.status(500).json({
				message: 'Database connection error'
			});
		}

		const { walletAddress, role: decodedRole } = decoded; // Get role from decoded token
		console.log('Fetching user with wallet:', walletAddress);

		// Get user profile from database
		const result = await db.query(
			'SELECT * FROM users WHERE wallet_address = $1',
			[walletAddress]
		);

		console.log('User lookup result:', result.rows.length > 0 ? 'User found' : 'User not found');

		let user;

		if (result.rows.length === 0) {
			// Create new user
			console.log('Creating new user with role:', decodedRole);
			const newUserResult = await db.query(
				'INSERT INTO users (wallet_address, role, username) VALUES ($1, $2, $3) RETURNING *',
				[walletAddress, decodedRole || 'donor', `User-${walletAddress.slice(0, 8)}`]
			);
			user = newUserResult.rows[0];
		} else {
			user = result.rows[0];
		}
		return res.status(200).json({
			user: {
				walletAddress: user.wallet_address,
				role: user.role,
				name: user.name,
				email: user.email,
				createdAt: user.created_at
			}
		});
	} catch (error) {
		console.error('Profile fetch error:', error);
		return res.status(500).json({
			message: 'Internal server error',
			details: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
}
