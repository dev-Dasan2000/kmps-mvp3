import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { patients: true, dentists: true, services: true }
    });
    res.json(invoices);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:invoice_id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoice_id: Number(req.params.invoice_id) },
      include: { patients: true, dentists: true, services: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    res.json(invoice);
  } catch {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, dentist_id, payment_type, tax_rate, lab_cost, discount, date, total_amount, note } = req.body;
    const newInvoice = await prisma.invoice.create({
      data: {
        patient_id,
        dentist_id,
        payment_type,
        tax_rate,
        lab_cost,
        discount,
        date: date ? new Date(date) : undefined,
        total_amount,
        note
      },
    });
    res.status(201).json(newInvoice);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.put('/:invoice_id', async (req, res) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    const updatedInvoice = await prisma.invoice.update({
      where: { invoice_id: Number(req.params.invoice_id) },
      data,
    });
    res.json(updatedInvoice);
  } catch {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:invoice_id', async (req, res) => {
  try {
    await prisma.invoice.delete({
      where: { invoice_id: Number(req.params.invoice_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
