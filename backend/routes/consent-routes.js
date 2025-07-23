import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/authentication.js';

const prisma = new PrismaClient();
const router = express.Router();

// Get all consent forms
router.get('/',  authenticateToken,  async (req, res) => {
  try {
    const consentForms = await prisma.consent_form.findMany({
      include: {
        patient: true,
        dentist: true
      }
    });
    res.json(consentForms);
  } catch (error) {
    console.error('Error fetching consent forms:', error);
    res.status(500).json({ error: 'Failed to fetch consent forms' });
  }
});

// Get consent forms by patient ID
router.get('/patient/:patient_id',  authenticateToken,  async (req, res) => {
  try {
    const { patient_id } = req.params;
    const consentForms = await prisma.consent_form.findMany({
      where: {
        patient_id: patient_id
      },
      include: {
        dentist: true
      }
    });
    res.json(consentForms);
  } catch (error) {
    console.error('Error fetching consent forms for patient:', error);
    res.status(500).json({ error: 'Failed to fetch consent forms for patient' });
  }
});

// Get consent forms by dentist ID
router.get('/dentist/:dentist_id',  authenticateToken,  async (req, res) => {
  try {
    const { dentist_id } = req.params;
    const consentForms = await prisma.consent_form.findMany({
      where: {
        dentist_id: dentist_id
      },
      include: {
        patient: true
      }
    });
    res.json(consentForms);
  } catch (error) {
    console.error('Error fetching consent forms for dentist:', error);
    res.status(500).json({ error: 'Failed to fetch consent forms for dentist' });
  }
});

// Get a specific consent form by ID
router.get('/:form_id',  authenticateToken,  async (req, res) => {
  try {
    const { form_id } = req.params;
    const consentForm = await prisma.consent_form.findUnique({
      where: {
        form_id: Number(form_id)
      },
      include: {
        patient: true,
        dentist: true
      }
    });
    
    if (!consentForm) {
      return res.status(404).json({ error: 'Consent form not found' });
    }
    
    res.json(consentForm);
  } catch (error) {
    console.error('Error fetching consent form:', error);
    res.status(500).json({ error: 'Failed to fetch consent form' });
  }
});

// Create a new consent form
router.post('/',  authenticateToken,  async (req, res) => {
  try {
    const { 
      patient_id, 
      dentist_id, 
      procedure_details, 
      explanation_given,
      status
    } = req.body;
    
    // Validate required fields
    if (!patient_id || !dentist_id) {
      return res.status(400).json({ error: 'Patient ID and Dentist ID are required' });
    }
    
    const created_date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const consentForm = await prisma.consent_form.create({
      data: {
        patient_id,
        dentist_id,
        procedure_details,
        explanation_given,
        status: status || 'pending', // Default status is pending
        created_date,
        signed_date: null // Will be updated when signed
      }
    });
    
    res.status(201).json(consentForm);
  } catch (error) {
    console.error('Error creating consent form:', error);
    res.status(500).json({ error: 'Failed to create consent form' });
  }
});

// Update a consent form
router.put('/:form_id',  authenticateToken,  async (req, res) => {
  try {
    const { form_id } = req.params;
    const { 
      procedure_details, 
      explanation_given, 
      sign, 
      status,
      signed_date
    } = req.body;
    
    // Check if consent form exists
    const existingForm = await prisma.consent_form.findUnique({
      where: {
        form_id: Number(form_id)
      }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Consent form not found' });
    }
    
    // If status is changing to 'signed', set signed_date to today
    let updateData = {
      procedure_details,
      explanation_given,
      sign,
      status
    };
    
    // Only set signed_date if provided or if status is changing to 'signed'
    if (signed_date) {
      updateData.signed_date = signed_date;
    } else if (status === 'signed' && !existingForm.signed_date) {
      updateData.signed_date = new Date().toISOString().split('T')[0];
    }
    
    const updatedForm = await prisma.consent_form.update({
      where: {
        form_id: Number(form_id)
      },
      data: updateData
    });
    
    res.json(updatedForm);
  } catch (error) {
    console.error('Error updating consent form:', error);
    res.status(500).json({ error: 'Failed to update consent form' });
  }
});

// Delete a consent form
router.delete('/:form_id',  authenticateToken,  async (req, res) => {
  try {
    const { form_id } = req.params;
    
    // Check if consent form exists
    const existingForm = await prisma.consent_form.findUnique({
      where: {
        form_id: Number(form_id)
      }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Consent form not found' });
    }
    
    await prisma.consent_form.delete({
      where: {
        form_id: Number(form_id)
      }
    });
    
    res.json({ message: 'Consent form deleted successfully' });
  } catch (error) {
    console.error('Error deleting consent form:', error);
    res.status(500).json({ error: 'Failed to delete consent form' });
  }
});

export default router; 