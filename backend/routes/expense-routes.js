import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        dentists: {
          select: {
            dentist_id: true,
            name: true,
          },
        },
      },
    });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.get('/fordentist/:dentist_id', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({where:{dentist_id:req.params.dentist_id}});
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense by ID
router.get('/:expence_id', async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { expence_id: Number(req.params.expence_id) },
    });
    if (!expense) return res.status(404).json({ error: 'Not found' });
    res.json(expense);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { date, title, description, amount, receipt_url, dentist_id, status } = req.body;
    const newExpense = await prisma.expense.create({
      data: {
        date: new Date(date),
        title,
        description,
        amount,
        receipt_url,
        dentist_id,
        status
      },
    });
    res.status(201).json(newExpense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:expence_id', async (req, res) => {
  try {
    const data = req.body;
    if (data.date) data.date = new Date(data.date);
    const updatedExpense = await prisma.expense.update({
      where: { expence_id: Number(req.params.expence_id) },
      data,
    });
    res.status(202).json(updatedExpense);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:expence_id', async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { expence_id: Number(req.params.expence_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
