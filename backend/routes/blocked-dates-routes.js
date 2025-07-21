import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const blockedDates = await prisma.blocked_dates.findMany();
    res.json(blockedDates);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

router.get('/fordentist/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const blockedDates = await prisma.blocked_dates.findMany({where: {dentist_id: req.params.dentist_id}});
    res.json(blockedDates);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

router.get('/:blocked_date_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const blockedDate = await prisma.blocked_dates.findUnique({
      where: { blocked_date_id: Number(req.params.blocked_date_id) },
    });
    if (!blockedDate) return res.status(404).json({ error: 'Not found' });
    res.json(blockedDate);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blocked date' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { dentist_id, date, time_from, time_to } = req.body;

    // No need to convert date to Date here since your model uses String
    const newBlockedDate = await prisma.blocked_dates.create({
      data: {
        dentist_id,
        date,
        time_from,
        time_to,
      }
    });

    res.status(201).json(newBlockedDate);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create blocked date' });
  }
});


router.put('/:blocked_date_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const data = req.body;
    const updatedBlockedDate = await prisma.blocked_dates.update({
      where: { blocked_date_id: Number(req.params.blocked_date_id) },
      data,
    });
    res.json(updatedBlockedDate);
  } catch {
    res.status(500).json({ error: 'Failed to update blocked date' });
  }
});

router.delete('/:blocked_date_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.blocked_dates.delete({
      where: { blocked_date_id: Number(req.params.blocked_date_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete blocked date' });
  }
});

export default router;
