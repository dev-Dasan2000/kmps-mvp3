import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all stage_assign records
router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const assignments = await prisma.stage_assign.findMany();
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stage assignments' });
  }
});

// Get single stage_assign by stage_assign_id
router.get('/:stage_assign_id',  authenticateToken,  async (req, res) => {
  try {
    const id = Number(req.params.stage_assign_id);
    const assignment = await prisma.stage_assign.findUnique({
      where: { stage_assign_id: id },
    });
    if (!assignment) return res.status(404).json({ error: 'Stage assignment not found' });
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stage assignment' });
  }
});

// Create new stage_assign
router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { stage_id, order_id, completed = false, date } = req.body;

    const newAssignment = await prisma.stage_assign.create({
      data: {
        stage_id,
        order_id,
        completed,
        date: new Date(date),
      },
    });

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create stage assignment' });
  }
});

// Update existing stage_assign by stage_assign_id
router.put('/:stage_assign_id',  authenticateToken,  async (req, res) => {
  try {
    const id = Number(req.params.stage_assign_id);
    const data = req.body;

    // If date is present, convert to Date object
    if (data.date) data.date = new Date(data.date);

    const updatedAssignment = await prisma.stage_assign.update({
      where: { stage_assign_id: id },
      data,
    });

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update stage assignment' });
  }
});

// Delete stage_assign by stage_assign_id
router.delete('/:stage_assign_id',  authenticateToken,  async (req, res) => {
  try {
    const id = Number(req.params.stage_assign_id);

    await prisma.stage_assign.delete({
      where: { stage_assign_id: id },
    });

    res.json({ message: 'Stage assignment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete stage assignment' });
  }
});

export default router;
