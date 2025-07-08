import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const services = await prisma.invoice_service.findMany();
    res.json(services);
  } catch {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/:service_id', async (req, res) => {
  try {
    const service = await prisma.invoice_service.findUnique({
      where: { service_id: Number(req.params.service_id) },
    });
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { service_name, amount } = req.body;
    const newService = await prisma.invoice_service.create({
      data: { service_name, amount },
    });
    res.status(201).json(newService);
  } catch {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/:service_id', async (req, res) => {
  try {
    const data = req.body;
    const updatedService = await prisma.invoice_service.update({
      where: { service_id: Number(req.params.service_id) },
      data,
    });
    res.json(updatedService);
  } catch {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:service_id', async (req, res) => {
  try {
    await prisma.invoice_service.delete({
      where: { service_id: Number(req.params.service_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;
