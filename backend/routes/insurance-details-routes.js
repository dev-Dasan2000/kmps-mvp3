import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// patient_id is the primary key

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const details = await prisma.insurance_details.findMany();
    res.json(details);
  } catch {
    res.status(500).json({ error: 'Failed to fetch insurance details' });
  }
});

router.get('/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const detail = await prisma.insurance_details.findUnique({
      where: { patient_id: req.params.patient_id },
    });
    if (!detail) return res.status(404).json({ error: 'Not found' });
    res.json(detail);
  } catch {
    res.status(500).json({ error: 'Failed to fetch insurance detail' });
  }
});

router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { patient_id, provider_name, policy_number } = req.body;
    const existing = await prisma.insurance_details.findUnique({ where: { patient_id } });
    if (existing) {
      return res.status(409).json({ error: 'Insurance detail for this patient already exists' });
    }
    const created = await prisma.insurance_details.create({
      data: { patient_id, provider_name, policy_number },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create insurance detail' });
  }
});

router.put('/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const patient_id = req.params.patient_id;
    const { provider_name, policy_number } = req.body;
    const updated = await prisma.insurance_details.update({
      where: { patient_id },
      data: { provider_name, policy_number },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update insurance detail' });
  }
});

router.delete('/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    await prisma.insurance_details.delete({ where: { patient_id: req.params.patient_id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete insurance detail' });
  }
});

export default router;
