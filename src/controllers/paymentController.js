const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');

/**
 * Map a Postgres payments row (snake_case) to the API shape (camelCase).
 */
function formatPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reference: row.reference || null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString()
  };
}

/**
 * Sync a user's paid status into their team member entry
 */
async function syncTeamMemberPayment(userId) {
  try {
    await query(`UPDATE team_members SET payment_status='paid' WHERE user_id=$1`, [userId]);
  } catch (err) {
    console.error('syncTeamMemberPayment error:', err);
  }
}

/**
 * Create a new payment
 */
exports.createPayment = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Check if user already has a completed payment
    const paidResult = await query(
      "SELECT id FROM payments WHERE user_id = $1 AND status = 'paid' LIMIT 1",
      [userId]
    );

    if (paidResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Create new payment
    const paymentId = uuidv4();
    const now = new Date().toISOString();
    const newPayment = {
      id: paymentId,
      userId: user.id,
      amount: 200,
      currency: 'INR',
      status: 'processing',
      reference: null,
      createdAt: now,
      updatedAt: now
    };

    // Save payment to database
    await query(
      `INSERT INTO payments (id, user_id, amount, currency, status, reference) VALUES ($1, $2, $3, $4, $5, $6)`,
      [paymentId, user.id, 200, 'INR', 'processing', null]
    );

    // Simulate async payment verification (in real implementation, this would be webhook from Razorpay)
    setTimeout(async () => {
      try {
        const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
        if (paymentResult.rows.length > 0) {
          const reference = `REF${Date.now()}`;
          await query(
            `UPDATE payments SET status = 'paid', reference = $1, updated_at = NOW() WHERE id = $2`,
            [reference, paymentId]
          );

          // Update user's payment status
          await query(`UPDATE users SET payment_status = 'paid' WHERE id = $1`, [userId]);

          // Sync team member entry
          await syncTeamMemberPayment(userId);
        }
      } catch (error) {
        console.error('Payment verification timeout error:', error);
      }
    }, 2000);

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: newPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment creation'
    });
  }
};

/**
 * Get payment by ID
 */
exports.getPaymentById = async (req, res) => {
  try {
    const paymentId = req.params.paymentId || req.params.id;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = formatPayment(paymentResult.rows[0]);

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get current user's payment
 */
exports.getMyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get the most recent payment
    const paymentsResult = await query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    const latestPayment =
      paymentsResult.rows.length > 0 ? formatPayment(paymentsResult.rows[0]) : null;

    res.status(200).json({
      success: true,
      data: latestPayment || null
    });
  } catch (error) {
    console.error('Get my payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Mock complete payment (for testing)
 */
exports.mockCompletePay = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRow = userResult.rows[0];
    const user = userRow;

    // Get user's most recent payment
    const paymentsResult = await query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    let payment = null;

    if (paymentsResult.rows.length > 0) {
      // Update existing payment
      const existing = paymentsResult.rows[0];
      const reference = `REF${Date.now()}`;
      const updateResult = await query(
        `UPDATE payments SET status = 'paid', reference = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [reference, existing.id]
      );
      payment = formatPayment(updateResult.rows[0]);

      // Update user's payment status
      await query(`UPDATE users SET payment_status = 'paid' WHERE id = $1`, [userId]);

      // Sync team member entry
      await query(`UPDATE team_members SET payment_status = 'paid' WHERE user_id = $1`, [userId]);
    } else {
      // Create new payment
      const paymentId = uuidv4();
      const reference = `REF${Date.now()}`;
      const insertResult = await query(
        `INSERT INTO payments (id, user_id, amount, currency, status, reference) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [paymentId, user.id, 200, 'INR', 'paid', reference]
      );
      payment = formatPayment(insertResult.rows[0]);

      // Update user's payment status
      await query(`UPDATE users SET payment_status = 'paid' WHERE id = $1`, [userId]);

      // Sync team member entry
      await query(`UPDATE team_members SET payment_status = 'paid' WHERE user_id = $1`, [userId]);
    }

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Mock complete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment completion'
    });
  }
};
