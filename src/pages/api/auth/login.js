import { verifySignature } from '@/services/blockchain';
import jwt from 'jsonwebtoken';
import { pool as db } from '@/utils/postgresConnection';
import { ethers } from 'ethers';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	const { walletAddress, signature, message, role } = req.body;

	// Input validation
	if (!walletAddress || !signature || !message || !role) {
		return res.status(400).json({
			message: 'Missing required fields'
		});
	}

	if (!['donor', 'charity', 'admin'].includes(role)) {
		return res.status(400).json({
			message: 'Invalid role specified'
		});
	}

	try {
		// Verify the signature
		const isValid = await verifySignature(message, signature, walletAddress);
		if (!isValid) {
			return res.status(401).json({
				message: 'Invalid signature'
			});
		}

		// Check if user exists in database
		const result = await db.query(
			'SELECT * FROM users WHERE wallet_address = $1',
			[walletAddress]
		);

		let user;
		if (result.rows.length === 0) {
			// Create new user if doesn't exist
			const newUserResult = await db.query(
				'INSERT INTO users (wallet_address, role, username) VALUES ($1, $2, $3) RETURNING *',
				[walletAddress, role, `User-${walletAddress.slice(0, 8)}`]
			);
			user = newUserResult.rows[0];
		} else {
			user = result.rows[0];
		}

		// If role is charity, get charity information
		let charityId = null;
		if (role === 'charity') {
			const charityResult = await db.query(
				'SELECT id, blockchain_id FROM charities WHERE admin_id = $1',
				[user.id]
			);
			if (charityResult.rows.length > 0) {
				charityId = charityResult.rows[0].id;
			}
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				walletAddress,
				role,
				userId: user.id,
				charityId
			},
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);

		return res.status(200).json({
			message: 'Login successful',
			token,
			user: {
				id: user.id,
				walletAddress: user.wallet_address,
				role: user.role,
				username: user.username,
				createdAt: user.created_at,
				charityId
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({
			message: 'Internal server error'
		});
	}
}
