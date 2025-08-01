import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/authentication.js';

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

// Helper function to format day name
function formatDayName(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC'
  }).format(date);
}

// Helper function to format date (month and day)
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

// Helper function to format full date (with year)
function formatFullDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

// Get today's attendance for all employees
router.get('/today', authenticateToken, async (req, res) => {
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
router.get('/:eid', authenticateToken, async (req, res) => {
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
router.get('/total/:eid', authenticateToken, async (req, res) => {
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
    const attendanceCount = await prisma.employee_atd.groupBy({
      by: ['eid'],
      where: {
        eid: employeeId
      },
      _count: {
        // Using distinct with function to extract only the date part
        _all: true
      },
      having: {
        eid: {
          equals: employeeId
        }
      }
    });

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
router.get('/with-leaves/:eid', authenticateToken, async (req, res) => {
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
router.get('/weekly/all', authenticateToken, async (req, res) => {
  try {
    // Calculate date range for the current week (Monday to Sunday)
    const currentDate = new Date();
    const currentDay = currentDate.getDay(); // 0 is Sunday, 6 is Saturday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() + mondayOffset);
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
      // Initialize attendance for each day of the week
      const attendanceByDay = {};

      // Create dates for each day of the week
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        const isoDate = formatDateOnly(date);

        attendanceByDay[isoDate] = {
          attendance: [],
          leave: false,
          leave_type: null,
          date: isoDate,
          formatted_day: formatDayName(date),
          formatted_date: formatDate(date)
        };
      }

      // Populate attendance for each day
      employee.attendance.forEach(record => {
        const recordDate = formatDateOnly(record.clock_in);
        if (attendanceByDay[recordDate]) {
          attendanceByDay[recordDate].attendance.push({
            clock_in: formatTimeOnly(record.clock_in),
            clock_out: formatTimeOnly(record.clock_out)
          });
        }
      });

      // Mark days with approved leaves
      employee.leaves.forEach(leave => {
        const leaveStart = new Date(leave.from_date);
        const leaveEnd = new Date(leave.to_date);

        Object.keys(attendanceByDay).forEach(dateStr => {
          const date = new Date(dateStr);
          if (date >= leaveStart && date <= leaveEnd) {
            attendanceByDay[dateStr].leave = true;
            attendanceByDay[dateStr].leave_type = leave.type;
          }
        });
      });

      // Count effective days present (including leave days)
      const daysPresent = Object.values(attendanceByDay).filter(day => day.attendance.length > 0).length;
      const daysOnLeave = Object.values(attendanceByDay).filter(day => day.leave && day.attendance.length === 0).length;

      return {
        eid: employee.eid,
        name: employee.name,
        weekly_attendance: attendanceByDay,
        total_days_present: daysPresent,
        total_days_on_leave: daysOnLeave,
        effective_attendance: daysPresent + daysOnLeave,
        week_range: {
          start: formatDateOnly(firstDayOfWeek),
          end: formatDateOnly(lastDayOfWeek),
          formatted_start: formatFullDate(firstDayOfWeek),
          formatted_end: formatFullDate(lastDayOfWeek)
        }
      };
    });

    res.json(weeklyAttendance);
  } catch (error) {
    console.error('Error fetching weekly attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily attendance for a specific date
router.get('/daily/:date', authenticateToken, async (req, res) => {
  try {
    const inputDate = new Date(req.params.date);
    if (isNaN(inputDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const startOfDay = new Date(inputDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(inputDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all employees with attendance and approved leaves on the given date
    const employees = await prisma.employees.findMany({
      include: {
        attendance: {
          where: {
            clock_in: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        },
        leaves: {
          where: {
            status: 'Approved',
            from_date: { lte: endOfDay },
            to_date: { gte: startOfDay }
          }
        }
      }
    });

    // Format daily attendance for each employee
    const dailyData = employees.map((employee) => {
      const attendance = employee.attendance.map((record) => ({
        clock_in: formatTimeOnly(record.clock_in),
        clock_out: formatTimeOnly(record.clock_out)
      }));

      const leave = employee.leaves.length > 0 ? employee.leaves[0] : null;

      return {
        eid: employee.eid,
        name: employee.name,
        date: formatDateOnly(inputDate),
        formatted_date: formatFullDate(inputDate),
        formatted_day: formatDayName(inputDate),
        attendance,
        leave: !!leave,
        leave_type: leave?.type || null
      };
    });

    res.json(dailyData);
  } catch (error) {
    console.error('Error fetching daily attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Record clock in
router.post('/clock-in', authenticateToken, async (req, res) => {
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
router.post('/clock-out', authenticateToken, async (req, res) => {
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