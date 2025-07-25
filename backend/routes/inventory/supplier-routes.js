import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all suppliers with their items and purchase_orders
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        items: true,
        purchase_orders: true,
      },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// GET single supplier by id with related items and purchase_orders
router.get('/:supplier_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id: Number(req.params.supplier_id) },
      include: {
        items: true,
        purchase_orders: true,
      },
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// POST create new supplier
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone_number,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      notes,
      status,
    } = req.body;

    const newSupplier = await prisma.supplier.create({
      data: {
        company_name,
        contact_person,
        email,
        phone_number,
        address,
        city,
        state,
        postal_code,
        country,
        website,
        notes,
        status,
      },
    });

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// PUT update supplier by id
router.put('/:supplier_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const supplierId = Number(req.params.supplier_id);
    const data = { ...req.body };

    const updatedSupplier = await prisma.supplier.update({
      where: { supplier_id: supplierId },
      data,
    });

    res.status(202).json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// DELETE supplier by id
router.delete('/:supplier_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const supplierId = Number(req.params.supplier_id);
    await prisma.supplier.delete({
      where: { supplier_id: supplierId },
    });
    res.json({ message: 'Supplier deleted' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
