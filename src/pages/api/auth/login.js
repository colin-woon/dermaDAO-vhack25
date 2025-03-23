import { verifySignature } from '@/services/blockchain';
import jwt from 'jsonwebtoken';

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

		// Generate JWT token
		const token = jwt.sign(
			{
				walletAddress,
				role
			},
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);

		return res.status(200).json({
			message: 'Login successful',
			token,
			user: {
				walletAddress,
				role
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({
			message: 'Internal server error'
		});
	}
}
