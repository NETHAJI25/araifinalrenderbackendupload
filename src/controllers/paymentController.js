const { v4: uuidv4 } = require('uuid');
const firebaseAdmin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Get Firebase Realtime Database reference
const db = firebaseAdmin.database();
const paymentsRef = db.ref('payments');
const usersRef = db.ref('users');
const teamsRef = db.ref('teams');

/**
 * Sync a user's paid status into their team member entry
 */
async function syncTeamMemberPayment(userId) {
  try {
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) return;
    const user = userSnapshot.val();
    if (!user.teamId) return;

    const teamsSnapshot = await teamsRef.orderByChild('teamId').equalTo(user.teamId).once('value');
    if (!teamsSnapshot.exists()) return;

    const updates = [];
    teamsSnapshot.forEach((childSnapshot) => {
      const teamKey = childSnapshot.key;
      const team = childSnapshot.val();
      const memberIdx = (team.members || []).findIndex((m) => m.userId === userId);
      if (memberIdx >= 0 && team.members[memberIdx].paymentStatus !== 'paid') {
        updates.push(
          teamsRef.child(teamKey).child('members').child(memberIdx).update({
            paymentStatus: 'paid'
          })
        );
        updates.push(
          teamsRef.child(teamKey).update({ updatedAt: new Date().toISOString() })
        );
      }
      return true;
    });
    await Promise.all(updates);
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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userSnapshot.val();

    // Check if user already has a completed payment
    const paymentsSnapshot = await paymentsRef.orderByChild('userId').equalTo(userId).once('value');
    let hasPaidPayment = false;
    paymentsSnapshot.forEach((paymentSnapshot) => {
      const payment = paymentSnapshot.val();
      if (payment.status === 'paid') {
        hasPaidPayment = true;
        return true;
      }
      return false;
    });

    if (hasPaidPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Create new payment
    const paymentId = uuidv4();
    const newPayment = {
      id: paymentId,
      userId: user.id,
      amount: 200,
      currency: 'INR',
      status: 'processing',
      reference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save payment to database
    await paymentsRef.child(paymentId).set(newPayment);

    // Simulate async payment verification (in real implementation, this would be webhook from Razorpay)
    setTimeout(async () => {
      try {
        const paymentRef = paymentsRef.child(paymentId);
        const paymentSnapshot = await paymentRef.once('value');
        if (paymentSnapshot.exists()) {
          const payment = paymentSnapshot.val();
          const updatedPayment = {
            ...payment,
            status: 'paid',
            reference: `REF${Date.now()}`,
            updatedAt: new Date().toISOString()
          };
          await paymentRef.set(updatedPayment);

          // Update user's payment status
          await usersRef.child(userId).update({ paymentStatus: 'paid' });

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
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    const paymentSnapshot = await paymentsRef.child(paymentId).once('value');
    if (!paymentSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = paymentSnapshot.val();

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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's payments
    const paymentsSnapshot = await paymentsRef.orderByChild('userId').equalTo(userId).once('value');
    const payments = paymentsSnapshot.exists() ? paymentsSnapshot.val() : {};

    // Get the most recent payment
    let latestPayment = null;
    let latestTimestamp = 0;

    Object.keys(payments).forEach(key => {
      const payment = payments[key];
      const timestamp = new Date(payment.createdAt).getTime();
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestPayment = { ...payment, id: key };
      }
    });

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
    const userSnapshot = await usersRef.child(userId).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's payments
    const paymentsSnapshot = await paymentsRef.orderByChild('userId').equalTo(userId).once('value');
    const payments = paymentsSnapshot.exists() ? paymentsSnapshot.val() : {};

    let paymentId = null;
    let payment = null;

    // Find existing payment
    Object.keys(payments).forEach(key => {
      const p = payments[key];
      if (p.userId === userId) {
        paymentId = key;
        payment = p;
      }
    });

    if (payment) {
      // Update existing payment
      const updatedPayment = {
        ...payment,
        status: 'paid',
        reference: `REF${Date.now()}`,
        updatedAt: new Date().toISOString()
      };
      await paymentsRef.child(paymentId).set(updatedPayment);

      // Update user's payment status
      await usersRef.child(userId).update({ paymentStatus: 'paid' });

      // Sync team member entry
      await syncTeamMemberPayment(userId);
    } else {
      // Create new payment
      paymentId = uuidv4();
      const newPayment = {
        id: paymentId,
        userId: user.id,
        amount: 200,
        currency: 'INR',
        status: 'paid',
        reference: `REF${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await paymentsRef.child(paymentId).set(newPayment);

      // Update user's payment status
      await usersRef.child(userId).update({ paymentStatus: 'paid' });

      // Sync team member entry
      await syncTeamMemberPayment(userId);

      payment = newPayment;
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