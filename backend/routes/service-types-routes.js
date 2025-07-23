import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const services = await prisma.service_types.findMany();
    res.json(services);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service types' });
  }
});

router.get('/:service_type_id',  authenticateToken,  async (req, res) => {
  try {
    const service = await prisma.service_types.findUnique({
      where: { service_type_id: Number(req.params.service_type_id) },
    });
    if (!service) return res.status(404).json({ error: 'Service type not found' });
    res.json(service);
  } catch {
    res.status(500).json({ error: 'Failed to fetch service type' });
  }
});

router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { service_type } = req.body;
    const created = await prisma.service_types.create({
      data: { service_type },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create service type' });
  }
});

router.put('/:service_type_id',  authenticateToken,  async (req, res) => {
  try {
    const id = Number(req.params.service_type_id);
    const { service_type } = req.body;

    const updated = await prisma.service_types.update({
      where: { service_type_id: id },
      data: { service_type },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update service type' });
  }
});

router.delete('/:service_type_id',  authenticateToken,  async (req, res) => {
  try {
    await prisma.service_types.delete({
      where: { service_type_id: Number(req.params.service_type_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete service type' });
  }
});

export default router;
