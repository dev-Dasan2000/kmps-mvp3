import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all payment terms with related purchase_orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const paymentTerms = await prisma.payment_term.findMany({
      include: {
        purchase_orders: true,
      },
    });
    res.json(paymentTerms);
  } catch (error) {
    console.error('Error fetching payment terms:', error);
    res.status(500).json({ error: 'Failed to fetch payment terms' });
  }
});

// GET single payment term by id with purchase_orders
router.get('/:payment_term_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.payment_term_id);
    const paymentTerm = await prisma.payment_term.findUnique({
      where: { payment_term_id: id },
      include: {
        purchase_orders: true,
      },
    });
    if (!paymentTerm) return res.status(404).json({ error: 'Payment term not found' });
    res.json(paymentTerm);
  } catch (error) {
    console.error('Error fetching payment term:', error);
    res.status(500).json({ error: 'Failed to fetch payment term' });
  }
});

// POST create new payment term
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { payment_term } = req.body;
    if (!payment_term) {
      return res.status(400).json({ error: 'payment_term is required' });
    }

    const newPaymentTerm = await prisma.payment_term.create({
      data: { payment_term },
    });

    res.status(201).json(newPaymentTerm);
  } catch (error) {
    console.error('Error creating payment term:', error);
    res.status(500).json({ error: 'Failed to create payment term' });
  }
});

// PUT update payment term by id
router.put('/:payment_term_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.payment_term_id);
    const data = { ...req.body };

    const updatedPaymentTerm = await prisma.payment_term.update({
      where: { payment_term_id: id },
      data,
    });

    res.status(202).json(updatedPaymentTerm);
  } catch (error) {
    console.error('Error updating payment term:', error);
    res.status(500).json({ error: 'Failed to update payment term' });
  }
});

// DELETE payment term by id
router.delete('/:payment_term_id', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.payment_term_id);
    await prisma.payment_term.delete({
      where: { payment_term_id: id },
    });
    res.json({ message: 'Payment term deleted' });
  } catch (error) {
    console.error('Error deleting payment term:', error);
    res.status(500).json({ error: 'Failed to delete payment term' });
  }
});

export default router;
