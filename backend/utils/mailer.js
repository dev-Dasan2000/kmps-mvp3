import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { link } from 'fs';

dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendVerificationCode = async (email, code) => {
    const mailOptions = {
        from: `"Kinross Dental Care" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verification Code for Your Kinross Dental Care Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4A90E2;">Kinross Dental Clinic Email Verification</h2>
                <p>Dear user,</p>
                <p>Please use the following verification code to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; background-color: #4A90E2; color: white; font-size: 24px; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
                        ${code}
                    </span>
                </div>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error(`Error sending verification email to ${email}:`, error);
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
};

const sendAppointmentConfirmation = async (email, date, start_time) => {
    const mailOptions = {
        from: `"Kinross Dental Clinic" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Appointment Confirmation Notice',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Appointment Confirmed</h2>
                <p>Dear user,</p>
                <p>We’re pleased to confirm your appointment booking. Please find the details below:</p>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Time:</strong></td>
                        <td style="padding: 8px 0;">${start_time}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px;">Please ensure to be on time. If you have any questions or need to reschedule, feel free to contact us.</p>
                <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error(`Error sending appointment confirmation to ${email}:`, error);
        throw new Error(`Failed to send appointment confirmation: ${error.message}`);
    }
};

const sendAppointmentCancelation = async (email, date, start_time, provider, cancelNote) => {
    // Format the date to be more readable (e.g., "Monday, January 1, 2023")
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const mailOptions = {
      from: `"Kinross Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Appointment Cancellation Notice',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #e53935;">Appointment Cancelled</h2>
          <p>Dear user,</p>
          <p>We’re sorry to inform you that your appointment with <strong>${provider}</strong> has been cancelled. Please find the details below:</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${start_time}</td>
            </tr>
            ${cancelNote ? `
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Reason for Cancellation:</strong></td>
              <td style="padding: 8px 0;">${cancelNote}</td>
            </tr>` : ''}
          </table>
          <p style="margin-top: 20px;">You can reschedule another appointment with ${provider} at your convenience. If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
        </div>
      `,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error(`Error sending appointment cancellation to ${email}:`, error);
      throw new Error(`Failed to send appointment cancellation: ${error.message}`);
    }
  };

  const sendAccountCreationInvite = async (email, role, link) => {
    const mailOptions = {
      from: `"Kinross Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Kinross Dental Clinic Account Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">You're Invited to Join Kinross Dental Clinic</h2>
          <p>Dear user,</p>
          <p>You’ve been invited to join <strong>Kinross Dental Clinic</strong> as a <strong>${role}</strong>.</p>
          <p>Please click the button below to create your account and get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #43a047; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Create Account</a>
          </div>
          <p>If the button doesn't work, copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${link}</p>
          <p>We're excited to have you on board. If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
        </div>
      `,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error(`Error sending account creation invite to ${email}:`, error);
      throw new Error(`Failed to send account creation invite: ${error.message}`);
    }
  };

  const sendAccountCreationNotice = async (email, ID) => {
    const mailOptions = {
      from: `"Kinross Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Kinross Dental Clinic Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">Welcome to Kinross Dental Clinic</h2>
          <p>Dear user,</p>
          <p>Your account has been successfully created on <strong>Kinross Dental Clinic</strong>.</p>
          <p><strong>Your Account ID:</strong> ${ID}</p>
          <p>You can now log in using your account ID and the password provided by your administrator.</p>
          <p>If you have any questions or need help accessing your account, please contact our support team.</p>
          <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
        </div>
      `,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error(`Error sending account creation notice to ${email}:`, error);
      throw new Error(`Failed to send account creation notice: ${error.message}`);
    }
  };

  const sendAccountCreationNoticeWithPassword = async (email, ID, password) => {
    const mailOptions = {
      from: `"Kinross Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Kinross Dental Clinic Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">Welcome to Kinross Dental Clinic</h2>
          <p>Dear user,</p>
          <p>Your account has been successfully created on <strong>Kinross Dental Clinic</strong>.</p>
          <p><strong>Your Account ID:</strong> ${ID}</p>
          <p><strong>Your Account Password:</strong> ${password}</p>
          <p>You can now log in using your account ID and the password provided by your administrator.</p>
          <p>If you have any questions or need help accessing your account, please contact our support team.</p>
          <p>Best regards,<br><strong>Kinross Dental Clinic Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Kinross Dental Clinic | Kinross Dental Clinic</p>
        </div>
      `,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error(`Error sending account creation notice to ${email}:`, error);
      throw new Error(`Failed to send account creation notice: ${error.message}`);
    }
  };
  

export {sendVerificationCode, sendAppointmentConfirmation, sendAppointmentCancelation, sendAccountCreationInvite, sendAccountCreationNotice, sendAccountCreationNoticeWithPassword};
