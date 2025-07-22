import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwTokens } from '../utils/jwt-helper.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const findUserById = async (id) => {
  /*let user = await prisma.patients.findUnique({ where: { patient_id: id } });
  if (user) return { user, role: 'patient' };*/

  user = await prisma.radiologists.findUnique({ where: { radiologist_id: id } });
  if (user) return { user, role: 'radiologist' };

  user = await prisma.dentists.findUnique({ where: { dentist_id: id } });
  if (user) return { user, role: 'dentist' };

  user = await prisma.receptionists.findUnique({ where: { receptionist_id: id } });
  if (user) return { user, role: 'receptionist' };

  user = await prisma.admins.findUnique({ where: { admin_id: id } });
  if (user) return { user, role: 'admin' };

  user = await prisma.lab.findUnique({ where: { lab_id: id } });
  if(user) return {user, role: 'lab'};

  return { user: null, role: null };
};

router.post('/login', async (req, res) => {
  try {
    const { id, password, checked } = req.body;
    const { user, role } = await findUserById(id);

    if (!user) {
      return res.status(404).json({ successful: false, message: 'User not found' });
    }

    if (!user.password) {
      return res.json({ successful: false, message: 'Invalid password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.json({ successful: false, message: 'Invalid password' });
    }

    // Check if email is verified
    if (user.email) {
      const verificationRecord = await prisma.email_verifications.findUnique({
        where: { email: user?.email }
      });
      if (verificationRecord) {
        return res.json({
          successful: false,
          message: 'Please verify your email before logging in',
          needsVerification: true,
          email: user.email
        });
      }
    }

    const tokens = jwTokens(user[`${role}_id`], user.name, role);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      maxAge: checked ? 14 * 24 * 60 * 60 * 1000 : undefined,
    });

    return res.json({
      successful: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      user: {
        id: user[`${role}_id`],
        name: user.name,
        role: role
      }
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/refresh_token', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.json(false);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (error, user) => {
      if (error) return res.status(403).json({ error: error.message });

      const { id, name, role } = user;

      const idKey = `${role}_id`;
      const payload = {
        [idKey]: id,
        name,
        role
      };


      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: '15m',
      });

      res.json({ accessToken, user: { id: id, name: name, role: role } });
    });
  } catch (err) {
    console.error(err.message);
    return res.json(false);
  }
});

router.delete('/delete_token', (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
    });

    return res.status(200).json({ message: 'Refresh token deleted' });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;