import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const shades = await prisma.shades.findMany();
    res.json(shades);
  } catch {
    res.status(500).json({ error: 'Failed to fetch shades' });
  }
});

router.post('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const { shade } = req.body;
    const newShade = await prisma.shades.create({ data: { shade } });
    res.status(201).json(newShade);
  } catch {
    res.status(500).json({ error: 'Failed to create shade' });
  }
});

router.put('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    const updated = await prisma.shades.update({
      where: { shade_type_id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update shade' });
  }
});

router.delete('/:id', /*authenticateToken,*/ async (req, res) => {
  try {
    await prisma.shades.delete({ where: { shade_type_id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete shade' });
  }
});

export default router;
