import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const user = await auth(req);

		const result = await pool.query(
			`SELECT
        d.*,
        p.title as proposal_title,
        c.name as charity_name
      FROM donations d
      JOIN proposals p ON d.proposal_id = p.id
      JOIN charities c ON p.charity_wallet = c.wallet_address
      WHERE d.donor_wallet = $1
      ORDER BY d.created_at DESC`,
			[user.walletAddress]
		);

		return res.status(200).json({
			success: true,
			data: {
				donations: result.rows,
				total: result.rows.reduce((sum, donation) => sum + Number(donation.amount), 0)
			}
		});
	} catch (error) {
		console.error('Error fetching user donations:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching user donations'
		});
	}
}
