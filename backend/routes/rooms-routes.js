import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET all rooms
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const rooms = await prisma.rooms.findMany();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET one room by ID
router.get('/:room_id', /* authenticateToken, */ async (req, res) => {
  try {
    const room = await prisma.rooms.findUnique({
      where: { room_id: req.params.room_id }
    });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST create a room
router.post('/', async (req, res) => {
  try {
    const { room_id, description } = req.body;

    const newRoom = await prisma.rooms.create({
      data: { room_id, description }
    });

    res.status(201).json(newRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// PUT update a room
router.put('/:room_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { description } = req.body;

    const updatedRoom = await prisma.rooms.update({
      where: { room_id: req.params.room_id },
      data: { description }
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE a room
router.delete('/:room_id', /* authenticateToken, */ async (req, res) => {
  try {
    await prisma.rooms.delete({
      where: { room_id: req.params.room_id }
    });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
