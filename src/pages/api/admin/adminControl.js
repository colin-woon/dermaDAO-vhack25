const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { validateProposal } = require('../services/aiValidation');

// Get all proposals
router.get('/', async (req, res) => {
	try {
		const proposalsResult = await req.db.query('SELECT * FROM proposals ORDER BY created_at DESC');
		res.json(proposalsResult.rows);
	} catch (error) {
		console.error('Error fetching proposals:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// Get pending proposals
router.get('/pending', auth, async (req, res) => {
	try {
		const proposalsResult = await req.db.query(
			`SELECT p.*, pr.name as project_name
       FROM proposals p
       JOIN projects pr ON p.project_id = pr.id
       WHERE p.is_approved = false AND p.is_claimed = false
       ORDER BY p.created_at DESC`
		);

		res.json(proposalsResult.rows);
	} catch (error) {
		console.error('Error fetching pending proposals:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// Validate a proposal with AI
router.post('/validate', auth, authorize(['charity']), async (req, res) => {
	try {
		const proposalData = req.body;

		// Call AI validation service
		const validationResult = await validateProposal(proposalData);

		res.json(validationResult);
	} catch (error) {
		console.error('Error validating proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// Create new proposal
router.post('/', auth, authorize(['charity']), async (req, res) => {
	try {
		const {
			projectId,
			blockchainId,
			description,
			ipfsHash,
			requestedAmount,
			aiValidationScore,
			aiValidationFeedback,
			transactionHash
		} = req.body;

		// Insert proposal
		const proposalResult = await req.db.query(
			`INSERT INTO proposals (
        project_id, blockchain_id, description, ipfs_hash,
        requested_amount, ai_validation_score, ai_validation_feedback, transaction_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
			[
				projectId, blockchainId, description, ipfsHash,
				requestedAmount, aiValidationScore, aiValidationFeedback, transactionHash
			]
		);

		res.status(201).json(proposalResult.rows[0]);
	} catch (error) {
		console.error('Error creating proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// Approve a proposal
router.put('/:id/approve', auth, authorize(['donor', 'admin']), async (req, res) => {
	try {
		const { id } = req.params;

		// Update proposal
		const updateResult = await req.db.query(
			`UPDATE proposals
       SET is_approved = true, approver_id = $1, approval_date = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
			[req.user.id, id]
		);

		if (updateResult.rows.length === 0) {
			return res.status(404).json({ message: 'Proposal not found' });
		}

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error('Error approving proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

// Mark a proposal as claimed
router.put('/:id/claim', auth, authorize(['charity']), async (req, res) => {
	try {
		const { id } = req.params;
		const { transactionHash } = req.body;

		// Update proposal
		const updateResult = await req.db.query(
			`UPDATE proposals
       SET is_claimed = true, claim_date = NOW(), transaction_hash = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
			[transactionHash, id]
		);

		if (updateResult.rows.length === 0) {
			return res.status(404).json({ message: 'Proposal not found' });
		}

		res.json(updateResult.rows[0]);
	} catch (error) {
		console.error('Error claiming proposal:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
