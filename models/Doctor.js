const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:MM)']
  }
});

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    trim: true,
    enum: [
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'General Medicine',
      'Gynecology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Pulmonology',
      'Radiology',
      'Surgery',
      'Urology',
      'Other'
    ]
  },
  qualifications: {
    type: String,
    required: [true, 'Qualifications are required'],
    trim: true,
    maxlength: [200, 'Qualifications cannot be more than 200 characters']
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  availability: {
    type: [availabilitySchema],
    required: [true, 'Availability is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one availability slot is required'
    }
  },
  location: {
    hospital: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      match: [/^\d{5}(-\d{4})?$/, 'Please provide valid zip code']
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please provide valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    }
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ 'location.city': 1 });
doctorSchema.index({ name: 'text', specialty: 'text', 'location.hospital': 'text' });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ rating: -1 });

// Virtual for full address
doctorSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

// Static method to find doctors by specialty
doctorSchema.statics.findBySpecialty = function(specialty) {
  return this.find({ 
    specialty: { $regex: specialty, $options: 'i' },
    isActive: true 
  });
};

// Static method to search doctors
doctorSchema.statics.searchDoctors = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance method to check availability on specific day
doctorSchema.methods.isAvailableOnDay = function(day) {
  return this.availability.some(slot => slot.day === day);
};

// Transform output
doctorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Doctor', doctorSchema); 