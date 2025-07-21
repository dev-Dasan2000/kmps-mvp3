import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const questions = await prisma.security_questions.findMany();
    res.json(questions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch security questions' });
  }
});

router.get('/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const question = await prisma.security_questions.findUnique({
      where: { security_question_id: Number(req.params.security_question_id) },
    });
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json(question);
  } catch {
    res.status(500).json({ error: 'Failed to fetch security question' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { question } = req.body;
    const created = await prisma.security_questions.create({ data: { question } });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create security question' });
  }
});

router.put('/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const id = Number(req.params.security_question_id);
    const { question } = req.body;

    const updated = await prisma.security_questions.update({
      where: { security_question_id: id },
      data: { question },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update security question' });
  }
});

router.delete('/:security_question_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.security_questions.delete({
      where: { security_question_id: Number(req.params.security_question_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete security question' });
  }
});

export default router;
