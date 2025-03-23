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

		const { name, description, website, documents } = req.body;

		// Input validation
		if (!name || !description) {
			return res.status(400).json({
				success: false,
				message: 'Name and description are required'
			});
		}

		// Upload documents to IPFS if provided
		let documentsHash = null;
		if (documents) {
			documentsHash = await uploadToIPFS(documents);
		}

		// Insert into database
		const result = await pool.query(
			`INSERT INTO charities (
        name,
        description,
        website,
        documents_hash,
        wallet_address,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *`,
			[name, description, website, documentsHash, user.walletAddress, 'pending']
		);

		return res.status(201).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error creating charity:', error);
		return res.status(500).json({
			success: false,
			message: 'Error creating charity'
		});
	}
}
