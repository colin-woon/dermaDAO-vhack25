const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { body, validationResult } = require('express-validator');

/**
 * @route GET /api/charities
 * @desc Get all charities
 * @access Public
 */
router.get('/', async (req, res) => {
	try {
		const charitiesResult = await req.db.query(
			`SELECT c.*, u.username as admin_username, u.wallet_address as admin_wallet
       FROM charities c
       JOIN users u ON c.admin_id = u.id
       ORDER BY c.created_at DESC`
		);

		res.json(charitiesResult.rows);
	} catch (error) {
		console.error('Error fetching charities:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/charities/:id
 * @desc Get charity by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const charityResult = await req.db.query(
			`SELECT c.*, u.username as admin_username, u.wallet_address as admin_wallet
       FROM charities c
       JOIN users u ON c.admin_id = u.id
       WHERE c.id = $1`,
			[id]
		);

		if (charityResult.rows.length === 0) {
			return res.status(404).json({ message: 'Charity not found' });
		}

		// Get all projects for this charity
		const projectsResult = await req.db.query(
			`SELECT p.*,
        (SELECT COUNT(*) FROM donations d WHERE d.project_id = p.id) as donation_count,
        (SELECT COALESCE(SUM(d.amount), 0) FROM donations d WHERE d.project_id = p.id) as total_donations
       FROM projects p
       WHERE p.charity_id = $1
       ORDER BY p.created_at DESC`,
			[id]
		);

		// Return charity with its projects
		res.json({
			...charityResult.rows[0],
			projects: projectsResult.rows
		});
	} catch (error) {
		console.error('Error fetching charity:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route POST /api/charities
 * @desc Register a new charity
 * @access Private (Charity role)
 */
router.post('/', [
	auth,
	authorize(['charity']),
	body('name').notEmpty().withMessage('Name is required'),
	body('description').notEmpty().withMessage('Description is required'),
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const {
			name,
			description,
			additionalInfo,
			blockchainId,
			blockchain_id,  // Alternative name format
			transactionHash,
			transaction_hash, // Alternative name format
			ipfsHash,
			ipfs_hash // Alternative name format
		} = req.body;

		console.log("Received charity registration:", req.body);

		// Handle different field name formats
		const finalBlockchainId = blockchainId || blockchain_id || null;
		const finalTransactionHash = transactionHash || transaction_hash || null;

		// Use provided ipfsHash or upload additional info to IPFS if provided
		let finalIpfsHash = ipfsHash || ipfs_hash || null;
		if (!finalIpfsHash && additionalInfo) {
			finalIpfsHash = await uploadToIPFS(additionalInfo);
		}

		// Check if database has the required columns
		try {
			// Create charity with blockchain information
			const charityResult = await req.db.query(
				`INSERT INTO charities
         (name, description, admin_id, ipfs_hash, blockchain_id, transaction_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
				[name, description, req.user.id, finalIpfsHash, finalBlockchainId, finalTransactionHash]
			);

			console.log("Successfully created charity with blockchain data");
			res.status(201).json(charityResult.rows[0]);
		} catch (insertError) {
			if (insertError.code === '42703') {
				// If transaction_hash column doesn't exist, try without it
				console.warn("Missing transaction_hash column, trying without it");
				const fallbackResult = await req.db.query(
					`INSERT INTO charities
           (name, description, admin_id, ipfs_hash, blockchain_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
					[name, description, req.user.id, finalIpfsHash, finalBlockchainId]
				);

				res.status(201).json({
					...fallbackResult.rows[0],
					warning: "Transaction hash not stored due to missing column"
				});
			} else if (insertError.code === '22P02') {
				// Invalid input syntax for type integer - blockchain_id is integer but we're sending string
				console.warn("Invalid input for blockchain_id, attempting to convert to integer");

				try {
					// Try to convert the blockchain ID to a number if it's numeric
					const numericBlockchainId = finalBlockchainId && !isNaN(parseInt(finalBlockchainId))
						? parseInt(finalBlockchainId)
						: null;

					const fallbackResult = await req.db.query(
						`INSERT INTO charities
             (name, description, admin_id, ipfs_hash, blockchain_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
						[name, description, req.user.id, finalIpfsHash, numericBlockchainId]
					);

					console.log("Successfully created charity with integer blockchain ID");
					res.status(201).json({
						...fallbackResult.rows[0],
						warning: "Transaction hash not stored and blockchain ID was converted to integer"
					});
				} catch (fallbackError) {
					console.error("Fallback insert also failed:", fallbackError);

					// Last resort: Insert without blockchain data
					const basicResult = await req.db.query(
						`INSERT INTO charities
             (name, description, admin_id, ipfs_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
						[name, description, req.user.id, finalIpfsHash]
					);

					console.log("Created charity without blockchain data");
					res.status(201).json({
						...basicResult.rows[0],
						warning: "Blockchain data could not be stored. Database schema may need updating."
					});
				}
			} else {
				throw insertError;
			}
		}
	} catch (error) {
		console.error('Error creating charity:', error);
		res.status(500).json({
			message: 'Server error',
			details: 'There was a problem creating the charity. Check server logs for details.',
			error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
		});
	}
});

/**
 * @route PUT /api/charities/:id
 * @desc Update charity
 * @access Private (Charity admin or Platform admin)
 */
router.put('/:id', [
	auth,
	body('name').optional().notEmpty().withMessage('Name cannot be empty'),
	body('description').optional().notEmpty().withMessage('Description cannot be empty'),
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { id } = req.params;
		const { name, description, additionalInfo } = req.body;

		// Check if charity exists and user has permission
		const charityResult = await req.db.query(
			'SELECT * FROM charities WHERE id = $1',
			[id]
		);

		if (charityResult.rows.length === 0) {
			return res.status(404).json({ message: 'Charity not found' });
		}

		const charity = charityResult.rows[0];

		// Check if user is charity admin or platform admin
		if (charity.admin_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Permission denied' });
		}

		// Upload additional info to IPFS if provided
		let ipfsHash = charity.ipfs_hash;
		if (additionalInfo) {
			ipfsHash = await uploadToIPFS(additionalInfo);
		}

		// Update charity
		const updateFields = [];
		const updateValues = [];
		let valueIndex = 1;

		if (name) {
			updateFields.push(`name = $${valueIndex}`);
			updateValues.push(name);
			valueIndex++;
		}

		if (description) {
			updateFields.push(`description = $${valueIndex}`);
			updateValues.push(description);
			valueIndex++;
		}

		if (ipfsHash !== charity.ipfs_hash) {
			updateFields.push(`ipfs_hash = $${valueIndex}`);
			updateValues.push(ipfsHash);
			valueIndex++;
		}

		// Add updated_at field
		updateFields.push(`updated_at = NOW()`);

		// Add ID as the last parameter
		updateValues.push(id);

		// Update charity if there are fields to update
		if (updateFields.length > 0) {
			const updateResult = await req.db.query(
				`UPDATE charities SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
				updateValues
			);

			res.json(updateResult.rows[0]);
		} else {
			res.json(charity);
		}
	} catch (error) {
		console.error('Error updating charity:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route PUT /api/charities/:id/verify
 * @desc Verify a charity
 * @access Private (Admin only)
 */
router.put('/:id/verify', [
	auth,
	authorize(['admin']),
	body('isVerified').isBoolean().withMessage('isVerified must be a boolean'),
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { id } = req.params;
		const { isVerified } = req.body;

		// Update charity verification status
		const updateResult = await req.db.query(
			'UPDATE charities SET is_verified = $1, verification_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
			[isVerified, isVerified ? new Date() : null, id]
		);

		if (updateResult.rows.length === 0) {
			return res.status(404).json({ message: 'Charity not found' });
		}

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error('Error verifying charity:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/charities/my/all
 * @desc Get all charities for current user
 * @access Private (Charity role)
 */
router.get('/my/all', [
	auth,
	authorize(['charity'])
], async (req, res) => {
	try {
		const charitiesResult = await req.db.query(
			`SELECT c.*
       FROM charities c
       WHERE c.admin_id = $1
       ORDER BY c.created_at DESC`,
			[req.user.id]
		);

		res.json(charitiesResult.rows);
	} catch (error) {
		console.error('Error fetching user charities:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
