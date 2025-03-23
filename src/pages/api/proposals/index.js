import { auth } from '@/middleware/auth';
import { uploadToIPFS } from '@/utils/ipfs';
import { validateProposal } from '@/services/aiValidation';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getProposals(req, res);
		case 'POST':
			return createProposal(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getProposals(req, res) {
	try {
		// Authenticate user
		const user = await auth(req);

		// Different queries based on user role
		let query = 'SELECT * FROM proposals';
		const params = [];

		if (user.role === 'charity') {
			query += ' WHERE charity_wallet = $1';
			params.push(user.walletAddress);
		} else if (user.role !== 'admin') {
			query += ' WHERE status = $1';
			params.push('approved');
		}

		query += ' ORDER BY created_at DESC';

		const result = await pool.query(query, params);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching proposals:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching proposals'
		});
	}
}

async function createProposal(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'charity') {
			return res.status(403).json({
				success: false,
				message: 'Only charities can create proposals'
			});
		}

		const {
			title,
			description,
			fundingGoal,
			duration,
			documents
		} = req.body;

		// Validate input
		if (!title || !description || !fundingGoal || !duration) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields'
			});
		}

		// Upload documents to IPFS
		let documentsHash = null;
		if (documents) {
			documentsHash = await uploadToIPFS(documents);
		}

		// Validate proposal with AI
		const validationResult = await validateProposal({
			title,
			description,
			fundingGoal
		});

		if (!validationResult.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Proposal validation failed',
				details: validationResult.reasons
			});
		}

		// Insert into database
		const result = await pool.query(
			`INSERT INTO proposals (
        title,
        description,
        funding_goal,
        duration,
        documents_hash,
        charity_wallet,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
			[
				title,
				description,
				fundingGoal,
				duration,
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
		console.error('Error creating proposal:', error);
		return res.status(500).json({
			success: false,
			message: 'Error creating proposal'
		});
	}
}
