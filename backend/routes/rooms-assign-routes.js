import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET all room assignments
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const assignments = await prisma.room_assign.findMany({
      include: {
        rooms: true,
        dentists: true,
      }
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room assignments' });
  }
});

// GET single room assignment
router.get('/:room_id/:dentist_id/:date/:time', /* authenticateToken, */ async (req, res) => {
  try {
    const { room_id, dentist_id, date, time } = req.params;

    const assignment = await prisma.room_assign.findUnique({
      where: {
        room_id_dentist_id_date_time: {
          room_id,
          dentist_id,
          date: new Date(decodeURIComponent(date)),
          time,
        },
      },
      include: {
        rooms: true,
        dentists: true,
      }
    });

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// POST create a room assignment
router.post('/', async (req, res) => {
  try {
    const { room_id, dentist_id, date, time } = req.body;

    const created = await prisma.room_assign.create({
      data: {
        room_id,
        dentist_id,
        date: new Date(date),
        time,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT update a room assignment
router.put('/:room_id/:dentist_id/:date/:time', /* authenticateToken, */ async (req, res) => {
  try {
    const { room_id, dentist_id, date, time } = req.params;
    const updateData = req.body;

    const updated = await prisma.room_assign.update({
      where: {
        room_id_dentist_id_date_time: {
          room_id,
          dentist_id,
          date: new Date(decodeURIComponent(date)),
          time,
        },
      },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE a room assignment
router.delete('/:room_id/:dentist_id/:date/:time', /* authenticateToken, */ async (req, res) => {
  try {
    const { room_id, dentist_id, date, time } = req.params;

    await prisma.room_assign.delete({
      where: {
        room_id_dentist_id_date_time: {
          room_id,
          dentist_id,
          date: new Date(decodeURIComponent(date)),
          time,
        },
      },
    });

    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
