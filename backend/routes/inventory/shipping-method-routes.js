import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all shipping methods with related purchase_orders
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const shippingMethods = await prisma.shipping_method.findMany({
      include: { purchase_orders: true },
    });
    res.json(shippingMethods);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ error: 'Failed to fetch shipping methods' });
  }
});

// GET single shipping method by id with purchase_orders
router.get('/:shipping_method_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.shipping_method_id);
    const shippingMethod = await prisma.shipping_method.findUnique({
      where: { shipping_method_id: id },
      include: { purchase_orders: true },
    });
    if (!shippingMethod) return res.status(404).json({ error: 'Shipping method not found' });
    res.json(shippingMethod);
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ error: 'Failed to fetch shipping method' });
  }
});

// POST create new shipping method
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const { shipping_method } = req.body;
    if (!shipping_method) return res.status(400).json({ error: 'shipping_method is required' });

    const newShippingMethod = await prisma.shipping_method.create({
      data: { shipping_method },
    });

    res.status(201).json(newShippingMethod);
  } catch (error) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({ error: 'Failed to create shipping method' });
  }
});

// PUT update shipping method by id
router.put('/:shipping_method_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.shipping_method_id);
    const data = { ...req.body };

    const updatedShippingMethod = await prisma.shipping_method.update({
      where: { shipping_method_id: id },
      data,
    });

    res.status(202).json(updatedShippingMethod);
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ error: 'Failed to update shipping method' });
  }
});

// DELETE shipping method by id
router.delete('/:shipping_method_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.shipping_method_id);
    await prisma.shipping_method.delete({
      where: { shipping_method_id: id },
    });
    res.json({ message: 'Shipping method deleted' });
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({ error: 'Failed to delete shipping method' });
  }
});

export default router;
