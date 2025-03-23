import { auth, authorize } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	const { id } = req.query;

	switch (req.method) {
		case 'GET':
			return getCharityById(req, res, id);
		case 'PUT':
			return updateCharity(req, res, id);
		case 'DELETE':
			return deleteCharity(req, res, id);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getCharityById(req, res, id) {
	try {
		const result = await pool.query(
			'SELECT * FROM charities WHERE id = $1',
			[id]
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
		console.error('Error fetching charity:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching charity'
		});
	}
}

async function updateCharity(req, res, id) {
	try {
		const user = await auth(req);

		// Verify ownership or admin status
		const charity = await pool.query(
			'SELECT * FROM charities WHERE id = $1',
			[id]
		);

		if (charity.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Charity not found'
			});
		}

		if (charity.rows[0].wallet_address !== user.walletAddress && user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Unauthorized to update this charity'
			});
		}

		const { name, description, website, status } = req.body;

		const result = await pool.query(
			`UPDATE charities
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           website = COALESCE($3, website),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
			[name, description, website, status, id]
		);

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error updating charity:', error);
		return res.status(500).json({
			success: false,
			message: 'Error updating charity'
		});
	}
}
