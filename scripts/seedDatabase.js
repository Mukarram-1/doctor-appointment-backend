const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'User123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'User123',
    role: 'user'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'User123',
    role: 'user'
  }
];

const sampleDoctors = [
  {
    name: 'Dr. Sarah Wilson',
    specialty: 'Cardiology',
    qualifications: 'MD, FACC - Harvard Medical School',
    experience: 15,
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' }
    ],
    location: {
      hospital: 'City General Hospital',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    contact: {
      phone: '+1-555-0101',
      email: 'dr.wilson@citygeneral.com'
    },
    consultationFee: 200,
    rating: 4.8,
    totalReviews: 124
  },
  {
    name: 'Dr. Michael Brown',
    specialty: 'Dermatology',
    qualifications: 'MD, Dermatology Board Certified - Stanford University',
    experience: 12,
    availability: [
      { day: 'Monday', startTime: '08:00', endTime: '16:00' },
      { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
      { day: 'Wednesday', startTime: '08:00', endTime: '16:00' },
      { day: 'Friday', startTime: '08:00', endTime: '16:00' }
    ],
    location: {
      hospital: 'Metro Skin Clinic',
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210'
    },
    contact: {
      phone: '+1-555-0102',
      email: 'dr.brown@metroskin.com'
    },
    consultationFee: 150,
    rating: 4.6,
    totalReviews: 89
  },
  {
    name: 'Dr. Emily Davis',
    specialty: 'Pediatrics',
    qualifications: 'MD, Pediatrics - Johns Hopkins University',
    experience: 10,
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '18:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00' },
      { day: 'Friday', startTime: '09:00', endTime: '18:00' },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00' }
    ],
    location: {
      hospital: 'Children\'s Health Center',
      address: '789 Pine Street',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    },
    contact: {
      phone: '+1-555-0103',
      email: 'dr.davis@childrenshealth.com'
    },
    consultationFee: 120,
    rating: 4.9,
    totalReviews: 156
  },
  {
    name: 'Dr. Robert Lee',
    specialty: 'Orthopedics',
    qualifications: 'MD, Orthopedic Surgery - Mayo Clinic',
    experience: 18,
    availability: [
      { day: 'Tuesday', startTime: '07:00', endTime: '15:00' },
      { day: 'Wednesday', startTime: '07:00', endTime: '15:00' },
      { day: 'Thursday', startTime: '07:00', endTime: '15:00' },
      { day: 'Friday', startTime: '07:00', endTime: '15:00' }
    ],
    location: {
      hospital: 'Sports Medicine Institute',
      address: '321 Sports Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101'
    },
    contact: {
      phone: '+1-555-0104',
      email: 'dr.lee@sportsmed.com'
    },
    consultationFee: 250,
    rating: 4.7,
    totalReviews: 203
  },
  {
    name: 'Dr. Lisa Anderson',
    specialty: 'General Medicine',
    qualifications: 'MD, Internal Medicine - UCLA',
    experience: 8,
    availability: [
      { day: 'Monday', startTime: '08:30', endTime: '17:30' },
      { day: 'Tuesday', startTime: '08:30', endTime: '17:30' },
      { day: 'Wednesday', startTime: '08:30', endTime: '17:30' },
      { day: 'Thursday', startTime: '08:30', endTime: '17:30' },
      { day: 'Friday', startTime: '08:30', endTime: '17:30' }
    ],
    location: {
      hospital: 'Community Health Clinic',
      address: '654 Community Blvd',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101'
    },
    contact: {
      phone: '+1-555-0105',
      email: 'dr.anderson@community.com'
    },
    consultationFee: 100,
    rating: 4.5,
    totalReviews: 76
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const users = [];
    
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      users.push({
        ...userData,
        password: hashedPassword
      });
    }
    
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Seed doctors
const seedDoctors = async () => {
  try {
    const createdDoctors = await Doctor.insertMany(sampleDoctors);
    console.log(`${createdDoctors.length} doctors created`);
    return createdDoctors;
  } catch (error) {
    console.error('Error seeding doctors:', error);
    throw error;
  }
};

// Seed appointments
const seedAppointments = async (users, doctors) => {
  try {
    const appointments = [];
    const regularUsers = users.filter(user => user.role === 'user');
    
    // Create some sample appointments
    const sampleAppointments = [
      {
        userId: regularUsers[0]._id,
        doctorId: doctors[0]._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        time: '10:00',
        reason: 'Regular cardiology checkup',
        notes: 'Patient has history of heart murmur',
        symptoms: ['chest pain', 'shortness of breath'],
        consultationFee: doctors[0].consultationFee,
        status: 'confirmed'
      },
      {
        userId: regularUsers[1]._id,
        doctorId: doctors[1]._id,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        time: '14:00',
        reason: 'Skin consultation',
        notes: 'New mole appeared last month',
        symptoms: ['skin irritation'],
        consultationFee: doctors[1].consultationFee,
        status: 'pending'
      },
      {
        userId: regularUsers[2]._id,
        doctorId: doctors[2]._id,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        time: '11:30',
        reason: 'Child vaccination',
        notes: 'Annual vaccination schedule',
        symptoms: [],
        consultationFee: doctors[2].consultationFee,
        status: 'confirmed'
      },
      {
        userId: regularUsers[0]._id,
        doctorId: doctors[3]._id,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        time: '09:00',
        reason: 'Knee pain evaluation',
        notes: 'Pain after running injury',
        symptoms: ['knee pain', 'swelling'],
        consultationFee: doctors[3].consultationFee,
        status: 'pending'
      },
      {
        userId: regularUsers[1]._id,
        doctorId: doctors[4]._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        time: '15:00',
        reason: 'Annual physical exam',
        notes: 'Complete physical examination',
        symptoms: [],
        consultationFee: doctors[4].consultationFee,
        status: 'completed'
      },
      {
        userId: regularUsers[2]._id,
        doctorId: doctors[0]._id,
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        time: '16:00',
        reason: 'Follow-up consultation',
        notes: 'Follow-up after previous treatment',
        symptoms: ['fatigue'],
        consultationFee: doctors[0].consultationFee,
        status: 'confirmed'
      }
    ];
    
    const createdAppointments = await Appointment.insertMany(sampleAppointments);
    console.log(`${createdAppointments.length} appointments created`);
    return createdAppointments;
  } catch (error) {
    console.error('Error seeding appointments:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed data
    const users = await seedUsers();
    const doctors = await seedDoctors();
    const appointments = await seedAppointments(users, doctors);
    
    console.log('\n=== DATABASE SEEDING COMPLETED ===');
    console.log('Sample accounts created:');
    console.log('Admin: admin@example.com / Admin123');
    console.log('User 1: john@example.com / User123');
    console.log('User 2: jane@example.com / User123');
    console.log('User 3: mike@example.com / User123');
    console.log('\nYou can now start the server and test the API!');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, clearDatabase }; 