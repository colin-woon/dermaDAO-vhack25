import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	switch (req.method) {
		case 'GET':
			return getPendingCharities(req, res);
		case 'PUT':
			return updateCharityStatus(req, res);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getPendingCharities(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		const result = await pool.query(`
      SELECT *
      FROM charities
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `);

		return res.status(200).json({
			success: true,
			data: result.rows
		});
	} catch (error) {
		console.error('Error fetching pending charities:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching pending charities'
		});
	}
}

async function updateCharityStatus(req, res) {
	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Admin access required'
			});
		}

		const { charityId, status, notes } = req.body;

		if (!['approved', 'rejected'].includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid status'
			});
		}

		const result = await pool.query(`
      UPDATE charities
      SET
        status = $1,
        admin_notes = $2,
        verified_at = NOW(),
        verified_by = $3
      WHERE id = $4
      RETURNING *
    `, [status, notes, user.walletAddress, charityId]);

		if (result.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Charity not found'
			});
		}

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error updating charity status:', error);
		return res.status(500).json({
			success: false,
			message: 'Error updating charity status'
		});
	}
}
