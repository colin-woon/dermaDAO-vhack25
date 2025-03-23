import { auth } from '@/middleware/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	const { id } = req.query;

	switch (req.method) {
		case 'GET':
			return getProjectById(req, res, id);
		case 'PUT':
			return updateProject(req, res, id);
		case 'DELETE':
			return deleteProject(req, res, id);
		default:
			return res.status(405).json({ message: 'Method not allowed' });
	}
}

async function getProjectById(req, res, id) {
	try {
		const result = await pool.query(`
      SELECT p.*, c.name as charity_name
      FROM projects p
      JOIN charities c ON p.charity_wallet = c.wallet_address
      WHERE p.id = $1
    `, [id]);

		if (result.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Project not found'
			});
		}

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error fetching project:', error);
		return res.status(500).json({
			success: false,
			message: 'Error fetching project'
		});
	}
}

async function updateProject(req, res, id) {
	try {
		const user = await auth(req);

		const project = await pool.query(
			'SELECT * FROM projects WHERE id = $1',
			[id]
		);

		if (project.rows.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Project not found'
			});
		}

		if (project.rows[0].charity_wallet !== user.walletAddress && user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Unauthorized to update this project'
			});
		}

		const { title, description, timeline, budget, status } = req.body;

		const result = await pool.query(
			`UPDATE projects
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           timeline = COALESCE($3, timeline),
           budget = COALESCE($4, budget),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
			[title, description, timeline, budget, status, id]
		);

		return res.status(200).json({
			success: true,
			data: result.rows[0]
		});
	} catch (error) {
		console.error('Error updating project:', error);
		return res.status(500).json({
			success: false,
			message: 'Error updating project'
		});
	}
}
