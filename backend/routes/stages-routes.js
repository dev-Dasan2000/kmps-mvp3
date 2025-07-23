import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all stages
router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const stages = await prisma.stages.findMany({
      orderBy: {
        stage_id: 'asc'
      }
    });
    res.json(stages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// Get single stage by stage_id
router.get('/:stage_id',  authenticateToken,  async (req, res) => {
  try {
    const stage = await prisma.stages.findUnique({
      where: { stage_id: Number(req.params.stage_id) },
    });
    if (!stage) return res.status(404).json({ error: 'Stage not found' });
    res.json(stage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stage' });
  }
});

// Create new stage
router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { name } = req.body;
    const newStage = await prisma.stages.create({
      data: { name },
    });
    res.status(201).json(newStage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create stage' });
  }
});

// Update existing stage
router.put('/:stage_id',  authenticateToken,  async (req, res) => {
  try {
    const data = req.body;
    const updatedStage = await prisma.stages.update({
      where: { stage_id: Number(req.params.stage_id) },
      data,
    });
    res.json(updatedStage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// Delete stage
router.delete('/:stage_id',  authenticateToken,  async (req, res) => {
  try {
    await prisma.stages.delete({
      where: { stage_id: Number(req.params.stage_id) },
    });
    res.json({ message: 'Deleted stage' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete stage' });
  }
});

export default router;
