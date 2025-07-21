import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get services assigned to an invoice by invoice_id
router.get('/:invoice_id', /*authenticateToken,*/  async (req, res) => {
  try {
    const invoice_id = parseInt(req.params.invoice_id);
    
    if (isNaN(invoice_id)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }
    
    const serviceAssignments = await prisma.invoice_service_assign.findMany({
      where: { invoice_id },
      include: { service: true }
    });
    
    res.json(serviceAssignments);
  } catch (error) {
    console.error('Error fetching invoice services:', error);
    res.status(500).json({ error: 'Failed to fetch services for invoice' });
  }
});

// Assign a service to an invoice
router.post('/', /*authenticateToken,*/ async (req, res) => {
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
router.delete('/', /*authenticateToken,*/ async (req, res) => {
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
