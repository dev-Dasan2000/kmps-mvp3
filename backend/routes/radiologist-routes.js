import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendAccountCreationNotice } from '../utils/mailer.js';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();
const SALT_ROUNDS = 10;

// Get all radiologists
router.get('/',  authenticateToken,  async (req, res) => {
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

// Update radiologist signature
router.put('/:radiologist_id/signature', authenticateToken, async (req, res) => {
  try {
    const radiologistId = req.params.radiologist_id;
    const { signatureUrl } = req.body;

    if (!signatureUrl) {
      return res.status(400).json({ error: 'Signature URL is required' });
    }

    // Check if radiologist exists
    const radiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });

    if (!radiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // Update the radiologist's signature
    const updatedRadiologist = await prisma.radiologists.update({
      where: { radiologist_id: radiologistId },
      data: { signature: signatureUrl },
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        signature: true
      }
    });

    res.json({
      message: 'Signature updated successfully',
      radiologist: updatedRadiologist
    });
  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({ error: 'Failed to update signature' });
  }
});

// Get radiologist by ID
router.get('/:radiologist_id',  authenticateToken,  async (req, res) => {
  try {
    const radiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: req.params.radiologist_id },
      select: {
        radiologist_id: true,
        name: true,
        email: true,
        phone_number: true,
        profile_picture: true,
        signature: true
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

// Get the 10 most recent studies for a radiologist
router.get('/:radiologist_id/recent-studies',  authenticateToken,  async (req, res) => {
  try {
    const radiologistId = req.params.radiologist_id;

    //if radiologist exists
    const existingRadiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });
    
    if (!existingRadiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // Get the 10 most recent studies for the radiologist with report details
    const recentStudies = await prisma.study.findMany({
      where: { 
        radiologist_id: radiologistId 
      },
      include: {
        patient: {
          select: {
            name: true
          }
        },
        report: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });

    // Format the response
    const formattedStudies = recentStudies.map(study => ({
      study_id: study.study_id,
      patient_id: study.patient_id,
      patient_name: study.patient.name,
      date: study.date,
      modality: study.modality,
      source: study.source,
      description: study.description,
      report: study.report ? {
        status: study.report.status || null
      } : null
    }));

    res.json(formattedStudies);
  } catch (error) {
    console.error('Error fetching recent studies for radiologist:', error);
    res.status(500).json({ error: 'Failed to fetch recent studies' });
  }
});

// Get counts of studies by report status for a radiologist
router.get('/:radiologist_id/study-counts',  authenticateToken,  async (req, res) => {
  try {
    const radiologistId = req.params.radiologist_id;

    // Check if radiologist exists
    const existingRadiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });
    
    if (!existingRadiologist) {
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // Get all studies assigned to the radiologist
    const studies = await prisma.study.findMany({
      where: { 
        radiologist_id: radiologistId 
      },
      include: {
        report: true
      }
    });

    // Count studies by report status
    const counts = {
      notReported: 0,   
      draft: 0,         
      finalized: 0 
    };

    studies.forEach(study => {
      if (!study.report_id) {
        counts.notReported++;
      } else if (study.report && study.report.status === 'draft') {
        counts.draft++;
      } else if (study.report && study.report.status === 'finalized') {
        counts.finalized++;
      }
    });

    res.json(counts);
  } catch (error) {
    console.error('Error fetching study counts for radiologist:', error);
    res.status(500).json({ error: 'Failed to fetch study counts' });
  }
});

// Create new radiologist
router.post('/',  async (req, res) => {
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
router.put('/:radiologist_id',  authenticateToken,  async (req, res) => {
  try {
    const { name, email, password, phone_number, profile_picture, signature } = req.body;
    const radiologistId = req.params.radiologist_id;

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
      profile_picture: profile_picture ?? existingRadiologist.profile_picture,
      signature: signature ?? existingRadiologist.signature
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

router.put('/change-password/:radiologist_id', authenticateToken, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const data = { ...rest };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      data.password = hashedPassword;
    }

    const updatedLab = await prisma.lab.update({
      where: { radiologist_id: req.params.radiologist_id },
      data,
    });

    res.status(202).json(updatedLab);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

// Delete radiologist
router.delete('/:radiologist_id',  authenticateToken,  async (req, res) => {
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