import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const contacts = await prisma.emergency_contacts.findMany();
    res.json(contacts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

router.get('/:emergency_contact_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const contact = await prisma.emergency_contacts.findUnique({
      where: { emergency_contact_id: Number(req.params.emergency_contact_id) },
    });
    if (!contact) return res.status(404).json({ error: 'Not found' });
    res.json(contact);
  } catch {
    res.status(500).json({ error: 'Failed to fetch emergency contact' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const data = req.body;
    const newContact = await prisma.emergency_contacts.create({ data });
    res.status(201).json(newContact);
  } catch {
    res.status(500).json({ error: 'Failed to create emergency contact' });
  }
});

router.put('/:emergency_contact_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const data = req.body;
    const updatedContact = await prisma.emergency_contacts.update({
      where: { emergency_contact_id: Number(req.params.emergency_contact_id) },
      data,
    });
    res.json(updatedContact);
  } catch {
    res.status(500).json({ error: 'Failed to update emergency contact' });
  }
});

router.delete('/:emergency_contact_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.emergency_contacts.delete({
      where: { emergency_contact_id: Number(req.params.emergency_contact_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete emergency contact' });
  }
});

export default router;
