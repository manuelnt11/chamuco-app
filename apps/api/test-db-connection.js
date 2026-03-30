#!/usr/bin/env node

// Use postgres.js driver (same as drizzle-orm)
const postgres = require('postgres');

async function testConnection() {
  console.log('🔍 Testing database connection...');

  // Determine connection options
  let connectionOptions;

  // Cloud Run uses unix socket
  if (process.env.NODE_ENV === 'production' && process.env.K_SERVICE) {
    console.log('📍 Cloud Run environment detected');
    connectionOptions = {
      host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
      database: 'chamuco_prod',
      user: 'chamuco-api-sa',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };
    console.log('  Host (unix socket):', connectionOptions.host);
    console.log('  Database:', connectionOptions.database);
    console.log('  User:', connectionOptions.user);
  } else {
    // Local development
    console.log('📍 Local development environment');
    console.log('  DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 80));
    connectionOptions = {
      ...postgres(process.env.DATABASE_URL).options,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    };
  }

  const sql = postgres(connectionOptions);

  try {
    console.log('📡 Attempting to connect...');

    console.log('🔍 Running test query...');
    const result = await sql`SELECT version()`;
    console.log('✅ Query result:', result[0].version.substring(0, 50) + '...');

    console.log('🔍 Checking current user...');
    const userResult = await sql`SELECT current_user, current_database()`;
    console.log('✅ Current user:', userResult[0].current_user);
    console.log('✅ Current database:', userResult[0].current_database);

    console.log('🔍 Checking schema permissions...');
    const permResult = await sql`
      SELECT
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_schema_privilege(current_user, 'public', 'USAGE') as can_usage,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create
    `;
    console.log('✅ Permissions:', permResult[0]);

    await sql.end();

    console.log('✅ All connection tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    console.error('Error stack:', error.stack);

    await sql.end();
    process.exit(1);
  }
}

testConnection();
