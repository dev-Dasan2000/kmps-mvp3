import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all parent categories with their sub_categories
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const parents = await prisma.parent_category.findMany({
      include: {
        sub_categories: true,
      },
    });
    res.json(parents);
  } catch (error) {
    console.error('Error fetching parent categories:', error);
    res.status(500).json({ error: 'Failed to fetch parent categories' });
  }
});

// GET single parent category by id with sub_categories
router.get('/:parent_category_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const parent = await prisma.parent_category.findUnique({
      where: { parent_category_id: Number(req.params.parent_category_id) },
      include: {
        sub_categories: true,
      },
    });
    if (!parent) return res.status(404).json({ error: 'Parent category not found' });
    res.json(parent);
  } catch (error) {
    console.error('Error fetching parent category:', error);
    res.status(500).json({ error: 'Failed to fetch parent category' });
  }
});

// POST create new parent category
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const { parent_category_name, description } = req.body;
    const newParent = await prisma.parent_category.create({
      data: {
        parent_category_name,
        description,
      },
    });
    res.status(201).json(newParent);
  } catch (error) {
    console.error('Error creating parent category:', error);
    res.status(500).json({ error: 'Failed to create parent category' });
  }
});

// PUT update parent category by id
router.put('/:parent_category_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const parentCategoryId = Number(req.params.parent_category_id);
    const data = { ...req.body };
    const updatedParent = await prisma.parent_category.update({
      where: { parent_category_id: parentCategoryId },
      data,
    });
    res.status(202).json(updatedParent);
  } catch (error) {
    console.error('Error updating parent category:', error);
    res.status(500).json({ error: 'Failed to update parent category' });
  }
});

// DELETE parent category by id
router.delete('/:parent_category_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const parentCategoryId = Number(req.params.parent_category_id);
    await prisma.parent_category.delete({
      where: { parent_category_id: parentCategoryId },
    });
    res.json({ message: 'Parent category deleted' });
  } catch (error) {
    console.error('Error deleting parent category:', error);
    res.status(500).json({ error: 'Failed to delete parent category' });
  }
});

export default router;
