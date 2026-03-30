#!/usr/bin/env node

// In the container, pg is installed via drizzle-orm dependencies
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 80));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📡 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    console.log('🔍 Running test query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query result:', result.rows[0].version);

    console.log('🔍 Checking current user...');
    const userResult = await client.query('SELECT current_user, current_database()');
    console.log('✅ Current user:', userResult.rows[0].current_user);
    console.log('✅ Current database:', userResult.rows[0].current_database);

    console.log('🔍 Checking schema permissions...');
    const permResult = await client.query(`
      SELECT
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_schema_privilege(current_user, 'public', 'USAGE') as can_usage,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create
    `);
    console.log('✅ Permissions:', permResult.rows[0]);

    client.release();
    await pool.end();

    console.log('✅ All connection tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);

    await pool.end();
    process.exit(1);
  }
}

testConnection();
