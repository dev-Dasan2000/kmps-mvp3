import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js'

const prisma = new PrismaClient();
const router = express.Router();

// GET all equipments with related equipment_category and maintenances
router.get('/', authenticateToken, async (req, res) => {
  try {
    const equipments = await prisma.equipment.findMany({
      include: {
        equipment_category: true,
        maintenances: true,
      },
    });
    res.json(equipments);
  } catch (error) {
    console.error('Error fetching equipments:', error);
    res.status(500).json({ error: 'Failed to fetch equipments' });
  }
});

// GET single equipment by id with relations
router.get('/:equipment_id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = Number(req.params.equipment_id);
    const equipment = await prisma.equipment.findUnique({
      where: { equipment_id: equipmentId },
      include: {
        equipment_category: true,
        maintenances: true,
      },
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// POST create new equipment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      equipment_name,
      equipment_category_id,
      brand,
      model,
      serial_number,
      purchase_date,
      purchase_price,
      location,
      warranty_start_date,
      warranty_end_date,
      status,
      notes,
    } = req.body;

    const newEquipment = await prisma.equipment.create({
      data: {
        equipment_name,
        equipment_category_id,
        brand,
        model,
        serial_number,
        purchase_date,
        purchase_price,
        location,
        warranty_start_date,
        warranty_end_date,
        status,
        notes,
      },
    });

    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// PUT update equipment by id
router.put('/:equipment_id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = Number(req.params.equipment_id);
    const data = { ...req.body };

    const updatedEquipment = await prisma.equipment.update({
      where: { equipment_id: equipmentId },
      data,
    });

    res.status(202).json(updatedEquipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// DELETE equipment by id
router.delete('/:equipment_id', authenticateToken, async (req, res) => {
  try {
    const equipmentId = Number(req.params.equipment_id);
    await prisma.equipment.delete({
      where: { equipment_id: equipmentId },
    });
    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

export default router;
