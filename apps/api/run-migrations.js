#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 Starting manual migration execution...');

  // Connection config
  const poolConfig = {
    host: '/cloudsql/chamuco-app-mn:us-central1:chamuco-postgres',
    database: 'chamuco_prod',
    user: 'chamuco-api-sa@chamuco-app-mn.iam',
    password: process.env.PGPASSWORD,
  };

  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create drizzle schema and migrations table if not exists
    console.log('📋 Creating drizzle schema and migrations table...');
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS drizzle;
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);
    console.log('✅ Schema and table created');

    // Read migration files
    const migrationsDir = path.join(__dirname, 'src/database/migrations');
    const metaPath = path.join(migrationsDir, 'meta', '_journal.json');

    console.log('📂 Reading migration journal...');
    const journal = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    console.log(`📊 Found ${journal.entries.length} migration(s)`);

    // Check which migrations have been applied
    const { rows: appliedMigrations } = await client.query(
      'SELECT hash FROM drizzle.__drizzle_migrations'
    );
    const appliedHashes = new Set(appliedMigrations.map((r) => r.hash));
    console.log(`✅ ${appliedHashes.size} migration(s) already applied`);

    // Apply pending migrations
    let appliedCount = 0;
    for (const entry of journal.entries) {
      if (appliedHashes.has(entry.tag)) {
        console.log(`⏭️  Skipping ${entry.tag} (already applied)`);
        continue;
      }

      console.log(`▶️  Applying ${entry.tag}...`);
      const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Execute migration in a transaction
      await client.query('BEGIN');
      try {
        // Split SQL by semicolons and execute each statement
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          if (statement) {
            await client.query(statement);
          }
        }

        // Record migration
        await client.query(
          'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
          [entry.tag, Date.now()]
        );

        await client.query('COMMIT');
        console.log(`✅ Applied ${entry.tag}`);
        appliedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to apply ${entry.tag}:`, error.message);
        throw error;
      }
    }

    if (appliedCount === 0) {
      console.log('✨ No new migrations to apply');
    } else {
      console.log(`✨ Successfully applied ${appliedCount} migration(s)`);
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
