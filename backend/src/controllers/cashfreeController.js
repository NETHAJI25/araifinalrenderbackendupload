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

// ─── Payments table compatibility ───────────────────────────────────────────
// The `payments` table only has: id, user_id, amount, currency, status,
// reference, created_at, updated_at. Cashfree-specific fields (our order id,
// Cashfree order id, payment session id, round, team id, method) are stored as
// a JSON object inside the existing `reference` text column.
function encodeMeta(meta) {
  return JSON.stringify(meta);
}

function parseMeta(reference) {
  if (!reference) return {};
  try {
    const parsed = JSON.parse(reference);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch (_) {
    /* legacy / non-JSON reference (e.g. "REF123") */
  }
  return {};
}

function publicPayment(row) {
  const meta = parseMeta(row.reference);
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    reference: row.reference,
    orderId: meta.orderId || null,
    cfOrderId: meta.cfOrderId || null,
    paymentSessionId: meta.paymentSessionId || null,
    cfPaymentId: meta.cfPaymentId || null,
    round: meta.round ?? 1,
    teamId: meta.teamId || null,
    method: meta.method || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPaymentByOrderId(userId, orderId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).find((p) => parseMeta(p.reference).orderId === orderId) || null;
}

async function hasPaidRound(userId, round) {
  const { data, error } = await supabase
    .from('payments')
    .select('reference')
    .eq('user_id', userId)
    .eq('status', 'paid');
  if (error) throw new Error(error.message);
  return (data || []).some((p) => (parseMeta(p.reference).round ?? 1) === round);
}

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

async function markPaymentPaid(payment, meta, cfPaymentId, method) {
  const updatedMeta = {
    ...meta,
    cfPaymentId: cfPaymentId || meta.cfPaymentId || null,
    method: method || meta.method || null,
  };
  await supabase
    .from('payments')
    .update({ status: 'paid', reference: encodeMeta(updatedMeta), updated_at: new Date().toISOString() })
    .eq('id', payment.id);
  await syncUserPaymentStatus(payment.user_id, 'paid');
  await syncTeamMemberPayment(payment.user_id);
}

function mapCashfreeStatus(cfOrderStatus, current) {
  if (cfOrderStatus === 'PAID') return 'paid';
  if (cfOrderStatus === 'EXPIRED') return 'expired';
  if (cfOrderStatus === 'ACTIVE') return 'initiated';
  return current;
}

// ─── Create order ────────────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res) => {
  try {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway is not configured on the server. Please contact the organizer.',
      });
    }

    const userId = req.user.userId;
    const { amount, round = 1 } = req.body;
    const roundNum = Number(round) === 2 ? 2 : 1;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw new Error(userError.message);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (await hasPaidRound(userId, roundNum)) {
      return res.status(400).json({ success: false, message: 'Payment already completed for this round' });
    }

    const paymentId = uuidv4();
    const orderId = `IA26_${Date.now()}_${paymentId.slice(0, 8)}`;
    const now = new Date().toISOString();
    const roundAmount = Number(amount) || (roundNum === 1 ? 100 : 200);

    const { data: teamData } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle();
    const teamId = teamData?.team_id || null;

    const meta = {
      orderId,
      cfOrderId: null,
      paymentSessionId: null,
      cfPaymentId: null,
      round: roundNum,
      teamId,
      method: null,
    };

    const { error: insertError } = await supabase.from('payments').insert({
      id: paymentId,
      user_id: userId,
      amount: roundAmount,
      currency: 'INR',
      status: 'created',
      reference: encodeMeta(meta),
      created_at: now,
      updated_at: now,
    });
    if (insertError) throw new Error(insertError.message);

    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.innovators-arena-tau.site').split(',')[0].trim();
    const returnUrl = `${frontendUrl}/dashboard/team?payment=success&order_id=${orderId}`;
    const notifyUrl = `${process.env.RENDER_EXTERNAL_URL || 'https://araifinalrenderbackendupload.onrender.com'}/api/payments/webhook`;

    let orderResult;
    try {
      orderResult = await cashfree.PGCreateOrder({
        order_amount: roundAmount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: userId,
          customer_phone: user.phone,
          customer_email: user.email,
          customer_name: user.name,
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: notifyUrl,
          payment_methods: 'cc,dc,nb,upi,app,paylater,cardlessemi',
        },
        order_note: `Innovators Arena 2.0 - Round ${roundNum} Registration Fee`,
      });
    } catch (cfErr) {
      await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentId);
      console.error('Cashfree PGCreateOrder failed:', cfErr?.response?.data || cfErr?.message || cfErr);
      return res.status(502).json({
        success: false,
        message: 'Unable to start the payment with the gateway. Please try again or contact the organizer.',
      });
    }

    if (!orderResult.data || orderResult.error) {
      await supabase.from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', paymentId);
      console.error('Cashfree order error:', orderResult.error);
      return res.status(502).json({
        success: false,
        message: 'Unable to start the payment with the gateway. Please try again or contact the organizer.',
        error: orderResult.error?.message,
      });
    }

    const cfOrder = orderResult.data;
    meta.cfOrderId = cfOrder.cf_order_id;
    meta.paymentSessionId = cfOrder.payment_session_id;
    await supabase
      .from('payments')
      .update({ reference: encodeMeta(meta), status: 'initiated', updated_at: new Date().toISOString() })
      .eq('id', paymentId);

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
        returnUrl,
      },
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment creation', error: error.message });
  }
};

