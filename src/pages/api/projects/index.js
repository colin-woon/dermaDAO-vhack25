import { auth } from '@/middleware/auth';
import { uploadToIPFS } from '@/utils/ipfs';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getProjects(req, res);
		case 'POST':
			return createProject(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getProjects(req, res) {
	try {
		const { status, charityId } = req.query;

		let query = `
      SELECT p.*, c.name as charity_name
      FROM projects p
      JOIN charities c ON p.charity_wallet = c.wallet_address
      WHERE 1=1
    `;
		const params = [];
		let paramCount = 1;

		if (status) {
			query += ` AND p.status = $${paramCount}`;
			params.push(status);
			paramCount++;
		}

		if (charityId) {
			query += ` AND p.charity_wallet = $${paramCount}`;
			params.push(charityId);
		}

		query += ' ORDER BY p.created_at DESC';

		const result = await pool.query(query, params);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching projects:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching projects'
		});
	}
}

async function createProject(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'charity') {
			return res.status(403).json({
				success: false,
				message: 'Only charities can create projects'
			});
		}

		const {
			title,
			description,
			timeline,
			budget,
			documents
		} = req.body;

		if (!title || !description || !timeline || !budget) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields'
			});
		}

		// Upload documents to IPFS if provided
		let documentsHash = null;
		if (documents) {
			documentsHash = await uploadToIPFS(documents);
		}

		const result = await pool.query(
			`INSERT INTO projects (
        title,
        description,
        timeline,
        budget,
        documents_hash,
        charity_wallet,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
			[
				title,
				description,
				timeline,
				budget,
				documentsHash,
				user.walletAddress,
				'pending'
			]
		);

		return res.status(201).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error creating project:', error);
		return res.status(500).json({
			success: false,
			message: 'Error creating project'
		});
	}
}
