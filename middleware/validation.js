const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Doctor creation/update validation
const validateDoctor = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Doctor name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('specialty')
    .notEmpty()
    .withMessage('Specialty is required')
    .isIn([
      'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
      'General Medicine', 'Gynecology', 'Neurology', 'Oncology',
      'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
      'Radiology', 'Surgery', 'Urology', 'Other'
    ])
    .withMessage('Invalid specialty'),
  
  body('qualifications')
    .trim()
    .notEmpty()
    .withMessage('Qualifications are required')
    .isLength({ max: 200 })
    .withMessage('Qualifications cannot exceed 200 characters'),
  
  body('experience')
    .isInt({ min: 0 })
    .withMessage('Experience must be a non-negative integer'),
  
  body('availability')
    .isArray({ min: 1 })
    .withMessage('At least one availability slot is required'),
  
  body('availability.*.day')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day'),
  
  body('availability.*.startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  
  body('availability.*.endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  
  body('location.hospital')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required'),
  
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('location.zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid zip code format'),
  
  body('contact.phone')
    .matches(/^\+?[\d\s\-\(\)]{10,}$/)
    .withMessage('Invalid phone number format'),
  
  body('contact.email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  handleValidationErrors
];

// Appointment creation validation
const validateAppointment = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('date')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      
      return true;
    }),
  
  body('time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format (HH:MM)'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for appointment is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array'),
  
  handleValidationErrors
];

// Appointment status update validation
const validateAppointmentStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid status'),
  
  body('cancellationReason')
    .if(body('status').equals('cancelled'))
    .notEmpty()
    .withMessage('Cancellation reason is required when cancelling appointment')
    .isLength({ max: 200 })
    .withMessage('Cancellation reason cannot exceed 200 characters'),
  
  body('cancelledBy')
    .if(body('status').equals('cancelled'))
    .isIn(['user', 'doctor', 'admin'])
    .withMessage('Invalid cancelledBy value'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (field) => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['name', 'specialty', 'rating', 'experience', 'consultationFee', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('specialty')
    .optional()
    .isIn([
      'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
      'General Medicine', 'Gynecology', 'Neurology', 'Oncology',
      'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
      'Radiology', 'Surgery', 'Urology', 'Other'
    ])
    .withMessage('Invalid specialty'),
  
  query('city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('City must be between 1 and 50 characters'),
  
  query('minFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum fee must be a positive number'),
  
  query('maxFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum fee must be a positive number'),
  
  handleValidationErrors
];

// Refresh token validation
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDoctor,
  validateAppointment,
  validateAppointmentStatus,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateRefreshToken,
  handleValidationErrors
}; 