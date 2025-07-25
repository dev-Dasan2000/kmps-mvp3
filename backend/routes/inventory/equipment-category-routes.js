import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all equipment categories with related equipments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.equipment_category.findMany({
      include: {
        equipments: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    res.status(500).json({ error: 'Failed to fetch equipment categories' });
  }
});

// GET single equipment category by id with equipments
router.get('/:equipment_category_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.equipment_category_id);
    const category = await prisma.equipment_category.findUnique({
      where: { equipment_category_id: id },
      include: { equipments: true },
    });
    if (!category) return res.status(404).json({ error: 'Equipment category not found' });
    res.json(category);
  } catch (error) {
    console.error('Error fetching equipment category:', error);
    res.status(500).json({ error: 'Failed to fetch equipment category' });
  }
});

// POST create new equipment category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { equipment_category } = req.body;
    if (!equipment_category) return res.status(400).json({ error: 'equipment_category is required' });

    const newCategory = await prisma.equipment_category.create({
      data: { equipment_category },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating equipment category:', error);
    res.status(500).json({ error: 'Failed to create equipment category' });
  }
});

// PUT update equipment category by id
router.put('/:equipment_category_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.equipment_category_id);
    const data = { ...req.body };

    const updatedCategory = await prisma.equipment_category.update({
      where: { equipment_category_id: id },
      data,
    });

    res.status(202).json(updatedCategory);
  } catch (error) {
    console.error('Error updating equipment category:', error);
    res.status(500).json({ error: 'Failed to update equipment category' });
  }
});

// DELETE equipment category by id
router.delete('/:equipment_category_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.equipment_category_id);
    await prisma.equipment_category.delete({
      where: { equipment_category_id: id },
    });
    res.json({ message: 'Equipment category deleted' });
  } catch (error) {
    console.error('Error deleting equipment category:', error);
    res.status(500).json({ error: 'Failed to delete equipment category' });
  }
});

export default router;
