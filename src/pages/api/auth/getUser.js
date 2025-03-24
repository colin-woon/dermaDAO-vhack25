import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const user = await auth(req);

		// Get user details from database
		const userResult = await pool.query(
			'SELECT id, wallet_address, role, username, created_at FROM users WHERE wallet_address = $1',
			[user.walletAddress]
		);

		if (userResult.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		const userData = userResult.rows[0];

		// If user is a charity, get charity information
		let charityData = null;
		if (userData.role === 'charity') {
			const charityResult = await pool.query(
				'SELECT id, blockchain_id, name, description, is_verified FROM charities WHERE admin_id = $1',
				[userData.id]
			);
			if (charityResult.rows.length > 0) {
				charityData = charityResult.rows[0];
			}
		}

		return res.status(200).json({
			success: true,
			user: {
				...userData,
				charity: charityData
			}
		});
	} catch (error) {
		console.error('Error getting user:', error);
		return res.status(500).json({
			success: false,
			message: 'Error getting user information'
		});
	}
}
