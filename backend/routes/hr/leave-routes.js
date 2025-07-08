import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to format date (extract only date part from datetime)
function formatDateOnly(dateTime) {
  if (!dateTime) return null;
  
  const date = new Date(dateTime);
  return date.toISOString().split('T')[0];
}

// Get all leave requests
router.get('/', async (req, res) => {
  try {
    const leaves = await prisma.leaves.findMany({
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            job_title: true,
            employment_status: true
          }
        }
      },
      orderBy: {
        from_date: 'desc'
      }
    });

    const formattedLeaves = leaves.map(leave => ({
      eid: leave.eid,
      employee_name: leave.employee.name,
      from_date: formatDateOnly(leave.from_date),
      to_date: formatDateOnly(leave.to_date),
      type: leave.type,
      status: leave.status,
      job_title: leave.employee.job_title,
      employment_status: leave.employee.employment_status
    }));

    res.json(formattedLeaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leaves for a specific employee
router.get('/:eid', async (req, res) => {
  try {
    const { eid } = req.params;
    const employeeId = parseInt(eid);

    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const leaves = await prisma.leaves.findMany({
      where: {
        eid: employeeId
      },
      orderBy: {
        from_date: 'desc'
      }
    });

    const formattedLeaves = leaves.map(leave => ({
      eid: leave.eid,
      employee_name: employee.name,
      from_date: formatDateOnly(leave.from_date),
      to_date: formatDateOnly(leave.to_date),
      type: leave.type,
      status: leave.status,
      duration: calculateLeaveDuration(leave.from_date, leave.to_date)
    }));

    res.json(formattedLeaves);
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate leave duration in days
function calculateLeaveDuration(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
}

// Get today's leaves for all employees
router.get('/today/all', async (req, res) => {
  try {
    // Get current date
    const today = new Date();
    const formattedToday = formatDateOnly(today);
    
    // Find all approved leaves that include today's date
    const leaves = await prisma.leaves.findMany({
      where: {
        status: 'Approved',
        AND: [
          { from_date: { lte: today } },
          { to_date: { gte: today } }
        ]
      },
      include: {
        employee: true
      }
    });
    
    // Format the response
    const formattedLeaves = leaves.map(leave => ({
      eid: leave.eid,
      employee_name: leave.employee.name,
      from_date: formatDateOnly(leave.from_date),
      to_date: formatDateOnly(leave.to_date),
      type: leave.type,
      status: leave.status,
      duration: calculateLeaveDuration(leave.from_date, leave.to_date)
    }));
    
    // Calculate stats
    const stats = {
      on_leave: leaves.length,
      by_type: {}
    };
    
    // Count by leave type
    leaves.forEach(leave => {
      if (!stats.by_type[leave.type]) {
        stats.by_type[leave.type] = 0;
      }
      stats.by_type[leave.type]++;
    });
    
    res.json({
      date: formattedToday,
      records: formattedLeaves,
      stats
    });
  } catch (error) {
    console.error('Error fetching today\'s leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply for leave
router.post('/', async (req, res) => {
  try {
    const { eid, from_date, to_date, type } = req.body;
    const employeeId = parseInt(eid);

    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate required fields
    if (!from_date || !to_date || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate dates
    const fromDateObj = new Date(from_date);
    const toDateObj = new Date(to_date);

    if (toDateObj < fromDateObj) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    // Check for overlapping leave requests
    const overlappingLeaves = await prisma.leaves.findMany({
      where: {
        eid: employeeId,
        OR: [
          {
            // Existing leave start date falls within the new leave period
            from_date: {
              gte: fromDateObj,
              lte: toDateObj
            }
          },
          {
            // Existing leave end date falls within the new leave period
            to_date: {
              gte: fromDateObj,
              lte: toDateObj
            }
          },
          {
            // New leave period falls entirely within an existing leave
            AND: [
              {
                from_date: {
                  lte: fromDateObj
                }
              },
              {
                to_date: {
                  gte: toDateObj
                }
              }
            ]
          }
        ],
        status: {
          in: ['Pending', 'Approved']
        }
      }
    });

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({ 
        message: 'Leave request overlaps with existing leave',
        overlapping_leaves: overlappingLeaves 
      });
    }

    // Create leave request
    const leave = await prisma.leaves.create({
      data: {
        eid: employeeId,
        from_date: fromDateObj,
        to_date: toDateObj,
        type,
        status: 'Pending' // Default status
      }
    });

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave: {
        ...leave,
        from_date: formatDateOnly(leave.from_date),
        to_date: formatDateOnly(leave.to_date)
      }
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update leave status (approve/reject)
router.put('/:eid/:fromDate/:toDate/status', async (req, res) => {
  try {
    const { eid, fromDate, toDate } = req.params;
    const { status } = req.body;
    const employeeId = parseInt(eid);

    // Validate status
    if (!status || !['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Status must be one of: Approved, Rejected, Cancelled' 
      });
    }

    // Check if leave exists
    const leave = await prisma.leaves.findUnique({
      where: {
        eid_from_date_to_date: {
          eid: employeeId,
          from_date: new Date(fromDate),
          to_date: new Date(toDate)
        }
      }
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Update leave status
    const updatedLeave = await prisma.leaves.update({
      where: {
        eid_from_date_to_date: {
          eid: employeeId,
          from_date: new Date(fromDate),
          to_date: new Date(toDate)
        }
      },
      data: {
        status
      }
    });

    res.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave: {
        ...updatedLeave,
        from_date: formatDateOnly(updatedLeave.from_date),
        to_date: formatDateOnly(updatedLeave.to_date)
      }
    });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a leave request
router.delete('/:eid/:fromDate/:toDate', async (req, res) => {
  try {
    const { eid, fromDate, toDate } = req.params;
    const employeeId = parseInt(eid);

    // Check if leave exists
    const leave = await prisma.leaves.findUnique({
      where: {
        eid_from_date_to_date: {
          eid: employeeId,
          from_date: new Date(fromDate),
          to_date: new Date(toDate)
        }
      }
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Delete leave request
    await prisma.leaves.delete({
      where: {
        eid_from_date_to_date: {
          eid: employeeId,
          from_date: new Date(fromDate),
          to_date: new Date(toDate)
        }
      }
    });

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leave summary for an employee (total leaves by type)
router.get('/summary/:eid', async (req, res) => {
  try {
    const { eid } = req.params;
    const employeeId = parseInt(eid);

    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get all approved leaves for this employee
    const leaves = await prisma.leaves.findMany({
      where: {
        eid: employeeId,
        status: 'Approved'
      }
    });

    // Calculate summary by leave type
    const summary = {};
    leaves.forEach(leave => {
      const days = calculateLeaveDuration(leave.from_date, leave.to_date);
      
      if (!summary[leave.type]) {
        summary[leave.type] = {
          total_days: 0,
          count: 0
        };
      }
      
      summary[leave.type].total_days += days;
      summary[leave.type].count += 1;
    });

    res.json({
      eid: employeeId,
      name: employee.name,
      summary
    });
  } catch (error) {
    console.error('Error fetching leave summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
