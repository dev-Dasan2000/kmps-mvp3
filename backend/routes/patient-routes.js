import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice, sendAccountCreationNoticeWithPassword } from '../utils/mailer.js';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const patients = await prisma.patients.findMany();
    res.json(patients);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/count', /* authenticateToken, */ async (req, res) => {
  try {
    const count = await prisma.patients.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/:patient_id', /* authenticateToken, */ async (req, res) => {
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

router.post('/', /* authenticateToken, */ async (req, res) => {
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

    const latest = await prisma.patients.findFirst({
      orderBy: {
        patient_id: 'desc'
      }
    });
    
    let newPatient_id = 'P001';
    if (latest) {
      const latestNum = parseInt(latest.patient_id.replace('P', '')) || 0;
      newPatient_id = 'P' + String(latestNum + 1).padStart(3, '0');
    }
    

    const existingByEmail = await prisma.patients.findUnique({ where: { email } });
    if (existingByEmail) return res.status(409).json({ error: 'Email already exists' });

    if (nic) {
      const existingByNic = await prisma.patients.findUnique({ where: { nic } });
      if (existingByNic) return res.status(409).json({ error: 'NIC already exists' });
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

    if(!passwordGenerated){
      console.log("sending email with ID");
      sendAccountCreationNotice(email, newPatient_id);
    }
    else{
      console.log("sending email with ID and password");
      sendAccountCreationNoticeWithPassword(email, newPatient_id, password);
    }
    res.status(201).json(created);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

router.put('/:patient_id', /* authenticateToken, */ async (req, res) => {
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


router.delete('/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    await prisma.patients.delete({ where: { patient_id: req.params.patient_id } });
    res.json({ message: 'Deleted' });
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;
