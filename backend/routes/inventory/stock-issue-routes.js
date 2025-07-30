import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET all stock issues with related batch and item
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const issues = await prisma.stock_issue.findMany({
      include: {
        batch: {
          include: {
            item: true,
          },
        },
      },
    });
    res.json(issues);
  } catch (error) {
    console.error('Error fetching stock issues:', error);
    res.status(500).json({ error: 'Failed to fetch stock issues' });
  }
});

// GET single stock issue by ID
router.get('/:stock_issue_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const stockIssueId = Number(req.params.stock_issue_id);
    const issue = await prisma.stock_issue.findUnique({
      where: { stock_issue_id: stockIssueId },
      include: {
        batch: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!issue) return res.status(404).json({ error: 'Stock issue not found' });
    res.json(issue);
  } catch (error) {
    console.error('Error fetching stock issue:', error);
    res.status(500).json({ error: 'Failed to fetch stock issue' });
  }
});

// POST create new stock issue
router.post('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { batch_id, quantity, usage_type, issued_to, notes } = req.body;

    const newIssue = await prisma.stock_issue.create({
      data: {
        batch_id,
        quantity,
        usage_type,
        issued_to,
        notes,
        date: new Date().toISOString().split('T')[0],
      },
    });

    res.status(201).json(newIssue);
  } catch (error) {
    console.error('Error creating stock issue:', error);
    res.status(500).json({ error: 'Failed to create stock issue' });
  }
});

// PUT update stock issue
router.put('/:stock_issue_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const stockIssueId = Number(req.params.stock_issue_id);
    const data = { ...req.body };

    const updated = await prisma.stock_issue.update({
      where: { stock_issue_id: stockIssueId },
      data,
    });

    res.status(202).json(updated);
  } catch (error) {
    console.error('Error updating stock issue:', error);
    res.status(500).json({ error: 'Failed to update stock issue' });
  }
});

// DELETE stock issue
router.delete('/:stock_issue_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const stockIssueId = Number(req.params.stock_issue_id);

    await prisma.stock_issue.delete({
      where: { stock_issue_id: stockIssueId },
    });

    res.json({ message: 'Stock issue deleted' });
  } catch (error) {
    console.error('Error deleting stock issue:', error);
    res.status(500).json({ error: 'Failed to delete stock issue' });
  }
});

export default router;
