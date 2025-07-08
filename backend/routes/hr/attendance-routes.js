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

// Get today's attendance for all employees
router.get('/today', async (req, res) => {
  try {
    // Get current date boundaries
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Get all employees
    const employees = await prisma.employees.findMany();
    
    // Get today's attendance records
    const attendance = await prisma.employee_atd.findMany({
      where: {
        clock_in: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });
    
    // Process attendance data
    const attendanceByEmployee = {};
    attendance.forEach(record => {
      attendanceByEmployee[record.eid] = record;
    });
    
    // Format response
    const todayAttendance = employees.map(employee => {
      const record = attendanceByEmployee[employee.eid];
      
      return {
        eid: employee.eid,
        name: employee.name,
        clock_in: record ? formatTimeOnly(record.clock_in) : null,
        clock_out: record?.clock_out ? formatTimeOnly(record.clock_out) : null,
        date: formatDateOnly(today),
        present: !!record
      };
    });
    
    // Calculate stats
    const stats = {
      present: todayAttendance.filter(e => e.present).length,
      absent: todayAttendance.filter(e => !e.present).length,
      total: todayAttendance.length
    };
    
    res.json({
      date: formatDateOnly(today),
      records: todayAttendance,
      stats
    });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee attendance for current month
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
router.get('/total/:eid', async (req, res) => {
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
    
    // Count approved leave days
    const leaves = await prisma.leaves.findMany({
      where: {
        eid: employeeId,
        status: 'Approved'
      }
    });
    
    // Calculate total leave days
    let totalLeaveDays = 0;
    leaves.forEach(leave => {
      const fromDate = new Date(leave.from_date);
      const toDate = new Date(leave.to_date);
      const diffTime = Math.abs(toDate - fromDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      totalLeaveDays += diffDays;
    });

    // Convert BigInt to Number to avoid type mixing issues
    const totalAttendanceDays = attendanceCount[0]?.total_days ? Number(attendanceCount[0].total_days) : 0;
    
    res.json({
      eid: employeeId,
      name: employee.name,
      total_attendance_days: totalAttendanceDays,
      total_leave_days: totalLeaveDays,
      effective_attendance: totalAttendanceDays + totalLeaveDays
    });
  } catch (error) {
    console.error('Error calculating total attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance with leave information for all employees
router.get('/with-leaves/:eid', async (req, res) => {
  try {
    // Get all employees with their attendance
    const employees = await prisma.employees.findMany({
      include: {
        attendance: true,
        leaves: {
          where: {
            status: 'Approved'
          }
        }
      }
    });

    // Format the attendance data with leave information
    const attendanceWithLeaves = employees.map(employee => {
      // Calculate total attendance days
      const uniqueDates = new Set();
      employee.attendance.forEach(record => {
        uniqueDates.add(formatDateOnly(record.clock_in));
      });
      
      // Calculate total leave days
      let totalLeaveDays = 0;
      const leaveDetails = employee.leaves.map(leave => {
        const fromDate = new Date(leave.from_date);
        const toDate = new Date(leave.to_date);
        const diffTime = Math.abs(toDate - fromDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
        totalLeaveDays += diffDays;
        
        return {
          from_date: formatDateOnly(leave.from_date),
          to_date: formatDateOnly(leave.to_date),
          type: leave.type,
          days: diffDays
        };
      });

      return {
        eid: employee.eid,
        name: employee.name,
        total_days_present: uniqueDates.size,
        total_leave_days: totalLeaveDays,
        effective_attendance: uniqueDates.size + totalLeaveDays,
        leaves: leaveDetails
      };
    });

    res.json(attendanceWithLeaves);
  } catch (error) {
    console.error('Error fetching attendance with leaves:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get weekly attendance for all employees
router.get('/weekly/all', async (req, res) => {
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

    // Get all employees with their attendance and leaves for the week
    const employees = await prisma.employees.findMany({
      include: {
        attendance: {
          where: {
            clock_in: {
              gte: firstDayOfWeek,
              lte: lastDayOfWeek
            }
          }
        },
        leaves: {
          where: {
            status: 'Approved',
            OR: [
              { // Leave starts within the week
                from_date: {
                  gte: firstDayOfWeek,
                  lte: lastDayOfWeek
                }
              },
              { // Leave ends within the week
                to_date: {
                  gte: firstDayOfWeek,
                  lte: lastDayOfWeek
                }
              },
              { // Leave spans over the entire week
                AND: [
                  { from_date: { lte: firstDayOfWeek } },
                  { to_date: { gte: lastDayOfWeek } }
                ]
              }
            ]
          }
        }
      }
    });

    // Format the weekly attendance data
    const weeklyAttendance = employees.map(employee => {
      // Group attendance by days
      const attendanceByDay = {};
      
      // Initialize days of week
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.forEach(day => {
        attendanceByDay[day] = {
          attendance: [],
          leave: false,
          leave_type: null
        };
      });

      // Populate attendance for each day
      employee.attendance.forEach(record => {
        const recordDate = new Date(record.clock_in);
        const dayOfWeek = days[recordDate.getDay()];
        
        attendanceByDay[dayOfWeek].attendance.push({
          clock_in: formatTimeOnly(record.clock_in),
          clock_out: formatTimeOnly(record.clock_out)
        });
      });
      
      // Process leave information for each day of the week
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        weekDates.push(date);
      }
      
      // Mark days with approved leaves
      employee.leaves.forEach(leave => {
        const leaveStart = new Date(leave.from_date);
        const leaveEnd = new Date(leave.to_date);
        
        weekDates.forEach((date, index) => {
          if (date >= leaveStart && date <= leaveEnd) {
            const dayOfWeek = days[index];
            attendanceByDay[dayOfWeek].leave = true;
            attendanceByDay[dayOfWeek].leave_type = leave.type;
          }
        });
      });
      
      // Count effective days present (including leave days)
      const daysPresent = days.filter(day => attendanceByDay[day].attendance.length > 0).length;
      const daysOnLeave = days.filter(day => attendanceByDay[day].leave && attendanceByDay[day].attendance.length === 0).length;
      
      return {
        eid: employee.eid,
        name: employee.name,
        weekly_attendance: attendanceByDay,
        total_days_present: daysPresent,
        total_days_on_leave: daysOnLeave,
        effective_attendance: daysPresent + daysOnLeave,
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
router.post('/clock-in', async (req, res) => {
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
router.post('/clock-out', async (req, res) => {
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
