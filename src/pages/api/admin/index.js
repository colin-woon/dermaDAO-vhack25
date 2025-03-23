import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getAdminDashboard(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getAdminDashboard(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		// Get dashboard statistics
		const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM charities WHERE status = 'pending') as pending_charities,
        (SELECT COUNT(*) FROM proposals WHERE status = 'pending') as pending_proposals,
        (SELECT SUM(amount) FROM donations) as total_donations,
        (SELECT COUNT(DISTINCT donor_wallet) FROM donations) as unique_donors
    `);

		return res.status(200).json({
			success: true,
			data: stats.rows[0]
		});
	} catch (error) {
		console.error('Error fetching admin dashboard:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching admin dashboard'
		});
	}
}
