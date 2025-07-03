import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const materials = await prisma.material_types.findMany();
    res.json(materials);
  } catch {
    res.status(500).json({ error: 'Failed to fetch material types' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { material } = req.body;
    const newMaterial = await prisma.material_types.create({ data: { material } });
    res.status(201).json(newMaterial);
  } catch {
    res.status(500).json({ error: 'Failed to create material type' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.material_types.update({
      where: { material_id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update material type' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.material_types.delete({ where: { material_id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete material type' });
  }
});

export default router;