// ─── Get status ──────────────────────────────────────────────────────────────
exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const payment = await getPaymentByOrderId(userId, orderId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const meta = parseMeta(payment.reference);
    let status = payment.status;
    let cfPaymentId = meta.cfPaymentId || null;

    if (meta.cfOrderId) {
      const orderResult = await cashfree.PGFetchOrder(meta.cfOrderId);
      if (orderResult.data) {
        const cfOrder = orderResult.data;
        status = mapCashfreeStatus(cfOrder.order_status, payment.status);
        cfPaymentId = cfOrder.payments?.[0]?.cf_payment_id || cfPaymentId;
        if (status === 'paid' && payment.status !== 'paid') {
          await markPaymentPaid(payment, meta, cfPaymentId, cfOrder.payments?.[0]?.payment_method);
        } else if (status !== payment.status) {
          await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', payment.id);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { ...publicPayment({ ...payment, status }), status, cfPaymentId },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── My payments ─────────────────────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.status(200).json({ success: true, data: (data || []).map(publicPayment) });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── Webhook ─────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);

    let signatureOk = false;
    if (signature && timestamp && process.env.CASHFREE_SECRET_KEY) {
      try {
        signatureOk = !!cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
      } catch (err) {
        signatureOk = false;
      }
    }

    const data = req.body?.data || req.body || {};
    const orderNode = data.order || {};
    const paymentNode = data.payment || {};
    const merchantOrderId = orderNode.order_id || data.order_id;
    const cfOrderId = orderNode.cf_order_id || data.cf_order_id;

    if (!merchantOrderId && !cfOrderId) {
      return res.status(200).json({ success: true, message: 'Ignored (no order id)' });
    }

    const { data: rows, error } = await supabase
      .from('payments')
      .select('*')
      .in('status', ['created', 'initiated'])
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const payment = (rows || []).find((p) => {
      const m = parseMeta(p.reference);
      return (merchantOrderId && m.orderId === merchantOrderId) || (cfOrderId && m.cfOrderId === cfOrderId);
    });

    if (!payment) {
      console.warn('Webhook: payment not found for order', merchantOrderId || cfOrderId);
      return res.status(200).json({ success: true, message: 'Webhook processed (payment not found)' });
    }

    const meta = parseMeta(payment.reference);

    // Authoritative server-to-server verification: only trust Cashfree.
    if (meta.cfOrderId) {
      const orderResult = await cashfree.PGFetchOrder(meta.cfOrderId);
      if (!orderResult.data || orderResult.data.order_status !== 'PAID') {
        return res.status(200).json({ success: true, message: 'Order not paid yet' });
      }
    } else if (!signatureOk) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    await markPaymentPaid(
      payment,
      meta,
      paymentNode.cf_payment_id || data.cf_payment_id,
      paymentNode.payment_method || data.payment_method
    );

    console.log(`Payment ${payment.id} marked as paid via webhook`);
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

// ─── Verify ──────────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.body;

    const payment = await getPaymentByOrderId(userId, orderId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const meta = parseMeta(payment.reference);
    if (!meta.cfOrderId) {
      return res.status(400).json({ success: false, message: 'No Cashfree order associated' });
    }

    const orderResult = await cashfree.PGFetchOrder(meta.cfOrderId);
    if (!orderResult.data) {
      return res.status(500).json({ success: false, message: 'Failed to fetch order from Cashfree' });
    }

    const cfOrder = orderResult.data;
    const status = mapCashfreeStatus(cfOrder.order_status, payment.status);
    const cfPaymentId = cfOrder.payments?.[0]?.cf_payment_id || meta.cfPaymentId || null;

    if (status === 'paid' && payment.status !== 'paid') {
      await markPaymentPaid(payment, meta, cfPaymentId, cfOrder.payments?.[0]?.payment_method);
    } else if (status !== payment.status) {
      await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', payment.id);
    }

    res.status(200).json({
      success: true,
      data: { ...publicPayment({ ...payment, status }), status, cfPaymentId },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
