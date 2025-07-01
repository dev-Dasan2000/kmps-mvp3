import express from 'express';
import { Prisma,PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';
// import { authenticateToken } from '../middleware/authentication.js';
import { sendAppointmentConfirmation, sendAppointmentCancelation } from '../utils/mailer.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', /* authenticateToken, */ async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/fordentist/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: { dentist_id: req.params.dentist_id },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/forpatient/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: { patient_id: req.params.patient_id },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/today/fordentist/:dentist_id', async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: req.params.dentist_id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/fordentist/patients/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    const dentistId = req.params.dentist_id;

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: dentistId,
        patient_id:{not:null}
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            profile_picture: true,
            email: true,
            phone_number: true,
            address: true,
            nic: true,
            blood_group: true,
            date_of_birth: true,
            gender: true
          }
        }
      }
    });

    // Extract unique patients
    const uniquePatients = Array.from(
      new Map(
        appointments.map(app => [app.patient.patient_id, app.patient])
      ).values()
    );

    res.json(uniquePatients);
  } catch (error) {
    console.error("Error fetching patients for dentist:", error);
    res.status(500).json({ error: "Failed to fetch patients for this dentist" });
  }
});


router.get('/today/forpatient/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: req.params.patient_id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});


router.get('/today', /* authenticateToken, */ async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const appointments = await prisma.appointments.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today', /* authenticateToken, */ async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        patient_id: { not: null },
        dentist_id: { not: null }
      }
    });

    res.json( count );
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today-checked-in', /* authenticateToken, */ async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: "checkedin",
        patient_id: { not: null },
        dentist_id: { not: null }
      }
    });

    res.json( count );
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count/today-not-checked-in', /* authenticateToken, */ async (req, res) => {
  try {
    const colomboNow = DateTime.now().setZone('Asia/Colombo');
    const startOfDay = colomboNow.startOf('day').toJSDate();
    const endOfDay = colomboNow.endOf('day').toJSDate();

    const count = await prisma.appointments.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ["confirmed", "pending"] },
        patient_id: { not: null },
        dentist_id: { not: null }
      }
    });

    res.json( count );
  } catch (error) {
    console.error("Error fetching today's appointments count", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/fordentist/upcoming/:dentist_id', /* authenticateToken, */ async (req, res) => {
  try {
    // Get today's date in Asia/Colombo (without time)
    const colomboToday = DateTime.now().setZone('Asia/Colombo').toISODate(); // '2025-06-20'

    const appointments = await prisma.appointments.findMany({
      where: {
        dentist_id: req.params.dentist_id,
        date: {
          gt: new Date(colomboToday)
        }
      },
      orderBy: {
        date: 'asc'
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});

router.get('/forpatient/upcoming/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    // Get today's date in Asia/Colombo (without time)
    const colomboToday = DateTime.now().setZone('Asia/Colombo').toISODate(); // '2025-06-20'

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: req.params.patient_id,
        date: {
          gt: new Date(colomboToday)
        }
      },
      orderBy: {
        date: 'asc'
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ error: "Failed to fetch upcoming appointments" });
  }
});

router.get('/pending', /* authenticateToken, */ async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        status: "pending"
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/checkedin', /* authenticateToken, */ async (req, res) => {
  try {
    const appointments = await prisma.appointments.findMany({
      where: {
        status: "checkedin"
      },
      include: {
        patient: {
          select: {
            patient_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        },
        dentist: {
          select: {
            dentist_id: true,
            name: true,
            email: true,
            profile_picture: true,
            phone_number: true
          }
        }
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ error: "Failed to fetch today's appointments" });
  }
});

router.get('/count', /* authenticateToken, */ async (req, res) => {
  try {
    const count = await prisma.appointments.count();
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/pending-count', /* authenticateToken, */ async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "pending", patient_id:{not:null}, dentist_id:{not: null} } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/completed-count', /* authenticateToken, */ async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "completed" } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/confirmed-count', /* authenticateToken, */ async (req, res) => {
  try {
    const count = await prisma.appointments.count({ where: { status: "confirmed" } });
    res.json(count);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/:appointment_id', /* authenticateToken, */ async (req, res) => {
  try {
    const appointment = await prisma.appointments.findUnique({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

router.post('/', async (req, res) => {
  try {
    // Explicitly extract only allowed fields
    const {
      patient_id,
      dentist_id,
      date,
      time_from,
      time_to,
      fee,
      note,
      status,
      payment_status
    } = req.body;

    const newAppointment = await prisma.appointments.create({
      data: {
        patient_id,
        dentist_id,
        date: new Date(date),
        time_from,
        time_to,
        fee,
        note,
        status: status || "pending",
        payment_status: payment_status || "not-paid",
      },
    });
    res.status(201).json(newAppointment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.put('/:appointment_id', /* authenticateToken, */ async (req, res) => {
  try {
    const data = req.body;
    console.log(data.status);
    if (data.date) data.date = new Date(data.date);
    const updated = await prisma.appointments.update({
      where: { appointment_id: Number(req.params.appointment_id) },
      data,
    });
    const appointment = await prisma.appointments.findUnique({where:{appointment_id:Number(req.params.appointment_id)}});
    const patient = await prisma.patients.findUnique({where:{patient_id:appointment.patient_id}});
    if(data.status == "cancelled"){
      sendAppointmentCancelation(patient.email,appointment.date,appointment.time_from);
    }
    else if(data.status == "confirmed"){
      sendAppointmentConfirmation(patient.email,appointment.date,appointment.time_from);
    }
    res.status(202).json(updated);
  } catch(err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

router.delete('/:appointment_id', /* authenticateToken, */ async (req, res) => {
  try {
    await prisma.appointments.delete({
      where: { appointment_id: Number(req.params.appointment_id) },
    });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

router.get('/payment-summary/:patient_id', /* authenticateToken, */ async (req, res) => {
  try {
    const { patient_id } = req.params;

    // Get paid and unpaid appointments separately for better clarity
    const [paidAppointments, unpaidAppointments] = await Promise.all([
      // Get all paid appointments (where payment_status is 'completed')
      prisma.appointments.findMany({
        where: { 
          patient_id,
          fee: { not: null },
          status: { not: 'cancelled' },
          OR : [
            {payment_status: 'paid'},
            {payment_status: 'Paid'}
          ]
        },
        select: { fee: true }
      }),
      // Get all unpaid appointments (where payment_status is not 'completed' or missing)
      prisma.appointments.findMany({
        where: { 
          patient_id,
          fee: { not: null },
          status: { not: 'cancelled' },
          payment_status: {
            notIn: ['paid', 'Paid']
          }      
        },
        select: { fee: true }
      })
    ]);

    // Calculate totals
    const totalPaid = paidAppointments.reduce(
      (sum, appt) => sum.plus(new Prisma.Decimal(appt.fee)), 
      new Prisma.Decimal(0)
    );
    
    const totalUnpaid = unpaidAppointments.reduce(
      (sum, appt) => sum.plus(new Prisma.Decimal(appt.fee)), 
      new Prisma.Decimal(0)
    );
    
    const totalDue = totalUnpaid;
    const total = parseInt(totalPaid) + parseInt(totalDue);
    res.json({
      success: true,
      data: {
        total_due: totalDue.toFixed(2),
        total_paid: totalPaid.toFixed(2),
        total: total.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary',
      details: error.message
    });
  }
});


export default router;
