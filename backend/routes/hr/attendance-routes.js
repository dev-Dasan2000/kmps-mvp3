import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to format time (extract only time part from datetime)
function formatTimeOnly(dateTime) {
  if (!dateTime) return null;
  
  const date = new Date(dateTime);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

// Helper function to format date (extract only date part from datetime)
function formatDateOnly(dateTime) {
  if (!dateTime) return null;
  
  const date = new Date(dateTime);
  return date.toISOString().split('T')[0];
}

// Get employee attendance for current month
router.get('/attendance/:eid', async (req, res) => {
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

    // Get current date
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get attendance for the current month
    const attendance = await prisma.employee_atd.findMany({
      where: {
        eid: employeeId,
        clock_in: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      orderBy: {
        clock_in: 'asc'
      }
    });

    // Format the attendance data
    const formattedAttendance = attendance.map(record => ({
      eid: record.eid,
      name: employee.name,
      date: formatDateOnly(record.clock_in),
      clock_in: formatTimeOnly(record.clock_in),
      clock_out: formatTimeOnly(record.clock_out)
    }));

    res.json(formattedAttendance);
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get total attendance days for an employee
router.get('/attendance/total/:eid', async (req, res) => {
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

    // Count unique days with attendance records
    const attendanceCount = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT DATE(clock_in)) as total_days
      FROM employee_atd
      WHERE eid = ${employeeId}
    `;

    res.json({
      eid: employeeId,
      name: employee.name,
      total_attendance_days: attendanceCount[0]?.total_days || 0
    });
  } catch (error) {
    console.error('Error calculating total attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get weekly attendance for all employees
router.get('/attendance/weekly/all', async (req, res) => {
  try {
    // Calculate date range for the current week (Sunday to Saturday)
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDay);
    firstDayOfWeek.setHours(0, 0, 0, 0);
    
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    // Get all employees with their attendance for the week
    const employees = await prisma.employees.findMany({
      include: {
        attendance: {
          where: {
            clock_in: {
              gte: firstDayOfWeek,
              lte: lastDayOfWeek
            }
          }
        }
      }
    });

    // Format the weekly attendance data
    const weeklyAttendance = employees.map(employee => {
      // Group attendance by days
      const attendanceByDay = {};
      
      // Initialize days of week
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      daysOfWeek.forEach(day => {
        attendanceByDay[day] = {
          present: false,
          clock_in: null,
          clock_out: null
        };
      });
      
      // Fill in attendance data
      employee.attendance.forEach(record => {
        const day = daysOfWeek[new Date(record.clock_in).getDay()];
        attendanceByDay[day] = {
          present: true,
          clock_in: formatTimeOnly(record.clock_in),
          clock_out: formatTimeOnly(record.clock_out)
        };
      });
      
      return {
        eid: employee.eid,
        name: employee.name,
        weekly_attendance: attendanceByDay,
        total_days_present: employee.attendance.length,
        week_range: {
          start: formatDateOnly(firstDayOfWeek),
          end: formatDateOnly(lastDayOfWeek)
        }
      };
    });

    res.json(weeklyAttendance);
  } catch (error) {
    console.error('Error fetching weekly attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record clock in
router.post('/attendance/clock-in', async (req, res) => {
  try {
    const { eid } = req.body;
    const employeeId = parseInt(eid);

    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if already clocked in today without clocking out
    const currentDate = new Date();
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const existingAttendance = await prisma.employee_atd.findMany({
      where: {
        eid: employeeId,
        clock_in: {
          gte: startOfDay
        },
        clock_out: null
      }
    });

    if (existingAttendance.length > 0) {
      return res.status(400).json({ message: 'Employee is already clocked in today' });
    }

    // Record clock in
    const attendance = await prisma.employee_atd.create({
      data: {
        eid: employeeId,
        clock_in: currentDate,
        clock_out: null
      }
    });

    res.status(201).json({
      message: 'Clock in recorded successfully',
      attendance: {
        eid: attendance.eid,
        name: employee.name,
        clock_in: formatTimeOnly(attendance.clock_in),
        date: formatDateOnly(attendance.clock_in)
      }
    });
  } catch (error) {
    console.error('Error recording clock in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Record clock out
router.post('/attendance/clock-out', async (req, res) => {
  try {
    const { eid } = req.body;
    const employeeId = parseInt(eid);

    // Check if employee exists
    const employee = await prisma.employees.findUnique({
      where: { eid: employeeId }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get current date
    const currentDate = new Date();
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Find the latest clock in without clock out
    const latestClockIn = await prisma.employee_atd.findFirst({
      where: {
        eid: employeeId,
        clock_in: {
          gte: startOfDay
        },
        clock_out: null
      },
      orderBy: {
        clock_in: 'desc'
      }
    });

    if (!latestClockIn) {
      return res.status(400).json({ message: 'No active clock in found for today' });
    }

    // Record clock out
    const updatedAttendance = await prisma.employee_atd.update({
      where: {
        eid_clock_in: {
          eid: employeeId,
          clock_in: latestClockIn.clock_in
        }
      },
      data: {
        clock_out: currentDate
      }
    });

    res.json({
      message: 'Clock out recorded successfully',
      attendance: {
        eid: updatedAttendance.eid,
        name: employee.name,
        clock_in: formatTimeOnly(updatedAttendance.clock_in),
        clock_out: formatTimeOnly(updatedAttendance.clock_out),
        date: formatDateOnly(updatedAttendance.clock_in)
      }
    });
  } catch (error) {
    console.error('Error recording clock out:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
