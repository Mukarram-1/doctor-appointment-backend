const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

class DoctorService {
  // Get all doctors with pagination, search, and filters
  async getAllDoctors(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'name',
        order = 'asc',
        search = '',
        specialty = '',
        city = '',
        minFee = 0,
        maxFee = Number.MAX_SAFE_INTEGER,
        isActive = true
      } = options;

      const skip = (page - 1) * limit;
      const sortOrder = order === 'desc' ? -1 : 1;

      // Build query
      let query = { isActive };

      // Add search conditions
      if (search) {
        query.$text = { $search: search };
      }

      if (specialty) {
        query.specialty = { $regex: specialty, $options: 'i' };
      }

      if (city) {
        query['location.city'] = { $regex: city, $options: 'i' };
      }

      if (minFee > 0 || maxFee < Number.MAX_SAFE_INTEGER) {
        query.consultationFee = {
          $gte: minFee,
          $lte: maxFee
        };
      }

      // Build sort object
      let sortObj = {};
      if (search && query.$text) {
        sortObj.score = { $meta: 'textScore' };
      }
      sortObj[sort] = sortOrder;

      // Execute query with pagination
      const [doctors, total] = await Promise.all([
        Doctor.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Doctor.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get doctor by ID
  async getDoctorById(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      if (!doctor.isActive) {
        throw new Error('Doctor is not available');
      }

      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Create new doctor (Admin only)
  async createDoctor(doctorData) {
    try {
      // Check if doctor with same email already exists
      const existingDoctor = await Doctor.findOne({ 
        'contact.email': doctorData.contact.email 
      });
      
      if (existingDoctor) {
        throw new Error('Doctor with this email already exists');
      }

      const doctor = new Doctor(doctorData);
      await doctor.save();

      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Update doctor (Admin only)
  async updateDoctor(doctorId, updateData) {
    try {
      // Remove fields that shouldn't be updated directly
      const { rating, totalReviews, ...allowedUpdates } = updateData;

      const doctor = await Doctor.findByIdAndUpdate(
        doctorId,
        allowedUpdates,
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete doctor (Admin only)
  async deleteDoctor(doctorId) {
    try {
      // Check if doctor has any active appointments
      const activeAppointments = await Appointment.countDocuments({
        doctorId,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date() }
      });

      if (activeAppointments > 0) {
        throw new Error('Cannot delete doctor with active appointments');
      }

      const doctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { isActive: false },
        { new: true }
      );

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Cancel all future pending appointments
      await Appointment.updateMany(
        {
          doctorId,
          status: 'pending',
          date: { $gte: new Date() }
        },
        {
          status: 'cancelled',
          cancellationReason: 'Doctor no longer available',
          cancelledBy: 'admin',
          cancelledAt: new Date()
        }
      );

      return { message: 'Doctor deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Get doctors by specialty
  async getDoctorsBySpecialty(specialty, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'rating',
        order = 'desc'
      } = options;

      const doctors = await Doctor.findBySpecialty(specialty)
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Doctor.countDocuments({ 
        specialty: { $regex: specialty, $options: 'i' },
        isActive: true 
      });

      return {
        doctors,
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

  // Search doctors
  async searchDoctors(searchTerm, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        specialty = '',
        city = ''
      } = options;

      let query = {
        $text: { $search: searchTerm },
        isActive: true
      };

      if (specialty) {
        query.specialty = { $regex: specialty, $options: 'i' };
      }

      if (city) {
        query['location.city'] = { $regex: city, $options: 'i' };
      }

      const doctors = await Doctor.find(query)
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Doctor.countDocuments(query);

      return {
        doctors,
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

  // Get doctor availability for a specific date
  async getDoctorAvailability(doctorId, date) {
    try {
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if doctor is available on this day
      const dayAvailability = doctor.availability.find(slot => slot.day === dayOfWeek);
      
      if (!dayAvailability) {
        return {
          available: false,
          message: 'Doctor is not available on this day'
        };
      }

      // Get existing appointments for this date
      const existingAppointments = await Appointment.find({
        doctorId,
        date: new Date(date),
        status: { $in: ['pending', 'confirmed'] }
      }).select('time');

      const bookedTimes = existingAppointments.map(apt => apt.time);

      return {
        available: true,
        daySchedule: dayAvailability,
        bookedTimes,
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          consultationFee: doctor.consultationFee
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get doctor statistics
  async getDoctorStats(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const stats = await Appointment.aggregate([
        { $match: { doctorId: doctor._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const upcomingAppointments = await Appointment.countDocuments({
        doctorId,
        date: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      });

      const totalAppointments = await Appointment.countDocuments({ doctorId });
      const completedAppointments = await Appointment.countDocuments({ 
        doctorId, 
        status: 'completed' 
      });

      return {
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          rating: doctor.rating,
          totalReviews: doctor.totalReviews
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          upcoming: upcomingAppointments,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all specialties
  async getAllSpecialties() {
    try {
      const specialties = await Doctor.distinct('specialty', { isActive: true });
      
      const specialtiesWithCount = await Promise.all(
        specialties.map(async (specialty) => {
          const count = await Doctor.countDocuments({ 
            specialty, 
            isActive: true 
          });
          return { specialty, count };
        })
      );

      return specialtiesWithCount.sort((a, b) => b.count - a.count);
    } catch (error) {
      throw error;
    }
  }

  async getPopularDoctors(limit = 5) {
    try {
      const doctors = await Doctor.find({ isActive: true })
        .sort({ rating: -1, totalReviews: -1 })
        .limit(parseInt(limit))
        .select('name specialty rating totalReviews consultationFee location.hospital location.city');

      return doctors;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DoctorService(); 