import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all items with relations
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET single item by id with relations
router.get('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { item_id: Number(req.params.item_id) },
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// GET item with batches included (custom endpoint)
router.get('/with-batches/:item_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { item_id: Number(req.params.item_id) },
      include: {
        batches: true,
        sub_category: true,
        supplier: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item with batches:', error);
    res.status(500).json({ error: 'Failed to fetch item with batches' });
  }
});

// GET items by supplier id (custom endpoint)
router.get('/by-supplier/:supplier_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const supplierId = Number(req.params.supplier_id);
    const items = await prisma.item.findMany({
      where: { supplier_id: supplierId },
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items by supplier:', error);
    res.status(500).json({ error: 'Failed to fetch items by supplier' });
  }
});

// POST create new item
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      item_name,
      unit_of_measurements,
      unit_price,
      storage_location,
      barcode,
      expiry_alert_days,
      description,
      sub_category_id,
      supplier_id,
      batch_tracking,
    } = req.body;

    const newItem = await prisma.item.create({
      data: {
        item_name,
        unit_of_measurements,
        unit_price,
        storage_location,
        barcode,
        expiry_alert_days,
        description,
        sub_category_id: sub_category_id || null,
        supplier_id: supplier_id || null,
        batch_tracking,
      },
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item by id
router.put('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const itemId = Number(req.params.item_id);
    const data = { ...req.body };

    // Ensure optional foreign keys are nullable if not provided
    if (!('sub_category_id' in data)) data.sub_category_id = undefined;
    if (!('supplier_id' in data)) data.supplier_id = undefined;

    const updatedItem = await prisma.item.update({
      where: { item_id: itemId },
      data,
    });

    res.status(202).json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item by id
router.delete('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const itemId = Number(req.params.item_id);
    await prisma.item.delete({
      where: { item_id: itemId },
    });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
