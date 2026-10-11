import { query, transaction, isPostgresConfigured } from './client';

export interface CustomerRecord {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  favouriteDrink: string | null;
  status: string;
  currentStampCount: number;
  lifetimeStamps: number;
  welcomeBonusGranted: boolean;
  availableRewards: any[];
  redeemedRewards: any[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  totalAmount: number;
  status: string;
  pickupTime: string;
  notes: string | null;
  qualifiesForLoyalty: boolean;
  loyaltyStampAwarded: boolean;
  loyaltyStampsDelta: number;
  loyaltyTransactionId: string | null;
  idempotencyKey: string | null;
  items: OrderItemRecord[];
  orderItems: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface LoyaltyTransactionRecord {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  stampsDelta: number;
  source: string | null;
  status: string;
  idempotencyKey: string | null;
  orderId: string | null;
  rewardId: string | null;
  note: string | null;
  previousValue: number | null;
  newValue: number | null;
  createdAt: string;
}

export interface OtpChallengeRecord {
  phone: string;
  codeHash: string;
  name?: string | null;
  email?: string | null;
  favouriteDrink?: string | null;
  purpose: 'LOGIN' | 'SIGNUP';
  attemptsRemaining: number;
  expiresAt: number;
  createdAt: number;
}

export interface CustomerSessionRecord {
  sessionHash: string;
  sessionId: string;
  customerId: string;
  role: 'CUSTOMER';
  expiresAt: number;
  createdAt: string;
}

/**
 * Normalizes phone numbers to standard 10-digit format
 */
export const normalizePhone = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('213') && digits.length >= 12) {
    return '0' + digits.slice(3);
  }
  return digits;
};

// ============================================================================
// POSTGRES IMPLEMENTATION OF THE REPOSITORY
// ============================================================================

