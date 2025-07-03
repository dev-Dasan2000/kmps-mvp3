import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const files = await prisma.order_files.findMany();
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order files' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { url, order_id } = req.body;
    const file = await prisma.order_files.create({ data: { url, order_id } });
    res.status(201).json(file);
  } catch {
    res.status(500).json({ error: 'Failed to create order file' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.order_files.delete({ where: { file_id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete order file' });
  }
});

export default router;
