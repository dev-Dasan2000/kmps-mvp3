//import libraries
import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {Server} from 'socket.io';
import http from 'http';

//import endpoint routers
import authRouter from './auth-routes/user-auth-route.js';
import adminRouter from './routes/admin-routes.js';
import appointmentHistoryRouter from './routes/appointments-history-routes.js';
import appointmentsRouter from './routes/appointments-routes.js';
import blockedDatesRouter from './routes/blocked-dates-routes.js';
import dentistSecurityQuestionsRouter from './routes/dentist-security-questions-answers-routes.js';
import dentistsRouter from './routes/dentists-routes.js';
import emailVerificationRouter from './routes/email-verification-routes.js';
import emergencyContactsRouter from './routes/emergency-contacts-routes.js';
import filesRouter from './routes/files-routes.js';
import insuranceDetailsRouter from './routes/insurance-details-routes.js';
import medicalHistoryRouter from './routes/medical-history-routes.js';
import medicalQuestionsRouter from './routes/medical-questions-routes.js';
import medicalReportsRouter from './routes/medical-reports-routes.js';
import patientRouter from './routes/patient-routes.js';
import patientSecurityQuestionsAnswersRouter from './routes/patient-security-questions-answers-routes.js';
import paymentHistoryRouter from './routes/payment-history-routes.js';
import photosRouter from './routes/photos-routes.js';
import receptionistSecurityQuestionsAnswersRouter from './routes/receptionist-security-questions-answers-routes.js';
import receptionistsRouter from './routes/receptionists-routes.js';
import securityQuestionsRouter from './routes/security-questions-routes.js';
import serviceTypesRouter from './routes/service-types-routes.js';
import soapNotesRouter from './routes/soap-notes-routes.js';
import radioLogistSecurityQuestionsAnswersRouter from './routes/radiologist-security-questions-answers-routes.js';
import createRoomsRouter from './routes/rooms-routes.js';
import roomAssignRouter from './routes/rooms-assign-routes.js';

import studyRouter from './routes/study-routes.js';
import radiologistRouter from './routes/radiologist-routes.js';
import reportsRouter from './routes/reports-routes.js';
import dentistAssignRouter from './routes/dentist-assign-routes.js';

import workTypesRouter from './routes/work-types-routes.js';
import shadesRouter from './routes/shades-routes.js';
import materialTypesRouter from './routes/material-types-routes.js';
import orderFilesRouter from './routes/order-files-routes.js';
import orderRouter from './routes/order-routes.js';
import stagesRouter from './routes/stages-routes.js';
import stageAssignRouter from './routes/stage-assign-routes.js';
import labRouter from './routes/lab-routes.js';
import labSecurityQuestionsAnswersRouter from './routes/lab-security-question-answers-routes.js';
import expenseRouter from './routes/expense-routes.js';
import invoiceServiceRouter from './routes/invoice-service-routes.js';
import invoiceRouter from './routes/invoice-routes.js';
import invoiceServiceAssignRouter from './routes/invoice-service-assign-routes.js';
import consentFormRouter from './routes/consent-routes.js';

import hrEmployeeRouter from './routes/hr/employee-routes.js';
import hrAttendanceRouter from './routes/hr/attendance-routes.js';
import hrLeaveRouter from './routes/hr/leave-routes.js';
import hrPayrollRouter from './routes/hr/payroll-routes.js';
import hrShiftsRouter from './routes/hr/shifts-routes.js';
import createNotesRouter from './routes/note-routes.js';

import passwordResetRouter from './routes/password-reset-routes.js';

import './routes/automated-routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
  credentials: true,
  origin: ['http://localhost:3001', 'http://localhost:4000', 'http://localhost:3000', 'https://dentax.globalpearlventures.com', 'https://dentax.globalpearlventures.com:3001', 'https://dentax.globalpearlventures.com:4000', 'https://dentax.globalpearlventures.com:5000'],
}

const server = http.createServer(app);
const io = new Server(server,{
  cors:{corsOptions}
})

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

//configure routers to redirect to endpoints
app.use('/auth',authRouter);
app.use('/admins', adminRouter);
app.use('/appointment-history', appointmentHistoryRouter);
app.use('/appointments', appointmentsRouter);
app.use('/blocked-dates', blockedDatesRouter);
app.use('/dentist-security-questions-answers', dentistSecurityQuestionsRouter);
app.use('/dentists', dentistsRouter);
app.use('/email-verification', emailVerificationRouter);
app.use('/emergency-contacts', emergencyContactsRouter);
app.use('/files', filesRouter);
app.use('/insurance-details', insuranceDetailsRouter);
app.use('/medical-history', medicalHistoryRouter);
app.use('/medical-questions', medicalQuestionsRouter);
app.use('/medical-reports', medicalReportsRouter);
app.use('/patients', patientRouter);
app.use('/patient-security-questions-answers', patientSecurityQuestionsAnswersRouter);
app.use('/payment-history', paymentHistoryRouter);
app.use('/photos',photosRouter);
app.use('/receptionist-security-questions-answers', receptionistSecurityQuestionsAnswersRouter);
app.use('/receptionists', receptionistsRouter);
app.use('/security-questions', securityQuestionsRouter);
app.use('/service-types', serviceTypesRouter);
app.use('/soap-notes', soapNotesRouter);
app.use('/radiologist-security-question-answers', radioLogistSecurityQuestionsAnswersRouter);
app.use('/rooms',createRoomsRouter(io));
app.use('/rooms-assign',roomAssignRouter);
app.use('/notes', createNotesRouter(io));

app.use('/studies', studyRouter);
app.use('/radiologists', radiologistRouter);
app.use('/reports', reportsRouter);
app.use('/dentist-assign', dentistAssignRouter);

app.use('/work-types', workTypesRouter);
app.use('/shades', shadesRouter);
app.use('/material-types', materialTypesRouter);
app.use('/order-files', orderFilesRouter);
app.use('/orders', orderRouter);
app.use('/stages', stagesRouter);
app.use('/stage-assign', stageAssignRouter);
app.use('/labs', labRouter);
app.use('/lab-security-question-answers', labSecurityQuestionsAnswersRouter);
app.use('/expense', expenseRouter);
app.use('/invoice-services', invoiceServiceRouter);
app.use('/invoices', invoiceRouter);
app.use('/invoice-service-assign', invoiceServiceAssignRouter);
app.use('/consent-forms', consentFormRouter);

app.use('/hr/employees', hrEmployeeRouter);
app.use('/hr/attendance', hrAttendanceRouter);
app.use('/hr/leaves', hrLeaveRouter);
app.use('/hr/payroll', hrPayrollRouter);
app.use('/hr/shifts', hrShiftsRouter);

app.use('/reset-password', passwordResetRouter);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));