import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const result = await pool.query('SELECT NOW()');
		res.status(200).json({
			success: true,
			message: 'Database connection successful',
			timestamp: result.rows[0].now
		});
	} catch (error) {
		console.error('Database connection error:', error);
		res.status(500).json({
			success: false,
			message: 'Database connection failed',
			error: error.message
		});
	}
}
