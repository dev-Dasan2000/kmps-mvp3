import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all purchase_order_items with related purchase_order and item
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const poi = await prisma.purchase_order_item.findMany({
      include: {
        purchase_order: true,
        item: true,
      },
    });
    res.json(poi);
  } catch (error) {
    console.error('Error fetching purchase_order_items:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order items' });
  }
});

// GET single purchase_order_item by composite key
router.get('/:purchase_order_id/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrderId = Number(req.params.purchase_order_id);
    const itemId = Number(req.params.item_id);

    const poi = await prisma.purchase_order_item.findUnique({
      where: {
        purchase_order_id_item_id: {
          purchase_order_id: purchaseOrderId,
          item_id: itemId,
        },
      },
      include: {
        purchase_order: true,
        item: true,
      },
    });

    if (!poi) return res.status(404).json({ error: 'Purchase order item not found' });
    res.json(poi);
  } catch (error) {
    console.error('Error fetching purchase_order_item:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order item' });
  }
});

router.post('/', async (req, res) => {
  let purchase_order_id

  try {
    const { purchase_order_id: poId, item_id, quantity } = req.body;
    purchase_order_id = poId; // assign for use in catch

    if (!poId || !item_id || !quantity) {
      return res.status(400).json({ error: 'purchase_order_id, item_id and quantity are required' });
    }

    const newPOI = await prisma.purchase_order_item.create({
      data: {
        purchase_order_id: poId,
        item_id,
        quantity,
      },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "purchase-order-item",
        event: "create",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(201).json(newPOI);
  } catch (error) {
    console.error('Error creating purchase_order_item:', error);

    // Only delete if we have a valid ID
    if (purchase_order_id) {
      try {
        await prisma.purchase_order.delete({ where: { purchase_order_id } });
      } catch (deleteError) {
        console.error('Error deleting purchase_order after POI failure:', deleteError);
      }
    }

    res.status(500).json({ error: 'Failed to create purchase order item' });
  }
});

// DELETE purchase_order_item by composite key
router.delete('/:purchase_order_id/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseOrderId = Number(req.params.purchase_order_id);
    const itemId = Number(req.params.item_id);

    await prisma.purchase_order_item.delete({
      where: {
        purchase_order_id_item_id: {
          purchase_order_id: purchaseOrderId,
          item_id: itemId,
        },
      },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "purchase-order-item",
        event: "delete",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.json({ message: 'Purchase order item deleted' });
  } catch (error) {
    console.error('Error deleting purchase_order_item:', error);
    res.status(500).json({ error: 'Failed to delete purchase order item' });
  }
});

export default router;
