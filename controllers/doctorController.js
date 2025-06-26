const doctorService = require('../services/doctorService');

class DoctorController {
  // Get all doctors with pagination and filters
  async getAllDoctors(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'name',
        order: req.query.order || 'asc',
        search: req.query.search || '',
        specialty: req.query.specialty || '',
        city: req.query.city || '',
        minFee: parseFloat(req.query.minFee) || 0,
        maxFee: parseFloat(req.query.maxFee) || Number.MAX_SAFE_INTEGER
      };

      const result = await doctorService.getAllDoctors(options);

      res.json({
        success: true,
        message: 'Doctors retrieved successfully',
        data: result.doctors,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all doctors error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get doctor by ID
  async getDoctorById(req, res) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);

      res.json({
        success: true,
        message: 'Doctor retrieved successfully',
        data: doctor
      });
    } catch (error) {
      console.error('Get doctor by ID error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new doctor (Admin only)
  async createDoctor(req, res) {
    try {
      const doctor = await doctorService.createDoctor(req.body);

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctor
      });
    } catch (error) {
      console.error('Create doctor error:', error);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Doctor with this email already exists'
        });
      }

      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update doctor (Admin only)
  async updateDoctor(req, res) {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: doctor
      });
    } catch (error) {
      console.error('Update doctor error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete doctor (Admin only)
  async deleteDoctor(req, res) {
    try {
      const result = await doctorService.deleteDoctor(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete doctor error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get doctors by specialty
  async getDoctorsBySpecialty(req, res) {
    try {
      const { specialty } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || 'rating',
        order: req.query.order || 'desc'
      };

      const result = await doctorService.getDoctorsBySpecialty(specialty, options);

      res.json({
        success: true,
        message: `Doctors in ${specialty} retrieved successfully`,
        data: result.doctors,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get doctors by specialty error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search doctors
  async searchDoctors(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        specialty: req.query.specialty || '',
        city: req.query.city || ''
      };

      const result = await doctorService.searchDoctors(searchTerm, options);

      res.json({
        success: true,
        message: 'Search results retrieved successfully',
        data: result.doctors,
        pagination: result.pagination,
        searchTerm
      });
    } catch (error) {
      console.error('Search doctors error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get doctor availability
  async getDoctorAvailability(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required'
        });
      }

      const availability = await doctorService.getDoctorAvailability(id, date);

      res.json({
        success: true,
        message: 'Doctor availability retrieved successfully',
        data: availability
      });
    } catch (error) {
      console.error('Get doctor availability error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get doctor statistics (Admin only)
  async getDoctorStats(req, res) {
    try {
      const stats = await doctorService.getDoctorStats(req.params.id);

      res.json({
        success: true,
        message: 'Doctor statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get doctor stats error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all specialties
  async getAllSpecialties(req, res) {
    try {
      const specialties = await doctorService.getAllSpecialties();

      res.json({
        success: true,
        message: 'Specialties retrieved successfully',
        data: specialties
      });
    } catch (error) {
      console.error('Get specialties error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get popular doctors
  async getPopularDoctors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const doctors = await doctorService.getPopularDoctors(limit);

      res.json({
        success: true,
        message: 'Popular doctors retrieved successfully',
        data: doctors
      });
    } catch (error) {
      console.error('Get popular doctors error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DoctorController(); 