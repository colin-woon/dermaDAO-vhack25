const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { validateProposal } = require('../services/aiValidation');
const { body, validationResult } = require('express-validator');

/**
 * @route GET /api/proposals
 * @desc Get all proposals
 * @access Private (Admin only)
 */
router.get('/', [
	auth,
	authorize(['admin'])
], async (req, res) => {
	try {
		const proposalsResult = await req.db.query(
			`SELECT p.*,
        pr.name as project_name,
        c.name as charity_name
       FROM proposals p
       JOIN projects pr ON p.project_id = pr.id
       JOIN charities c ON pr.charity_id = c.id
       ORDER BY p.created_at DESC`
		);

		res.json(proposalsResult.rows);
	} catch (error) {
		console.error('Error fetching proposals:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/proposals/pending
 * @desc Get pending proposals for review
 * @access Private (Donor role)
 */
router.get('/pending', [
	auth,
	authorize(['donor'])
], async (req, res) => {
	try {
		const proposalsResult = await req.db.query(
			`SELECT p.*,
        pr.name as project_name,
        c.name as charity_name
       FROM proposals p
       JOIN projects pr ON p.project_id = pr.id
       JOIN charities c ON pr.charity_id = c.id
       WHERE p.is_approved = false AND p.is_claimed = false AND p.ai_validation_score >= 70
       ORDER BY p.created_at DESC`
		);

		res.json(proposalsResult.rows);
	} catch (error) {
		console.error('Error fetching pending proposals:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/proposals/:id
 * @desc Get proposal by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const proposalResult = await req.db.query(
			`SELECT p.*,
        pr.name as project_name,
        c.name as charity_name
       FROM proposals p
       JOIN projects pr ON p.project_id = pr.id
       JOIN charities c ON pr.charity_id = c.id
       WHERE p.id = $1`,
			[id]
		);

		if (proposalResult.rows.length === 0) {
			return res.status(404).json({ message: 'Proposal not found' });
		}

		res.json(proposalResult.rows[0]);
	} catch (error) {
		console.error('Error fetching proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route POST /api/proposals/validate
 * @desc Validate a proposal with AI
 * @access Private (Charity role)
 */
router.post('/validate', [
	auth,
	authorize(['charity']),
	body('projectId').isInt().withMessage('Project ID must be an integer'),
	body('description').notEmpty().withMessage('Description is required'),
	body('detailedProposal').notEmpty().withMessage('Detailed proposal is required'),
	body('requestedAmount').isFloat({ gt: 0 }).withMessage('Requested amount must be greater than 0'),
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Call AI validation service
		const validation = await validateProposal(req.body);

		res.json(validation);
	} catch (error) {
		console.error('Error validating proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route POST /api/proposals
 * @desc Create a new proposal
 * @access Private (Charity role)
 */
router.post('/', [
	auth,
	authorize(['charity']),
	body('projectId').isInt().withMessage('Project ID must be an integer'),
	body('description').notEmpty().withMessage('Description is required'),
	body('requestedAmount').isFloat({ gt: 0 }).withMessage('Requested amount must be greater than 0'),
], async (req, res) => {
	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const {
			projectId,
			description,
			ipfsHash,
			requestedAmount,
			blockchainId,
			aiValidationScore,
			aiValidationFeedback,
			transactionHash
		} = req.body;

		// Check if project exists and user has permission
		const projectResult = await req.db.query(
			`SELECT p.*, c.admin_id as charity_admin_id
       FROM projects p
       JOIN charities c ON p.charity_id = c.id
       WHERE p.id = $1`,
			[projectId]
		);

		if (projectResult.rows.length === 0) {
			return res.status(404).json({ message: 'Project not found' });
		}

		const project = projectResult.rows[0];

		// Check if user is charity admin
		if (project.charity_admin_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Permission denied' });
		}

		// Check if requested amount is available
		if (requestedAmount > project.allocated_funds) {
			return res.status(400).json({ message: 'Requested amount exceeds available funds' });
		}

		// Create proposal
		const proposalResult = await req.db.query(
			`INSERT INTO proposals
        (project_id, blockchain_id, description, ipfs_hash, requested_amount, ai_validation_score, ai_validation_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
			[projectId, blockchainId, description, ipfsHash, requestedAmount, aiValidationScore, aiValidationFeedback]
		);

		// Record transaction if provided
		if (transactionHash) {
			await req.db.query(
				`INSERT INTO transactions
          (transaction_hash, transaction_type, related_id, related_type, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
				[transactionHash, 'create_proposal', proposalResult.rows[0].id, 'proposal', req.user.id]
			);
		}

		res.status(201).json(proposalResult.rows[0]);
	} catch (error) {
		console.error('Error creating proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route PUT /api/proposals/:id/approve
 * @desc Approve a proposal
 * @access Private (Donor role)
 */
router.put('/:id/approve', [
	auth,
	authorize(['donor'])
], async (req, res) => {
	try {
		const { id } = req.params;
		const { transactionHash } = req.body;

		// Check if proposal exists
		const proposalResult = await req.db.query(
			'SELECT * FROM proposals WHERE id = $1',
			[id]
		);

		if (proposalResult.rows.length === 0) {
			return res.status(404).json({ message: 'Proposal not found' });
		}

		const proposal = proposalResult.rows[0];

		// Check if proposal is already approved
		if (proposal.is_approved) {
			return res.status(400).json({ message: 'Proposal already approved' });
		}

		// Check if proposal is already claimed
		if (proposal.is_claimed) {
			return res.status(400).json({ message: 'Proposal already claimed' });
		}

		// Approve proposal
		const updateResult = await req.db.query(
			`UPDATE proposals
       SET is_approved = true, approver_id = $1, approval_date = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
			[req.user.id, id]
		);

		// Record transaction if provided
		if (transactionHash) {
			await req.db.query(
				`INSERT INTO transactions
          (transaction_hash, transaction_type, related_id, related_type, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
				[transactionHash, 'approve_proposal', id, 'proposal', req.user.id]
			);
		}

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error('Error approving proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route PUT /api/proposals/:id/claim
 * @desc Claim funds for an approved proposal
 * @access Private (Charity role)
 */
router.put('/:id/claim', [
	auth,
	authorize(['charity'])
], async (req, res) => {
	try {
		const { id } = req.params;
		const { transactionHash } = req.body;

		// Check if proposal exists and user has permission
		const proposalResult = await req.db.query(
			`SELECT p.*,
        pr.charity_id,
        c.admin_id as charity_admin_id
       FROM proposals p
       JOIN projects pr ON p.project_id = pr.id
       JOIN charities c ON pr.charity_id = c.id
       WHERE p.id = $1`,
			[id]
		);

		if (proposalResult.rows.length === 0) {
			return res.status(404).json({ message: 'Proposal not found' });
		}

		const proposal = proposalResult.rows[0];

		// Check if user is charity admin
		if (proposal.charity_admin_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Permission denied' });
		}

		// Check if proposal is approved
		if (!proposal.is_approved) {
			return res.status(400).json({ message: 'Proposal not approved' });
		}

		// Check if proposal is already claimed
		if (proposal.is_claimed) {
			return res.status(400).json({ message: 'Proposal already claimed' });
		}

		// Claim proposal
		const updateResult = await req.db.query(
			`UPDATE proposals
       SET is_claimed = true, claim_date = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
			[id]
		);

		// Record transaction if provided
		if (transactionHash) {
			await req.db.query(
				`INSERT INTO transactions
          (transaction_hash, transaction_type, related_id, related_type, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
				[transactionHash, 'claim_proposal', id, 'proposal', req.user.id]
			);
		}

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error('Error claiming proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
