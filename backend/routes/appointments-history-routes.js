import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const histories = await prisma.appointment_history.findMany();
    res.json(histories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment histories' });
  }
});

router.get('/:appointment_history_id', /* authenticateToken, */ async (req, res) => {
  try {
    const history = await prisma.appointment_history.findUnique({
      where: { appointment_history_id: Number(req.params.appointment_history_id) },
    });
    if (!history) return res.status(404).json({ error: 'Not found' });
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment history' });
  }
});

router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const data = req.body;
    const newHistory = await prisma.appointment_history.create({ data });
    res.status(201).json(newHistory);
  } catch {
    res.status(500).json({ error: 'Failed to create appointment history' });
  }
});

router.put('/:appointment_history_id', /* authenticateToken, */ async (req, res) => {
  try {
    const data = req.body;
    const updatedHistory = await prisma.appointment_history.update({
      where: { appointment_history_id: Number(req.params.appointment_history_id) },
      data,
    });
    res.json(updatedHistory);
  } catch {
    res.status(500).json({ error: 'Failed to update appointment history' });
  }
});

router.delete('/:appointment_history_id', /* authenticateToken, */ async (req, res) => {
  try {
    await prisma.appointment_history.delete({
      where: { appointment_history_id: Number(req.params.appointment_history_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete appointment history' });
  }
});

export default router;
