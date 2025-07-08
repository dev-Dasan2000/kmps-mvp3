import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all payroll records
router.get('/payroll', async (req, res) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true,
            employment_status: true
          }
        }
      }
    });
    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single payroll record
router.get('/payroll/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await prisma.payroll.findUnique({
      where: { payroll_id: parseInt(id) },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true,
            employment_status: true
          }
        }
      }
    });

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    res.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payroll records for a specific employee
router.get('/employees/:eid/payroll', async (req, res) => {
  try {
    const { eid } = req.params;
    
    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(eid) }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const payrolls = await prisma.payroll.findMany({
      where: { eid: parseInt(eid) },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true,
            employment_status: true
          }
        }
      }
    });
    
    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching employee payroll records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new payroll record
router.post('/payroll', async (req, res) => {
  try {
    const { eid, net_salary, epf, etf, status } = req.body;
    
    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: parseInt(eid) }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Validate required fields
    if (net_salary === undefined || epf === undefined || etf === undefined || !status) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        eid: parseInt(eid),
        net_salary: parseFloat(net_salary),
        epf: Boolean(epf),
        etf: Boolean(etf),
        status
      }
    });
    
    res.status(201).json(payroll);
  } catch (error) {
    console.error('Error creating payroll record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a payroll record
router.put('/payroll/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { net_salary, epf, etf, status } = req.body;
    
    // Check if payroll record exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { payroll_id: parseInt(id) }
    });
    
    if (!existingPayroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Update payroll record
    const updatedPayroll = await prisma.payroll.update({
      where: { payroll_id: parseInt(id) },
      data: {
        net_salary: net_salary !== undefined ? parseFloat(net_salary) : undefined,
        epf: epf !== undefined ? Boolean(epf) : undefined,
        etf: etf !== undefined ? Boolean(etf) : undefined,
        status
      }
    });
    
    res.json(updatedPayroll);
  } catch (error) {
    console.error('Error updating payroll record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a payroll record
router.delete('/payroll/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payroll record exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { payroll_id: parseInt(id) }
    });
    
    if (!existingPayroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    
    // Delete payroll record
    await prisma.payroll.delete({
      where: { payroll_id: parseInt(id) }
    });
    
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
