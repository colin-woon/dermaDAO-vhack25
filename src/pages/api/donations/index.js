import { verifyToken } from '@/utils/auth';
import { pool } from '@/utils/postgresConnection';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'No token provided' });
		}

		const token = authHeader.split(' ')[1];
		const decoded = verifyToken(token);

		if (!decoded) {
			return res.status(403).json({ error: 'Invalid token' });
		}

		// Validate required fields
		const { projectId, amount, transactionHash, blockchainProjectId, currentRoundId } = req.body;
		if (!projectId || !amount || !transactionHash || !currentRoundId) {
			return res.status(400).json({
				error: 'Missing required fields',
				received: { projectId, amount, transactionHash, currentRoundId }
			});
		}

		// Convert blockchainProjectId to integer
		const blockchainProjectIdInt = parseInt(blockchainProjectId, 10);
		if (isNaN(blockchainProjectIdInt)) {
			return res.status(400).json({
				error: 'Invalid blockchain project ID',
				received: blockchainProjectId
			});
		}

		// Start transaction
		await pool.query('BEGIN');

		// Check if project exists
		const projectResult = await pool.query(
			'SELECT * FROM projects WHERE id = $1',
			[projectId]
		);

		if (projectResult.rows.length === 0) {
			await pool.query('ROLLBACK');
			return res.status(404).json({ message: 'Project not found' });
		}

		// Check if round exists in database
		const roundResult = await pool.query(
			'SELECT * FROM funding_rounds WHERE blockchain_id = $1',
			[currentRoundId]
		);

		let roundId;
		if (roundResult.rows.length === 0) {
			// Create new round if it doesn't exist
			const newRoundResult = await pool.query(
				`INSERT INTO funding_rounds (
					blockchain_id,
					start_date,
					end_date,
					is_distributed,
					total_pool_amount
				) VALUES ($1, NOW(), NOW() + INTERVAL '30 days', false, 0)
				RETURNING id`,
				[currentRoundId]
			);
			roundId = newRoundResult.rows[0].id;
		} else {
			roundId = roundResult.rows[0].id;
		}

		// Check if transaction already exists
		const existingTransactionResult = await pool.query(
			'SELECT * FROM transactions WHERE transaction_hash = $1',
			[transactionHash]
		);

		if (existingTransactionResult.rows.length > 0) {
			await pool.query('ROLLBACK');
			return res.status(400).json({ message: 'Transaction already recorded' });
		}

		// Insert donation into database
		const query = `
			INSERT INTO donations (
				blockchain_id,
				donor_id,
				project_id,
				round_id,
				amount,
				transaction_hash
			)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`;

		const values = [
			blockchainProjectIdInt,  // blockchain_id
			decoded.userId,          // donor_id
			projectId,               // project_id
			roundId,                 // round_id
			amount,                  // amount
			transactionHash         // transaction_hash
		];

		const result = await pool.query(query, values);
		const donationId = result.rows[0].id;

		// Record transaction
		await pool.query(
			`INSERT INTO transactions (
				transaction_hash,
				transaction_type,
				related_id,
				related_type,
				user_id
			) VALUES ($1, $2, $3, $4, $5)`,
			[transactionHash, 'donation', donationId, 'donation', decoded.userId]
		);

		// Update round pool amount
		await pool.query(
			'UPDATE funding_rounds SET total_pool_amount = total_pool_amount + $1 WHERE id = $2',
			[amount, roundId]
		);

		// Commit transaction
		await pool.query('COMMIT');

		return res.status(201).json({
			message: 'Donation recorded successfully',
			donationId,
			blockchainProjectId: blockchainProjectIdInt,
			roundId
		});

	} catch (error) {
		// Rollback transaction on error
		await pool.query('ROLLBACK').catch(err => {
			console.error('Error during rollback:', err);
		});

		console.error('Error recording donation:', error);
		return res.status(500).json({
			error: 'Failed to record donation',
			details: error.message
		});
	}
}
