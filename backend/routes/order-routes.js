import express from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        lab: true,
        patient: true,
        dentist: true,
        work_type: true,
        shade_type: true,
        material_type: true,
        order_files: true,
        stage_assign: true,
      },
    });
    res.json(orders);
  } catch (err) {
    console.log(err)
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

router.get('/forlab/:id', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      where:
      {
        lab_id: req.params.id,
        status: { not: "request" }
      },
      include: {
        lab: true,
        patient: true,
        dentist: true,
        work_type: true,
        shade_type: true,
        material_type: true,
        order_files: true,
        stage_assign: true,
      },
    });
    res.json(orders);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/fordentist/:id', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { dentist_id: req.params.id },
      include: {
        lab: true,
        patient: true,
        work_type: true,
        shade_type: true,
        material_type: true,
        order_files: true,
        stage_assign: true,
      },
    });
    res.json(orders);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.dentist_id) {
      return res.status(400).json({ error: 'Dentist ID is required' });
    }

    // Ensure numeric fields are properly formatted
    const orderData = {
      ...data,
      work_type_id: data.work_type_id ? parseInt(data.work_type_id) : null,
      shade_type_id: data.shade_type_id ? parseInt(data.shade_type_id) : null,
      material_id: data.material_id ? parseInt(data.material_id) : null,
      due_date: data.due_date ? new Date(data.due_date) : null,
    };

    console.log('Creating order with data:', orderData); // Debug log

    const order = await prisma.orders.create({ 
      data: orderData,
      include: {
        lab: true,
        patient: true,
        dentist: true,
        work_type: true,
        shade_type: true,
        material_type: true,
      }
    });

    console.log('Order created:', order); // Debug log
    res.status(201).json(order.order_id);
  } catch (err) {
    console.error('Error creating order:', err);
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Unique constraint violation' });
    } else if (err.code === 'P2003') {
      res.status(400).json({ error: 'Foreign key constraint violation. Please check all IDs are valid.' });
    } else {
      res.status(500).json({ error: 'Failed to create order: ' + err.message });
    }
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.orders.update({
      where: { order_id: Number(req.params.id) },
      data: req.body,
    });
    res.status(202).json(updated);
  } catch (err) {
    console.log(err);
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
