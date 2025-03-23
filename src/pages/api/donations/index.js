import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getDonations(req, res);
		case 'POST':
			return createDonation(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getDonations(req, res) {
	try {
		const user = await auth(req);

		// Different queries based on user role
		let query = `
      SELECT d.*, p.title as proposal_title, c.name as charity_name
      FROM donations d
      JOIN proposals p ON d.proposal_id = p.id
      JOIN charities c ON p.charity_wallet = c.wallet_address
    `;
		const params = [];

		if (user.role === 'donor') {
			query += ' WHERE d.donor_wallet = $1';
			params.push(user.walletAddress);
		} else if (user.role === 'charity') {
			query += ' WHERE p.charity_wallet = $1';
			params.push(user.walletAddress);
		}

		query += ' ORDER BY d.created_at DESC';

		const result = await pool.query(query, params);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching donations:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching donations'
		});
	}
}

async function createDonation(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'donor') {
			return res.status(403).json({
				success: false,
				message: 'Only donors can make donations'
			});
		}

		const { proposalId, amount, transactionHash } = req.body;

		// Validate input
		if (!proposalId || !amount || !transactionHash) {
			return res.status(400).json({
				success: false,
				message: 'Missing required fields'
			});
		}

		// Verify proposal exists and is active
		const proposal = await pool.query(
			'SELECT * FROM proposals WHERE id = $1 AND status = $2',
			[proposalId, 'active']
		);

		if (proposal.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Proposal not found or not active'
			});
		}

		// Insert donation
		const result = await pool.query(
			`INSERT INTO donations (
        proposal_id,
        donor_wallet,
        amount,
        transaction_hash,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
			[proposalId, user.walletAddress, amount, transactionHash, 'confirmed']
		);

		return res.status(201).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error creating donation:', error);
		return res.status(500).json({
			success: false,
			message: 'Error creating donation'
		});
	}
}
