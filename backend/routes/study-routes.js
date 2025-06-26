import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all studies
router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const studies = await prisma.study.findMany({
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      }
    });
    res.json(studies);
  } catch (error) {
    console.error('Error fetching studies:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
});

// Get a single study by ID
router.get('/:study_id', /* authenticateToken, */ async (req, res) => {
  try {
    const study = await prisma.study.findUnique({
      where: { study_id: parseInt(req.params.study_id) },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      }
    });

    if (!study) {
      return res.status(404).json({ error: 'Study not found' });
    }

    res.json(study);
  } catch (error) {
    console.error('Error fetching study:', error);
    res.status(500).json({ error: 'Failed to fetch study' });
  }
});

// Get studies by patient ID
router.get('/patient/:patient_id', /* authenticateToken, */ async (req, res) => {
  console.debug("route called");
  console.debug(req.params.patient_id);
  try {
    const studies = await prisma.study.findMany({
      where: { patient_id: req.params.patient_id },
      include: {
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });
    console.debug(studies);
    res.json(studies);
  } catch (error) {
    console.error('Error fetching patient studies:', error);
    res.status(500).json({ error: 'Failed to fetch patient studies' });
  }
});

// Get studies by dentist ID
router.get('/dentist/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const studies = await prisma.study.findMany({
      where: {
        dentistAssigns: {
          some: {
            dentist_id: req.params.dentist_id
          }
        }
      },
      include: {
        patient: true,
        radiologist: true,
        report: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    res.json(studies);
  } catch (error) {
    console.error('Error fetching dentist studies:', error);
    res.status(500).json({ error: 'Failed to fetch dentist studies' });
  }
});

// Create a new study
router.post('/', /* authenticateToken, */ async (req, res) => {
  try {
    const data = { ...req.body };
    console.debug(data);
    const newStudy = await prisma.study.create({
      data,
      include: {
        patient: true,
        radiologist: true,
        report: true
      }
    });

    res.status(201).json(newStudy);
  } catch (error) {
    console.error('Error creating study:', error);
    res.status(500).json({ error: 'Failed to create study', details: error.message });
  }
});

// Update a study
router.put('/:study_id', /* authenticateToken, */ async (req, res) => {
  try {
    const studyId = parseInt(req.params.study_id);
    console.debug("put method called");
    console.debug(req.body);
    // Extract custom assignment fields
    const { radiologist_id, doctor_ids, ...rest } = req.body;

    // Build Prisma-compatible update payload
    /** @type {import('@prisma/client').Prisma.studyUpdateInput} */
    const updateData = { ...rest };

    // Handle radiologist assignment (nullable)
    if (radiologist_id !== undefined) {
      if (radiologist_id === null || radiologist_id === '') {
        updateData.radiologist = { disconnect: true };
      } else {
        updateData.radiologist = {
          connect: { radiologist_id } // ✅ no conversion
        };
      }
    }

    // Handle dentists assignment through junction table DentistAssign
    if (Array.isArray(doctor_ids)) {
      if (doctor_ids.length === 0) {
        // User cleared all dentists
        updateData.dentistAssigns = { deleteMany: {} };
      } else {
        // Replace existing dentists with provided list
        updateData.dentistAssigns = {
          deleteMany: {},
          create: doctor_ids.map((dentistId) => ({
            dentist: { connect: { dentist_id: dentistId.toString() } }
          }))
        };
      }
    }

    // Update study
    const updatedStudy = await prisma.study.update({
      where: { study_id: studyId },
      data: updateData,
      include: {
        radiologist: true,
        dentistAssigns: {
          include: {
            dentist: true
          }
        }
      }
    });
    console.debug("Updated successfully");
    res.json(updatedStudy);
  } catch (error) {
    console.error('Error updating study:', error);
    res.status(500).json({ error: 'Failed to update study', details: error.message });
  }
});

// Delete a study
router.delete('/:study_id', /* authenticateToken, */ async (req, res) => {
  try {
    const studyId = parseInt(req.params.study_id);

    // Check if study exists
    const existingStudy = await prisma.study.findUnique({
      where: { study_id: studyId }
    });

    if (!existingStudy) {
      return res.status(404).json({ error: 'Study not found' });
    }

    await prisma.study.delete({
      where: { study_id: studyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting study:', error);
    res.status(500).json({ error: 'Failed to delete study', details: error.message });
  }
});

// Get count of today's studies
router.get('/today/count', async (req, res) => {
  try {
    const now = new Date();
    // Get UTC year/month/day:
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();   // 0-based
    const day = now.getUTCDate();

    // UTC midnight for today and tomorrow:
    const startUtc = new Date(Date.UTC(year, month, day));         // e.g. 2025-06-22T00:00:00.000Z
    const endUtc = new Date(Date.UTC(year, month, day + 1));     // next UTC midnight

    const count = await prisma.study.count({
      where: {
        date: {
          gte: startUtc,
          lt: endUtc
        }
      }
    });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching today's study count:", error);
    res.status(500).json({ error: "Failed to fetch today's study count", details: error.message });
  }
});



export default router;