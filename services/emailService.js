const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  // Initialize email transporter
  init() {
    if (!config.EMAIL.USER || !config.EMAIL.PASS) {
      console.warn('Email configuration not complete. Email features will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: config.EMAIL.HOST,
      port: config.EMAIL.PORT,
      secure: config.EMAIL.PORT === 465,
      auth: {
        user: config.EMAIL.USER,
        pass: config.EMAIL.PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email configuration error:', error);
      } else {
        console.log('Email service is ready');
      }
    });
  }

  // Send appointment confirmation email to user
  async sendAppointmentConfirmation(appointment, user, doctor) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email.');
      return false;
    }

    try {
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      const appointmentTime = appointment.time;

      const mailOptions = {
        from: config.EMAIL.FROM,
        to: user.email,
        subject: 'Appointment Confirmation - Doctor Appointment System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Appointment Confirmation</h2>
            
            <p>Dear ${user.name},</p>
            
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
              <p><strong>Specialty:</strong> ${doctor.specialty}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Hospital:</strong> ${doctor.location.hospital}</p>
              <p><strong>Address:</strong> ${doctor.location.address}, ${doctor.location.city}, ${doctor.location.state} ${doctor.location.zipCode}</p>
              <p><strong>Contact:</strong> ${doctor.contact.phone}</p>
              <p><strong>Consultation Fee:</strong> $${appointment.consultationFee}</p>
            </div>
            
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #2980b9; margin-top: 0;">Important Notes:</h4>
              <ul>
                <li>Please arrive 15 minutes before your appointment time</li>
                <li>Bring a valid ID and insurance card</li>
                <li>You can cancel this appointment up to 24 hours before the scheduled time</li>
              </ul>
            </div>
            
            <p>If you need to cancel or reschedule your appointment, please contact us as soon as possible.</p>
            
            <p>Thank you for choosing our services!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment confirmation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      return false;
    }
  }

  // Send appointment cancellation email
  async sendAppointmentCancellation(appointment, user, doctor, cancellationReason) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email.');
      return false;
    }

    try {
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      const appointmentTime = appointment.time;

      const mailOptions = {
        from: config.EMAIL.FROM,
        to: user.email,
        subject: 'Appointment Cancelled - Doctor Appointment System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Appointment Cancelled</h2>
            
            <p>Dear ${user.name},</p>
            
            <p>We regret to inform you that your appointment has been cancelled.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Cancelled Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Reason:</strong> ${cancellationReason || 'Not specified'}</p>
            </div>
            
            <p>We apologize for any inconvenience caused. You can book a new appointment at your convenience.</p>
            
            <p>Thank you for your understanding.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment cancellation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending appointment cancellation email:', error);
      return false;
    }
  }

  // Send appointment reminder email
  async sendAppointmentReminder(appointment, user, doctor) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email.');
      return false;
    }

    try {
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      const appointmentTime = appointment.time;

      const mailOptions = {
        from: config.EMAIL.FROM,
        to: user.email,
        subject: 'Appointment Reminder - Doctor Appointment System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f39c12;">Appointment Reminder</h2>
            
            <p>Dear ${user.name},</p>
            
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details</h3>
              <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Hospital:</strong> ${doctor.location.hospital}</p>
              <p><strong>Contact:</strong> ${doctor.contact.phone}</p>
            </div>
            
            <p>Please arrive 15 minutes before your scheduled appointment time.</p>
            
            <p>Thank you!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Appointment reminder email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending appointment reminder email:', error);
      return false;
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email.');
      return false;
    }

    try {
      const mailOptions = {
        from: config.EMAIL.FROM,
        to: user.email,
        subject: 'Welcome to Doctor Appointment System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27ae60;">Welcome to Doctor Appointment System!</h2>
            
            <p>Dear ${user.name},</p>
            
            <p>Welcome to our Doctor Appointment System! We're excited to have you on board.</p>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What you can do:</h3>
              <ul>
                <li>Browse our directory of qualified doctors</li>
                <li>Book appointments with ease</li>
                <li>Manage your appointments</li>
                <li>Receive appointment confirmations and reminders</li>
              </ul>
            </div>
            
            <p>Start by exploring our doctor directory and booking your first appointment!</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>Doctor Appointment System Team</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService(); 