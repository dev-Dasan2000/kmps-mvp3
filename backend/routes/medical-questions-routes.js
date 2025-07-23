import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Initialize default medical questions if they don't exist
const initializeMedicalQuestions = async () => {
  const defaultQuestions = [
    'Do you have any heart disease?',
    'Do you have diabetes?',
    'Do you have hypertension?',
    'Do you have asthma?',
    'Do you have any kidney disease?',
    'Do you have any liver disease?',
    'Do you have any blood disorders?',
    'Are you pregnant?',
    'What is your smoking status?',
    'What is your alcohol consumption?',
    'When was your last dental visit?',
    'Do you have any dental concerns?',
    'Do you have any medication allergies?',
    'Family medical history',
    'Additional notes'
  ];

  try {
    const existingQuestions = await prisma.medical_questions.findMany();
    
    // Only add questions that don't exist
    for (const question of defaultQuestions) {
      const exists = existingQuestions.some(q => q.question === question);
      if (!exists) {
        await prisma.medical_questions.create({
          data: { question }
        });
      }
    }
    console.log('Medical questions initialized successfully');
  } catch (error) {
    console.error('Failed to initialize medical questions:', error);
  }
};

// Call initialization on server start
initializeMedicalQuestions();

router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const questions = await prisma.medical_questions.findMany();
    res.json(questions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical questions' });
  }
});

router.get('/:medical_question_id',  authenticateToken,  async (req, res) => {
  try {
    const question = await prisma.medical_questions.findUnique({
      where: { medical_question_id: Number(req.params.medical_question_id) },
    });
    if (!question) return res.status(404).json({ error: 'Not found' });
    res.json(question);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical question' });
  }
});

router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { question } = req.body;
    const created = await prisma.medical_questions.create({ data: { question } });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create medical question' });
  }
});

router.put('/:medical_question_id',  authenticateToken,  async (req, res) => {
  try {
    const medical_question_id = Number(req.params.medical_question_id);
    const { question } = req.body;
    const updated = await prisma.medical_questions.update({
      where: { medical_question_id },
      data: { question },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update medical question' });
  }
});

router.delete('/:medical_question_id',  authenticateToken,  async (req, res) => {
  try {
    await prisma.medical_questions.delete({
      where: { medical_question_id: Number(req.params.medical_question_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete medical question' });
  }
});

export default router;
