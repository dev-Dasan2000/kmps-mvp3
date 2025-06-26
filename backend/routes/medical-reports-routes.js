import express from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const reports = await prisma.medical_reports.findMany();
    res.json(reports);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical reports' });
  }
});

router.get('/:report_id', /* authenticateToken, */ async (req, res) => {
  try {
    const report = await prisma.medical_reports.findUnique({
      where: { report_id: Number(req.params.report_id) },
    });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch {
    res.status(500).json({ error: 'Failed to fetch medical report' });
  }
});

router.get('/forpatient/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const reports = await prisma.medical_reports.findMany({
      where: { patient_id: req.params.patient_id },
    });
    if (!reports) return res.status(404).json({ error: 'Not found' });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medical report' });
  }
});

router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { patient_id, record_url, record_name } = req.body;

    // Check if the record_url already exists
    const existing = await prisma.medical_reports.findFirst({
      where: { record_url },
    });

    if (existing) {
      return res.status(201).json('Report Updated');
    }

    // Create the new record since URL is unique
    const created = await prisma.medical_reports.create({
      data: { patient_id, record_url, record_name },
    });

    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Failed to create medical report' });
  }
});


router.put('/:report_id', /* authenticateToken, */ async (req, res) => {
  try {
    const report_id = Number(req.params.report_id);
    const { patient_id, record_url, record_name } = req.body;
    const updated = await prisma.medical_reports.update({
      where: { report_id },
      data: { patient_id, record_url, record_name },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update medical report' });
  }
});

router.delete('/:report_id', /* authenticateToken, */ async (req, res) => {
  try {
    const reportId = Number(req.params.report_id);

    // 1. Fetch the report to get the file URL
    const report = await prisma.medical_reports.findUnique({
      where: { report_id: reportId },
    });

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    // 2. Delete the file from the filesystem
    const filePath = path.join('uploads', 'files', path.basename(report.record_url));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 3. Delete the DB record
    await prisma.medical_reports.delete({
      where: { report_id: reportId },
    });

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete medical report' });
  }
});

export default router;
