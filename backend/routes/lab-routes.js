import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

const SALT_ROUNDS = 10;

function generateLabId(count) {
  const number = (count + 1).toString().padStart(3, '0');
  return `knrslab${number}`;
}

router.get('/', /*authenticateToken,*/ async (req, res) => {
  try {
    const labs = await prisma.lab.findMany();
    res.json(labs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

router.get('/:lab_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { lab_id: req.params.lab_id },
    });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    res.json(lab);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

router.get('/profile/:lab_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const lab = await prisma.lab.findUnique({
      where: { lab_id: req.params.lab_id },
    });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    res.json(lab);
  } catch {
    res.status(500).json({ error: 'Failed to fetch lab' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { password, email, ...rest } = req.body;
    console.log(req.body);

    const existingLab = await prisma.lab.findUnique({
      where: { email },
    });

    if (existingLab) {
      return res.status(409).json({ message: "Email Already Exists" });
    }

    // Generate unique lab_id like: knrslab001, knrslab002, ...
    let labSuffix = 1;
    let lab_id;
    let isUnique = false;

    while (!isUnique) {
      lab_id = `knrslab${labSuffix.toString().padStart(3, '0')}`;
      const existing = await prisma.lab.findUnique({
        where: { lab_id },
      });
      if (!existing) {
        isUnique = true;
      } else {
        labSuffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newLab = await prisma.lab.create({
      data: {
        lab_id,
        email,
        password: hashedPassword,
        ...rest,
      },
    });

    sendAccountCreationNotice(email, lab_id);
    res.status(201).json(newLab);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});


router.put('/:lab_id', /*authenticateToken,*/ async (req, res) => {
  try {
    const { password, ...rest } = req.body.formData;
    const data = { ...rest };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }

    const updatedLab = await prisma.lab.update({
      where: { lab_id: req.params.lab_id },
      data,
    });

    res.status(202).json(updatedLab);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});


router.delete('/:lab_id', /*authenticateToken,*/ async (req, res) => {
  try {
    await prisma.lab.delete({
      where: { lab_id: req.params.lab_id },
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting lab:', error);
    
    // P2003 is Prisma's error code for foreign key constraint violations
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'Cannot delete lab because it has associated orders',
        message: 'This lab has existing orders and cannot be deleted. Please remove the associated orders first.'
      });
    }
    
    res.status(500).json({ error: 'Failed to delete lab' });
  }
});

export default router;
