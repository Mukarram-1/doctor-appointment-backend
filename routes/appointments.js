const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticated, adminOnly } = require('../middleware/auth');
const {
  validateAppointment,
  validateAppointmentStatus,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment (User)
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
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
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
 *     summary: Get appointments (User gets own appointments, Admin gets all appointments)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/', authenticated, appointmentController.getAppointments);

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
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Appointment not found
 */
router.patch('/:id/status', adminOnly, validateObjectId('id'), validateAppointmentStatus, appointmentController.updateAppointmentStatus);

module.exports = router; 
