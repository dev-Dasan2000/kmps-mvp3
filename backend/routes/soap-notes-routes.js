import express from 'express';
import { PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const notes = await prisma.soap_notes.findMany();
    res.json(notes);
  } catch {
    res.status(500).json({ error: 'Failed to fetch SOAP notes' });
  }
});

router.get('/forpatient/:patient_id',  authenticateToken,  async (req, res) => {
  try {
    const notes = await prisma.soap_notes.findMany({where:{patient_id:req.params.patient_id}});
    res.json(notes);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch SOAP notes' });
  }
});

router.get('/:note_id',  authenticateToken,  async (req, res) => {
  try {
    const note = await prisma.soap_notes.findUnique({
      where: { note_id: Number(req.params.note_id) },
    });
    if (!note) return res.status(404).json({ error: 'SOAP note not found' });
    res.json(note);
  } catch {
    res.status(500).json({ error: 'Failed to fetch SOAP note' });
  }
});

router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { dentist_id, patient_id, note } = req.body;

    const colomboDate = DateTime.now().setZone('Asia/Colombo').toFormat('yyyy-MM-dd');

    const created = await prisma.soap_notes.create({
      data: {
        dentist_id,
        patient_id,
        note,
        date: colomboDate
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create SOAP note:", error);
    res.status(500).json({ error: 'Failed to create SOAP note' });
  }
});

router.put('/:note_id',  authenticateToken,  async (req, res) => {
  try {
    const id = Number(req.params.note_id);
    const { dentist_id, patient_id, note } = req.body;

    const updated = await prisma.soap_notes.update({
      where: { note_id: id },
      data: { dentist_id, patient_id, note },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update SOAP note' });
  }
});

router.delete('/:note_id',  authenticateToken,  async (req, res) => {
  try {
    await prisma.soap_notes.delete({
      where: { note_id: Number(req.params.note_id) },
    });
    res.json({ message: 'Deleted SOAP note' });
  } catch {
    res.status(500).json({ error: 'Failed to delete SOAP note' });
  }
});

export default router;
