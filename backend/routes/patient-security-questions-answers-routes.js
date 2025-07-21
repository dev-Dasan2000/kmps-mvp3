import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Composite key: patient_id + security_question_id

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const answers = await prisma.patient_security_question_answers.findMany();
    res.json(answers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient security answers' });
  }
});

router.get('/:patient_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, security_question_id } = req.params;
    const answer = await prisma.patient_security_question_answers.findUnique({
      where: {
        patient_id_security_question_id: {
          patient_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    if (!answer) return res.status(404).json({ error: 'Not found' });
    res.json(answer);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient security answer' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    let { patient_id, security_question_id, answer } = req.body;

    if (typeof security_question_id === "string") {
      security_question_id = Number(security_question_id);
    }

    // Check if record exists to prevent duplicate composite key
    const exists = await prisma.patient_security_question_answers.findUnique({
      where: {
        patient_id_security_question_id: {
          patient_id,
          security_question_id,
        },
      },
    });
    if (exists) return res.status(409).json({ error: 'Answer already exists' });

    const created = await prisma.patient_security_question_answers.create({
      data: {
        patient_id,
        security_question_id,
        answer,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create patient security answer' });
  }
});

router.put('/:patient_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, security_question_id } = req.params;
    const { answer } = req.body;

    const updated = await prisma.patient_security_question_answers.update({
      where: {
        patient_id_security_question_id: {
          patient_id,
          security_question_id: Number(security_question_id),
        },
      },
      data: { answer },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update patient security answer' });
  }
});

router.delete('/:patient_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { patient_id, security_question_id } = req.params;
    await prisma.patient_security_question_answers.delete({
      where: {
        patient_id_security_question_id: {
          patient_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete patient security answer' });
  }
});

export default router;
