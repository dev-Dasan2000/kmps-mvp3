import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Composite key: radiologist_id + security_question_id

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const answers = await prisma.radiologist_security_question_answers.findMany();
    res.json(answers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch radiologist security answers' });
  }
});

router.get('/:radiologist_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { radiologist_id, security_question_id } = req.params;
    const answer = await prisma.radiologist_security_question_answers.findUnique({
      where: {
        radiologist_id_security_question_id: {
          radiologist_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    if (!answer) return res.status(404).json({ error: 'Not found' });
    res.json(answer);
  } catch {
    res.status(500).json({ error: 'Failed to fetch radiologist security answer' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { radiologist_id, security_question_id, answer } = req.body;

    // Check if record exists to prevent duplicate composite key
    const exists = await prisma.radiologist_security_question_answers.findUnique({
      where: {
        radiologist_id_security_question_id: {
          radiologist_id,
          security_question_id,
        },
      },
    });
    if (exists) return res.status(409).json({ error: 'Answer already exists' });

    const created = await prisma.radiologist_security_question_answers.create({
      data: {
        radiologist_id,
        security_question_id,
        answer,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create radiologist security answer' });
  }
});

router.put('/:radiologist_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { radiologist_id, security_question_id } = req.params;
    const { answer } = req.body;

    const updated = await prisma.radiologist_security_question_answers.update({
      where: {
        radiologist_id_security_question_id: {
          radiologist_id,
          security_question_id: Number(security_question_id),
        },
      },
      data: { answer },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update radiologist security answer' });
  }
});

router.delete('/:radiologist_id/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { radiologist_id, security_question_id } = req.params;
    await prisma.radiologist_security_question_answers.delete({
      where: {
        radiologist_id_security_question_id: {
          radiologist_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete radiologist security answer' });
  }
});

export default router;
