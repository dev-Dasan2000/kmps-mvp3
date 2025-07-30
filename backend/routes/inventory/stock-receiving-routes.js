import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all stock_receivings with purchase_order
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const stockReceivings = await prisma.stock_receiving.findMany({
      include: {
        purchase_order: true,
      },
    });
    res.json(stockReceivings);
  } catch (error) {
    console.error('Error fetching stock receivings:', error);
    res.status(500).json({ error: 'Failed to fetch stock receivings' });
  }
});

// GET single stock_receiving by id with purchase_order
router.get('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    const stockReceiving = await prisma.stock_receiving.findUnique({
      where: { stock_receiving_id: id },
      include: {
        purchase_order: true,
      },
    });
    if (!stockReceiving) return res.status(404).json({ error: 'Stock receiving not found' });
    res.json(stockReceiving);
  } catch (error) {
    console.error('Error fetching stock receiving:', error);
    res.status(500).json({ error: 'Failed to fetch stock receiving' });
  }
});

// POST create new stock_receiving
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      purchase_order_id,
      received_date,
      received_by,
      invoice_url,
      delivery_note_url,
      qc_report_url,
      notes,
      status
    } = req.body;

    const newStockReceiving = await prisma.stock_receiving.create({
      data: {
        purchase_order_id,
        received_date,
        received_by,
        invoice_url,
        delivery_note_url,
        qc_report_url,
        notes,
        status
      },
    });

    res.status(201).json(newStockReceiving);
  } catch (error) {
    console.error('Error creating stock receiving:', error);
    res.status(500).json({ error: 'Failed to create stock receiving' });
  }
});

// PUT update stock_receiving by id
router.put('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    const data = { ...req.body };

    const updatedStockReceiving = await prisma.stock_receiving.update({
      where: { stock_receiving_id: id },
      data,
    });

    res.status(202).json(updatedStockReceiving);
  } catch (error) {
    console.error('Error updating stock receiving:', error);
    res.status(500).json({ error: 'Failed to update stock receiving' });
  }
});

// DELETE stock_receiving by id
router.delete('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    await prisma.stock_receiving.delete({
      where: { stock_receiving_id: id },
    });
    res.json({ message: 'Stock receiving deleted' });
  } catch (error) {
    console.error('Error deleting stock receiving:', error);
    res.status(500).json({ error: 'Failed to delete stock receiving' });
  }
});

export default router;
