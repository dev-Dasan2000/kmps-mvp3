import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const dentists = await prisma.dentists.findMany();
    res.json(dentists);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dentists' });
  }
});

router.get('/count',  /*authenticateToken,*/  async (req, res) => {
  try {
    const count = await prisma.dentists.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dentists' });
  }
});

router.get('/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const dentist = await prisma.dentists.findUnique({
      where: { dentist_id: req.params.dentist_id },
    });
    if (!dentist) return res.status(404).json({ error: 'Not found' });
    res.json(dentist);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dentist' });
  }
});

router.get('/getworkinfo/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const dentist = await prisma.dentists.findUnique({
      where: { dentist_id: req.params.dentist_id },
      select: {
        work_days_from: true,
        work_days_to: true,
        work_time_from: true,
        work_time_to: true,
        appointment_duration: true,
        appointment_fee: true
      },
    });
    if (!dentist) return res.status(404).json({ error: 'Not found' });
    res.json(dentist);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch dentist' });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const { password, email, ...rest } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const existing = await prisma.dentists.findUnique({
      where: { email: email },
    });
    if (existing) {
      return res.status(409).json({ error: 'Dentist already exists' });
    }

    let dentistIdSuffix = 1;
    let new_dentist_id;
    let exists = true;

    while (exists) {
      new_dentist_id = `knrsdent${dentistIdSuffix.toString().padStart(3, '0')}`;
      const existing = await prisma.dentists.findUnique({
        where: { dentist_id: new_dentist_id }
      });
      if (!existing) {
        exists = false;
      } else {
        dentistIdSuffix++;
      }
    }
    
    console.log('Creating dentist with data:', {
      dentist_id: new_dentist_id,
      email,
      ...rest
    });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newDentist = await prisma.dentists.create({
      data: {
        dentist_id: new_dentist_id,
        password: hashedPassword,
        email,
        ...rest
      },
    });

    console.log('Dentist created successfully:', newDentist);
    sendAccountCreationNotice(email, new_dentist_id);
    res.status(201).json(newDentist);
  } catch (error) {
    console.error('Error creating dentist:', error);
    res.status(500).json({
      error: 'Failed to create dentist',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.put('/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    let data = { ...rest };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }
    const updatedDentist = await prisma.dentists.update({
      where: { dentist_id: req.params.dentist_id },
      data,
    });
    res.json(updatedDentist);
  } catch {
    res.status(500).json({ error: 'Failed to update dentist' });
  }
});

router.delete('/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.dentists.delete({
      where: { dentist_id: req.params.dentist_id },
    });
    res.json({ message: 'Deleted' });
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to delete dentist' });
  }
});

//analytics - appointment counts for a dentist
router.get('/appointment-counts/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const dentistId = req.params.dentist_id;
    const [total, completed, confirmed, pending, canceled] = await Promise.all([
      prisma.appointments.count({ where: { dentist_id: dentistId } }),
      prisma.appointments.count({ where: { dentist_id: dentistId, status: 'completed' } }),
      prisma.appointments.count({ where: { dentist_id: dentistId, status: 'confirmed' } }),
      prisma.appointments.count({ where: { dentist_id: dentistId, status: 'pending' } }),
      prisma.appointments.count({ where: { dentist_id: dentistId, status: 'canceled' } }),
    ]);
    res.json({ total, completed, confirmed, pending, canceled });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch appointment counts' });
  }
});

//analytics - get earnings for a dentist
router.get('/earnings/:dentist_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const dentistId = req.params.dentist_id;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const [totalAllTime, yearSum, monthSum, lastMonthSum] = await Promise.all([
      prisma.appointments.aggregate({ _sum: { fee: true }, where: { dentist_id: dentistId, status: 'completed' } }),
      prisma.appointments.aggregate({ _sum: { fee: true }, where: { dentist_id: dentistId, status: 'completed', date: { gte: startOfYear } } }),
      prisma.appointments.aggregate({ _sum: { fee: true }, where: { dentist_id: dentistId, status: 'completed', date: { gte: startOfMonth } } }),
      prisma.appointments.aggregate({ _sum: { fee: true }, where: { dentist_id: dentistId, status: 'completed', date: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);
    const toNumber = (value) => (value ? parseFloat(value.toString()) : 0);
    res.json({
      totalEarningsAllTime: toNumber(totalAllTime._sum.fee),
      totalEarningsThisYear: toNumber(yearSum._sum.fee),
      earningsThisMonth: toNumber(monthSum._sum.fee),
      earningsLastMonth: toNumber(lastMonthSum._sum.fee),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});


export default router;
