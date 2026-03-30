#!/usr/bin/env node

// Use postgres.js driver (same as drizzle-orm)
const postgres = require('postgres');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 80));

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log('📡 Attempting to connect...');

    console.log('🔍 Running test query...');
    const result = await sql`SELECT version()`;
    console.log('✅ Query result:', result[0].version);

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
