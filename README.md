# Doctor Appointment Booking API

A comprehensive RESTful API for doctor appointment booking system built with Node.js, Express.js, MongoDB, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**
  - JWT access and refresh tokens
  - Role-based access control (Admin/User)
  - Rate limiting on login attempts
  - Password hashing with bcrypt

- **Core Entities**
  - Users (Admin/Regular Users) with email authentication
  - Doctors (with specialties, availability, location, contact info)
  - Appointments (booking, status management, conflict prevention)

- **Advanced Features**
  - Search and filter doctors by specialty, location
  - Smart appointment scheduling with availability checking
  - Time conflict prevention
  - Pagination support
  - Input validation with express-validator
  - API documentation with Swagger
  - Rate limiting and security headers
  - Error handling and logging

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest (configured)

## 📁 Project Structure

```
backend/
├── config/
│   ├── config.js              # Environment configuration
│   └── database.js            # MongoDB connection
├── controllers/
│   ├── authController.js      # Authentication controllers
│   ├── doctorController.js    # Doctor management controllers
│   └── appointmentController.js # Appointment controllers
├── middleware/
│   ├── auth.js                # Authentication middleware
│   └── validation.js          # Request validation middleware
├── models/
│   ├── User.js                # User model with email authentication
│   ├── Doctor.js              # Doctor model (no email field)
│   └── Appointment.js         # Appointment model with timestamps
├── routes/
│   ├── auth.js                # Authentication routes
│   ├── doctors.js             # Doctor routes
│   └── appointments.js        # Appointment routes
├── services/
│   ├── authService.js         # Authentication business logic
│   ├── doctorService.js       # Doctor business logic
│   └── appointmentService.js  # Appointment business logic
├── scripts/
│   └── seedDatabase.js        # Database seeding script
├── utils/
│   └── jwt.js                 # JWT utilities
├── package.json
├── server.js                  # Main server file
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/doctor-appointment-db

# JWT Secrets (Use strong, random secrets in production)
JWT_ACCESS_SECRET=your_jwt_access_secret_here_make_it_long_and_secure_12345
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_make_it_long_and_secure_67890
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas, ensure your connection string is correct in .env
```

### 4. Seed the Database (Optional)

```bash
npm run seed
```

This will create sample users, doctors, and appointments.

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Doctors
- `GET /api/doctors` - List all doctors (Public access with pagination & filters)
- `POST /api/doctors` - Create new doctor (Admin only)
- `PUT /api/doctors/:id` - Update doctor (Admin only)
- `DELETE /api/doctors/:id` - Delete doctor (Admin only)

### Appointments
- `POST /api/appointments` - Book appointment (User)
- `GET /api/appointments` - Get appointments (User: own, Admin: all)
- `PATCH /api/appointments/:id/status` - Update appointment status (Admin)

## 🗄️ Data Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (admin/user, default: user),
  isActive: Boolean (default: true),
  lastLogin: Date,
  refreshTokens: Array
}
```

### Doctor Schema
```javascript
{
  name: String (required),
  specialty: String (required, enum),
  qualifications: String (required),
  experience: Number (required),
  availability: [{
    day: String (required, Monday-Sunday),
    startTime: String (required, HH:MM format),
    endTime: String (required, HH:MM format)
  }],
  location: {
    hospital: String (required),
    address: String (required),
    city: String (required),
    state: String (required),
    zipCode: String (required, format: 12345 or 12345-6789)
  },
  contact: {
    phone: String (required, format: +1-555-0123)
  },
  consultationFee: Number (required),
  rating: Number (0-5, default: 0),
  totalReviews: Number (default: 0),
  isActive: Boolean (default: true)
}
```

### Appointment Schema
```javascript
{
  userId: ObjectId (required, ref: User),
  doctorId: ObjectId (required, ref: Doctor),
  date: Date (required, cannot be in past),
  time: String (required, HH:MM format),
  status: String (pending/confirmed/cancelled/completed),
  reason: String (required, max 500 chars),
  notes: String (optional, max 1000 chars),
  symptoms: Array of Strings (optional),
  consultationFee: Number (required),
  paymentStatus: String (pending/paid/refunded),
  cancellationReason: String (required if cancelled),
  cancelledBy: String (user/doctor/admin),
  cancelledAt: Date,
  confirmedAt: Date,
  completedAt: Date
}
```

## 🔒 Authentication Flow

1. **Register/Login**: User receives access token (15min) and refresh token (7 days)
2. **API Requests**: Include `Authorization: Bearer <access_token>` header
3. **Token Refresh**: Use refresh token to get new access token when expired
4. **Role-based Access**: Admin vs User permissions enforced

## 🛡️ Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive validation with express-validator
- **NoSQL Injection Protection**: MongoDB built-in protections
- **XSS Protection**: Helmet middleware
- **CORS Configuration**: Controlled cross-origin requests
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Signed tokens with expiration

## 🎯 Query Parameters

### Doctor Listing
```
GET /api/doctors?page=1&limit=10&sort=name&order=asc&specialty=Cardiology&search=john
```

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (name, specialty, rating, experience, consultationFee, createdAt)
- `order`: Sort order (asc/desc, default: desc)
- `search`: Search in name, specialty, location
- `specialty`: Filter by specialty

### Appointment Listing (Admin)
```
GET /api/appointments?page=1&limit=10&status=pending&doctorId=123&dateFrom=2024-01-01&dateTo=2024-12-31
```

## 📊 Sample Data

### Default Users (created by seed script)
- **Admin**: admin@doctorapp.com / password123
- **User**: user@doctorapp.com / password123

### Sample Doctors
The seed script creates 5 sample doctors across different specialties with realistic availability schedules.

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-appointment-db
JWT_ACCESS_SECRET=very_long_and_secure_secret_for_production
JWT_REFRESH_SECRET=another_very_long_and_secure_secret_for_production
FRONTEND_URL=https://yourdomain.com
```

### Deployment Considerations
- Use environment variables for all sensitive data
- Enable MongoDB authentication
- Use HTTPS in production
- Set up proper logging and monitoring
- Configure rate limiting based on your needs
- Use a process manager like PM2

## 🐛 Error Handling

The API returns consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message",
      "value": "submitted value"
    }
  ]
}
```

## 📝 API Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {  // For paginated responses
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 