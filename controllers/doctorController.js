const doctorService = require('../services/doctorService');

class DoctorController {
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
}

module.exports = new DoctorController(); 
