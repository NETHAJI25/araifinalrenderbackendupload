const express = require('express');
const router = express.Router();
const cashfreeController = require('../controllers/cashfreeController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/order', authenticate, cashfreeController.createPaymentOrder);
router.get('/my', authenticate, cashfreeController.getMyPayments);
router.get('/:orderId', authenticate, cashfreeController.getPaymentStatus);
router.post('/verify', authenticate, cashfreeController.verifyPayment);
router.post('/webhook', cashfreeController.handleWebhook);

module.exports = router;