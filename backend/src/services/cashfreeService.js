const { Cashfree, CFEnvironment } = require('cashfree-pg');

const cashfree = new Cashfree(
  process.env.CASHFREE_ENV === 'SANDBOX' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);
cashfree.XApiVersion = process.env.CASHFREE_API_VERSION || '2026-01-01';

module.exports = cashfree;