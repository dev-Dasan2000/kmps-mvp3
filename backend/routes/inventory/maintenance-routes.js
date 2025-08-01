import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all maintenance records with related equipment
router.get('/',  /*authenticateToken,*/ async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany({
      include: {
        equipment: true,
      },
    });
    res.json(maintenances);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
});

// GET single maintenance record by id with equipment
router.get('/:maintenance_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const maintenanceId = Number(req.params.maintenance_id);
    const maintenance = await prisma.maintenance.findUnique({
      where: { maintenance_id: maintenanceId },
      include: {
        equipment: true,
      },
    });
    if (!maintenance) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance record' });
  }
});

// POST create new maintenance record
router.post('/',  /*authenticateToken,*/async (req, res) => {
  try {
    const {
      equipment_id,
      maintain_type,
      maintenance_date,
      description,
      performed_by,
      cost,
      next_maintenance_date,
      notes,
    } = req.body;

    const newMaintenance = await prisma.maintenance.create({
      data: {
        equipment_id,
        maintain_type,
        maintenance_date,
        description,
        performed_by,
        cost,
        next_maintenance_date,
        notes,
      },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "maintenance",
        event: "create",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(201).json(newMaintenance);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Failed to create maintenance record' });
  }
});

// PUT update maintenance record by id
router.put('/:maintenance_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const maintenanceId = Number(req.params.maintenance_id);
    const data = { ...req.body };

    const updatedMaintenance = await prisma.maintenance.update({
      where: { maintenance_id: maintenanceId },
      data,
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "maintenance",
        event: "edit",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.status(202).json(updatedMaintenance);
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
});

// DELETE maintenance record by id
router.delete('/:maintenance_id',  /*authenticateToken,*/ async (req, res) => {
  try {
    const maintenanceId = Number(req.params.maintenance_id);
    await prisma.maintenance.delete({
      where: { maintenance_id: maintenanceId },
    });

    const now = new Date();
    const actres = await prisma.activity_log.create({
      data: {
        subject: "maintenance",
        event: "delete",
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
      }
    });

    res.json({ message: 'Maintenance record deleted' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ error: 'Failed to delete maintenance record' });
  }
});

export default router;
