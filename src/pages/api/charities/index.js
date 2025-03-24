import { auth, authorize } from '@/middleware/auth';
import { uploadToIPFS } from '@/utils/ipfs';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getCharities(req, res);
		case 'POST':
			return createCharity(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

// Get all charities
async function getCharities(req, res) {
	try {
		const result = await pool.query(
			'SELECT * FROM charities ORDER BY created_at DESC'
		);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching charities:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching charities'
		});
	}
}

// Create new charity
async function createCharity(req, res) {
	try {
		// Authenticate and authorize
		const user = await auth(req);
		if (user.role !== 'charity') {
			return res.status(403).json({
				success: false,
				message: 'Only charity accounts can register'
			});
		}

		const { name, description, blockchainId, ownerAddress } = req.body;
		console.log('Creating charity with data:', req.body); // Debug log

		// Input validation
		if (!name || !description || !blockchainId || !ownerAddress) {
			return res.status(400).json({
				success: false,
				message: 'Name, description, blockchain ID, and owner address are required'
			});
		}

		// Get admin_id from users table using wallet address
		const userResult = await pool.query(
			'SELECT id FROM users WHERE wallet_address = $1',
			[ownerAddress]
		);

		if (userResult.rows.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'User not found for the given wallet address'
			});
		}

		const adminId = userResult.rows[0].id;

		// Insert into database
		const result = await pool.query(
			`INSERT INTO charities (
				name,
				description,
				blockchain_id,
				admin_id,
				is_verified,
				created_at,
				updated_at
			) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			RETURNING *`,
			[name, description, blockchainId, adminId, false]
		);

		console.log('Charity created in database:', result.rows[0]); // Debug log

		return res.status(201).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error creating charity:', error);
		return res.status(500).json({
			success: false,
			message: `Error creating charity: ${error.message}`
		});
	}
}
