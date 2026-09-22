const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', authenticate, paymentController.createPayment);
router.get('/my', authenticate, paymentController.getMyPayment);
router.get('/:id', authenticate, paymentController.getPaymentById);
router.post('/mock-complete', authenticate, paymentController.mockCompletePay);

module.exports = router;