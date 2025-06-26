import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all dentist assignments
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const assignments = await prisma.DentistAssign.findMany({
      include: {
        study: true,
        dentist: true
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching dentist assignments:', error);
    res.status(500).json({ error: 'Failed to fetch dentist assignments' });
  }
});

// Get assignments by study ID
router.get('/study/:study_id', /* authenticateToken, */ async (req, res) => {
  try {
    const assignments = await prisma.DentistAssign.findMany({
      where: { study_id: parseInt(req.params.study_id) },
      include: {
        dentist: true
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching dentist assignments for study:', error);
    res.status(500).json({ error: 'Failed to fetch dentist assignments for study' });
  }
});

// Get assignments by dentist ID
router.get('/dentist/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const assignments = await prisma.DentistAssign.findMany({
      where: { dentist_id: req.params.dentist_id },
      include: {
        study: true
      }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments for dentist:', error);
    res.status(500).json({ error: 'Failed to fetch assignments for dentist' });
  }
});

// Create a new dentist assignment
router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const { study_id, dentist_id } = req.body;
    
    // Check if the assignment already exists
    const existingAssignment = await prisma.DentistAssign.findUnique({
      where: {
        study_id_dentist_id: {
          study_id: parseInt(study_id),
          dentist_id: dentist_id
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Dentist is already assigned to this study' });
    }

    const newAssignment = await prisma.DentistAssign.create({
      data: {
        study_id: parseInt(study_id),
        dentist_id: dentist_id
      },
      include: {
        study: true,
        dentist: true
      }
    });
    
    res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating dentist assignment:', error);
    res.status(500).json({ 
      error: 'Failed to create dentist assignment',
      details: error.message 
    });
  }
});

// Delete a dentist assignment
router.delete('/:study_id/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { study_id, dentist_id } = req.params;

    // Check if assignment exists
    const existingAssignment = await prisma.DentistAssign.findUnique({
      where: {
        study_id_dentist_id: {
          study_id: parseInt(study_id),
          dentist_id: dentist_id
        }
      }
    });
    
    if (!existingAssignment) {
      return res.status(404).json({ error: 'Dentist assignment not found' });
    }

    await prisma.DentistAssign.delete({
      where: {
        study_id_dentist_id: {
          study_id: parseInt(study_id),
          dentist_id: dentist_id
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting dentist assignment:', error);
    res.status(500).json({ 
      error: 'Failed to delete dentist assignment',
      details: error.message 
    });
  }
});

export default router;
