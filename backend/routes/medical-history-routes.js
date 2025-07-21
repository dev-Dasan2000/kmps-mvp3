import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Composite primary key: patient_id + medical_question_id

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const histories = await prisma.medical_history.findMany();
    res.json(histories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical histories' });
  }
});

router.get('/:patient_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const histories = await prisma.medical_history.findMany(
      {
        where: {
          patient_id: req.params.patient_id,
        },
        include: {
          question: true
        }
      }
    );
    res.json(histories);
  } catch(err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to fetch medical histories' });
  }
});

router.get('/:patient_id/:medical_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, medical_question_id } = req.params;
    const history = await prisma.medical_history.findUnique({
      where: {
        patient_id_medical_question_id: {
          patient_id,
          medical_question_id: Number(medical_question_id),
        },
      },
    });
    if (!history) return res.status(404).json({ error: 'Not found' });
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, medical_question_id, medical_question_answer } = req.body;
    const existing = await prisma.medical_history.findUnique({
      where: {
        patient_id_medical_question_id: {
          patient_id,
          medical_question_id,
        },
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Medical history record already exists' });
    }
    const created = await prisma.medical_history.create({
      data: { patient_id, medical_question_id, medical_question_answer },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create medical history' });
  }
});

router.put('/:patient_id/:medical_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, medical_question_id } = req.params;
    const { medical_question_answer } = req.body;
    const updated = await prisma.medical_history.update({
      where: {
        patient_id_medical_question_id: {
          patient_id,
          medical_question_id: Number(medical_question_id),
        },
      },
      data: { medical_question_answer },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update medical history' });
  }
});

router.delete('/:patient_id/:medical_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, medical_question_id } = req.params;
    await prisma.medical_history.delete({
      where: {
        patient_id_medical_question_id: {
          patient_id,
          medical_question_id: Number(medical_question_id),
        },
      },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete medical history' });
  }
});

export default router;
