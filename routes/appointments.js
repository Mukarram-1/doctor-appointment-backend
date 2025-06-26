const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticate, adminOnly, authenticated } = require('../middleware/auth');
const {
  validateAppointment,
  validateAppointmentStatus,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - doctorId
 *         - date
 *         - time
 *         - reason
 *       properties:
 *         doctorId:
 *           type: string
 *           description: Doctor's ObjectId
 *         date:
 *           type: string
 *           format: date
 *           description: Appointment date (YYYY-MM-DD)
 *         time:
 *           type: string
 *           pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Appointment time (HH:MM)
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for appointment
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes
 *         symptoms:
 *           type: array
 *           items:
 *             type: string
 *           description: List of symptoms
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Appointment status
 *         consultationFee:
 *           type: number
 *           minimum: 0
 *           description: Consultation fee
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, refunded]
 *           description: Payment status
 */

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment (User only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - time
 *               - reason
 *             properties:
 *               doctorId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
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
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Doctor not found
 *       409:
 *         description: Time slot conflict
 */
router.post('/', authenticated, validateAppointment, appointmentController.bookAppointment);

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get appointments (User: own appointments, Admin: all appointments)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by status
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Show only upcoming appointments
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor (Admin only)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (Admin only)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (Admin only)
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/', authenticated, validatePagination, appointmentController.getAppointments);

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     summary: Get current user's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *         description: Filter by status
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Show only upcoming appointments
 *     responses:
 *       200:
 *         description: User appointments retrieved successfully
 */
router.get('/my', authenticated, validatePagination, appointmentController.getMyAppointments);

/**
 * @swagger
 * /api/appointments/stats:
 *   get:
 *     summary: Get appointment statistics (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter by doctor
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', adminOnly, appointmentController.getAppointmentStats);

/**
 * @swagger
 * /api/appointments/upcoming:
 *   get:
 *     summary: Get upcoming appointments (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Upcoming appointments retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/upcoming', adminOnly, appointmentController.getUpcomingAppointments);

/**
 * @swagger
 * /api/appointments/user/{userId}:
 *   get:
 *     summary: Get specific user's appointment history (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User appointment history retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/user/:userId', adminOnly, validateObjectId('userId'), validatePagination, appointmentController.getUserAppointmentHistory);

/**
 * @swagger
 * /api/appointments/doctor/{doctorId}:
 *   get:
 *     summary: Get specific doctor's appointments (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor appointments retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/doctor/:doctorId', adminOnly, validateObjectId('doctorId'), validatePagination, appointmentController.getDoctorAppointments);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 */
router.get('/:id', authenticated, validateObjectId('id'), appointmentController.getAppointmentById);

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *               cancellationReason:
 *                 type: string
 *                 description: Required when status is 'cancelled'
 *               cancelledBy:
 *                 type: string
 *                 enum: [user, doctor, admin]
 *                 description: Who cancelled the appointment
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Appointment not found
 */
router.patch('/:id/status', adminOnly, validateObjectId('id'), validateAppointmentStatus, appointmentController.updateAppointmentStatus);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   patch:
 *     summary: Cancel appointment (User can cancel own, Admin can cancel any)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancellationReason
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 maxLength: 200
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Cannot cancel appointment
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 */
router.patch('/:id/cancel', authenticated, validateObjectId('id'), appointmentController.cancelAppointment);

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   patch:
 *     summary: Reschedule appointment (User can reschedule own, Admin can reschedule any)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: New appointment date
 *               time:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: New appointment time
 *               reason:
 *                 type: string
 *                 description: Updated reason (optional)
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Cannot reschedule appointment
 *       403:
 *         description: Access denied
 *       404:
 *         description: Appointment not found
 *       409:
 *         description: New time slot is already booked
 */
router.patch('/:id/reschedule', authenticated, validateObjectId('id'), appointmentController.rescheduleAppointment);

module.exports = router; 