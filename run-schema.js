// One-time: create schema + seed Supabase Postgres.
// Usage: node run-schema.js "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Provide connection string as arg or DATABASE_URL env');
    process.exit(1);
  }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase Postgres');

  const schema = fs.readFileSync(path.join(__dirname, 'src', 'config', 'schema.sql'), 'utf8');
  await client.query(schema);
  console.log('Schema applied (7 tables + indexes)');

  // Seed admin user (password admin123) if missing
  const adminEmail = 'contact11induskiller@gmail.com';
  const existing = await client.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (id, name, email, password, phone, college, course, year, city, state, country, profile_completed, payment_status, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,'pending','admin')`,
      [uuidv4(), 'Admin', adminEmail, hash, '1234567890', 'Test College', 'CS', '3', 'Chennai', 'Tamil Nadu', 'India']
    );
    console.log('Admin user seeded:', adminEmail);
  } else {
    console.log('Admin user already exists');
  }

  // Seed announcements if empty
  const annCount = await client.query('SELECT COUNT(*)::int AS c FROM announcements');
  if (annCount.rows[0].c === 0) {
    const anns = [
      ['Welcome to Innovators Arena 2.0!', 'Registration is now open. Form your teams and start building!', 'Important', 'published'],
      ['Problem Statements Released', 'The official problem statements from our sponsors are now available in the dashboard.', 'Normal', 'published'],
      ['Round 1 Submission Deadline Extended', 'The deadline for Round 1 PPT submissions has been extended by 48 hours.', 'Urgent', 'published'],
    ];
    for (const [title, content, priority, status] of anns) {
      await client.query(
        'INSERT INTO announcements (id, title, content, priority, status) VALUES ($1,$2,$3,$4,$5)',
        [uuidv4(), title, content, priority, status]
      );
    }
    console.log('Announcements seeded (3)');
  } else {
    console.log('Announcements already present');
  }

  await client.end();
  console.log('Done');
}

main().catch((e) => { console.error('SEED FAIL:', e.message); process.exit(1); });
