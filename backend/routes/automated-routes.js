import {PrismaClient} from '@prisma/client';
import cron from 'node-cron';
import {sendReminder} from './../utils/mailer.js';
import { addDays, startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

cron.schedule('0 20 * * *', async () => {
    try {
      const now = new Date();
      const tomorrow = addDays(now, 1);
      const start = startOfDay(tomorrow);
      const end = endOfDay(tomorrow);
  
      const appointments = await prisma.appointments.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          }
        },
        include: {
          patient: true,
          dentist: true,
        },
      });
  
      for (const appointment of appointments) {
        if (appointment.patient?.email && appointment.dentist?.name) {
          await sendReminder(
            appointment.patient.email,
            appointment.date.toISOString().split('T')[0],
            appointment.time_from,
            appointment.dentist.name
          );
          console.log(`Reminder sent to ${appointment.patient.email}`);
        }
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  }, {
    timezone: 'Asia/Colombo'
  });