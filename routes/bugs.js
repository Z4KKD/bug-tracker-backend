const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Bug = require('../models/Bug');
const authMiddleware = require('../middleware/auth');
const xss = require('xss');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * /api/bugs:
 *   get:
 *     summary: Get a list of bugs with pagination and optional filters
 *     tags: [Bugs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Number of bugs per page (default: 10)"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority (Low, Medium, High)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (Open, In Progress, Resolved, Closed)
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assignee
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start creation date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end creation date
 *     responses:
 *       200:
 *         description: List of bugs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalBugs:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 bugs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bug'
 */
router.get('/', async (req, res) => {
  let { page = 1, limit = 10, priority, status, assignedTo, startDate, endDate } = req.query;

  page = Math.max(1, parseInt(page));
  limit = Math.min(100, Math.max(1, parseInt(limit)));

  priority = priority ? xss(priority.trim()) : null;
  status = status ? xss(status.trim()) : null;
  assignedTo = assignedTo ? xss(assignedTo.trim()) : null;

  if (startDate) startDate = new Date(startDate);
  if (endDate) endDate = new Date(endDate);

  const filter = {};
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    filter.createdAt = dateFilter;
  }

  try {
    const bugs = await Bug.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const totalBugs = await Bug.countDocuments(filter);
    res.json({
      totalBugs,
      totalPages: Math.ceil(totalBugs / limit),
      currentPage: page,
      bugs,
    });
  } catch (err) {
    console.error('Error fetching bugs:', err);
    res.status(500).json({ message: 'Server error while fetching bugs' });
  }
});

/**
 * @swagger
 * /api/bugs:
 *   post:
 *     summary: Create a new bug
 *     tags: [Bugs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - reporter
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               reporter:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bug created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bug'
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('description').optional().trim(),
    body('priority')
      .isIn(['Low', 'Medium', 'High'])
      .withMessage('Priority must be Low, Medium, or High'),
    body('reporter').notEmpty().withMessage('Reporter is required').trim(),
    body('assignedTo').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, reporter, assignedTo } = req.body;

    const sanitizedTitle = xss(title);
    const sanitizedDescription = description ? xss(description) : '';

    try {
      const newBug = new Bug({
        title: sanitizedTitle,
        description: sanitizedDescription,
        priority,
        reporter,
        assignedTo,
        status: 'Open',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newBug.save();
      res.status(201).json(newBug);
    } catch (err) {
      console.error('Error creating bug:', err);
      res.status(500).json({ message: 'Server error while creating bug' });
    }
  }
);

// PUT: Update a bug (Require authentication)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('Invalid ID format');
    return res.status(400).json({ message: 'Invalid Bug ID' });
  }

  try {
    const updatedBug = await Bug.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBug) {
      return res.status(404).json({ message: 'Bug not found' });
    }
    res.json(updatedBug);
  } catch (error) {
    console.error('Error updating bug:', error);
    res.status(500).json({ message: 'Server error while updating bug' });
  }
});

// DELETE: Delete a bug by ID (Require authentication)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Bug ID' });
  }

  try {
    const deletedBug = await Bug.findByIdAndDelete(id);
    if (!deletedBug) {
      return res.status(404).json({ message: 'Bug not found' });
    }
    res.json({ message: 'Bug deleted' });
  } catch (error) {
    console.error('Error deleting bug:', error);
    res.status(500).json({ message: 'Server error while deleting bug' });
  }
});

// PUT: Update bug's status (Require authentication)
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Bug ID' });
  }

  const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const updatedBug = await Bug.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedBug) {
      return res.status(404).json({ message: 'Bug not found' });
    }
    res.json(updatedBug);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

module.exports = router;
