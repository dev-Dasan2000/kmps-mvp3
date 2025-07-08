import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Assign a service to an invoice
router.post('/', async (req, res) => {
  try {
    const { invoice_id, service_id } = req.body;
    const assignment = await prisma.invoice_service_assign.create({
      data: {
        invoice_id,
        service_id
      }
    });
    res.status(201).json(assignment);
  } catch {
    res.status(500).json({ error: 'Failed to assign service to invoice' });
  }
});

// Delete a service from an invoice
router.delete('/', async (req, res) => {
  try {
    const { invoice_id, service_id } = req.body;
    await prisma.invoice_service_assign.delete({
      where: {
        invoice_id_service_id: {
          invoice_id,
          service_id
        }
      }
    });
    res.json({ message: 'Unassigned' });
  } catch {
    res.status(500).json({ error: 'Failed to unassign service from invoice' });
  }
});

export default router;
