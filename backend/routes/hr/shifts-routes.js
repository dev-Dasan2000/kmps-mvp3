import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all shifts
router.get('', authenticateToken, async (req, res) => {
  try {
    const shifts = await prisma.shifts.findMany({
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true
          }
        }
      }
    });
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single shift
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await prisma.shifts.findUnique({
      where: { shift_id: parseInt(id) },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true
          }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    res.json(shift);
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all shifts for a specific employee
router.get('/employees/shifts/:eid', authenticateToken, async (req, res) => {
  try {
    const { eid } = req.params;
    
    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(eid) }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const shifts = await prisma.shifts.findMany({
      where: { eid: parseInt(eid) },
      orderBy: {
        from_time: 'asc'
      }
    });
    
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee shifts within a date range
router.get('/employees/:eid/shifts/range', authenticateToken, async (req, res) => {
  try {
    const { eid } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate query parameters' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD format' });
    }
    
    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(eid) }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const shifts = await prisma.shifts.findMany({
      where: {
        eid: parseInt(eid),
        from_time: {
          gte: startIso,
        },
        to_time: {
          lte: endIso,
        }
      },
      orderBy: {
        from_time: 'asc'
      }
    });
    
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching employee shifts by date range:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new shift
router.post('', authenticateToken, async (req, res) => {
  try {
    const { eid, from_time, to_time } = req.body;
    
    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(eid) }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Validate required fields
    if (!from_time || !to_time) {
      return res.status(400).json({ message: 'Please provide from_time and to_time' });
    }
    
    // Convert strings to Date objects for validation
    const fromTimeDate = new Date(from_time);
    const toTimeDate = new Date(to_time);

    // Store standardized ISO strings
    const fromIso = fromTimeDate.toISOString();
    const toIso = toTimeDate.toISOString();
    
    // Validate date formats
    if (isNaN(fromTimeDate.getTime()) || isNaN(toTimeDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Validate that to_time is after from_time
    if (toTimeDate <= fromTimeDate) {
      return res.status(400).json({ message: 'to_time must be after from_time' });
    }
    
    // Create shift
    const shift = await prisma.shifts.create({
      data: {
        eid: parseInt(eid),
        from_time: fromIso,
        to_time: toIso
      }
    });
    
    res.status(201).json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a shift
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { from_time, to_time } = req.body;
    
    // Check if shift exists
    const existingShift = await prisma.shifts.findUnique({
      where: { shift_id: parseInt(id) }
    });
    
    if (!existingShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    let fromTimeDate = new Date(existingShift.from_time);
    let toTimeDate = new Date(existingShift.to_time);
    
    // Update time values if provided
    if (from_time) {
      const parsed = new Date(from_time);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid from_time format' });
      }
      fromTimeDate = parsed;
    }
    
    if (to_time) {
      const parsed = new Date(to_time);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid to_time format' });
      }
      toTimeDate = parsed;
    }
    
    // Validate that to_time is after from_time
    if (toTimeDate <= fromTimeDate) {
      return res.status(400).json({ message: 'to_time must be after from_time' });
    }
    
    // Update shift
    const updatedShift = await prisma.shifts.update({
      where: { shift_id: parseInt(id) },
      data: {
        from_time: fromTimeDate.toISOString(),
        to_time: toTimeDate.toISOString()
      }
    });
    
    res.json(updatedShift);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a shift
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if shift exists
    const existingShift = await prisma.shifts.findUnique({
      where: { shift_id: parseInt(id) }
    });
    
    if (!existingShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Delete shift
    await prisma.shifts.delete({
      where: { shift_id: parseInt(id) }
    });
    
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
