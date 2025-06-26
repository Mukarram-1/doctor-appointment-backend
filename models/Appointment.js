const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'Appointment date cannot be in the past'
    }
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format (HH:MM)']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    trim: true,
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot be more than 200 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'doctor', 'admin'],
    required: function() {
      return this.status === 'cancelled';
    }
  },
  cancelledAt: {
    type: Date,
    required: function() {
      return this.status === 'cancelled';
    }
  },
  confirmedAt: {
    type: Date,
    required: function() {
      return this.status === 'confirmed';
    }
  },
  completedAt: {
    type: Date,
    required: function() {
      return this.status === 'completed';
    }
  }
}, {
  timestamps: true
});

appointmentSchema.index({ userId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ createdAt: -1 });

appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['pending', 'confirmed'] } 
    }
  }
);

appointmentSchema.virtual('appointmentDateTime').get(function() {
  const appointmentDate = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return appointmentDate;
});

appointmentSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const appointmentDateTime = this.appointmentDateTime;
  return appointmentDateTime > now && (this.status === 'pending' || this.status === 'confirmed');
});

appointmentSchema.virtual('canBeCancelled').get(function() {
  const now = new Date();
  const appointmentDateTime = this.appointmentDateTime;
  const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return (this.status === 'pending' || this.status === 'confirmed') && 
         hoursDifference >= 24;
});

appointmentSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('doctorId', 'name specialty location.hospital contact.phone')
    .sort({ date: -1, time: -1 });
};
appointmentSchema.statics.findByDoctor = function(doctorId, status = null) {
  const query = { doctorId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('userId', 'name')
    .sort({ date: -1, time: -1 });
};
appointmentSchema.statics.hasConflict = function(doctorId, date, time, excludeId = null) {
  const query = {
    doctorId,
    date,
    time,
    status: { $in: ['pending', 'confirmed'] }
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query);
};
appointmentSchema.statics.getUpcomingAppointments = function(days = 7) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.find({
    date: { $gte: today, $lte: futureDate },
    status: { $in: ['pending', 'confirmed'] }
  })
  .populate('userId', 'name')
  .populate('doctorId', 'name specialty')
  .sort({ date: 1, time: 1 });
};
appointmentSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('status')) {
    switch (this.status) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
    }
  }
  
  next();
});
appointmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Appointment', appointmentSchema); 
