const appointmentService = require('../services/appointmentService');

class AppointmentController {
  // Book a new appointment (User only)
  async bookAppointment(req, res) {
    try {
      const appointment = await appointmentService.bookAppointment(req.userId, req.body);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Book appointment error:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('not available') || 
                        error.message.includes('already booked') ? 409 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user's appointments
  async getUserAppointments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        upcoming: req.query.upcoming === 'true'
      };

      const result = await appointmentService.getUserAppointments(req.userId, options);

      res.json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all appointments (Admin only)
  async getAllAppointments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        doctorId: req.query.doctorId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc'
      };

      const result = await appointmentService.getAllAppointments(options);

      res.json({
        success: true,
        message: 'All appointments retrieved successfully',
        data: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get appointments based on user role
  async getAppointments(req, res) {
    try {
      if (req.userRole === 'admin') {
        return this.getAllAppointments(req, res);
      } else {
        return this.getUserAppointments(req, res);
      }
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get appointment by ID
  async getAppointmentById(req, res) {
    try {
      const appointment = await appointmentService.getAppointmentById(
        req.params.id,
        req.userId,
        req.userRole
      );

      res.json({
        success: true,
        message: 'Appointment retrieved successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Get appointment by ID error:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Access denied') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update appointment status (Admin only)
  async updateAppointmentStatus(req, res) {
    try {
      const appointment = await appointmentService.updateAppointmentStatus(
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        success: true,
        message: 'Appointment status updated successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Update appointment status error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cancel appointment (User or Admin)
  async cancelAppointment(req, res) {
    try {
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.userId,
        req.userRole,
        req.body
      );

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Access denied') ? 403 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reschedule appointment (User or Admin)
  async rescheduleAppointment(req, res) {
    try {
      const appointment = await appointmentService.rescheduleAppointment(
        req.params.id,
        req.userId,
        req.userRole,
        req.body
      );

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: appointment
      });
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('Access denied') ? 403 :
                        error.message.includes('already booked') ? 409 : 400;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get appointment statistics (Admin only)
  async getAppointmentStats(req, res) {
    try {
      const filters = {
        doctorId: req.query.doctorId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const stats = await appointmentService.getAppointmentStats(filters);

      res.json({
        success: true,
        message: 'Appointment statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get appointment stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get upcoming appointments (Admin only)
  async getUpcomingAppointments(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const appointments = await appointmentService.getUpcomingAppointments(days);

      res.json({
        success: true,
        message: 'Upcoming appointments retrieved successfully',
        data: appointments
      });
    } catch (error) {
      console.error('Get upcoming appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get my appointments (shortcut for users)
  async getMyAppointments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        upcoming: req.query.upcoming === 'true'
      };

      const result = await appointmentService.getUserAppointments(req.userId, options);

      res.json({
        success: true,
        message: 'Your appointments retrieved successfully',
        data: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get my appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get appointment history for a user (Admin only)
  async getUserAppointmentHistory(req, res) {
    try {
      const { userId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status
      };

      const result = await appointmentService.getUserAppointments(userId, options);

      res.json({
        success: true,
        message: 'User appointment history retrieved successfully',
        data: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user appointment history error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get doctor's appointments (Admin only)
  async getDoctorAppointments(req, res) {
    try {
      const { doctorId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        sort: req.query.sort || 'date',
        order: req.query.order || 'asc'
      };

      // Override doctorId in options
      options.doctorId = doctorId;

      const result = await appointmentService.getAllAppointments(options);

      res.json({
        success: true,
        message: 'Doctor appointments retrieved successfully',
        data: result.appointments,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get doctor appointments error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AppointmentController(); 