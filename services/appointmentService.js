const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const emailService = require('./emailService');

class AppointmentService {
  async bookAppointment(userId, appointmentData) {
    try {
      const { doctorId, date, time, reason, notes, symptoms } = appointmentData;

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }
      if (!doctor.isActive) {
        throw new Error('Doctor is not available');
      }

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

      const existingAppointment = await Appointment.hasConflict(doctorId, appointmentDate, time);
      if (existingAppointment) {
        throw new Error('Time slot is already booked');
      }

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

      await appointment.populate([
        { path: 'userId', select: 'name email' },
        { path: 'doctorId', select: 'name specialty location contact' }
      ]);

      emailService.sendAppointmentConfirmation(
        appointment,
        appointment.userId,
        appointment.doctorId
      ).then(() => {
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

  async getAppointmentById(appointmentId, userId = null, userRole = null) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (userRole !== 'admin' && userId && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId, statusData, updatedBy) {
    try {
      const { status, cancellationReason, cancelledBy } = statusData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (!this.isValidStatusTransition(appointment.status, status)) {
        throw new Error(`Cannot change status from ${appointment.status} to ${status}`);
      }

      appointment.status = status;
      const now = new Date();
      if (status === 'confirmed') {
        appointment.confirmedAt = now;
      } else if (status === 'cancelled') {
        appointment.cancellationReason = cancellationReason;
        appointment.cancelledBy = cancelledBy || 'admin';
        appointment.cancelledAt = now;
      } else if (status === 'completed') {
        appointment.completedAt = now;
      }

      await appointment.save();

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

  async cancelAppointment(appointmentId, userId, userRole, cancellationData) {
    try {
      const { cancellationReason } = cancellationData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (userRole !== 'admin' && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      if (!appointment.canBeCancelled) {
        throw new Error('Appointment cannot be cancelled (must be at least 24 hours before appointment time)');
      }

      if (!['pending', 'confirmed'].includes(appointment.status)) {
        throw new Error('Only pending or confirmed appointments can be cancelled');
      }

      appointment.status = 'cancelled';
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = userRole === 'admin' ? 'admin' : 'user';

      await appointment.save();

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

  async getUpcomingAppointments(days = 1) {
    try {
      return await Appointment.getUpcomingAppointments(days);
    } catch (error) {
      throw error;
    }
  }

  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [],
      'completed': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async rescheduleAppointment(appointmentId, userId, userRole, rescheduleData) {
    try {
      const { date, time, reason } = rescheduleData;

      const appointment = await Appointment.findById(appointmentId)
        .populate('userId', 'name email')
        .populate('doctorId', 'name specialty location contact availability');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (userRole !== 'admin' && appointment.userId._id.toString() !== userId.toString()) {
        throw new Error('Access denied');
      }

      if (!['pending', 'confirmed'].includes(appointment.status)) {
        throw new Error('Only pending or confirmed appointments can be rescheduled');
      }

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

      appointment.date = newDate;
      appointment.time = time;
      if (reason) {
        appointment.reason = reason;
      }

      await appointment.save();

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
