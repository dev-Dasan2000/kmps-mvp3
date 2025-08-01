import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all items with relations
router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

//GET all items count
router.get('/count', /*authenticateToken,*/ async (req, res) => {
  try {
    const count = await prisma.item.count();
    res.json(count);
  } catch (error) {
    console.error('Error fetching item count:', error);
    res.status(500).json({ error: 'Failed to fetch item count' });
  }
});

//GET value of all items
router.get('/total-value', /*authenticateToken,*/ async (req, res) => {
  try {
    // Fetch all batches with their item's unit price
    const batches = await prisma.batch.findMany({
      include: {
        item: {
          select: {
            unit_price: true,
          },
        },
      },
    });

    // Calculate total inventory value
    const totalValue = batches.reduce((sum, batch) => {
      const price = batch.item?.unit_price || 0;
      return sum + (price * batch.current_stock);
    }, 0);

    res.json(totalValue);
  } catch (error) {
    console.error('Error calculating total value:', error);
    res.status(500).json({ error: 'Failed to calculate total inventory value' });
  }
});

//GET low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        item: true,
      },
    });

    // Map to group low-stock batches per item
    const lowStockMap = new Map();

    batches.forEach(batch => {
      // Only consider batches where current_stock <= minimum_stock
      if (batch.current_stock <= batch.minimum_stock) {
        if (!lowStockMap.has(batch.item_id)) {
          lowStockMap.set(batch.item_id, {
            item: batch.item,
            batches: [],
          });
        }
        lowStockMap.get(batch.item_id).batches.push(batch);
      }
    });

    const lowStockItemsWithBatches = Array.from(lowStockMap.values());

    res.json(lowStockItemsWithBatches);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// GET expiring soon items
router.get('/expiring-soon', async (req, res) => {
  try {
    const today = new Date();

    // Fetch batches with related item data
    const batches = await prisma.batch.findMany({
      include: {
        item: true,
      },
    });

    // Filter batches that are expiring soon
    const expiringSoonMap = new Map();

    batches.forEach((batch) => {
      const item = batch.item;
      const expiryAlertDays = item.expiry_alert_days;

      const expiryDate = new Date(batch.expiry_date);
      const alertDate = new Date();
      alertDate.setDate(today.getDate() + expiryAlertDays);

      if (expiryDate <= alertDate) {
        if (!expiringSoonMap.has(item.item_id)) {
          expiringSoonMap.set(item.item_id, {
            item,
            batches: [],
          });
        }
        expiringSoonMap.get(item.item_id).batches.push(batch);
      }
    });

    const expiringSoonItems = Array.from(expiringSoonMap.values());

    res.json(expiringSoonItems);
  } catch (error) {
    console.error('Error fetching expiring soon items:', error);
    res.status(500).json({ error: 'Failed to fetch expiring soon items' });
  }
});

// GET single item by id with relations
router.get('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { item_id: Number(req.params.item_id) },
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// GET item with batches included (custom endpoint)
router.get('/with-batches/:item_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { item_id: Number(req.params.item_id) },
      include: {
        batches: true,
        sub_category: true,
        supplier: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    console.error('Error fetching item with batches:', error);
    res.status(500).json({ error: 'Failed to fetch item with batches' });
  }
});

// GET items by supplier id (custom endpoint)
router.get('/by-supplier/:supplier_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const supplierId = Number(req.params.supplier_id);
    const items = await prisma.item.findMany({
      where: { supplier_id: supplierId },
      include: {
        sub_category: true,
        supplier: true,
      },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items by supplier:', error);
    res.status(500).json({ error: 'Failed to fetch items by supplier' });
  }
});

// POST create new item
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      item_name,
      unit_of_measurements,
      unit_price,
      storage_location,
      barcode,
      expiry_alert_days,
      description,
      sub_category_id,
      supplier_id,
      batch_tracking,
    } = req.body;

    const newItem = await prisma.item.create({
      data: {
        item_name,
        unit_of_measurements,
        unit_price,
        storage_location,
        barcode,
        expiry_alert_days,
        description,
        sub_category_id: sub_category_id || null,
        supplier_id: supplier_id || null,
        batch_tracking,
      },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "item",
        event: "create",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item by id
router.put('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const itemId = Number(req.params.item_id);
    const data = { ...req.body };

    // Ensure optional foreign keys are nullable if not provided
    if (!('sub_category_id' in data)) data.sub_category_id = undefined;
    if (!('supplier_id' in data)) data.supplier_id = undefined;

    const updatedItem = await prisma.item.update({
      where: { item_id: itemId },
      data,
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "item",
        event: "edit",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(202).json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error.message);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item by id
router.delete('/:item_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const itemId = Number(req.params.item_id);
    await prisma.item.delete({
      where: { item_id: itemId },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "item",
        event: "delete",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
