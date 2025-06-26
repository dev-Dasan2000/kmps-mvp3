import express from 'express';
import { PrismaClient } from '@prisma/client';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Composite key: (dentist_id, security_question_id)

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const answers = await prisma.dentist_security_question_answers.findMany();
    res.json(answers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dentist security question answers' });
  }
});

router.get('/:dentist_id/:security_question_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { dentist_id, security_question_id } = req.params;
    const answer = await prisma.dentist_security_question_answers.findUnique({
      where: {
        dentist_id_security_question_id: {
          dentist_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    if (!answer) return res.status(404).json({ error: 'Not found' });
    res.json(answer);
  } catch {
    res.status(500).json({ error: 'Failed to fetch answer' });
  }
});

router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { dentist_id, security_question_id, answer } = req.body;
    const existing = await prisma.dentist_security_question_answers.findUnique({
      where: {
        dentist_id_security_question_id: {
          dentist_id,
          security_question_id,
        },
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Answer already exists for this dentist and question' });
    }
    const created = await prisma.dentist_security_question_answers.create({
      data: {
        dentist_id,
        security_question_id,
        answer,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create answer' });
  }
});

router.put('/:dentist_id/:security_question_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { dentist_id, security_question_id } = req.params;
    const { answer } = req.body;
    const updated = await prisma.dentist_security_question_answers.update({
      where: {
        dentist_id_security_question_id: {
          dentist_id,
          security_question_id: Number(security_question_id),
        },
      },
      data: { answer },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

router.delete('/:dentist_id/:security_question_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { dentist_id, security_question_id } = req.params;
    await prisma.dentist_security_question_answers.delete({
      where: {
        dentist_id_security_question_id: {
          dentist_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

export default router;
