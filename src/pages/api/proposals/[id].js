import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	const { id } = req.query;

	switch (req.method) {
		case 'GET':
			return getProposalById(req, res, id);
		case 'PUT':
			return updateProposal(req, res, id);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getProposalById(req, res, id) {
	try {
		const result = await pool.query(
			'SELECT * FROM proposals WHERE id = $1',
			[id]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Proposal not found'
			});
		}

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error fetching proposal:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching proposal'
		});
	}
}

async function updateProposal(req, res, id) {
	try {
		const user = await auth(req);

		const proposal = await pool.query(
			'SELECT * FROM proposals WHERE id = $1',
			[id]
		);

		if (proposal.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Proposal not found'
			});
		}

		// Check authorization
		if (proposal.rows[0].charity_wallet !== user.walletAddress && user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Unauthorized to update this proposal'
			});
		}

		const { title, description, fundingGoal, duration, status } = req.body;

		const result = await pool.query(
			`UPDATE proposals
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           funding_goal = COALESCE($3, funding_goal),
           duration = COALESCE($4, duration),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
			[title, description, fundingGoal, duration, status, id]
		);

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error updating proposal:', error);
		return res.status(500).json({
			success: false,
			message: 'Error updating proposal'
		});
	}
}
