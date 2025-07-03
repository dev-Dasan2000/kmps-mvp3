import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const workTypes = await prisma.work_types.findMany();
    res.json(workTypes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work types' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { work_type } = req.body;
    const newType = await prisma.work_types.create({ data: { work_type } });
    res.status(201).json(newType);
  } catch {
    res.status(500).json({ error: 'Failed to create work type' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.work_types.update({
      where: { work_type_id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update work type' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.work_types.delete({ where: { work_type_id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete work type' });
  }
});

export default router;
