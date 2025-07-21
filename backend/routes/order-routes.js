import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', /*authenticateToken,*/ async (req, res) => {
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

router.get('/:id', /*authenticateToken,*/ async (req, res) => {
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

router.get('/forlab/:id', /*authenticateToken,*/ async (req, res) => {
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

router.get('/fordentist/:id', /*authenticateToken,*/ async (req, res) => {
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

router.post('/', /*authenticateToken,*/ async (req, res) => {
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

router.put('/:id', /*authenticateToken,*/ async (req, res) => {
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

router.put('/status/:id', /*authenticateToken,*/ async (req, res) => {
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

router.put('/priority/:id', /*authenticateToken,*/ async (req, res) => {
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

router.delete('/:id', /*authenticateToken,*/ async (req, res) => {
  const orderId = Number(req.params.id);
  const uploadPath = path.join('uploads', 'files');

  try {
    // Step 1: Fetch all order_files related to the order
    const files = await prisma.order_files.findMany({
      where: { order_id: orderId },
    });

    // Step 2: Delete each file from the file system
    for (const file of files) {
      const filePath = path.join(uploadPath, file.url); // Adjust key if needed
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.warn(`Failed to delete file: ${filePath}`, fileErr);
        }
      }
    }

    // Step 3: Delete order_files records
    await prisma.order_files.deleteMany({
      where: { order_id: orderId },
    });

    // Step 4: Delete the order itself
    await prisma.orders.delete({
      where: { order_id: orderId },
    });

    res.json({ message: 'Order and associated files deleted successfully' });
  } catch (err) {
    console.error('Delete order failed:', err);
    res.status(500).json({ error: 'Failed to delete order and its files' });
  }
});

export default router;