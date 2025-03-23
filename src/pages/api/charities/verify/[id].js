import { auth, authorize } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	if (req.method !== 'PUT') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const user = await auth(req);
		if (user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Only admins can verify charities'
			});
		}

		const { id } = req.query;
		const { status, verificationNotes } = req.body;

		if (!['verified', 'rejected'].includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid status'
			});
		}

		const result = await pool.query(
			`UPDATE charities
       SET status = $1,
           verification_notes = $2,
           verified_at = NOW(),
           verified_by = $3
       WHERE id = $4
       RETURNING *`,
			[status, verificationNotes, user.walletAddress, id]
		);

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
		console.error('Error verifying charity:', error);
		return res.status(500).json({
			success: false,
			message: 'Error verifying charity'
		});
	}
}
