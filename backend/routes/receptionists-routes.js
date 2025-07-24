import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const receptionists = await prisma.receptionists.findMany();
    res.json(receptionists);
  } catch {
    res.status(500).json({ error: 'Failed to fetch receptionists' });
  }
});

router.get('/count',  authenticateToken,  async (req, res) => {
  try {
    const count = await prisma.receptionists.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch receptionists' });
  }
});

router.get('/:receptionist_id',  authenticateToken,  async (req, res) => {
  try {
    const receptionist = await prisma.receptionists.findUnique({
      where: { receptionist_id: req.params.receptionist_id },
    });
    if (!receptionist) return res.status(404).json({ error: 'Receptionist not found' });
    res.json(receptionist);
  } catch {
    res.status(500).json({ error: 'Failed to fetch receptionist' });
  }
});

router.post('/',  async (req, res) => {
  try {
    const { password, name, email, phone_number } = req.body;

    // Check if email already exists
    const existingEmail = await prisma.receptionists.findUnique({ where: { email } });
    if (existingEmail) return res.status(409).json({ error: 'Email already in use' });

    // Generate unique receptionist ID: knrsrecep001, knrsrecep002, ...
    let suffix = 1;
    let new_receptionist_id;
    let isUnique = false;

    while (!isUnique) {
      new_receptionist_id = `knrsrecep${suffix.toString().padStart(3, '0')}`;
      const existing = await prisma.receptionists.findUnique({
        where: { receptionist_id: new_receptionist_id }
      });
      if (!existing) {
        isUnique = true;
      } else {
        suffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await prisma.receptionists.create({
      data: {
        receptionist_id: new_receptionist_id,
        password: hashedPassword,
        name,
        email,
        phone_number
      },
    });

    sendAccountCreationNotice(email, new_receptionist_id);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating receptionist:', err);
    res.status(500).json({ error: 'Failed to create receptionist' });
  }
});

router.put('/:receptionist_id',  authenticateToken,  async (req, res) => {
  try {
    const { receptionist_id } = req.params;
    const { password, name, email, phone_number } = req.body;

    // If updating email, ensure uniqueness
    if (email) {
      const existingEmail = await prisma.receptionists.findUnique({ where: { email } });
      if (existingEmail && existingEmail.receptionist_id !== receptionist_id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    let dataToUpdate = { name, email, phone_number };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updated = await prisma.receptionists.update({
      where: { receptionist_id },
      data: dataToUpdate,
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update receptionist' });
  }
});

router.put('/change-password/:receptionist_id', authenticateToken, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const data = { ...rest };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }

    const updatedLab = await prisma.lab.update({
      where: { receptionist_id: req.params.receptionist_id },
      data,
    });

    res.status(202).json(updatedLab);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

router.delete('/:receptionist_id',  authenticateToken,  async (req, res) => {
  try {
    console.log(req.params.receptionist_id);
    await prisma.receptionists.delete({
      where: { receptionist_id: req.params.receptionist_id },
    });
    res.json({ message: 'Receptionist deleted' });
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to delete receptionist' });
  }
});

export default router;
