import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { order_id: Number(req.params.id) },
    });
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const order = await prisma.orders.create({ data });
    res.status(201).json(order);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.orders.update({
      where: { order_id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.put('/status/:id', async (req, res) => {
  try {
    const updated = await prisma.orders.update({
      where: { order_id: Number(req.params.id) },
      data: { status: req.body.status },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.put('/priority/:id', async (req, res) => {
  try {
    const updated = await prisma.orders.update({
      where: { order_id: Number(req.params.id) },
      data: { priority: req.body.priority },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update priority' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.orders.delete({ where: { order_id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
