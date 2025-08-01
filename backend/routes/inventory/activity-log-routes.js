import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET all activity logs
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const logs = await prisma.activity_log.findMany({
      orderBy: {
        activity_log_id: 'desc',
      },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

router.get('/recent', /*authenticateToken,*/ async (req, res) => {
  try {
    const recentLogs = await prisma.activity_log.findMany({
      take: 10,
      orderBy: {
        activity_log_id: 'desc',
      },
    });
    res.json(recentLogs);
  } catch (error) {
    console.error('Error fetching recent activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity logs' });
  }
});


// GET activity log by ID
router.get('/:log_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const log = await prisma.activity_log.findUnique({
      where: {
        activity_log_id: Number(req.params.log_id),
      },
    });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// POST new activity log
router.post('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { subject, event, date, time } = req.body;

    if (!subject || !event || !date || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newLog = await prisma.activity_log.create({
      data: {
        subject,
        event,
        date,
        time,
      },
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ error: 'Failed to create activity log' });
  }
});

// DELETE activity log by ID
router.delete('/:log_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const logId = Number(req.params.log_id);

    await prisma.activity_log.delete({
      where: {
        activity_log_id: logId,
      },
    });

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ error: 'Failed to delete activity log' });
  }
});

// OPTIONAL: Filter by date
router.get('/filter/by-date/:date', /*authenticateToken,*/ async (req, res) => {
  try {
    const logs = await prisma.activity_log.findMany({
      where: {
        date: req.params.date,
      },
      orderBy: {
        time: 'asc',
      },
    });
    res.json(logs);
  } catch (error) {
    console.error('Error filtering activity logs:', error);
    res.status(500).json({ error: 'Failed to filter logs' });
  }
});

export default router;
