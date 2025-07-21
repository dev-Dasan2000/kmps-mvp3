import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice, sendAccountCreationNoticeWithPassword } from '../utils/mailer.js';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search request received with query:', q); // Debug log

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${q}%`;

    // Using Prisma's raw query for better search functionality
    const patients = await prisma.$queryRaw`
      SELECT 
        patient_id, 
        name, 
        email, 
        phone_number
      FROM patients
      WHERE 
        LOWER(name) LIKE LOWER(${searchTerm}) OR
        patient_id::TEXT LIKE ${searchTerm} OR
        LOWER(email) LIKE LOWER(${searchTerm}) OR
        phone_number LIKE ${searchTerm}
      LIMIT 20
    `;

    console.log('Search results:', patients); // Debug log
    res.json(patients);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search patients',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const patients = await prisma.patients.findMany();
    res.json(patients);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/count',  /*authenticateToken,*/  async (req, res) => {
  try {
    const count = await prisma.patients.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/:patient_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const patient = await prisma.patients.findUnique({
      where: { patient_id: req.params.patient_id },
    });
    if (!patient) return res.status(404).json({ error: 'Not found' });
    res.json(patient);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.post('/',  /*authenticateToken,*/  async (req, res) => {
  let passwordGenerated = false;
  try {
    let {
      password,
      name,
      profile_picture,
      email,
      phone_number,
      address,
      nic,
      blood_group,
      date_of_birth,
      gender,
    } = req.body;

    console.log(req.body);

    if (!password || password.trim() === '') {
      password = Math.floor(100000 + Math.random() * 900000).toString();
      passwordGenerated = true;
    }

    // Check for existing email
    const existingByEmail = await prisma.patients.findUnique({ where: { email } });
    if (existingByEmail) return res.status(409).json({ error: 'Email already exists' });

    // Check for existing NIC
    if (nic) {
      const existingByNic = await prisma.patients.findUnique({ where: { nic } });
      if (existingByNic) return res.status(409).json({ error: 'NIC already exists' });
    }

    // Safe unique patient_id generation
    let suffix = 1;
    let newPatient_id;
    let isUnique = false;

    while (!isUnique) {
      newPatient_id = `P${String(suffix).padStart(3, '0')}`;
      const exists = await prisma.patients.findUnique({
        where: { patient_id: newPatient_id }
      });
      if (!exists) {
        isUnique = true;
      } else {
        suffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const created = await prisma.patients.create({
      data: {
        patient_id: newPatient_id,
        password: hashedPassword,
        name,
        profile_picture,
        email,
        phone_number,
        address,
        nic,
        blood_group,
        date_of_birth,
        gender,
      },
    });

    if (!passwordGenerated) {
      console.log("sending email with ID");
      sendAccountCreationNotice(email, newPatient_id);
    } else {
      console.log("sending email with ID and password");
      sendAccountCreationNoticeWithPassword(email, newPatient_id, password);
    }

    res.status(201).json(created);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

router.put('/:patient_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const patient_id = req.params.patient_id;
    const {
      password,
      name,
      profile_picture,
      email,
      phone_number,
      address,
      nic,
      blood_group,
      date_of_birth,
      gender,
    } = req.body;

    if (email) {
      const existingByEmail = await prisma.patients.findFirst({
        where: { email, patient_id: { not: patient_id } },
      });
      if (existingByEmail) return res.status(409).json({ error: 'Email already exists' });
    }
    if (nic) {
      const existingByNic = await prisma.patients.findFirst({
        where: { nic, patient_id: { not: patient_id } },
      });
      if (existingByNic) return res.status(409).json({ error: 'NIC already exists' });
    }

    const dataToUpdate = {
      name,
      profile_picture,
      email,
      phone_number,
      address,
      nic,
      blood_group,
      date_of_birth,
      gender,
    };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updated = await prisma.patients.update({
      where: { patient_id },
      data: dataToUpdate,
    });

    res.status(202).json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

router.delete('/:patient_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.patients.delete({ where: { patient_id: req.params.patient_id } });
    res.json({ message: 'Deleted' });
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;