export const SCHEMA_SQL = `
-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(255),
  favourite_drink VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 2. Loyalty Accounts (1:1 with Customers)
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  customer_id VARCHAR(64) PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  current_stamp_count INT NOT NULL DEFAULT 0,
  lifetime_stamps INT NOT NULL DEFAULT 0,
  welcome_bonus_granted BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  stamps_delta INT NOT NULL,
  source VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
  idempotency_key VARCHAR(128) UNIQUE,
  order_id VARCHAR(64),
  reward_id VARCHAR(64),
  note TEXT,
  previous_value INT,
  new_value INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_order ON loyalty_transactions(order_id);

-- 4. Rewards (Available & Redeemed)
CREATE TABLE IF NOT EXISTS rewards (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'FREE_DRINK',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
  redemption_code VARCHAR(32) UNIQUE,
  redemption_token VARCHAR(128) UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  redemption_staff_id VARCHAR(64),
  redemption_location VARCHAR(255),
  source_order_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rewards_customer ON rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_rewards_code ON rewards(redemption_code);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  pickup_time VARCHAR(64) NOT NULL DEFAULT '15 mins',
  notes TEXT,
  qualifies_for_loyalty BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_stamp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_stamps_delta INT NOT NULL DEFAULT 0,
  loyalty_transaction_id VARCHAR(64),
  idempotency_key VARCHAR(128) UNIQUE,
  payload_fingerprint VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(128) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 7. Store Settings & Config
CREATE TABLE IF NOT EXISTS store_settings (
  key VARCHAR(64) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Customer Sessions (Durable multi-instance session storage)
CREATE TABLE IF NOT EXISTS customer_sessions (
  session_hash VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  session_id VARCHAR(64) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER',
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON customer_sessions(expires_at);

-- 9. Customer OTP Challenges (Durable multi-instance OTP storage)
CREATE TABLE IF NOT EXISTS customer_otp_challenges (
  phone VARCHAR(32) PRIMARY KEY,
  code_hash VARCHAR(128) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  favourite_drink VARCHAR(255),
  purpose VARCHAR(32) NOT NULL DEFAULT 'LOGIN',
  attempts_remaining INT NOT NULL DEFAULT 3,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  details JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp DESC);

-- 11. Today's Specials
CREATE TABLE IF NOT EXISTS specials (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'coffee',
  price_dzd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price_dzd NUMERIC(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date VARCHAR(32),
  end_date VARCHAR(32),
  badge_text VARCHAR(128),
  perk_text VARCHAR(255),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_specials_active ON specials(is_active);

-- 12. Daily Quizzes
CREATE TABLE IF NOT EXISTS daily_quizzes (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_index INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 10,
  explanation TEXT,
  description TEXT,
  date_key VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_start_date VARCHAR(32),
  scheduled_end_date VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reward_type VARCHAR(32) NOT NULL DEFAULT 'POINTS',
  reward_value NUMERIC(10, 2) NOT NULL DEFAULT 10,
  reward_description VARCHAR(255),
  time_limit_seconds INT NOT NULL DEFAULT 120,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_daily_quizzes_date ON daily_quizzes(date_key);
CREATE INDEX IF NOT EXISTS idx_daily_quizzes_published ON daily_quizzes(is_published);

-- 13. Customer Quiz Attempts (Enforces strictly one attempt per authenticated customer per quiz)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR(64) PRIMARY KEY,
  quiz_id VARCHAR(64) NOT NULL REFERENCES daily_quizzes(id) ON DELETE CASCADE,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  selected_option_index INT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  points_awarded INT NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]',
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 1,
  is_perfect_score BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken_seconds INT,
  timed_out BOOLEAN NOT NULL DEFAULT FALSE,
  reward_issued JSONB,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_customer_quiz UNIQUE(quiz_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_cust ON quiz_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- 13B. Customer Quiz Points Balance (Separate from loyalty stamps)
CREATE TABLE IF NOT EXISTS quiz_point_balances (
  customer_id VARCHAR(64) PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  points_balance INT NOT NULL DEFAULT 0,
  total_quizzes_answered INT NOT NULL DEFAULT 0,
  total_correct_answers INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_points_balance ON quiz_point_balances(points_balance DESC);

-- 13C. Quiz Point Transactions (Auditable transaction history for earned quiz points)
CREATE TABLE IF NOT EXISTS quiz_point_transactions (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quiz_id VARCHAR(64) REFERENCES daily_quizzes(id) ON DELETE SET NULL,
  quiz_title VARCHAR(255),
  points_delta INT NOT NULL,
  balance_after INT NOT NULL,
  reason VARCHAR(64) NOT NULL DEFAULT 'DAILY_QUIZ_CORRECT',
  note TEXT,
  idempotency_key VARCHAR(128) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_tx_customer ON quiz_point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_quiz_tx_quiz ON quiz_point_transactions(quiz_id);

-- 14. Weekly Competitions
CREATE TABLE IF NOT EXISTS weekly_competitions (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  week_number INT NOT NULL,
  year INT NOT NULL,
  start_date VARCHAR(32) NOT NULL,
  end_date VARCHAR(32) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_drawn BOOLEAN NOT NULL DEFAULT FALSE,
  drawn_at TIMESTAMPTZ,
  eligibility_rule VARCHAR(64) NOT NULL DEFAULT 'ALL_CUSTOMERS',
  winner_selection_rule VARCHAR(64) NOT NULL DEFAULT 'RANDOM_DRAW',
  prizes JSONB NOT NULL DEFAULT '[]',
  banner_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Competition Participants
CREATE TABLE IF NOT EXISTS competition_participants (
  id VARCHAR(64) PRIMARY KEY,
  competition_id VARCHAR(64) NOT NULL REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  order_count INT NOT NULL DEFAULT 0,
  stamp_count INT NOT NULL DEFAULT 0,
  is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_competition_customer UNIQUE(competition_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_comp_participants_comp ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_participants_cust ON competition_participants(customer_id);

-- 16. Competition Winners
CREATE TABLE IF NOT EXISTS competition_winners (
  id VARCHAR(64) PRIMARY KEY,
  competition_id VARCHAR(64) NOT NULL REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) NOT NULL,
  prize_id VARCHAR(64) NOT NULL,
  prize_title VARCHAR(255) NOT NULL,
  prize_type VARCHAR(64) NOT NULL,
  reward_id VARCHAR(64),
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_comp_winners_comp ON competition_winners(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_winners_cust ON competition_winners(customer_id);
`;
