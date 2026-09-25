const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

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
    const { error } = await supabase
      .from('team_members')
      .update({ payment_status: 'paid' })
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a completed payment
    const { data: paidRows, error: paidError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .limit(1);
    if (paidError) throw new Error(paidError.message);

    if (paidRows && paidRows.length > 0) {
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
    const { error: insertError } = await supabase.from('payments').insert({
      id: paymentId,
      user_id: user.id,
      amount: 200,
      currency: 'INR',
      status: 'processing',
      reference: null
    });
    if (insertError) throw new Error(insertError.message);

    // Simulate async payment verification (in real implementation, this would be webhook from Razorpay)
    setTimeout(async () => {
      try {
        const { data: existingPayment, error: fetchError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .maybeSingle();
        if (fetchError) throw new Error(fetchError.message);
        if (existingPayment) {
          const reference = `REF${Date.now()}`;
          const { error: updateError } = await supabase
            .from('payments')
            .update({ status: 'paid', reference, updated_at: new Date().toISOString() })
            .eq('id', paymentId);
          if (updateError) throw new Error(updateError.message);

          // Update user's payment status
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ payment_status: 'paid' })
            .eq('id', userId);
          if (userUpdateError) throw new Error(userUpdateError.message);

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

    const { data: row, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = formatPayment(row);

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get the most recent payment
    const { data: paymentRows, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (paymentsError) throw new Error(paymentsError.message);

    const latestPayment =
      paymentRows && paymentRows.length > 0 ? formatPayment(paymentRows[0]) : null;

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
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!userRow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userRow;

    // Get user's most recent payment
    const { data: paymentRows, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (paymentsError) throw new Error(paymentsError.message);

    let payment = null;

    if (paymentRows && paymentRows.length > 0) {
      // Update existing payment
      const existing = paymentRows[0];
      const reference = `REF${Date.now()}`;
      const { data: updatedRow, error: updateError } = await supabase
        .from('payments')
        .update({ status: 'paid', reference, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);
      payment = formatPayment(updatedRow);

      // Update user's payment status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userId);
      if (userUpdateError) throw new Error(userUpdateError.message);

      // Sync team member entry
      const { error: memberUpdateError } = await supabase
        .from('team_members')
        .update({ payment_status: 'paid' })
        .eq('user_id', userId);
      if (memberUpdateError) throw new Error(memberUpdateError.message);
    } else {
      // Create new payment
      const paymentId = uuidv4();
      const reference = `REF${Date.now()}`;
      const { data: insertedRow, error: insertError } = await supabase
        .from('payments')
        .insert({
          id: paymentId,
          user_id: user.id,
          amount: 200,
          currency: 'INR',
          status: 'paid',
          reference
        })
        .select()
        .maybeSingle();
      if (insertError) throw new Error(insertError.message);
      payment = formatPayment(insertedRow);

      // Update user's payment status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userId);
      if (userUpdateError) throw new Error(userUpdateError.message);

      // Sync team member entry
      const { error: memberUpdateError } = await supabase
        .from('team_members')
        .update({ payment_status: 'paid' })
        .eq('user_id', userId);
      if (memberUpdateError) throw new Error(memberUpdateError.message);
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
