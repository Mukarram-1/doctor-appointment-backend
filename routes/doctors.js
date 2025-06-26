const express = require('express');
const doctorController = require('../controllers/doctorController');
const { adminOnly, authenticated } = require('../middleware/auth');
const {
  validateDoctor,
  validateObjectId
} = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors (Public/Protected)
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 */
router.get('/', doctorController.getAllDoctors);

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create a new doctor (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialty
 *               - qualifications
 *               - experience
 *               - availability
 *               - location
 *               - contact
 *               - consultationFee
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.post('/', adminOnly, validateDoctor, doctorController.createDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update a doctor (Admin only)
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
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Doctor not found
 */
router.put('/:id', adminOnly, validateObjectId('id'), validateDoctor, doctorController.updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete a doctor (Admin only)
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
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Doctor not found
 */
router.delete('/:id', adminOnly, validateObjectId('id'), doctorController.deleteDoctor);

module.exports = router; 
