const express = require('express');
const doctorController = require('../controllers/doctorController');
const { authenticate, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  validateDoctor,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Doctor:
 *       type: object
 *       required:
 *         - name
 *         - specialty
 *         - qualifications
 *         - experience
 *         - availability
 *         - location
 *         - contact
 *         - consultationFee
 *       properties:
 *         name:
 *           type: string
 *           description: Doctor's full name
 *         specialty:
 *           type: string
 *           enum: [Cardiology, Dermatology, Endocrinology, Gastroenterology, General Medicine, Gynecology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, Urology, Other]
 *         qualifications:
 *           type: string
 *           description: Doctor's qualifications
 *         experience:
 *           type: number
 *           description: Years of experience
 *         availability:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         location:
 *           type: object
 *           properties:
 *             hospital:
 *               type: string
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *         consultationFee:
 *           type: number
 *           minimum: 0
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         totalReviews:
 *           type: number
 *           minimum: 0
 */

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors with pagination and filters
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, specialty, rating, experience, consultationFee]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by specialty
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: minFee
 *         schema:
 *           type: number
 *         description: Minimum consultation fee
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *         description: Maximum consultation fee
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 */
router.get('/', validatePagination, validateSearch, doctorController.getAllDoctors);

/**
 * @swagger
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filter by specialty
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', validateSearch, doctorController.searchDoctors);

/**
 * @swagger
 * /api/doctors/specialties:
 *   get:
 *     summary: Get all available specialties
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Specialties retrieved successfully
 */
router.get('/specialties', doctorController.getAllSpecialties);

/**
 * @swagger
 * /api/doctors/popular:
 *   get:
 *     summary: Get popular doctors (highest rated)
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *         description: Number of doctors to return
 *     responses:
 *       200:
 *         description: Popular doctors retrieved successfully
 */
router.get('/popular', doctorController.getPopularDoctors);

/**
 * @swagger
 * /api/doctors/specialty/{specialty}:
 *   get:
 *     summary: Get doctors by specialty
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: specialty
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical specialty
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 */
router.get('/specialty/:specialty', validatePagination, doctorController.getDoctorsBySpecialty);

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create new doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', adminOnly, validateDoctor, doctorController.createDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor retrieved successfully
 *       404:
 *         description: Doctor not found
 */
router.get('/:id', validateObjectId('id'), doctorController.getDoctorById);

/**
 * @swagger
 * /api/doctors/{id}/availability:
 *   get:
 *     summary: Get doctor availability for a specific date
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Availability retrieved successfully
 *       400:
 *         description: Date is required
 *       404:
 *         description: Doctor not found
 */
router.get('/:id/availability', validateObjectId('id'), doctorController.getDoctorAvailability);

/**
 * @swagger
 * /api/doctors/{id}/stats:
 *   get:
 *     summary: Get doctor statistics (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Doctor not found
 */
router.get('/:id/stats', adminOnly, validateObjectId('id'), doctorController.getDoctorStats);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Doctor'
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Doctor not found
 */
router.put('/:id', adminOnly, validateObjectId('id'), validateDoctor, doctorController.updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       400:
 *         description: Cannot delete doctor with active appointments
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Doctor not found
 */
router.delete('/:id', adminOnly, validateObjectId('id'), doctorController.deleteDoctor);

module.exports = router; 