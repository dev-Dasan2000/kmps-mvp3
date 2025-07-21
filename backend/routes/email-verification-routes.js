import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendVerificationCode } from '../utils/mailer.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  async (req, res) => {
  try {
    const verifications = await prisma.email_verifications.findMany();
    res.json(verifications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch email verifications' });
  }
});

router.get('/:email',  async (req, res) => {
  try {
    const email = req.params.email;
    const verification = await prisma.email_verifications.findUnique({
      where: { email },
    });
    if (!verification) return res.status(404).json({ error: 'Not found' });
    res.json(verification);
  } catch {
    res.status(500).json({ error: 'Failed to fetch email verification' });
  }
});

router.post('/verify',  async (req, res) => {
  try {
    const { email, code } = req.body;

    const existing = await prisma.email_verifications.findUnique({
      where: { email }
    });
    if (!existing) {
      return res.status(409).json({ error: 'No record found' });
    }

    if(existing.code == code){
      await prisma.email_verifications.delete({ where: { email: email } });
      return res.status(200).json(true);
    }
    else{
      return res.status(500).json(false);
    }
  } catch {
    res.status(500).json({ error: 'Failed to create email verification' });
  }
});

router.post('/',  async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await prisma.email_verifications.findUnique({
      where: { email }
    });
    if (existing) {
      return res.status(409).json({ error: 'Verification for this email already exists' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const created = await prisma.email_verifications.create({
      data: { email, code }
    });

    sendVerificationCode(email, code);
    res.status(201).json("Created Succesfully");
  } catch {
    res.status(500).json({ error: 'Failed to create email verification' });
  }
});

router.put('/:email',  async (req, res) => {
  try {
    const email = req.params.email;
    const { code } = req.body;
    const updated = await prisma.email_verifications.update({
      where: { email },
      data: { code },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update email verification' });
  }
});

router.delete('/:email',  async (req, res) => {
  try {
    await prisma.email_verifications.delete({ where: { email: req.params.email } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete email verification' });
  }
});

export default router;
