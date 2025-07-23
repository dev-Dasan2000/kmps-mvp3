import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.payment_history.findMany({
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                patient_id: true,
                name: true,
                email: true,
                phone_number: true,
                profile_picture: true
              }
            },
            dentist: {
              select: {
                dentist_id: true,
                name: true,
                email: true,
                phone_number: true,
                profile_picture: true
              }
            }
          }
        }
      }
    });

    // Replace patient info if it's "<Former_Patient>"
    const formatted = payments.map(payment => {
      const appt = payment.appointment;

      if (appt?.patient?.patient_id === '<Former_Patient>') {
        appt.patient = {
          patient_id: '<former_patient>',
          name: '<Former Patient>',
          email: 'N/A',
          phone_number: 'N/A',
          profile_picture: "N/A"
        };
      }

      return payment;
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment histories' });
  }
});

router.get('/trends',  authenticateToken,  async (req, res) => {

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Get payment records with their appointment data
    const payments = await prisma.payment_history.findMany({
      where: {
        payment_date: {
          gte: sixMonthsAgo.toISOString().split('T')[0], // assumes payment_date is in YYYY-MM-DD format
        },
      },
      include: {
        appointment: {
          select: {
            date: true,
            fee: true,
          },
        },
      },
    });

    // Prepare monthly summary
    const trendsMap = {};

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      trendsMap[key] = {
        month: monthNames[date.getMonth()],
        revenue: 0,
        appointments: 0,
      };
    }

    // Aggregate fees and counts
    payments.forEach(p => {
      if (p.appointment && p.appointment.date) {
        const date = new Date(p.appointment.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (trendsMap[key]) {
          trendsMap[key].revenue += parseFloat(p.appointment.fee || 0);
          trendsMap[key].appointments += 1;
        }
      }
    });

    // Return data sorted by month (oldest to newest)
    const trendData = Object.values(trendsMap).reverse();

    res.json(trendData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment trends' });
  }
});

router.get('/income/this-month',  authenticateToken,  async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await prisma.payment_history.findMany({
      where: {
        payment_date: {
          gte: startOfMonth.toISOString().split('T')[0],
          lte: endOfMonth.toISOString().split('T')[0],
        },
      },
      include: {
        appointment: {
          select: { fee: true },
        },
      },
    });

    const totalIncome = result.reduce((sum, record) => {
      const fee = parseFloat(record.appointment?.fee ?? 0);
      return sum + fee;
    }, 0);

    res.json({ income: totalIncome });
  } catch {
    res.status(500).json({ error: 'Failed to calculate monthly income' });
  }
});

router.get('/:appointment_id',  authenticateToken,  async (req, res) => {
  try {
    const payment = await prisma.payment_history.findUnique({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json(payment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { appointment_id, reference_number } = req.body;

    // Get current date and time
    const now = new Date();
    const payment_date = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const payment_time = now.toTimeString().slice(0, 5);   // "HH:MM"

    // Check if payment history already exists for appointment_id
    const existing = await prisma.payment_history.findUnique({
      where: { appointment_id },
    });
    if (existing) return res.status(409).json({ error: 'Payment history already exists for this appointment' });

    const created = await prisma.payment_history.create({
      data: { appointment_id, payment_date, payment_time, reference_number },
    });

    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create payment history' });
  }
});

router.put('/:appointment_id',  authenticateToken,  async (req, res) => {
  try {
    const appointment_id = Number(req.params.appointment_id);
    const { payment_date, payment_time, reference_number } = req.body;

    const updated = await prisma.payment_history.update({
      where: { appointment_id },
      data: { payment_date, payment_time, reference_number },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update payment history' });
  }
});

router.delete('/:appointment_id',  authenticateToken,  async (req, res) => {
  try {
    await prisma.payment_history.delete({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete payment history' });
  }
});

// Get payment history by patient ID
router.get('/patient/:patient_id',  authenticateToken,  async (req, res) => {
  try {
    const patientId = req.params.patient_id;
    // First, get all appointments for the patient
    const appointments = await prisma.appointments.findMany({
      where: { patient_id: patientId },
      select: { appointment_id: true }
    });

    if (appointments.length === 0) {
      return res.json([]);
    }

    // Get payment histories for these appointments
    const paymentHistories = await prisma.payment_history.findMany({
      where: {
        appointment_id: {
          in: appointments.map(a => a.appointment_id)
        }
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                patient_id: true,
                name: true,
                email: true,
                phone_number: true,
                profile_picture: true
              }
            },
            dentist: {
              select: {
                dentist_id: true,
                name: true,
                email: true,
                phone_number: true,
                profile_picture: true
              }
            }
          }
        }
      },
      orderBy: {
        payment_date: 'desc' // Most recent payments first
      }
    });

    res.json(paymentHistories);
  } catch (error) {
    console.error('Error fetching payment history for patient:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
