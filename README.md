# Doctor Appointment Booking API

A comprehensive RESTful API for doctor appointment booking system built with Node.js, Express.js, MongoDB, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**
  - JWT access and refresh tokens
  - Role-based access control (Admin/User)
  - Rate limiting on login attempts
  - Password hashing with bcrypt

- **Core Entities**
  - Users (Admin/Regular Users)
  - Doctors (with specialties, availability, location)
  - Appointments (booking, status management)

- **Advanced Features**
  - Email notifications for appointments
  - Search and filter doctors
  - Pagination support
  - Input validation
  - API documentation with Swagger
  - Rate limiting
  - Security headers with Helmet
  - Error handling and logging

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest, Supertest

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
│   ├── validation.js          # Request validation middleware
│   └── rateLimiter.js         # Rate limiting middleware
├── models/
│   ├── User.js                # User model
│   ├── Doctor.js              # Doctor model
│   └── Appointment.js         # Appointment model
├── routes/
│   ├── auth.js                # Authentication routes
│   ├── doctors.js             # Doctor routes
│   └── appointments.js        # Appointment routes
├── services/
│   ├── authService.js         # Authentication business logic
│   ├── doctorService.js       # Doctor business logic
│   ├── appointmentService.js  # Appointment business logic
│   └── emailService.js        # Email service
├── utils/
│   ├── jwt.js                 # JWT utilities
│   └── helpers.js             # Helper functions
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

# Email Configuration (Optional - for appointment notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Doctor Appointment System <noreply@doctorapp.com>

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

### 4. Start the Server

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
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Doctors (Admin only for CUD operations)
- `GET /api/doctors` - List all doctors (with pagination & filters)
- `POST /api/doctors` - Create new doctor (Admin only)
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/:id` - Update doctor (Admin only)
- `DELETE /api/doctors/:id` - Delete doctor (Admin only)

### Appointments
- `POST /api/appointments` - Book appointment (User)
- `GET /api/appointments` - Get appointments (User: own, Admin: all)
- `PATCH /api/appointments/:id/status` - Update appointment status (Admin)

## 🔒 Authentication Flow

1. **Register/Login**: User receives access token (15min) and refresh token (7 days)
2. **API Requests**: Include `Authorization: Bearer <access_token>` header
3. **Token Refresh**: Use refresh token to get new access token when expired
4. **Logout**: Invalidates refresh token

## 🛡️ Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Validates all incoming data
- **SQL Injection Protection**: MongoDB prevents SQL injection
- **XSS Protection**: Helmet middleware
- **CORS Configuration**: Controlled cross-origin requests
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Signed tokens with expiration

## 🎯 Query Parameters

### Doctor Listing
```
GET /api/doctors?page=1&limit=10&sort=name&order=asc&specialty=Cardiology&city=NewYork&search=john
```

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (name, specialty, rating, experience, consultationFee)
- `order`: Sort order (asc, desc)
- `specialty`: Filter by medical specialty
- `city`: Filter by city
- `search`: Search in name, specialty, hospital
- `minFee`, `maxFee`: Fee range filter

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Sample Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Book Appointment
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "date": "2024-01-15",
    "time": "10:00",
    "reason": "Regular checkup"
  }'
```

## 🚀 Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong, unique JWT secrets
- Configure proper email service
- Set up MongoDB Atlas or production database
- Configure CORS for your frontend domain

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Errors**
   - Ensure JWT secrets are set in `.env`
   - Check token expiration
   - Verify token format in requests

3. **Email Not Sending**
   - Configure email credentials in `.env`
   - Check SMTP settings
   - Ensure app passwords for Gmail

4. **Rate Limiting Issues**
   - Adjust rate limit settings in config
   - Clear rate limit if needed during development

## 📞 Support

For support, email support@doctorappointment.com or create an issue in the repository. 