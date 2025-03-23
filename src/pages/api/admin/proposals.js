import { auth } from '@/middleware/auth';
import { validateProposal } from '@/services/aiValidation';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getPendingProposals(req, res);
		case 'POST':
			return validateProposals(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getPendingProposals(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		const result = await pool.query(`
      SELECT p.*, c.name as charity_name
      FROM proposals p
      JOIN charities c ON p.charity_wallet = c.wallet_address
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching pending proposals:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching pending proposals'
		});
	}
}

async function validateProposals(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		const { proposalId } = req.body;

		const proposal = await pool.query(
			'SELECT * FROM proposals WHERE id = $1',
			[proposalId]
		);

		if (proposal.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Proposal not found'
			});
		}

		// Run AI validation
		const validationResult = await validateProposal(proposal.rows[0]);

		// Update proposal with validation results
		const result = await pool.query(`
      UPDATE proposals
      SET
        validation_status = $1,
        validation_details = $2,
        validated_at = NOW(),
        validated_by = $3
      WHERE id = $4
      RETURNING *
    `, [
			validationResult.isValid ? 'approved' : 'rejected',
			JSON.stringify(validationResult),
			user.walletAddress,
			proposalId
		]);

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error validating proposal:', error);
		return res.status(500).json({
			success: false,
			message: 'Error validating proposal'
		});
	}
}
