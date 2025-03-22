const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { uploadToIPFS } = require('../utils/ipfs');
const { body, validationResult } = require('express-validator');

/**
 * @route GET /api/projects
 * @desc Get all projects
 * @access Public
 */
router.get('/', async (req, res) => {
	try {
		console.log('Getting all projects');
		const projectsResult = await req.db.query(
			`SELECT p.*, c.name as charity_name,
        (SELECT COUNT(*) FROM donations d WHERE d.project_id = p.id) as donation_count,
        (SELECT COALESCE(SUM(d.amount), 0) FROM donations d WHERE d.project_id = p.id) as total_donations
       FROM projects p
       JOIN charities c ON p.charity_id = c.id
       ORDER BY p.created_at DESC`
		);

		res.json(projectsResult.rows);
	} catch (error) {
		console.error('Error fetching projects:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/projects/:id
 * @desc Get project by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		console.log(`Getting project with ID: ${id}`);

		// Debug to identify the issue
		console.log('Project ID type:', typeof id, id);

		const projectResult = await req.db.query(
			`SELECT p.*, c.name as charity_name
       FROM projects p
       JOIN charities c ON p.charity_id = c.id
       WHERE p.id = $1`,
			[id]
		);

		console.log('Project query result:', projectResult.rows.length ? 'Found' : 'Not found');

		if (projectResult.rows.length === 0) {
			return res.status(404).json({ message: 'Project not found' });
		}

		res.json(projectResult.rows[0]);
	} catch (error) {
		console.error('Error fetching project:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Private (Charity role)
 */
router.post('/', [
	auth,
	authorize(['charity']),
	body('charityId').isInt().withMessage('Charity ID must be an integer'),
	body('name').notEmpty().withMessage('Name is required'),
	body('description').notEmpty().withMessage('Description is required'),
], async (req, res) => {
	console.log('Create project request received:', req.body);

	// Validate request
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.log('Validation errors:', errors.array());
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const {
			charityId,
			name,
			description,
			ipfsHash,
			blockchainId,
			transactionHash,
			goalAmount = null
		} = req.body;

		// Check if charity exists and user has permission
		const charityResult = await req.db.query(
			'SELECT * FROM charities WHERE id = $1',
			[charityId]
		);

		if (charityResult.rows.length === 0) {
			return res.status(404).json({ message: 'Charity not found' });
		}

		const charity = charityResult.rows[0];

		// Check if user is charity admin
		if (charity.admin_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Permission denied' });
		}

		// Create project
		const projectResult = await req.db.query(
			`INSERT INTO projects
        (charity_id, blockchain_id, name, description, ipfs_hash, goal_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
			[charityId, blockchainId, name, description, ipfsHash, goalAmount]
		);

		// Record transaction if provided
		if (transactionHash) {
			try {
				await req.db.query(
					`INSERT INTO transactions
            (transaction_hash, transaction_type, related_id, related_type, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
					[transactionHash, 'create_project', projectResult.rows[0].id, 'project', req.user.id]
				);
			} catch (txError) {
				console.error('Error recording transaction:', txError);
				// Continue anyway, this is not critical
			}
		}

		res.status(201).json(projectResult.rows[0]);
	} catch (error) {
		console.error('Error creating project:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route PUT /api/projects/:id
 * @desc Update project
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
		const { name, description, ipfsHash, isActive } = req.body;

		// Check if project exists
		const projectResult = await req.db.query(
			`SELECT p.*, c.admin_id as charity_admin_id
       FROM projects p
       JOIN charities c ON p.charity_id = c.id
       WHERE p.id = $1`,
			[id]
		);

		if (projectResult.rows.length === 0) {
			return res.status(404).json({ message: 'Project not found' });
		}

		const project = projectResult.rows[0];

		// Check if user is charity admin or platform admin
		if (project.charity_admin_id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({ message: 'Permission denied' });
		}

		// Update fields
		const updateFields = [];
		const updateValues = [];
		let valueIndex = 1;

		if (name !== undefined) {
			updateFields.push(`name = $${valueIndex}`);
			updateValues.push(name);
			valueIndex++;
		}

		if (description !== undefined) {
			updateFields.push(`description = $${valueIndex}`);
			updateValues.push(description);
			valueIndex++;
		}

		if (ipfsHash !== undefined) {
			updateFields.push(`ipfs_hash = $${valueIndex}`);
			updateValues.push(ipfsHash);
			valueIndex++;
		}

		if (isActive !== undefined) {
			updateFields.push(`is_active = $${valueIndex}`);
			updateValues.push(isActive);
			valueIndex++;
		}

		// Add updated_at field
		updateFields.push(`updated_at = NOW()`);

		// Add ID as the last parameter
		updateValues.push(id);

		// Update project if there are fields to update
		if (updateFields.length > 0) {
			const updateResult = await req.db.query(
				`UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
				updateValues
			);

			res.json(updateResult.rows[0]);
		} else {
			res.json(project);
		}
	} catch (error) {
		console.error('Error updating project:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

/**
 * @route GET /api/projects/:id/proposals
 * @desc Get all proposals for a project
 * @access Public
 */
router.get('/:id/proposals', async (req, res) => {
	try {
		const { id } = req.params;
		console.log(`Fetching proposals for project ID: ${id}`);

		const proposalsResult = await req.db.query(
			`SELECT * FROM proposals WHERE project_id = $1 ORDER BY created_at DESC`,
			[id]
		);

		console.log(`Found ${proposalsResult.rows.length} proposals`);
		res.json(proposalsResult.rows);
	} catch (error) {
		console.error('Error fetching proposals:', error);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
