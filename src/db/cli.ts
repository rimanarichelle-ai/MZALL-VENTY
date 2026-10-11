import 'dotenv/config';
import { isPostgresConfigured, query, testConnection } from './client';
import { runMigrations } from './migrations';
import { migrateJsonToPostgres } from './migrateData';

async function main() {
  console.log('========================================================');
  console.log('VENTY THE COFFEE — PostgreSQL Serverless Migration CLI');
  console.log('========================================================');

  if (!isPostgresConfigured()) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    console.error('Please configure DATABASE_URL (e.g. from Neon Postgres) before running this script.');
    process.exit(1);
  }

  try {
    console.log('Step 0: Testing PostgreSQL database connection...');
    const ping = await testConnection();
    if (!ping.success) {
      throw new Error(`Database connection failed: ${ping.error}`);
    }
    console.log(`✓ Connected to PostgreSQL (${ping.latencyMs}ms latency)`);

    console.log('\nStep 1: Running DDL schema migrations...');
    const migRes = await runMigrations();
    console.log(`✓ ${migRes.message}`);

    console.log('\nStep 2: Migrating existing data from data_store/venty_loyalty_db.json...');
    const dataRes = await migrateJsonToPostgres();
    console.log(`✓ Data migration completed in ${dataRes.durationMs}ms`);
    console.log(`  - Customers: ${dataRes.customersCount}`);
    console.log(`  - Orders: ${dataRes.ordersCount}`);
    console.log(`  - Order Items: ${dataRes.orderItemsCount}`);
    console.log(`  - Transactions: ${dataRes.transactionsCount}`);
    console.log(`  - Rewards: ${dataRes.rewardsCount}`);
    console.log(`  - Store Settings: ${dataRes.settingsCount}`);

    console.log('\nStep 3: Verifying PostgreSQL tables and live record counts...');
    const tables = [
      'customers',
      'loyalty_accounts',
      'loyalty_transactions',
      'rewards',
      'orders',
      'order_items',
      'store_settings',
      'customer_sessions',
      'customer_otp_challenges',
      'audit_logs',
    ];
    for (const tbl of tables) {
      const cntRes = await query(`SELECT COUNT(*) as count FROM ${tbl}`);
      console.log(`  - ${tbl}: ${cntRes.rows[0]?.count} rows`);
    }

    console.log('\n========================================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('PostgreSQL database is now durable, normalized, and Vercel-ready.');
    console.log('========================================================');
  } catch (err: any) {
    console.error('FATAL: Database migration failed:', err?.message || err);
    process.exit(1);
  }
}

main();
