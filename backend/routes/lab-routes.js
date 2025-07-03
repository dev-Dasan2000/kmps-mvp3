import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

const SALT_ROUNDS = 10;

function generateLabId(count) {
  const number = (count + 1).toString().padStart(3, '0');
  return `knrslab${number}`;
}

router.get('/', async (req, res) => {
  try {
    const labs = await prisma.lab.findMany();
    res.json(labs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch labs' });
  }
});

router.get('/:lab_id', async (req, res) => {
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
    const { password, ...rest } = req.body;

    const count = await prisma.lab.count();
    const lab_id = generateLabId(count);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newLab = await prisma.lab.create({
      data: {
        lab_id,
        password: hashedPassword,
        ...rest,
      },
    });
    sendAccountCreationNotice(rest.email, lab_id);
    res.status(201).json(newLab);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create lab' });
  }
});

router.put('/:lab_id', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const data = { ...rest };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }

    const updatedLab = await prisma.lab.update({
      where: { lab_id: req.params.lab_id },
      data,
    });

    res.json(updatedLab);
  } catch {
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

router.delete('/:lab_id', async (req, res) => {
  try {
    await prisma.lab.delete({
      where: { lab_id: req.params.lab_id },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete lab' });
  }
});

export default router;
