import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
// import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

// Get all radiologists
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const radiologists = await prisma.radiologists.findMany({
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        phone_number: true,
        profile_picture: true
      }
    });
    res.json(radiologists);
  } catch (error) {
    console.error('Error fetching radiologists:', error);
    res.status(500).json({ error: 'Failed to fetch radiologists' });
  }
});

// Get radiologist by ID
router.get('/:radiologist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const radiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: req.params.radiologist_id },
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        phone_number: true,
        profile_picture: true
      }
    });
    
    if (!radiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }
    
    res.json(radiologist);
  } catch (error) {
    console.error('Error fetching radiologist:', error);
    res.status(500).json({ error: 'Failed to fetch radiologist' });
  }
});

// Create new radiologist
router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { name, email, password, phone_number, profile_picture } = req.body;

    // Check if email already exists
    const existingRadiologist = await prisma.radiologists.findUnique({
      where: { email }
    });
    
    if (existingRadiologist) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Generate unique radiologist_id: knrsradio001, knrsradio002, ...
    let suffix = 1;
    let new_radiologist_id;
    let isUnique = false;

    while (!isUnique) {
      new_radiologist_id = `knrsradio${suffix.toString().padStart(3, '0')}`;
      const existingId = await prisma.radiologists.findUnique({
        where: { radiologist_id: new_radiologist_id }
      });
      if (!existingId) {
        isUnique = true;
      } else {
        suffix++;
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newRadiologist = await prisma.radiologists.create({
      data: {
        radiologist_id: new_radiologist_id,
        name,
        email,
        password: hashedPassword,
        phone_number,
        profile_picture
      },
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        phone_number: true,
        profile_picture: true
      }
    });

    sendAccountCreationNotice(email, new_radiologist_id);
    res.status(201).json(newRadiologist);
  } catch (error) {
    console.error('Error creating radiologist:', error);
    res.status(500).json({ error: 'Failed to create radiologist' });
  }
});


// Update radiologist
router.put('/:radiologist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { name, email, password, phone_number, profile_picture } = req.body;
    const radiologistId = parseInt(req.params.radiologist_id);

    // Check if radiologist exists
    const existingRadiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });
    
    if (!existingRadiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // Check if email is being updated and already exists
    if (email && email !== existingRadiologist.email) {
      const emailExists = await prisma.radiologists.findUnique({
        where: { email }
      });
      
      if (emailExists) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {
      name: name ?? existingRadiologist.name,
      email: email ?? existingRadiologist.email,
      phone_number: phone_number ?? existingRadiologist.phone_number,
      profile_picture: profile_picture ?? existingRadiologist.profile_picture
    };

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const updatedRadiologist = await prisma.radiologists.update({
      where: { radiologist_id: radiologistId },
      data: updateData,
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        phone_number: true,
        profile_picture: true
      }
    });

    res.json(updatedRadiologist);
  } catch (error) {
    console.error('Error updating radiologist:', error);
    res.status(500).json({ error: 'Failed to update radiologist' });
  }
});

// Delete radiologist
router.delete('/:radiologist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const radiologistId = req.params.radiologist_id;

    // Check if radiologist exists
    const existingRadiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });
    
    if (!existingRadiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // Check if radiologist has assigned studies
    const assignedStudies = await prisma.study.findMany({
      where: { radiologist_id: radiologistId }
    });
    
    if (assignedStudies.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete radiologist with assigned studies. Reassign or delete studies first.' 
      });
    }

    await prisma.radiologists.delete({
      where: { radiologist_id: radiologistId }
    });

    res.json({ message: 'Radiologist deleted successfully' });
  } catch (error) {
    console.error('Error deleting radiologist:', error);
    res.status(500).json({ error: 'Failed to delete radiologist' });
  }
});

export default router;