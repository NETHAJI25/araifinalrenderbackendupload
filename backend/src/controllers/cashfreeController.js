const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { Cashfree, CFEnvironment } = require('cashfree-pg');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'SANDBOX' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);
cashfree.XApiVersion = process.env.CASHFREE_API_VERSION || '2026-01-01';

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

async function syncUserPaymentStatus(userId, status) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ payment_status: status })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('syncUserPaymentStatus error:', err);
  }
}

exports.createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, round = 1 } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { data: paidRows, error: paidError } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .limit(1);
    if (paidError) throw new Error(paidError.message);

    if (paidRows && paidRows.length > 0) {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    const paymentId = uuidv4();
    const orderId = `IA26_${Date.now()}_${paymentId.slice(0, 8)}`;
    const now = new Date().toISOString();

    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle();

    let teamId = teamData?.team_id || null;
    let roundAmount = amount || (round === 1 ? 100 : 200);

    const { error: insertError } = await supabase.from('payments').insert({
      id: paymentId,
      user_id: userId,
      team_id: teamId,
      amount: roundAmount,
      currency: 'INR',
      status: 'created',
      order_id: orderId,
      round: round,
      created_at: now,
      updated_at: now
    });
    if (insertError) throw new Error(insertError.message);

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/team?payment=success&order_id=${orderId}`;
    const notifyUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://araifinalrenderbackendupload.onrender.com'}/api/payments/webhook`;

    const orderResult = await cashfree.PGCreateOrder({
      order_amount: roundAmount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: userId,
        customer_phone: user.phone,
        customer_email: user.email,
        customer_name: user.name
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: 'cc,dc,nb,upi,app,paylater,cardlessemi'
      },
      order_note: `Innovators Arena 2.0 - Round ${round} Registration Fee`
    });

    if (!orderResult.data || orderResult.error) {
      await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentId);
      return res.status(500).json({ success: false, message: 'Failed to create payment order', error: orderResult.error?.message });
    }

    const cfOrder = orderResult.data;
    await supabase.from('payments').update({
      cf_order_id: cfOrder.cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      status: 'initiated',
      updated_at: new Date().toISOString()
    }).eq('id', paymentId);

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        paymentId,
        orderId,
        cfOrderId: cfOrder.cf_order_id,
        paymentSessionId: cfOrder.payment_session_id,
        amount: roundAmount,
        currency: 'INR',
        returnUrl
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment creation', error: error.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.cf_order_id) {
      const orderResult = await cashfree.PGFetchOrder(payment.cf_order_id);
      if (orderResult.data) {
        const cfOrder = orderResult.data;
        let newStatus = payment.status;

        if (cfOrder.order_status === 'PAID') {
          newStatus = 'paid';
        } else if (cfOrder.order_status === 'EXPIRED') {
          newStatus = 'expired';
        } else if (cfOrder.order_status === 'ACTIVE') {
          newStatus = 'initiated';
        }

        if (newStatus !== payment.status) {
          await supabase.from('payments').update({
            status: newStatus,
            updated_at: new Date().toISOString()
          }).eq('id', payment.id);

          if (newStatus === 'paid') {
            await syncUserPaymentStatus(userId, 'paid');
            await syncTeamMemberPayment(userId);
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            ...payment,
            status: newStatus,
            cf_payment_id: cfOrder.payments?.[0]?.cf_payment_id || null
          }
        });
      }
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);

    if (!signature || !timestamp) {
      console.warn('Missing webhook headers');
      return res.status(400).json({ success: false, message: 'Missing webhook headers' });
    }

    const webhookEvent = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

    if (!webhookEvent) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    console.log('Cashfree webhook received:', webhookEvent.type);

    if (webhookEvent.type === 'PAYMENT_SUCCESS' || webhookEvent.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const paymentData = webhookEvent.data;
      const cfOrderId = paymentData.order_id;
      const cfPaymentId = paymentData.cf_payment_id;
      const paymentAmount = paymentData.payment_amount;
      const paymentStatus = paymentData.payment_status;

      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('cf_order_id', cfOrderId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!payment) {
        console.warn('Payment not found for cf_order_id:', cfOrderId);
        return res.status(200).json({ success: true, message: 'Webhook processed (payment not found)' });
      }

      if (payment.status === 'paid') {
        return res.status(200).json({ success: true, message: 'Payment already processed' });
      }

      await supabase.from('payments').update({
        status: 'paid',
        cf_payment_id: cfPaymentId,
        reference: paymentData.payment_method || 'cashfree',
        updated_at: new Date().toISOString()
      }).eq('id', payment.id);

      await syncUserPaymentStatus(payment.user_id, 'paid');
      await syncTeamMemberPayment(payment.user_id);

      console.log(`Payment ${payment.id} marked as paid via webhook`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.body;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (!payment.cf_order_id) {
      return res.status(400).json({ success: false, message: 'No Cashfree order associated' });
    }

    const orderResult = await cashfree.PGFetchOrder(payment.cf_order_id);
    if (!orderResult.data) {
      return res.status(500).json({ success: false, message: 'Failed to fetch order from Cashfree' });
    }

    const cfOrder = orderResult.data;
    let newStatus = payment.status;

    if (cfOrder.order_status === 'PAID') {
      newStatus = 'paid';
    } else if (cfOrder.order_status === 'EXPIRED') {
      newStatus = 'expired';
    }

    if (newStatus !== payment.status) {
      await supabase.from('payments').update({
        status: newStatus,
        cf_payment_id: cfOrder.payments?.[0]?.cf_payment_id || null,
        updated_at: new Date().toISOString()
      }).eq('id', payment.id);

      if (newStatus === 'paid') {
        await syncUserPaymentStatus(userId, 'paid');
        await syncTeamMemberPayment(userId);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...payment,
        status: newStatus,
        cf_payment_id: cfOrder.payments?.[0]?.cf_payment_id || null
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};