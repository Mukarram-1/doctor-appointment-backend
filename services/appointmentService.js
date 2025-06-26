const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const emailService = require('./emailService');

class AppointmentService {
  // Book a new appointment
  async bookAppointment(userId, appointmentData) {
    try {
      const { doctorId, date, time, reason, notes, symptoms } = appointmentData;

      // Verify doctor exists and is active
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }
      if (!doctor.isActive) {
        throw new Error('Doctor is not available');
      }

      // Check if doctor is available on the requested day and time
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      const isDoctorAvailable = doctor.availability.some(slot => {
        if (slot.day !== dayOfWeek) return false;
        
        const slotStart = this.parseTime(slot.startTime);
        const slotEnd = this.parseTime(slot.endTime);
        const requestedTime = this.parseTime(time);
        
        return requestedTime >= slotStart && requestedTime < slotEnd;
      });

      if (!isDoctorAvailable) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Check for appointment conflicts
      const existingAppointment = await Appointment.hasConflict(doctorId, appointmentDate, time);
      if (existingAppointment) {
        throw new Error('Time slot is already booked');
      }

      // Create appointment
      const appointment = new Appointment({
        userId,
        doctorId,
        date: appointmentDate,
        time,
        reason,
        notes,
        symptoms: symptoms || [],
        consultationFee: doctor.consultationFee
      });

      await appointment.save();

      // Populate user and doctor details
      await appointment.populate([
        { path: 'userId', select: 'name email' },
        { path: 'doctorId', select: 'name specialty location contact' }
      ]);

      // Send confirmation email (don't wait for it)
      emailService.sendAppointmentConfirmation(
        appointment,
        appointment.userId,
        appointment.doctorId
      ).then(() => {
        // Update email sent status
        appointment.emailSent = true;
        appointment.save();
      }).catch(error => {
        console.error('Failed to send appointment confirmation email:', error);
      });

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Get appointments for a user
  async getUserAppointments(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        upcoming = false
      } = options;

      let query = { userId };
      
      if (status) {
        query.status = status;
      }
      
      if (upcoming) {
        query.date = { $gte: new Date() };
        query.status = { $in: ['pending', 'confirmed'] };
      }

      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        Appointment.find(query)
          .populate('doctorId', 'name specialty location.hospital contact.phone')
          .sort({ date: -1, time: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Appointment.countDocuments(query)
      ]);

      return {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all appointments (Admin only)
  async getAllAppointments(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        doctorId = null,
        dateFrom = null,
        dateTo = null,
        sort = 'createdAt',
        order = 'desc'
      } = options;

      let query = {};
      
      if (status) {
        query.status = status;
      }
      
      if (doctorId) {
        query.doctorId = doctorId;
      }
      
      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;
      const sortObj = { [sort]: order === 'desc' ? -1 : 1 };

      const [appointments, total] = await Promise.all([
        Appointment.find(query)
          .populate('userId', 'name email')
          .populate('doctorId', 'name specialty location.hospital')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Appointment.countDocuments(query)
      ]);

      return {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId, userId = null, userRole = null) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if user can access this appointment
      if (userRole !== 'admin' && userId && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Update appointment status (Admin only)
  async updateAppointmentStatus(appointmentId, statusData, updatedBy) {
    try {
      const { status, cancellationReason, cancelledBy } = statusData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Validate status transition
      if (!this.isValidStatusTransition(appointment.status, status)) {
        throw new Error(`Cannot change status from ${appointment.status} to ${status}`);
      }

      // Update appointment
      appointment.status = status;
      
      if (status === 'cancelled') {
        appointment.cancellationReason = cancellationReason;
        appointment.cancelledBy = cancelledBy || 'admin';
      }

      await appointment.save();

      // Send email notification based on status
      if (status === 'confirmed') {
        emailService.sendAppointmentConfirmation(
          appointment,
          appointment.userId,
          appointment.doctorId
        ).catch(error => {
          console.error('Failed to send confirmation email:', error);
        });
      } else if (status === 'cancelled') {
        emailService.sendAppointmentCancellation(
          appointment,
          appointment.userId,
          appointment.doctorId,
          cancellationReason
        ).catch(error => {
          console.error('Failed to send cancellation email:', error);
        });
      }

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Cancel appointment (User or Admin)
  async cancelAppointment(appointmentId, userId, userRole, cancellationData) {
    try {
      const { cancellationReason } = cancellationData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if user can cancel this appointment
      if (userRole !== 'admin' && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      // Check if appointment can be cancelled
      if (!appointment.canBeCancelled) {
        throw new Error('Appointment cannot be cancelled (must be at least 24 hours before appointment time)');
      }

      if (!['pending', 'confirmed'].includes(appointment.status)) {
        throw new Error('Only pending or confirmed appointments can be cancelled');
      }

      // Update appointment
      appointment.status = 'cancelled';
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = userRole === 'admin' ? 'admin' : 'user';

      await appointment.save();

      // Send cancellation email
      emailService.sendAppointmentCancellation(
        appointment,
        appointment.userId,
        appointment.doctorId,
        cancellationReason
      ).catch(error => {
        console.error('Failed to send cancellation email:', error);
      });

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(filters = {}) {
    try {
      const { doctorId, dateFrom, dateTo } = filters;

      let matchQuery = {};
      
      if (doctorId) {
        matchQuery.doctorId = doctorId;
      }
      
      if (dateFrom || dateTo) {
        matchQuery.date = {};
        if (dateFrom) matchQuery.date.$gte = new Date(dateFrom);
        if (dateTo) matchQuery.date.$lte = new Date(dateTo);
      }

      const stats = await Appointment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalFees: { $sum: '$consultationFee' }
          }
        }
      ]);

      const totalAppointments = await Appointment.countDocuments(matchQuery);
      const upcomingAppointments = await Appointment.countDocuments({
        ...matchQuery,
        date: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      });

      // Revenue calculation (only for completed appointments)
      const revenue = await Appointment.aggregate([
        {
          $match: {
            ...matchQuery,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$consultationFee' }
          }
        }
      ]);

      return {
        totalAppointments,
        upcomingAppointments,
        revenue: revenue[0]?.totalRevenue || 0,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            fees: stat.totalFees
          };
          return acc;
        }, {})
      };
    } catch (error) {
      throw error;
    }
  }

  // Get upcoming appointments (for reminders)
  async getUpcomingAppointments(days = 1) {
    try {
      return await Appointment.getUpcomingAppointments(days);
    } catch (error) {
      throw error;
    }
  }

  // Helper method to parse time string to minutes
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper method to validate status transitions
  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [], // Cannot change from cancelled
      'completed': [] // Cannot change from completed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, userId, userRole, rescheduleData) {
    try {
      const { date, time, reason } = rescheduleData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact availability');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if user can reschedule this appointment
      if (userRole !== 'admin' && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      if (!['pending', 'confirmed'].includes(appointment.status)) {
        throw new Error('Only pending or confirmed appointments can be rescheduled');
      }

      // Check if new time slot is available
      const newDate = new Date(date);
      const existingAppointment = await Appointment.hasConflict(
        appointment.doctorId._id,
        newDate,
        time,
        appointmentId
      );

      if (existingAppointment) {
        throw new Error('New time slot is already booked');
      }

      // Verify doctor availability for new time
      const dayOfWeek = newDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isDoctorAvailable = appointment.doctorId.availability.some(slot => {
        if (slot.day !== dayOfWeek) return false;
        
        const slotStart = this.parseTime(slot.startTime);
        const slotEnd = this.parseTime(slot.endTime);
        const requestedTime = this.parseTime(time);
        
        return requestedTime >= slotStart && requestedTime < slotEnd;
      });

      if (!isDoctorAvailable) {
        throw new Error('Doctor is not available at the new requested time');
      }

      // Update appointment
      appointment.date = newDate;
      appointment.time = time;
      if (reason) {
        appointment.reason = reason;
      }

      await appointment.save();

      // Send updated confirmation email
      emailService.sendAppointmentConfirmation(
        appointment,
        appointment.userId,
        appointment.doctorId
      ).catch(error => {
        console.error('Failed to send rescheduled appointment email:', error);
      });

      return appointment;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AppointmentService(); 