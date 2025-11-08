// Minimal user model helpers for Postgres. Extend as needed.
const pool = require('../../db');

async function findByEmail(email) {
  const result = await pool.query('SELECT id, email, created_at FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function create(email) {
  const result = await pool.query('INSERT INTO users(email, created_at) VALUES($1, NOW()) RETURNING id, email', [email]);
  return result.rows[0];
}

module.exports = { findByEmail, create };