export const pgRepository = {
  // --------------------------------------------------------------------------
  // 1. Customers & Loyalty
  // --------------------------------------------------------------------------
  async getCustomerById(customerId: string): Promise<CustomerRecord | null> {
    const res = await query(
      `SELECT c.id, c.name, c.phone, c.email, c.favourite_drink, c.status, c.created_at, c.updated_at,
              COALESCE(l.current_stamp_count, 0) as current_stamp_count,
              COALESCE(l.lifetime_stamps, 0) as lifetime_stamps,
              COALESCE(l.welcome_bonus_granted, false) as welcome_bonus_granted
       FROM customers c
       LEFT JOIN loyalty_accounts l ON c.id = l.customer_id
       WHERE c.id = $1`,
      [customerId],
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    const rewardsRes = await query(
      `SELECT id, type, status, redemption_code, redemption_token, issued_at, expires_at, redeemed_at, redemption_staff_id, redemption_location
       FROM rewards WHERE customer_id = $1 ORDER BY issued_at DESC`,
      [customerId],
    );

    const availableRewards: any[] = [];
    const redeemedRewards: any[] = [];
    for (const r of rewardsRes.rows) {
      const item = {
        rewardId: r.id,
        id: r.id,
        customerId,
        customerName: row.name,
        customerPhone: row.phone,
        type: r.type,
        status: r.status,
        redemptionCode: r.redemption_code,
        redemptionToken: r.redemption_token,
        issuedAt: r.issued_at ? new Date(r.issued_at).toISOString() : null,
        expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        redeemedAt: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null,
        redemptionStaffId: r.redemption_staff_id,
        redemptionLocation: r.redemption_location,
      };
      if (r.status === 'REDEEMED') {
        redeemedRewards.push(item);
      } else {
        availableRewards.push(item);
      }
    }

    return {
      id: row.id,
      customerId: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      favouriteDrink: row.favourite_drink,
      status: row.status,
      currentStampCount: Number(row.current_stamp_count),
      lifetimeStamps: Number(row.lifetime_stamps),
      welcomeBonusGranted: Boolean(row.welcome_bonus_granted),
      availableRewards,
      redeemedRewards,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  },

  async getCustomerByPhone(phone: string): Promise<CustomerRecord | null> {
    const clean = normalizePhone(phone);
    const res = await query(`SELECT id FROM customers WHERE phone = $1`, [clean]);
    if (res.rows.length === 0) return null;
    return this.getCustomerById(res.rows[0].id);
  },

  async createCustomer(params: {
    customerId: string;
    name: string;
    phone: string;
    email?: string | null;
    favouriteDrink?: string | null;
    welcomeBonusStamps?: number;
  }): Promise<CustomerRecord> {
    const cleanPhone = normalizePhone(params.phone);
    const welcomeStamps = params.welcomeBonusStamps ?? 2;

    return await transaction(async (client) => {
      // 1. Insert customer
      await client.query(
        `INSERT INTO customers (id, name, phone, email, favourite_drink, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'Active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
        [params.customerId, params.name, cleanPhone, params.email || null, params.favouriteDrink || null],
      );

      // 2. Insert loyalty account with welcome bonus
      await client.query(
        `INSERT INTO loyalty_accounts (customer_id, current_stamp_count, lifetime_stamps, welcome_bonus_granted, status, updated_at)
         VALUES ($1, $2, $2, true, 'Active', NOW())
         ON CONFLICT (customer_id) DO NOTHING`,
        [params.customerId, welcomeStamps],
      );

      // 3. Record welcome bonus transaction
      if (welcomeStamps > 0) {
        const txId = `LTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await client.query(
          `INSERT INTO loyalty_transactions (
             id, customer_id, customer_name, type, stamps_delta, source, status,
             idempotency_key, note, previous_value, new_value, created_at
           ) VALUES ($1, $2, $3, 'WELCOME_BONUS', $4, 'SIGNUP_BONUS', 'CONFIRMED', $5, $6, 0, $4, NOW())
           ON CONFLICT (id) DO NOTHING`,
          [
            txId,
            params.customerId,
            params.name,
            welcomeStamps,
            `welcome_bonus_${params.customerId}`,
            `Welcome Bonus: +${welcomeStamps} Free Stamps on Account Signup`,
          ],
        );
      }

      const created = await this.getCustomerById(params.customerId);
      if (!created) {
        throw new Error('Failed to retrieve newly created customer.');
      }
      return created;
    });
  },

  async updateCustomerProfile(
    customerId: string,
    updates: { name?: string; email?: string | null; favouriteDrink?: string | null; phone?: string | null },
  ): Promise<CustomerRecord | null> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      sets.push(`email = $${idx++}`);
      values.push(updates.email);
    }
    if (updates.favouriteDrink !== undefined) {
      sets.push(`favourite_drink = $${idx++}`);
      values.push(updates.favouriteDrink);
    }
    if (updates.phone !== undefined) {
      sets.push(`phone = $${idx++}`);
      values.push(updates.phone);
    }

    if (sets.length === 0) return this.getCustomerById(customerId);

    sets.push(`updated_at = NOW()`);
    values.push(customerId);

    await query(
      `UPDATE customers SET ${sets.join(', ')} WHERE id = $${idx}`,
      values,
    );
    return this.getCustomerById(customerId);
  },

  // --------------------------------------------------------------------------
  // 2. Orders & Concurrency-Safe Status Transitions
  // --------------------------------------------------------------------------
  async getOrderById(orderId: string): Promise<OrderRecord | null> {
    const res = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (res.rows.length === 0) return null;
    const o = res.rows[0];

    const itemsRes = await query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC`,
      [orderId],
    );

    const items: OrderItemRecord[] = itemsRes.rows.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      name: r.name,
      category: r.category,
      unitPrice: Number(r.unit_price),
      quantity: Number(r.quantity),
      lineTotal: Number(r.line_total),
    }));

    return {
      id: o.id,
      orderId: o.id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      totalAmount: Number(o.total_amount),
      status: o.status,
      pickupTime: o.pickup_time,
      notes: o.notes,
      qualifiesForLoyalty: Boolean(o.qualifies_for_loyalty),
      loyaltyStampAwarded: Boolean(o.loyalty_stamp_awarded),
      loyaltyStampsDelta: Number(o.loyalty_stamps_delta),
      loyaltyTransactionId: o.loyalty_transaction_id,
      idempotencyKey: o.idempotency_key,
      items,
      orderItems: items,
      createdAt: new Date(o.created_at).toISOString(),
      updatedAt: new Date(o.updated_at).toISOString(),
      completedAt: o.completed_at ? new Date(o.completed_at).toISOString() : null,
      cancelledAt: o.cancelled_at ? new Date(o.cancelled_at).toISOString() : null,
    };
  },

  async getOrderByFingerprint(fingerprint: string): Promise<OrderRecord | null> {
    const res = await query(`SELECT id FROM orders WHERE payload_fingerprint = $1`, [fingerprint]);
    if (res.rows.length === 0) return null;
    return this.getOrderById(res.rows[0].id);
  },

  async getOrderByIdempotencyKey(key: string): Promise<OrderRecord | null> {
    const res = await query(`SELECT id FROM orders WHERE idempotency_key = $1`, [key]);
    if (res.rows.length === 0) return null;
    return this.getOrderById(res.rows[0].id);
  },

  async getOrders(options: {
    limit?: number;
    offset?: number;
    status?: string;
    customerId?: string;
    search?: string;
  } = {}): Promise<OrderRecord[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (options.status) {
      where.push(`status = $${idx++}`);
      values.push(options.status.toUpperCase());
    }
    if (options.customerId) {
      where.push(`customer_id = $${idx++}`);
      values.push(options.customerId);
    }
    if (options.search) {
      where.push(`(customer_name ILIKE $${idx} OR customer_phone ILIKE $${idx} OR id ILIKE $${idx})`);
      values.push(`%${options.search}%`);
      idx++;
    }

    const limit = Math.min(Math.max(options.limit || 50, 1), 200);
    const offset = Math.max(options.offset || 0, 0);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const res = await query(
      `SELECT id FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      values,
    );

    const orders: OrderRecord[] = [];
    for (const row of res.rows) {
      const ord = await this.getOrderById(row.id);
      if (ord) orders.push(ord);
    }
    return orders;
  },

  async createOrder(params: {
    orderId: string;
    customerId?: string | null;
    customerName: string;
    customerPhone?: string | null;
    pickupTime?: string;
    notes?: string | null;
    status?: string;
    qualifiesForLoyalty: boolean;
    idempotencyKey?: string;
    payloadFingerprint?: string;
    items: Array<{
      id?: string;
      productId: string;
      name: string;
      category: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }>;
  }): Promise<OrderRecord> {
    return await transaction(async (client) => {
      // 1. Check idempotency inside transaction
      if (params.idempotencyKey) {
        const existing = await client.query(`SELECT id FROM orders WHERE idempotency_key = $1`, [params.idempotencyKey]);
        if (existing.rows.length > 0) {
          const ord = await this.getOrderById(existing.rows[0].id);
          if (ord) return ord;
        }
      }

      const totalAmount = params.items.reduce((sum, item) => sum + item.lineTotal, 0);

      // Verify customer exists if specified
      let validCustomerId: string | null = params.customerId || null;
      if (validCustomerId) {
        const cCheck = await client.query(`SELECT id FROM customers WHERE id = $1`, [validCustomerId]);
        if (cCheck.rows.length === 0) validCustomerId = null;
      }

      const initialStatus = (params.status || 'PENDING').toUpperCase();

      await client.query(
        `INSERT INTO orders (
          id, customer_id, customer_name, customer_phone, total_amount, status,
          pickup_time, notes, qualifies_for_loyalty, idempotency_key, payload_fingerprint,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          params.orderId,
          validCustomerId,
          params.customerName,
          params.customerPhone || null,
          totalAmount,
          initialStatus,
          params.pickupTime || '15 mins',
          params.notes || null,
          params.qualifiesForLoyalty,
          params.idempotencyKey || null,
          params.payloadFingerprint || null,
        ],
      );

      for (let i = 0; i < params.items.length; i++) {
        const item = params.items[i];
        const itemId = item.id || `${params.orderId}_item_${i}`;
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, name, category, unit_price, quantity, line_total, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            itemId,
            params.orderId,
            item.productId,
            item.name,
            item.category,
            item.unitPrice,
            item.quantity,
            item.lineTotal,
          ],
        );
      }

      const created = await this.getOrderById(params.orderId);
      if (!created) {
        throw new Error('Failed to retrieve newly inserted order.');
      }
      return created;
    });
  },

  /**
   * ATOMIC ORDER STATUS UPDATE & LOYALTY STAMP AWARDING (STRICT ACID)
   * Guaranteed:
   * 1. Order status update
   * 2. Loyalty stamp awarded ONLY ONCE
   * 3. Reward creation when threshold reached
   * 4. Loyalty transaction ledger written
   * ALL executed inside a single PostgreSQL atomic transaction.
   */
  async updateOrderStatus(
    orderId: string,
    nextStatus: string,
    options: {
      stampsToReward?: number;
      stampsPerOrder?: number;
      allowAdminCancellation?: boolean;
      cancellationReason?: string;
      actorId?: string;
    } = {},
  ): Promise<{
    order: OrderRecord;
    loyaltyAwarded: boolean;
    loyaltyReversed?: boolean;
    customerAccount?: CustomerRecord | null;
  }> {
    const stampsToReward = options.stampsToReward || 7;
    const stampsPerOrder = options.stampsPerOrder || 1;

    return await transaction(async (client) => {
      // 1. Lock order row for update
      const ordRes = await client.query(
        `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
        [orderId],
      );
      if (ordRes.rows.length === 0) {
        throw new Error(`Order #${orderId} not found.`);
      }
      const order = ordRes.rows[0];
      const currentStatus = order.status;

      // Guard terminal states
      if (currentStatus === 'COMPLETED' && nextStatus !== 'COMPLETED') {
        if (nextStatus === 'CANCELLED' && options.allowAdminCancellation) {
          // Allowed for admin reversal
        } else {
          throw new Error(`Order #${orderId} is already COMPLETED and cannot transition backwards.`);
        }
      }
      if (currentStatus === 'CANCELLED' && nextStatus !== 'CANCELLED') {
        throw new Error(`Order #${orderId} has been CANCELLED and cannot transition backwards.`);
      }

      let loyaltyAwarded = false;
      let loyaltyReversed = false;
      let newLoyaltyTxId: string | null = order.loyalty_transaction_id;
      let customerRecord: CustomerRecord | null = null;

      // If transitioning to COMPLETED and eligible for stamp
      if (
        nextStatus === 'COMPLETED' &&
        order.qualifies_for_loyalty &&
        !order.loyalty_stamp_awarded &&
        order.customer_id
      ) {
        // Lock loyalty account
        const custRes = await client.query(
          `SELECT c.id, c.name, c.phone, l.current_stamp_count, l.lifetime_stamps
           FROM customers c
           JOIN loyalty_accounts l ON c.id = l.customer_id
           WHERE c.id = $1 FOR UPDATE`,
          [order.customer_id],
        );

        if (custRes.rows.length > 0) {
          const cust = custRes.rows[0];
          const prevStamps = Number(cust.current_stamp_count);
          const nextStamps = prevStamps + stampsPerOrder;
          const nextLifetime = Number(cust.lifetime_stamps) + stampsPerOrder;

          // Check reward threshold
          const shouldUnlockReward = nextStamps >= stampsToReward;
          const finalStamps = shouldUnlockReward ? nextStamps - stampsToReward : nextStamps;

          // Update loyalty account
          await client.query(
            `UPDATE loyalty_accounts
             SET current_stamp_count = $1, lifetime_stamps = $2, updated_at = NOW()
             WHERE customer_id = $3`,
            [finalStamps, nextLifetime, order.customer_id],
          );

          // Insert transaction ledger
          newLoyaltyTxId = `LTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await client.query(
            `INSERT INTO loyalty_transactions (
               id, customer_id, customer_name, type, stamps_delta, source, status,
               order_id, note, previous_value, new_value, created_at
             ) VALUES ($1, $2, $3, 'PURCHASE_STAMP', $4, 'ORDER_COMPLETION', 'CONFIRMED', $5, $6, $7, $8, NOW())`,
            [
              newLoyaltyTxId,
              order.customer_id,
              cust.name,
              stampsPerOrder,
              orderId,
              `Order #${orderId} completed (+${stampsPerOrder} Stamp)`,
              prevStamps,
              nextStamps,
            ],
          );

          // If unlocked reward, create reward record
          if (shouldUnlockReward) {
            const rewardId = `RW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const redemptionCode = `VENTY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const token = `rw_tok_${Math.random().toString(36).substring(2, 12)}`;
            const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

            await client.query(
              `INSERT INTO rewards (
                 id, customer_id, customer_name, customer_phone, type, status,
                 redemption_code, redemption_token, issued_at, expires_at, source_order_id, created_at, updated_at
               ) VALUES ($1, $2, $3, $4, 'FREE_DRINK', 'AVAILABLE', $5, $6, NOW(), $7, $8, NOW(), NOW())`,
              [
                rewardId,
                order.customer_id,
                cust.name,
                cust.phone,
                redemptionCode,
                token,
                expiresAt,
                orderId,
              ],
            );
          }

          loyaltyAwarded = true;
        }
      }

      // If transitioning to CANCELLED and was previously awarded a stamp
      if (nextStatus === 'CANCELLED' && order.loyalty_stamp_awarded && order.customer_id) {
        const custRes = await client.query(
          `SELECT c.id, c.name, l.current_stamp_count, l.lifetime_stamps
           FROM customers c
           JOIN loyalty_accounts l ON c.id = l.customer_id
           WHERE c.id = $1 FOR UPDATE`,
          [order.customer_id],
        );
        if (custRes.rows.length > 0) {
          const cust = custRes.rows[0];
          const deltaToReverse = Number(order.loyalty_stamps_delta || stampsPerOrder || 1);
          const prevStamps = Number(cust.current_stamp_count);
          const newStamps = Math.max(0, prevStamps - deltaToReverse);
          const newLifetime = Math.max(0, Number(cust.lifetime_stamps) - deltaToReverse);

          await client.query(
            `UPDATE loyalty_accounts
             SET current_stamp_count = $1, lifetime_stamps = $2, updated_at = NOW()
             WHERE customer_id = $3`,
            [newStamps, newLifetime, order.customer_id],
          );

          newLoyaltyTxId = `LTX-${Date.now().toString(36).toUpperCase()}-REV`;
          await client.query(
            `INSERT INTO loyalty_transactions (
               id, customer_id, customer_name, type, stamps_delta, source, status,
               order_id, note, previous_value, new_value, created_at
             ) VALUES ($1, $2, $3, 'REVERSAL', $4, 'SYSTEM', 'CONFIRMED', $5, $6, $7, $8, NOW())`,
            [
              newLoyaltyTxId,
              order.customer_id,
              cust.name,
              -deltaToReverse,
              orderId,
              `Reversal of Order #${orderId}: -${deltaToReverse} Stamp (${options.cancellationReason || 'Order cancelled'})`,
              prevStamps,
              newStamps,
            ],
          );
          loyaltyReversed = true;
        }
      }

      // Update order status
      const completedAt = nextStatus === 'COMPLETED' ? new Date() : order.completed_at;
      const cancelledAt = nextStatus === 'CANCELLED' ? new Date() : order.cancelled_at;

      await client.query(
        `UPDATE orders
         SET status = $1,
             updated_at = NOW(),
             completed_at = $2,
             cancelled_at = $3,
             loyalty_stamp_awarded = $4,
             loyalty_stamps_delta = $5,
             loyalty_transaction_id = $6
         WHERE id = $7`,
        [
          nextStatus,
          completedAt,
          cancelledAt,
          loyaltyAwarded ? true : (nextStatus === 'CANCELLED' ? false : order.loyalty_stamp_awarded),
          loyaltyAwarded ? stampsPerOrder : (nextStatus === 'CANCELLED' ? 0 : order.loyalty_stamps_delta),
          newLoyaltyTxId,
          orderId,
        ],
      );

      const updatedOrder = await this.getOrderById(orderId);
      if (order.customer_id) {
        customerRecord = await this.getCustomerById(order.customer_id);
      }

      return {
        order: updatedOrder!,
        loyaltyAwarded,
        loyaltyReversed,
        customerAccount: customerRecord,
      };
    });
  },

  // --------------------------------------------------------------------------
  // 3. Rewards & Atomic Redemption
  // --------------------------------------------------------------------------
  async redeemReward(
    rewardId: string,
    options: { staffId?: string; location?: string } = {},
  ): Promise<{ success: boolean; reward: any; message: string }> {
    return await transaction(async (client) => {
      const res = await client.query(
        `SELECT * FROM rewards WHERE id = $1 OR redemption_code = $1 FOR UPDATE`,
        [rewardId],
      );
      if (res.rows.length === 0) {
        throw new Error(`Reward #${rewardId} not found.`);
      }
      const r = res.rows[0];

      if (r.status === 'REDEEMED') {
        return {
          success: true,
          reward: r,
          message: `Reward #${r.id} has already been redeemed.`,
        };
      }

      await client.query(
        `UPDATE rewards
         SET status = 'REDEEMED',
             redeemed_at = NOW(),
             redemption_staff_id = $1,
             redemption_location = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [options.staffId || 'Staff-Amine', options.location || 'Miliana Flagship Counter', r.id],
      );

      const updatedRes = await client.query(`SELECT * FROM rewards WHERE id = $1`, [r.id]);
      return {
        success: true,
        reward: updatedRes.rows[0],
        message: `Reward #${r.id} successfully redeemed.`,
      };
    });
  },

  // --------------------------------------------------------------------------
  // 4. Serverless-Safe Sessions & OTP Challenges
  // --------------------------------------------------------------------------
  async saveCustomerSession(session: CustomerSessionRecord): Promise<void> {
    await query(
      `INSERT INTO customer_sessions (session_hash, session_id, customer_id, role, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (session_hash) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      [session.sessionHash, session.sessionId, session.customerId, session.role, session.expiresAt],
    );
  },

  async getCustomerSession(sessionHash: string): Promise<CustomerSessionRecord | null> {
    const res = await query(
      `SELECT * FROM customer_sessions WHERE session_hash = $1 AND expires_at > $2`,
      [sessionHash, Date.now()],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      sessionHash: r.session_hash,
      sessionId: r.session_id,
      customerId: r.customer_id,
      role: r.role,
      expiresAt: Number(r.expires_at),
      createdAt: new Date(r.created_at).toISOString(),
    };
  },

  async deleteCustomerSession(sessionHash: string): Promise<void> {
    await query(`DELETE FROM customer_sessions WHERE session_hash = $1`, [sessionHash]);
  },

  async saveOtpChallenge(challenge: OtpChallengeRecord): Promise<void> {
    await query(
      `INSERT INTO customer_otp_challenges (
         phone, code_hash, name, email, favourite_drink, purpose, attempts_remaining, expires_at, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (phone) DO UPDATE SET
         code_hash = EXCLUDED.code_hash,
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         favourite_drink = EXCLUDED.favourite_drink,
         purpose = EXCLUDED.purpose,
         attempts_remaining = EXCLUDED.attempts_remaining,
         expires_at = EXCLUDED.expires_at,
         created_at = EXCLUDED.created_at`,
      [
        challenge.phone,
        challenge.codeHash,
        challenge.name || null,
        challenge.email || null,
        challenge.favouriteDrink || null,
        challenge.purpose,
        challenge.attemptsRemaining,
        challenge.expiresAt,
        challenge.createdAt,
      ],
    );
  },

  async getOtpChallenge(phone: string): Promise<OtpChallengeRecord | null> {
    const res = await query(
      `SELECT * FROM customer_otp_challenges WHERE phone = $1 AND expires_at > $2`,
      [normalizePhone(phone), Date.now()],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      phone: r.phone,
      codeHash: r.code_hash,
      name: r.name,
      email: r.email,
      favouriteDrink: r.favourite_drink,
      purpose: r.purpose,
      attemptsRemaining: Number(r.attempts_remaining),
      expiresAt: Number(r.expires_at),
      createdAt: Number(r.created_at),
    };
  },

  async deleteOtpChallenge(phone: string): Promise<void> {
    await query(`DELETE FROM customer_otp_challenges WHERE phone = $1`, [normalizePhone(phone)]);
  },

  // --------------------------------------------------------------------------
  // 5. Store Settings & Audit Logs
  // --------------------------------------------------------------------------
  async getSetting<T = any>(key: string): Promise<T | null> {
    const res = await query(`SELECT value FROM store_settings WHERE key = $1`, [key]);
    if (res.rows.length === 0) return null;
    return res.rows[0].value as T;
  },

  async setSetting(key: string, value: any): Promise<void> {
    await query(
      `INSERT INTO store_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, JSON.stringify(value)],
    );
  },

  async logAudit(eventType: string, details: Record<string, any>): Promise<void> {
    try {
      await query(
        `INSERT INTO audit_logs (event_type, details, timestamp) VALUES ($1, $2, NOW())`,
        [eventType, JSON.stringify(details)],
      );
    } catch (err) {
      console.error('[Audit Log] Failed to insert audit log in Postgres:', err);
    }
  },

  // --------------------------------------------------------------------------
  // 6. Management Queries & Administrative Modifications
  // --------------------------------------------------------------------------
  async getAllCustomers(options: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<any[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (options.status && options.status !== 'ALL') {
      where.push(`c.status = $${idx++}`);
      values.push(options.status);
    }
    if (options.search) {
      where.push(`(c.name ILIKE $${idx} OR c.phone ILIKE $${idx} OR c.id ILIKE $${idx})`);
      values.push(`%${options.search}%`);
      idx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(options.limit || 100, 1), 500);
    const offset = Math.max(options.offset || 0, 0);

    const res = await query(
      `SELECT c.id, c.name, c.phone, c.email, c.favourite_drink, c.status, c.created_at, c.updated_at,
              COALESCE(l.current_stamp_count, 0) as current_stamp_count,
              COALESCE(l.lifetime_stamps, 0) as lifetime_stamps,
              COALESCE(l.welcome_bonus_granted, false) as welcome_bonus_granted,
              (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) as orders_count,
              (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.customer_id = c.id) as total_spent
       FROM customers c
       LEFT JOIN loyalty_accounts l ON c.id = l.customer_id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      values,
    );

    return res.rows.map((r) => ({
      id: r.id,
      customerId: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      favouriteDrink: r.favourite_drink,
      status: r.status,
      currentStampCount: Number(r.current_stamp_count),
      lifetimeStamps: Number(r.lifetime_stamps),
      welcomeBonusGranted: Boolean(r.welcome_bonus_granted),
      ordersCount: Number(r.orders_count || 0),
      totalSpent: Number(r.total_spent || 0),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  },

  async updateCustomerStatus(customerId: string, status: string): Promise<boolean> {
    const res = await query(`UPDATE customers SET status = $1, updated_at = NOW() WHERE id = $2`, [status, customerId]);
    return (res.rowCount || 0) > 0;
  },

  async adjustCustomerStamps(
    customerId: string,
    delta: number,
    note: string,
    actorId: string = 'ADMIN',
  ): Promise<{ success: boolean; customer: CustomerRecord | null; txId: string }> {
    return await transaction(async (client) => {
      const custRes = await client.query(
        `SELECT c.id, c.name, l.current_stamp_count, l.lifetime_stamps
         FROM customers c
         JOIN loyalty_accounts l ON c.id = l.customer_id
         WHERE c.id = $1 FOR UPDATE`,
        [customerId],
      );
      if (custRes.rows.length === 0) {
        throw new Error(`Customer #${customerId} not found.`);
      }
      const cust = custRes.rows[0];
      const prevStamps = Number(cust.current_stamp_count);
      const nextStamps = Math.max(0, prevStamps + delta);
      const prevLifetime = Number(cust.lifetime_stamps);
      const nextLifetime = delta > 0 ? prevLifetime + delta : prevLifetime;

      await client.query(
        `UPDATE loyalty_accounts
         SET current_stamp_count = $1, lifetime_stamps = $2, updated_at = NOW()
         WHERE customer_id = $3`,
        [nextStamps, nextLifetime, customerId],
      );

      const txId = `LTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await client.query(
        `INSERT INTO loyalty_transactions (
           id, customer_id, customer_name, type, stamps_delta, source, status,
           note, previous_value, new_value, created_at
         ) VALUES ($1, $2, $3, $4, $5, 'ADMIN_MANUAL_ADJUSTMENT', 'CONFIRMED', $6, $7, $8, NOW())`,
        [
          txId,
          customerId,
          cust.name,
          delta >= 0 ? 'PURCHASE_STAMP' : 'STAMP_DEDUCTION',
          delta,
          note || `Manual adjustment by ${actorId}`,
          prevStamps,
          nextStamps,
        ],
      );

      const updated = await this.getCustomerById(customerId);
      return { success: true, customer: updated, txId };
    });
  },

  async getLoyaltyTransactions(options: { customerId?: string; limit?: number } = {}): Promise<LoyaltyTransactionRecord[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (options.customerId) {
      where.push(`customer_id = $${idx++}`);
      values.push(options.customerId);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);

    const res = await query(
      `SELECT * FROM loyalty_transactions ${whereClause} ORDER BY created_at DESC LIMIT ${limit}`,
      values,
    );

    return res.rows.map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      type: r.type,
      stampsDelta: Number(r.stamps_delta),
      source: r.source,
      status: r.status,
      idempotencyKey: r.idempotency_key,
      orderId: r.order_id,
      rewardId: r.reward_id,
      note: r.note,
      previousValue: r.previous_value !== null ? Number(r.previous_value) : null,
      newValue: r.new_value !== null ? Number(r.new_value) : null,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  },

  async getRewardsList(options: { customerId?: string; status?: string; limit?: number } = {}): Promise<any[]> {
    const where: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (options.customerId) {
      where.push(`customer_id = $${idx++}`);
      values.push(options.customerId);
    }
    if (options.status) {
      where.push(`status = $${idx++}`);
      values.push(options.status.toUpperCase());
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(options.limit || 50, 1), 200);

    const res = await query(
      `SELECT * FROM rewards ${whereClause} ORDER BY issued_at DESC LIMIT ${limit}`,
      values,
    );

    return res.rows.map((r) => ({
      id: r.id,
      rewardId: r.id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      type: r.type,
      status: r.status,
      redemptionCode: r.redemption_code,
      redemptionToken: r.redemption_token,
      issuedAt: r.issued_at ? new Date(r.issued_at).toISOString() : null,
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
      redeemedAt: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null,
      redemptionStaffId: r.redemption_staff_id,
      redemptionLocation: r.redemption_location,
      sourceOrderId: r.source_order_id,
    }));
  },

  // --------------------------------------------------------------------------
  // 6. Daily Quizzes & Customer Quiz Points System
  // --------------------------------------------------------------------------
  async getTodayPublishedQuiz(dateKey: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM daily_quizzes 
       WHERE is_published = TRUE AND (date_key = $1 OR status = 'PUBLISHED')
       ORDER BY (date_key = $1) DESC, updated_at DESC LIMIT 1`,
      [dateKey],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const options = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
    return {
      id: r.id,
      title: r.title,
      question: r.question || r.title,
      options,
      correctOptionIndex: Number(r.correct_option_index) || 0,
      points: Number(r.points) || 10,
      explanation: r.explanation || '',
      description: r.description || '',
      dateKey: r.date_key,
      status: r.status,
      isPublished: Boolean(r.is_published),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  },

  async getQuizById(id: string): Promise<any | null> {
    const res = await query(`SELECT * FROM daily_quizzes WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const options = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
    return {
      id: r.id,
      title: r.title,
      question: r.question || r.title,
      options,
      correctOptionIndex: Number(r.correct_option_index) || 0,
      points: Number(r.points) || 10,
      explanation: r.explanation || '',
      description: r.description || '',
      dateKey: r.date_key,
      status: r.status,
      isPublished: Boolean(r.is_published),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  },

  async getAllQuizzes(): Promise<any[]> {
    const res = await query(
      `SELECT q.*, 
              COUNT(a.id)::int as total_attempts,
              COUNT(CASE WHEN a.is_correct THEN 1 END)::int as correct_attempts
       FROM daily_quizzes q
       LEFT JOIN quiz_attempts a ON q.id = a.quiz_id
       GROUP BY q.id
       ORDER BY q.date_key DESC, q.created_at DESC`,
    );
    return res.rows.map((r) => {
      const options = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
      const totalAttempts = Number(r.total_attempts) || 0;
      const correctAttempts = Number(r.correct_attempts) || 0;
      return {
        id: r.id,
        title: r.title,
        question: r.question || r.title,
        options,
        correctOptionIndex: Number(r.correct_option_index) || 0,
        points: Number(r.points) || 10,
        explanation: r.explanation || '',
        description: r.description || '',
        dateKey: r.date_key,
        status: r.status,
        isPublished: Boolean(r.is_published),
        hasSubmissions: totalAttempts > 0,
        stats: {
          totalAttempts,
          correctAttempts,
          accuracyRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        },
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      };
    });
  },

  async upsertQuiz(quiz: {
    id: string;
    title: string;
    question?: string;
    options: string[];
    correctOptionIndex: number;
    points: number;
    explanation?: string;
    description?: string;
    dateKey: string;
    status: string;
    isPublished: boolean;
  }): Promise<any> {
    const optionsJson = JSON.stringify(quiz.options || []);
    const questionText = quiz.question || quiz.title;
    const res = await query(
      `INSERT INTO daily_quizzes (
        id, title, question, options, correct_option_index, points,
        explanation, description, date_key, status, is_published, is_active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_option_index = EXCLUDED.correct_option_index,
        points = EXCLUDED.points,
        explanation = EXCLUDED.explanation,
        description = EXCLUDED.description,
        date_key = EXCLUDED.date_key,
        status = EXCLUDED.status,
        is_published = EXCLUDED.is_published,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *`,
      [
        quiz.id,
        quiz.title,
        questionText,
        optionsJson,
        quiz.correctOptionIndex ?? 0,
        quiz.points ?? 10,
        quiz.explanation || '',
        quiz.description || '',
        quiz.dateKey,
        quiz.status || 'DRAFT',
        Boolean(quiz.isPublished),
        true,
      ],
    );
    const r = res.rows[0];
    const opts = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
    return {
      id: r.id,
      title: r.title,
      question: r.question,
      options: opts,
      correctOptionIndex: Number(r.correct_option_index),
      points: Number(r.points),
      explanation: r.explanation,
      description: r.description,
      dateKey: r.date_key,
      status: r.status,
      isPublished: Boolean(r.is_published),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  },

  async publishQuiz(id: string, dateKey?: string): Promise<any> {
    return await transaction(async (client) => {
      // 1. Get current quiz to know dateKey if not provided
      const current = await client.query(`SELECT * FROM daily_quizzes WHERE id = $1`, [id]);
      if (current.rows.length === 0) {
        throw new Error('Quiz not found in database');
      }
      const targetDateKey = dateKey || current.rows[0].date_key;

      // 2. Unpublish any other published quizzes for the same dateKey or previous active ones
      await client.query(
        `UPDATE daily_quizzes 
         SET is_published = FALSE, status = 'UNPUBLISHED', updated_at = NOW()
         WHERE id != $1 AND (date_key = $2 OR is_published = TRUE)`,
        [id, targetDateKey],
      );

      // 3. Mark target quiz as published
      const updated = await client.query(
        `UPDATE daily_quizzes 
         SET is_published = TRUE, status = 'PUBLISHED', is_active = TRUE, date_key = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, targetDateKey],
      );
      const r = updated.rows[0];
      const opts = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
      return {
        id: r.id,
        title: r.title,
        question: r.question,
        options: opts,
        correctOptionIndex: Number(r.correct_option_index),
        points: Number(r.points),
        explanation: r.explanation,
        description: r.description,
        dateKey: r.date_key,
        status: r.status,
        isPublished: Boolean(r.is_published),
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      };
    });
  },

  async unpublishQuiz(id: string): Promise<any> {
    const res = await query(
      `UPDATE daily_quizzes 
       SET is_published = FALSE, status = 'UNPUBLISHED', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const opts = Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [];
    return {
      id: r.id,
      title: r.title,
      question: r.question,
      options: opts,
      correctOptionIndex: Number(r.correct_option_index),
      points: Number(r.points),
      explanation: r.explanation,
      description: r.description,
      dateKey: r.date_key,
      status: r.status,
      isPublished: Boolean(r.is_published),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  },

  async deleteQuiz(id: string): Promise<{ success: boolean; archived: boolean }> {
    const attempts = await query(`SELECT id FROM quiz_attempts WHERE quiz_id = $1 LIMIT 1`, [id]);
    if (attempts.rows.length > 0) {
      await query(
        `UPDATE daily_quizzes 
         SET status = 'ARCHIVED', is_published = FALSE, is_active = FALSE, updated_at = NOW()
         WHERE id = $1`,
        [id],
      );
      return { success: true, archived: true };
    }
    await query(`DELETE FROM daily_quizzes WHERE id = $1`, [id]);
    return { success: true, archived: false };
  },

  async getQuizAttempt(quizId: string, customerId: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND customer_id = $2`,
      [quizId, customerId],
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      quizId: r.quiz_id,
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      selectedOptionIndex: r.selected_option_index !== null ? Number(r.selected_option_index) : undefined,
      isCorrect: Boolean(r.is_correct),
      pointsAwarded: Number(r.points_awarded) || 0,
      score: Number(r.score) || (r.is_correct ? 1 : 0),
      totalQuestions: Number(r.total_questions) || 1,
      completedAt: new Date(r.completed_at).toISOString(),
    };
  },

  async recordQuizAttemptAndPoints(attempt: {
    id: string;
    quizId: string;
    quizTitle: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
    pointsAwarded: number;
    completedAt: string;
  }): Promise<{ attempt: any; newBalance: number }> {
    return await transaction(async (client) => {
      // 1. Insert attempt with strict unique constraint (quiz_id, customer_id)
      await client.query(
        `INSERT INTO quiz_attempts (
          id, quiz_id, customer_id, customer_name, customer_phone,
          selected_option_index, is_correct, points_awarded, score, total_questions,
          completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          attempt.id,
          attempt.quizId,
          attempt.customerId,
          attempt.customerName,
          attempt.customerPhone,
          attempt.selectedOptionIndex,
          attempt.isCorrect,
          attempt.pointsAwarded,
          attempt.isCorrect ? 1 : 0,
          1,
          attempt.completedAt,
        ],
      );

      // 2. Update quiz_point_balances atomically
      const correctInc = attempt.isCorrect ? 1 : 0;
      const balRes = await client.query(
        `INSERT INTO quiz_point_balances (
          customer_id, points_balance, total_quizzes_answered, total_correct_answers, updated_at
        ) VALUES ($1, $2, 1, $3, NOW())
        ON CONFLICT (customer_id) DO UPDATE SET
          points_balance = quiz_point_balances.points_balance + $2,
          total_quizzes_answered = quiz_point_balances.total_quizzes_answered + 1,
          total_correct_answers = quiz_point_balances.total_correct_answers + $3,
          updated_at = NOW()
        RETURNING points_balance`,
        [attempt.customerId, attempt.pointsAwarded, correctInc],
      );
      const newBalance = Number(balRes.rows[0]?.points_balance) || 0;

      // 3. If points awarded, record auditable transaction
      if (attempt.pointsAwarded > 0) {
        const txId = `QTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const idempotencyKey = `quiz_${attempt.quizId}_${attempt.customerId}`;
        await client.query(
          `INSERT INTO quiz_point_transactions (
            id, customer_id, quiz_id, quiz_title, points_delta, balance_after,
            reason, note, idempotency_key, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            txId,
            attempt.customerId,
            attempt.quizId,
            attempt.quizTitle,
            attempt.pointsAwarded,
            newBalance,
            'DAILY_QUIZ_CORRECT',
            `Correct answer on Daily Quiz: ${attempt.quizTitle} (+${attempt.pointsAwarded} pts)`,
            idempotencyKey,
          ],
        );
      }

      return { attempt, newBalance };
    });
  },

  async getCustomerQuizSummary(customerId: string): Promise<{
    pointsBalance: number;
    totalQuizzesAnswered: number;
    totalCorrectAnswers: number;
    accuracyRate: number;
    transactions: any[];
  }> {
    const balRes = await query(
      `SELECT * FROM quiz_point_balances WHERE customer_id = $1`,
      [customerId],
    );
    const balanceRow = balRes.rows[0] || {
      points_balance: 0,
      total_quizzes_answered: 0,
      total_correct_answers: 0,
    };

    const txRes = await query(
      `SELECT * FROM quiz_point_transactions WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [customerId],
    );

    const answered = Number(balanceRow.total_quizzes_answered) || 0;
    const correct = Number(balanceRow.total_correct_answers) || 0;

    return {
      pointsBalance: Number(balanceRow.points_balance) || 0,
      totalQuizzesAnswered: answered,
      totalCorrectAnswers: correct,
      accuracyRate: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      transactions: txRes.rows.map((t) => ({
        id: t.id,
        customerId: t.customer_id,
        quizId: t.quiz_id,
        quizTitle: t.quiz_title,
        pointsDelta: Number(t.points_delta),
        balanceAfter: Number(t.balance_after),
        reason: t.reason,
        note: t.note,
        idempotencyKey: t.idempotency_key,
        createdAt: new Date(t.created_at).toISOString(),
      })),
    };
  },
};
