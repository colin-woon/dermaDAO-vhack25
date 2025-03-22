const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

/**
 * @route GET /api/donations
 * @desc Get all donations
 * @access Private (Admin only)
 */
router.get('/', [
	auth,
	authorize(['admin'])
], async (req, res) => {
	try {
		const donationsResult = await req.db.query(
			`SELECT d.*,
        u.username as donor_username,
        p.name as project_name,
        c.name as charity_name
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       JOIN projects p ON d.project_id = p.id
       JOIN charities c ON p.charity_id = c.id
       ORDER BY d.created_at DESC`
		);

		res.json(donationsResult.rows);
	} catch (error) {
		console.error('Error fetching donations:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/donations/my
 * @desc Get donations for current user
 * @access Private
 */
router.get('/my', [
	auth
], async (req, res) => {
	try {
		const donationsResult = await req.db.query(
			`SELECT d.*,
        p.name as project_name,
        c.name as charity_name
       FROM donations d
       JOIN projects p ON d.project_id = p.id
       JOIN charities c ON p.charity_id = c.id
       WHERE d.donor_id = $1
       ORDER BY d.created_at DESC`,
			[req.user.id]
		);

		res.json(donationsResult.rows);
	} catch (error) {
		console.error('Error fetching user donations:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route POST /api/donations
 * @desc Record a new donation
 * @access Private
 */
router.post('/', [
	auth,
	body('projectId').isInt().withMessage('Project ID must be an integer'),
	body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
	body('transactionHash').isString().withMessage('Transaction hash is required')
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		await req.db.query('BEGIN');

		const { projectId, amount, transactionHash } = req.body;

		// Check if project exists
		const projectResult = await req.db.query(
			'SELECT * FROM projects WHERE id = $1',
			[projectId]
		);

		if (projectResult.rows.length === 0) {
			await req.db.query('ROLLBACK');
			return res.status(404).json({ message: 'Project not found' });
		}

		// Get current funding round
		const roundResult = await req.db.query(
			'SELECT * FROM funding_rounds WHERE is_distributed = false ORDER BY id DESC LIMIT 1'
		);

		let roundId;
		if (roundResult.rows.length === 0) {
			// Create a new funding round if none exists
			const newRoundResult = await req.db.query(
				`INSERT INTO funding_rounds (start_date, end_date, is_distributed, total_pool_amount)
         VALUES (NOW(), NOW() + INTERVAL '30 days', false, 0)
         RETURNING id`,
			);
			roundId = newRoundResult.rows[0].id;
		} else {
			roundId = roundResult.rows[0].id;
		}

		// Check if transaction already exists
		const existingTransactionResult = await req.db.query(
			'SELECT * FROM transactions WHERE transaction_hash = $1',
			[transactionHash]
		);

		if (existingTransactionResult.rows.length > 0) {
			await req.db.query('ROLLBACK');
			return res.status(400).json({ message: 'Transaction already recorded' });
		}

		// Record donation
		const donationResult = await req.db.query(
			`INSERT INTO donations (donor_id, project_id, round_id, amount, transaction_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
			[req.user.id, projectId, roundId, amount, transactionHash]
		);

		// Record transaction
		await req.db.query(
			`INSERT INTO transactions (transaction_hash, transaction_type, related_id, related_type, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
			[transactionHash, 'donation', donationResult.rows[0].id, 'donation', req.user.id]
		);

		// Update round pool amount
		await req.db.query(
			'UPDATE funding_rounds SET total_pool_amount = total_pool_amount + $1 WHERE id = $2',
			[amount, roundId]
		);

		await req.db.query('COMMIT');
		res.status(201).json(donationResult.rows[0]);
	} catch (error) {
		await req.db.query('ROLLBACK').catch(err => {
			console.error('Error during rollback:', err);
		});
		console.error('Error recording donation:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
