import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/authentication.js';
import { sendAccountCreationInvite } from '../utils/mailer.js';

const prisma = new PrismaClient();
const router = express.Router();
dotenv.config();

const SALT_ROUNDS = 10;

router.get('/',  /*authenticateToken,*/  async (req, res) => {
  try {
    const admins = await prisma.admins.findMany();
    res.json(admins);
  } catch {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

router.get('/:admin_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const admin = await prisma.admins.findUnique({
      where: { admin_id: req.params.admin_id },
    });
    if (!admin) return res.status(404).json({ error: 'Not found' });
    res.json(admin);
  } catch {
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { admin_id, password } = req.body;

    const existing = await prisma.admins.findUnique({
      where: { admin_id },
    });
    if (existing) {
      return res.status(409).json({ error: 'Admin ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newAdmin = await prisma.admins.create({
      data: { admin_id, password: hashedPassword },
    });
    res.status(201).json(newAdmin);
  } catch {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

router.put('/:admin_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    const { password } = req.body;
    let data = {};
    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }
    const updatedAdmin = await prisma.admins.update({
      where: { admin_id: req.params.admin_id },
      data,
    });
    res.json(updatedAdmin);
  } catch {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

router.delete('/:admin_id',  /*authenticateToken,*/  async (req, res) => {
  try {
    await prisma.admins.delete({
      where: { admin_id: req.params.admin_id },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

router.post('/invite',  /*authenticateToken,*/  async (req, res) => {
  try{
    const role = req.body.role.toLowerCase();
    const URL = `${process.env.FRONTEND_URL}/${role}Signup`;
    await sendAccountCreationInvite(req.body.email, req.body.role, URL);
    res.status(202).json("sent successfully");
  }
  catch(err){
    console.log(err);
    res.status(500).json({error: "Failed Sending Invite"});
  }
});

export default router;
