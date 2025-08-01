import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// GET all batches with related item info
router.get('/',/*authenticateToken,*/ async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        item: true,
      },
    });
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// GET single batch by id with related item
router.get('/:batch_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const batch = await prisma.batch.findUnique({
      where: { batch_id: Number(req.params.batch_id) },
      include: {
        item: true,
      },
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// GET batches by item_id (custom endpoint)
router.get('/by-item/:item_id',/* authenticateToken,*/ async (req, res) => {
  try {
    const itemId = Number(req.params.item_id);
    const batches = await prisma.batch.findMany({
      where: { item_id: itemId },
      include: { item: true },
    });
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches by item:', error);
    res.status(500).json({ error: 'Failed to fetch batches by item' });
  }
});

// POST create new batch
router.post('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      item_id,
      current_stock,
      minimum_stock,
      expiry_date,
      stock_date,
    } = req.body;

    const newBatch = await prisma.batch.create({
      data: {
        item_id,
        current_stock,
        minimum_stock,
        expiry_date,
        stock_date,
      },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "batch",
        event: "create",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(201).json(newBatch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// PUT update batch by id
router.put('/:batch_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const batchId = Number(req.params.batch_id);
    const data = { ...req.body };

    const updatedBatch = await prisma.batch.update({
      where: { batch_id: batchId },
      data,
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "batch",
        event: "edit",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(202).json(updatedBatch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// DELETE batch by id
router.delete('/:batch_id',/* authenticateToken,*/ async (req, res) => {
  try {
    const batchId = Number(req.params.batch_id);
    await prisma.batch.delete({
      where: { batch_id: batchId },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "batch",
        event: "delete",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.json({ message: 'Batch deleted' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

export default router;
