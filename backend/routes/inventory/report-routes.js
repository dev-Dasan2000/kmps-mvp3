import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/stock', /*authenticateToken,*/ async (req, res) => {
  try {
    const stockReport = await prisma.batch.findMany({
      include: {
        item: {
          select: {
            item_id: true,
            item_name: true,
            unit_of_measurements: true,
            unit_price: true,
          },
        },
      },
    });

    const result = stockReport.map(batch => ({
      batch_id: batch.batch_id,
      current_stock: batch.current_stock,
      minimum_stock: batch.minimum_stock,
      expiry_date: batch.expiry_date,
      stock_date: batch.stock_date,
      item: {
        item_id: batch.item.item_id,
        item_name: batch.item.item_name,
        unit_of_measurement: batch.item.unit_of_measurements,
        unit_price: batch.item.unit_price,
      },
    }));

    res.json(result);
  } catch (error) {
    console.error('Error generating stock report:', error);
    res.status(500).json({ error: 'Failed to generate stock report' });
  }
});

router.get('/usage', /*authenticateToken,*/ async (req, res) => {
  try {
    const usageReport = await prisma.stock_issue.findMany({
      include: {
        batch: {
          include: {
            item: {
              select: {
                item_id: true,
                item_name: true,
                unit_of_measurements: true,
                unit_price: true,
              },
            },
          },
        },
      },
    });

    const result = usageReport.map(issue => ({
      stock_issue_id: issue.stock_issue_id,
      quantity: issue.quantity,
      usage_type: issue.usage_type ?? '',
      issued_to: issue.issued_to ?? '',
      date: issue.date,
      batch: {
        batch_id: issue.batch.batch_id,
        item: {
          item_id: issue.batch.item.item_id,
          item_name: issue.batch.item.item_name,
          unit_of_measurement: issue.batch.item.unit_of_measurements,
          unit_price: issue.batch.item.unit_price,
        },
      },
    }));

    res.json(result);
  } catch (error) {
    console.error('Error generating usage report:', error);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

router.get('/purchase', /*authenticateToken,*/ async (req, res) => {
  try {
    const purchaseReport = await prisma.purchase_order_item.findMany({
      include: {
        item: {
          select: {
            item_id: true,
            item_name: true,
            unit_of_measurements: true,
            unit_price: true,
          },
        },
        purchase_order: {
          include: {
            supplier: {
              select: {
                supplier_id: true,
                company_name: true,
              },
            },
          },
        },
      },
    });

    const result = purchaseReport.map(record => ({
      quantity: record.quantity,
      purchase_order: {
        purchase_order_id: record.purchase_order.purchase_order_id,
        requested_by: record.purchase_order.requested_by,
        expected_delivery_date: record.purchase_order.expected_delivery_date,
        order_date: record.purchase_order.order_date,
        supplier: {
          supplier_id: record.purchase_order.supplier.supplier_id,
          supplier_name: record.purchase_order.supplier.company_name,
        },
      },
      item: {
        item_id: record.item.item_id,
        item_name: record.item.item_name,
        unit_of_measurement: record.item.unit_of_measurements,
        unit_price: record.item.unit_price,
      },
    }));

    res.json(result);
  } catch (error) {
    console.error('Error generating purchase report:', error);
    res.status(500).json({ error: 'Failed to generate purchase report' });
  }
});

export default router;
