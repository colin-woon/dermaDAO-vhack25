import { auth } from '@/middleware/auth';

export default async function handler(req, res) {
	if (req.method !== 'PUT') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		console.log("PUT Update Profile")
		// Apply auth middleware
		await auth(req, res);

		const { db } = req;
		const { walletAddress } = req.user;
		const { name, email } = req.body;

		// Validate input
		if (!name && !email) {
			return res.status(400).json({
				message: 'No fields to update'
			});
		}

		// Update user profile
		const result = await db.query(
			`UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           updated_at = NOW()
       WHERE wallet_address = $3
       RETURNING *`,
			[name, email, walletAddress]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				message: 'User not found'
			});
		}

		const user = result.rows[0];
		return res.status(200).json({
			message: 'Profile updated successfully',
			user: {
				walletAddress: user.wallet_address,
				role: user.role,
				name: user.name,
				email: user.email,
				updatedAt: user.updated_at
			}
		});
	} catch (error) {
		console.error('Profile update error:', error);
		return res.status(500).json({
			message: 'Internal server error'
		});
	}
}
