import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Composite key: lab_id + security_question_id

router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const answers = await prisma.lab_security_question_answers.findMany();
    res.json(answers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lab security answers' });
  }
});

router.get('/:lab_id/:security_question_id',  authenticateToken,  async (req, res) => {
  try {
    const { lab_id, security_question_id } = req.params;
    const answer = await prisma.lab_security_question_answers.findUnique({
      where: {
        lab_id_security_question_id: {
          lab_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    if (!answer) return res.status(404).json({ error: 'Not found' });
    res.json(answer);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lab security answer' });
  }
});

router.post('/',  authenticateToken,  async (req, res) => {
  try {
    let { lab_id, security_question_id, answer } = req.body;

    if (typeof security_question_id === "string") {
      security_question_id = Number(security_question_id);
    }

    // Check if record exists to prevent duplicate composite key
    const exists = await prisma.lab_security_question_answers.findUnique({
      where: {
        lab_id_security_question_id: {
          lab_id,
          security_question_id,
        },
      },
    });
    if (exists) return res.status(409).json({ error: 'Answer already exists' });

    const created = await prisma.lab_security_question_answers.create({
      data: {
        lab_id,
        security_question_id,
        answer,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create lab security answer' });
  }
});

router.put('/:lab_id/:security_question_id',  authenticateToken,  async (req, res) => {
  try {
    const { lab_id, security_question_id } = req.params;
    const { answer } = req.body;

    const updated = await prisma.lab_security_question_answers.update({
      where: {
        lab_id_security_question_id: {
          lab_id,
          security_question_id: Number(security_question_id),
        },
      },
      data: { answer },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update lab security answer' });
  }
});

router.delete('/:lab_id/:security_question_id',  authenticateToken,  async (req, res) => {
  try {
    const { lab_id, security_question_id } = req.params;
    await prisma.lab_security_question_answers.delete({
      where: {
        lab_id_security_question_id: {
          lab_id,
          security_question_id: Number(security_question_id),
        },
      },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete lab security answer' });
  }
});

export default router;
