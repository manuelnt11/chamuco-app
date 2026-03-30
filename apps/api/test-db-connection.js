#!/usr/bin/env node

// Use pg driver for better IAM auth support
const { Pool } = require('pg');
const { getIAMToken } = require('./get-iam-token');

async function testConnection() {
  console.log('🔍 Testing database connection...');

  // Determine connection options
  let poolConfig;

  // Cloud Run uses unix socket with IAM authentication
  if (process.env.NODE_ENV === 'production' && process.env.K_SERVICE) {
    console.log('📍 Cloud Run environment detected');

    // Get IAM token for authentication (if not already set)
    let token = process.env.PGPASSWORD;
    if (!token) {
      console.log('🔑 Getting IAM authentication token...');
      token = await getIAMToken();
      console.log('✅ Token acquired');
    } else {
      console.log('✅ Using existing PGPASSWORD token');
    }

    poolConfig = {
      host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
      database: 'chamuco_prod',
      user: 'chamuco-api-sa@chamuco-app-mn.iam',  // IAM user as registered in Cloud SQL
      password: token,  // Use IAM token as password
      max: 1,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    };
    console.log('  Host (unix socket):', poolConfig.host);
    console.log('  Database:', poolConfig.database);
    console.log('  User:', poolConfig.user);
  } else {
    // Local development uses connection string
    console.log('📍 Local development environment');
    console.log('  DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 80));
    poolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 1,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    };
  }

  const pool = new Pool(poolConfig);

  try {
    console.log('📡 Attempting to connect...');
    const client = await pool.connect();

    console.log('🔍 Running test query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query result:', result.rows[0].version.substring(0, 50) + '...');

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
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    await pool.end();
    process.exit(1);
  }
}

testConnection();
