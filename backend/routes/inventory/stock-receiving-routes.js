import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all stock_receivings with purchase_order
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const stockReceivings = await prisma.stock_receiving.findMany({
      include: {
        purchase_order: {
          include: {
            supplier: true,
            payment_term: true,
            shipping_method: true,
            purchase_order_items: {
              include: {
                item: true
              }
            }
          }
        }
      },
    });
    
    // Calculate total_amount for each purchase_order
    const enrichedStockReceivings = stockReceivings.map((sr) => {
      if (sr.purchase_order && sr.purchase_order.purchase_order_items) {
        const totalAmount = sr.purchase_order.purchase_order_items.reduce((sum, poi) => {
          const unitPrice = poi.item?.unit_price || 0;
          return sum + poi.quantity * unitPrice;
        }, 0);
        
        return {
          ...sr,
          purchase_order: {
            ...sr.purchase_order,
            total_amount: totalAmount,
          }
        };
      }
      return sr;
    });
    
    res.json(enrichedStockReceivings);
  } catch (error) {
    console.error('Error fetching stock receivings:', error);
    res.status(500).json({ error: 'Failed to fetch stock receivings' });
  }
});

// GET single stock_receiving by id with purchase_order
router.get('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    const stockReceiving = await prisma.stock_receiving.findUnique({
      where: { stock_receiving_id: id },
      include: {
        purchase_order: {
          include: {
            supplier: true,
            payment_term: true,
            shipping_method: true,
            purchase_order_items: {
              include: {
                item: true
              }
            }
          }
        }
      },
    });
    if (!stockReceiving) return res.status(404).json({ error: 'Stock receiving not found' });
    
    // Calculate total_amount for purchase_order
    if (stockReceiving.purchase_order && stockReceiving.purchase_order.purchase_order_items) {
      const totalAmount = stockReceiving.purchase_order.purchase_order_items.reduce((sum, poi) => {
        const unitPrice = poi.item?.unit_price || 0;
        return sum + poi.quantity * unitPrice;
      }, 0);
      
      stockReceiving.purchase_order.total_amount = totalAmount;
    }
    
    res.json(stockReceiving);
  } catch (error) {
    console.error('Error fetching stock receiving:', error);
    res.status(500).json({ error: 'Failed to fetch stock receiving' });
  }
});

// POST create new stock_receiving
router.post('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const {
      purchase_order_id,
      received_date,
      received_by,
      invoice_url,
      delivery_note_url,
      qc_report_url,
      notes,
      status
    } = req.body;

    const newStockReceiving = await prisma.stock_receiving.create({
      data: {
        purchase_order_id,
        received_date,
        received_by,
        invoice_url,
        delivery_note_url,
        qc_report_url,
        notes,
        status
      },
      include: {
        purchase_order: {
          include: {
            supplier: true,
            payment_term: true,
            shipping_method: true,
            purchase_order_items: {
              include: {
                item: true
              }
            }
          }
        }
      },
    });
    
    // Calculate total_amount for purchase_order
    if (newStockReceiving.purchase_order && newStockReceiving.purchase_order.purchase_order_items) {
      const totalAmount = newStockReceiving.purchase_order.purchase_order_items.reduce((sum, poi) => {
        const unitPrice = poi.item?.unit_price || 0;
        return sum + poi.quantity * unitPrice;
      }, 0);
      
      newStockReceiving.purchase_order.total_amount = totalAmount;
    }

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "stock-receive",
        event: "create",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(201).json(newStockReceiving);
  } catch (error) {
    console.error('Error creating stock receiving:', error);
    res.status(500).json({ error: 'Failed to create stock receiving' });
  }
});

// PUT update stock_receiving by id
router.put('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    const data = { ...req.body };

    const updatedStockReceiving = await prisma.stock_receiving.update({
      where: { stock_receiving_id: id },
      data,
      include: {
        purchase_order: {
          include: {
            supplier: true,
            payment_term: true,
            shipping_method: true,
            purchase_order_items: {
              include: {
                item: true
              }
            }
          }
        }
      },
    });
    
    // Calculate total_amount for purchase_order
    if (updatedStockReceiving.purchase_order && updatedStockReceiving.purchase_order.purchase_order_items) {
      const totalAmount = updatedStockReceiving.purchase_order.purchase_order_items.reduce((sum, poi) => {
        const unitPrice = poi.item?.unit_price || 0;
        return sum + poi.quantity * unitPrice;
      }, 0);
      
      updatedStockReceiving.purchase_order.total_amount = totalAmount;
    }

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "stock-receive",
        event: "edit",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(202).json(updatedStockReceiving);
  } catch (error) {
    console.error('Error updating stock receiving:', error);
    res.status(500).json({ error: 'Failed to update stock receiving' });
  }
});

// DELETE stock_receiving by id
router.delete('/:stock_receiving_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const id = Number(req.params.stock_receiving_id);
    await prisma.stock_receiving.delete({
      where: { stock_receiving_id: id },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "stock-receive",
        event: "delete",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.json({ message: 'Stock receiving deleted' });
  } catch (error) {
    console.error('Error deleting stock receiving:', error);
    res.status(500).json({ error: 'Failed to delete stock receiving' });
  }
});

export default router;
