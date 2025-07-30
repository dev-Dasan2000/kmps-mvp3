import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all purchase orders with relations
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrders = await prisma.purchase_order.findMany({
      include: {
        supplier: true,
        payment_term: true,
        shipping_method: true,
        stock_receivings: true,
        purchase_order_items: {
          include: {
            item: true,
          },
        },
      },
    });
    const enrichedPurchaseOrders = purchaseOrders.map((po) => {
      const totalAmount = po.purchase_order_items.reduce((sum, poi) => {
        const unitPrice = poi.item?.unit_price || 0;
        return sum + poi.quantity * unitPrice;
      }, 0);

      return {
        ...po,
        total_amount: totalAmount,
      };
    });

    res.json(enrichedPurchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// GET count of all purchase orders
router.get('/count',  /*authenticateToken,*/ async (req, res) => {
  try {
    const count = await prisma.purchase_order.count();
    res.json(count);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});


// GET single purchase order by id with relations
router.get('/:purchase_order_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrder = await prisma.purchase_order.findUnique({
      where: { purchase_order_id: Number(req.params.purchase_order_id) },
      include: {
        supplier: true,
        payment_term: true,
        shipping_method: true,
        purchase_order_items: true,
        stock_receivings: true,
      },
    });
    if (!purchaseOrder) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// POST create new purchase order
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      supplier_id,
      requested_by,
      expected_delivery_date,
      payment_term_id,
      shipping_method_id,
      order_date,
      authorized_by,
      delivery_address,
      notes,
    } = req.body;

    const newPurchaseOrder = await prisma.purchase_order.create({
      data: {
        supplier_id,
        requested_by,
        expected_delivery_date,
        payment_term_id: payment_term_id || null,
        shipping_method_id: shipping_method_id || null,
        order_date,
        authorized_by,
        delivery_address,
        notes,
      },
    });

    res.status(201).json(newPurchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// PUT update purchase order by id
router.put('/:purchase_order_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrderId = Number(req.params.purchase_order_id);
    const data = { ...req.body };

    const updatedPurchaseOrder = await prisma.purchase_order.update({
      where: { purchase_order_id: purchaseOrderId },
      data,
    });

    res.status(202).json(updatedPurchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// DELETE purchase order by id
router.delete('/:purchase_order_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrderId = Number(req.params.purchase_order_id);
    await prisma.purchase_order.delete({
      where: { purchase_order_id: purchaseOrderId },
    });
    res.json({ message: 'Purchase order deleted' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

export default router;
