import fs from 'fs';
import path from 'path';
import { transaction, isPostgresConfigured } from './client';

export interface MigrationSummary {
  customersCount: number;
  ordersCount: number;
  orderItemsCount: number;
  transactionsCount: number;
  rewardsCount: number;
  settingsCount: number;
  durationMs: number;
  sourceFile: string;
}

export const migrateJsonToPostgres = async (jsonFilePath?: string): Promise<MigrationSummary> => {
  if (!isPostgresConfigured()) {
    throw new Error('DATABASE_URL is not set. Cannot run Postgres data migration.');
  }

  const filePath =
    jsonFilePath ||
    path.resolve(process.cwd(), 'data_store', 'venty_loyalty_db.json');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Data migration source file not found at: ${filePath}`);
  }

  const startTime = Date.now();
  console.log(`[Data Migration] Reading legacy file database from ${filePath}...`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const db = JSON.parse(rawData);

  const accounts = Array.isArray(db.accounts) ? db.accounts : [];
  const transactions = Array.isArray(db.transactions) ? db.transactions : [];
  const orders = Array.isArray(db.orders) ? db.orders : [];
  const config = db.config || {};
  const storeSettings = db.storeSettings || {};
  const staffMembers = db.staffMembers || [];
  const menuOverrides = db.menuOverrides || {};

  console.log(`[Data Migration] Loaded ${accounts.length} accounts, ${orders.length} orders, ${transactions.length} transactions.`);

  let insertedCustomers = 0;
  let insertedOrders = 0;
  let insertedOrderItems = 0;
  let insertedTransactions = 0;
  let insertedRewards = 0;
  let insertedSettings = 0;

  await transaction(async (client) => {
    // 0. Ensure _schema_migrations exists and check if legacy data was already imported
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(64) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const alreadyMigrated = await client.query(
      `SELECT id FROM _schema_migrations WHERE version = $1`,
      ['v1_legacy_data_imported'],
    );

    if (alreadyMigrated.rows.length > 0) {
      console.log('[Data Migration] Legacy data has already been imported previously. Preserving existing production data.');
      return;
    }

    // 1. Insert Customers & Loyalty Accounts (ONLY IF NOT PRESENT, NEVER OVERWRITE)
    for (const acc of accounts) {
      if (!acc.customerId || !acc.phone) continue;

      const customerId = String(acc.customerId).trim();
      const name = String(acc.name || 'Valued Guest').trim();
      const phone = String(acc.phone).trim();
      const email = acc.email ? String(acc.email).trim() : null;
      const favouriteDrink = acc.favouriteDrink ? String(acc.favouriteDrink).trim() : null;
      const status = acc.loyaltyStatus || 'Active';
      const createdAt = acc.createdAt ? new Date(acc.createdAt) : new Date();
      const updatedAt = acc.updatedAt ? new Date(acc.updatedAt) : new Date();

      const existingCust = await client.query(
        `SELECT id FROM customers WHERE id = $1 OR phone = $2 LIMIT 1`,
        [customerId, phone],
      );

      if (existingCust.rows.length === 0) {
        await client.query(
          `INSERT INTO customers (id, name, phone, email, favourite_drink, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [customerId, name, phone, email, favouriteDrink, status, createdAt, updatedAt],
        );
        insertedCustomers++;
      }

      const existingAccount = await client.query(
        `SELECT customer_id FROM loyalty_accounts WHERE customer_id = $1 LIMIT 1`,
        [customerId],
      );

      if (existingAccount.rows.length === 0) {
        await client.query(
          `INSERT INTO loyalty_accounts (customer_id, current_stamp_count, lifetime_stamps, welcome_bonus_granted, status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (customer_id) DO NOTHING`,
          [
            customerId,
            Number(acc.currentStampCount || 0),
            Number(acc.lifetimeStamps || 0),
            Boolean(acc.welcomeBonusGranted),
            status,
            updatedAt,
          ],
        );
      }

      // Collect any customer rewards
      const customerRewards = [
        ...(Array.isArray(acc.availableRewards) ? acc.availableRewards : []),
        ...(Array.isArray(acc.redeemedRewards) ? acc.redeemedRewards : []),
      ];

      for (const r of customerRewards) {
        const rewardId = String(r.rewardId || r.id || `RW-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
        const rewardRes = await client.query(
          `INSERT INTO rewards (
            id, customer_id, customer_name, customer_phone, type, status,
            redemption_code, redemption_token, issued_at, expires_at, redeemed_at,
            redemption_staff_id, redemption_location
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING`,
          [
            rewardId,
            customerId,
            name,
            phone,
            r.type || 'FREE_DRINK',
            r.status || 'AVAILABLE',
            r.redemptionCode || null,
            r.redemptionToken || null,
            r.issuedAt ? new Date(r.issuedAt) : new Date(),
            r.expiresAt ? new Date(r.expiresAt) : null,
            r.redeemedAt ? new Date(r.redeemedAt) : null,
            r.redemptionStaffId || null,
            r.redemptionLocation || null,
          ],
        );
        if (rewardRes.rowCount && rewardRes.rowCount > 0) {
          insertedRewards++;
        }
      }
    }

    // 2. Insert Orders & Order Items (ONLY IF NOT PRESENT, NEVER OVERWRITE)
    for (const ord of orders) {
      const orderId = String(ord.orderId || ord.id).trim();
      if (!orderId) continue;

      let customerId: string | null = ord.customerId ? String(ord.customerId).trim() : null;
      if (customerId) {
        const custCheck = await client.query(`SELECT id FROM customers WHERE id = $1`, [customerId]);
        if (custCheck.rows.length === 0) {
          customerId = null;
        }
      }

      const existingOrder = await client.query(`SELECT id FROM orders WHERE id = $1 LIMIT 1`, [orderId]);
      if (existingOrder.rows.length > 0) {
        // Order already exists in PostgreSQL — NEVER overwrite live order state!
        continue;
      }

      const customerName = String(ord.customerName || 'Valued Guest').trim();
      const customerPhone = ord.customerPhone ? String(ord.customerPhone).trim() : null;
      const totalAmount = Number(ord.totalAmount || ord.totalDzd || 0);
      const status = String(ord.status || 'PENDING').toUpperCase();
      const pickupTime = String(ord.pickupTime || '15 mins');
      const notes = ord.notes ? String(ord.notes) : null;
      const qualifiesForLoyalty = Boolean(ord.qualifiesForLoyalty || ord.qualifiesForStamp);
      const loyaltyStampAwarded = Boolean(ord.loyaltyStampAwarded || ord.stampAwarded);
      const loyaltyStampsDelta = Number(ord.loyaltyStampsDelta || 0);
      const loyaltyTransactionId = ord.loyaltyTransactionId ? String(ord.loyaltyTransactionId) : null;
      const idempotencyKey = ord.idempotencyKey ? String(ord.idempotencyKey) : null;
      const payloadFingerprint = ord.payloadFingerprint ? String(ord.payloadFingerprint) : null;
      const createdAt = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const updatedAt = ord.updatedAt ? new Date(ord.updatedAt) : new Date();
      const completedAt = ord.completedAt ? new Date(ord.completedAt) : null;
      const cancelledAt = ord.cancelledAt ? new Date(ord.cancelledAt) : null;

      await client.query(
        `INSERT INTO orders (
          id, customer_id, customer_name, customer_phone, total_amount, status,
          pickup_time, notes, qualifies_for_loyalty, loyalty_stamp_awarded,
          loyalty_stamps_delta, loyalty_transaction_id, idempotency_key,
          payload_fingerprint, created_at, updated_at, completed_at, cancelled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          orderId,
          customerId,
          customerName,
          customerPhone,
          totalAmount,
          status,
          pickupTime,
          notes,
          qualifiesForLoyalty,
          loyaltyStampAwarded,
          loyaltyStampsDelta,
          loyaltyTransactionId,
          idempotencyKey,
          payloadFingerprint,
          createdAt,
          updatedAt,
          completedAt,
          cancelledAt,
        ],
      );
      insertedOrders++;

      const items = Array.isArray(ord.orderItems)
        ? ord.orderItems
        : Array.isArray(ord.items)
        ? ord.items
        : [];

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const itemId = String(item.id || `${orderId}_item_${idx}`);
        const productId = String(item.productId || item.id || `prod_${idx}`);
        const itemName = String(item.name || 'Artisanal Coffee');
        const category = String(item.category || 'coffee');
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const quantity = Number(item.quantity || 1);
        const lineTotal = Number(item.lineTotal || unitPrice * quantity);

        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, category, unit_price, quantity, line_total, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [itemId, orderId, productId, itemName, category, unitPrice, quantity, lineTotal, createdAt],
        );
        insertedOrderItems++;
      }
    }

    // 3. Insert Loyalty Transactions (NEVER OVERWRITE)
    for (const tx of transactions) {
      const txId = String(tx.id).trim();
      if (!txId) continue;

      let customerId = String(tx.customerId || '').trim();
      if (!customerId) continue;

      const custCheck = await client.query(`SELECT id FROM customers WHERE id = $1`, [customerId]);
      if (custCheck.rows.length === 0) continue;

      const customerName = String(tx.customerName || 'Valued Guest');
      const type = String(tx.type || 'PURCHASE_STAMP');
      const stampsDelta = Number(tx.stampsDelta || 0);
      const source = tx.source ? String(tx.source) : null;
      const status = tx.status || 'CONFIRMED';
      const idempotencyKey = tx.idempotencyKey ? String(tx.idempotencyKey) : null;
      const orderId = tx.orderId ? String(tx.orderId) : null;
      const rewardId = tx.rewardId ? String(tx.rewardId) : null;
      const note = tx.note ? String(tx.note) : null;
      const previousValue = typeof tx.previousValue === 'number' ? tx.previousValue : null;
      const newValue = typeof tx.newValue === 'number' ? tx.newValue : null;
      const createdAt = tx.timestamp ? new Date(tx.timestamp) : new Date();

      const txRes = await client.query(
        `INSERT INTO loyalty_transactions (
          id, customer_id, customer_name, type, stamps_delta, source, status,
          idempotency_key, order_id, reward_id, note, previous_value, new_value, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO NOTHING`,
        [
          txId,
          customerId,
          customerName,
          type,
          stampsDelta,
          source,
          status,
          idempotencyKey,
          orderId,
          rewardId,
          note,
          previousValue,
          newValue,
          createdAt,
        ],
      );
      if (txRes.rowCount && txRes.rowCount > 0) {
        insertedTransactions++;
      }
    }

    // 4. Store Settings & Config (ONLY INSERT MISSING, NEVER OVERWRITE LIVE CONFIG)
    const settingsMap: Record<string, any> = {
      config,
      storeSettings,
      staffMembers,
      menuOverrides,
    };

    for (const [key, val] of Object.entries(settingsMap)) {
      const setRes = await client.query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(val)],
      );
      if (setRes.rowCount && setRes.rowCount > 0) {
        insertedSettings++;
      }
    }

    // 5. Mark legacy data import as completed in _schema_migrations
    await client.query(
      `INSERT INTO _schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING`,
      ['v1_legacy_data_imported'],
    );
  });

  const durationMs = Date.now() - startTime;
  console.log(`[Data Migration Completed] in ${durationMs}ms:`);
  console.log(`  - Customers: ${insertedCustomers}`);
  console.log(`  - Orders: ${insertedOrders}`);
  console.log(`  - Order Items: ${insertedOrderItems}`);
  console.log(`  - Loyalty Transactions: ${insertedTransactions}`);
  console.log(`  - Rewards: ${insertedRewards}`);
  console.log(`  - Settings records: ${insertedSettings}`);

  return {
    customersCount: insertedCustomers,
    ordersCount: insertedOrders,
    orderItemsCount: insertedOrderItems,
    transactionsCount: insertedTransactions,
    rewardsCount: insertedRewards,
    settingsCount: insertedSettings,
    durationMs,
    sourceFile: filePath,
  };
};
