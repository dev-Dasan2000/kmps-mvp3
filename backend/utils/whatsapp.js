import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const sendWhatsAppTextMessage = async (phone, message) => {
    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: message },
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    }
};

const sendVerificationCodeWhatsApp = async (phone, code) => {
    const body = `👋 Hello from Kinross Dental Clinic!\n\nYour verification code is: *${code}*\n\nIf you did not request this, you can safely ignore this message.`;
    return sendWhatsAppTextMessage(phone, body);
};

const sendAppointmentConfirmationWhatsApp = async (phone, date, time) => {
    const body = `✅ Appointment Confirmed!\n\n📅 Date: *${date}*\n⏰ Time: *${time}*\n\nKinross Dental Clinic\nPlease arrive on time.`;
    return sendWhatsAppTextMessage(phone, body);
};

const sendAppointmentCancellationWhatsApp = async (phone, date, time, provider, reason = '') => {
    let body = `❌ Appointment Cancelled\n\nWith *${provider}*\n📅 *${date}* at *${time}*`;
    if (reason) body += `\n\nReason: ${reason}`;
    body += `\n\nPlease contact Kinross Dental Clinic to reschedule.`;
    return sendWhatsAppTextMessage(phone, body);
};

const sendReminderWhatsApp = async (phone, date, time, dentistName) => {
    const body = `📌 Reminder: You have a dental appointment tomorrow\n\n📅 *${date}*\n⏰ *${time}*\n👨‍⚕️ Dr. ${dentistName}\n\nPlease arrive a few minutes early.`;
    return sendWhatsAppTextMessage(phone, body);
};

const sendImageOrReportNoticeWhatsApp = async (phone, type, date, name) => {
    const label = type === 'both'
        ? 'a medical image and report'
        : type === 'report'
            ? 'a medical report'
            : 'a medical image';

    const body = `📄 New ${label} has been added to your record on *${date}*.\n\nPatient: ${name}\n\nLog in to your portal to view it.`;
    return sendWhatsAppTextMessage(phone, body);
};

export {
    sendVerificationCodeWhatsApp,
    sendAppointmentConfirmationWhatsApp,
    sendAppointmentCancellationWhatsApp,
    sendReminderWhatsApp,
    sendImageOrReportNoticeWhatsApp,
};
