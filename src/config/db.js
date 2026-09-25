const { Pool } = require('pg');
const dns = require('dns').promises;

let poolPromise = null;

function parseDatabaseUrl() {
  const u = new URL(process.env.DATABASE_URL);
  return {
    host: u.hostname,
    port: Number(u.port) || 5432,
    database: u.pathname.replace(/^\//, '') || 'postgres',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const cfg = parseDatabaseUrl();
      // Render egress has no IPv6 route: pin the pool to a resolved IPv4 address.
      // Re-resolved on every fresh boot (Render restarts often), so DNS rotation is safe.
      try {
        const v4 = await dns.resolve4(cfg.host);
        if (v4 && v4.length > 0) {
          console.log(`Postgres host ${cfg.host} resolved to IPv4 ${v4[0]}`);
          cfg.host = v4[0];
        }
      } catch (err) {
        console.warn('IPv4 pre-resolve failed, using hostname:', err.message);
      }
      const pool = new Pool({
        ...cfg,
        ssl: { rejectUnauthorized: false, servername: new URL(process.env.DATABASE_URL).hostname },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });
      pool.on('error', (err) => {
        console.error('Postgres pool error:', err.message);
      });
      return pool;
    })();
  }
  return poolPromise;
}

async function query(text, params) {
  const pool = await getPool();
  return pool.query(text, params);
}

// Lazy pool accessor for server.js health/debug checks
async function getPoolInstance() {
  return getPool();
}

module.exports = { pool: null, query, getPool: getPoolInstance };
