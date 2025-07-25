import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all sub_categories with parent_category and items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subCategories = await prisma.sub_category.findMany({
      include: {
        parent_category: true,
        items: true,
      },
    });
    res.json(subCategories);
  } catch (error) {
    console.error('Error fetching sub categories:', error);
    res.status(500).json({ error: 'Failed to fetch sub categories' });
  }
});

// GET single sub_category by id with relations
router.get('/:sub_category_id', authenticateToken, async (req, res) => {
  try {
    const subCategory = await prisma.sub_category.findUnique({
      where: { sub_category_id: Number(req.params.sub_category_id) },
      include: {
        parent_category: true,
        items: true,
      },
    });
    if (!subCategory) return res.status(404).json({ error: 'Sub category not found' });
    res.json(subCategory);
  } catch (error) {
    console.error('Error fetching sub category:', error);
    res.status(500).json({ error: 'Failed to fetch sub category' });
  }
});

// POST create new sub_category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sub_category_name, description, parent_category_id } = req.body;
    const newSubCategory = await prisma.sub_category.create({
      data: {
        sub_category_name,
        description,
        parent_category_id: parent_category_id || null,
      },
    });
    res.status(201).json(newSubCategory);
  } catch (error) {
    console.error('Error creating sub category:', error);
    res.status(500).json({ error: 'Failed to create sub category' });
  }
});

// PUT update sub_category by id
router.put('/:sub_category_id', authenticateToken, async (req, res) => {
  try {
    const subCategoryId = Number(req.params.sub_category_id);
    const data = { ...req.body };
    if (!('parent_category_id' in data)) data.parent_category_id = undefined;
    const updatedSubCategory = await prisma.sub_category.update({
      where: { sub_category_id: subCategoryId },
      data,
    });
    res.status(202).json(updatedSubCategory);
  } catch (error) {
    console.error('Error updating sub category:', error);
    res.status(500).json({ error: 'Failed to update sub category' });
  }
});

// DELETE sub_category by id
router.delete('/:sub_category_id', authenticateToken, async (req, res) => {
  try {
    const subCategoryId = Number(req.params.sub_category_id);
    await prisma.sub_category.delete({
      where: { sub_category_id: subCategoryId },
    });
    res.json({ message: 'Sub category deleted' });
  } catch (error) {
    console.error('Error deleting sub category:', error);
    res.status(500).json({ error: 'Failed to delete sub category' });
  }
});

export default router;
