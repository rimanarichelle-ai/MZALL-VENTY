import { query, transaction, isPostgresConfigured } from './client';
import { SCHEMA_SQL } from './schema';

export const runMigrations = async (): Promise<{ success: boolean; message: string }> => {
  if (!isPostgresConfigured()) {
    return {
      success: false,
      message: 'DATABASE_URL is not configured; skipping Postgres migrations.',
    };
  }

  try {
    console.log('[Postgres Migration] Initializing normalized relational schema...');
    
    // Execute DDL schema inside transaction
    await transaction(async (client) => {
      // Create migration metadata table
      await client.query(`
        CREATE TABLE IF NOT EXISTS _schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(64) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Check if v1_initial_schema has already been applied
      const checkRes = await client.query(
        `SELECT id FROM _schema_migrations WHERE version = $1`,
        ['v1_initial_schema'],
      );

      if (checkRes.rows.length === 0) {
        // Execute DDL schema
        await client.query(SCHEMA_SQL);
        await client.query(
          `INSERT INTO _schema_migrations (version) VALUES ($1)`,
          ['v1_initial_schema'],
        );
        console.log('[Postgres Migration] Applied v1_initial_schema successfully.');
      } else {
        console.log('[Postgres Migration] Schema v1_initial_schema already up to date.');
      }

      // Check if v2_specials_quiz_competitions has been applied
      const checkV2 = await client.query(
        `SELECT id FROM _schema_migrations WHERE version = $1`,
        ['v2_specials_quiz_competitions'],
      );
      if (checkV2.rows.length === 0) {
        await client.query(SCHEMA_SQL);
        await client.query(
          `INSERT INTO _schema_migrations (version) VALUES ($1)`,
          ['v2_specials_quiz_competitions'],
        );
        console.log('[Postgres Migration] Applied v2_specials_quiz_competitions successfully.');
      }

      // Check if v3_daily_quiz_points_system has been applied
      const checkV3 = await client.query(
        `SELECT id FROM _schema_migrations WHERE version = $1`,
        ['v3_daily_quiz_points_system'],
      );
      if (checkV3.rows.length === 0) {
        // Idempotent column additions for existing tables
        await client.query(`
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS question TEXT NOT NULL DEFAULT '';
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]';
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS correct_option_index INT NOT NULL DEFAULT 0;
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 10;
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS explanation TEXT;
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'DRAFT';
          ALTER TABLE daily_quizzes ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

          ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS selected_option_index INT;
          ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS is_correct BOOLEAN NOT NULL DEFAULT FALSE;
          ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS points_awarded INT NOT NULL DEFAULT 0;

          CREATE TABLE IF NOT EXISTS quiz_point_balances (
            customer_id VARCHAR(64) PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
            points_balance INT NOT NULL DEFAULT 0,
            total_quizzes_answered INT NOT NULL DEFAULT 0,
            total_correct_answers INT NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_quiz_points_balance ON quiz_point_balances(points_balance DESC);

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
        `);
        await client.query(
          `INSERT INTO _schema_migrations (version) VALUES ($1)`,
          ['v3_daily_quiz_points_system'],
        );
        console.log('[Postgres Migration] Applied v3_daily_quiz_points_system successfully.');
      }
    });

    return {
      success: true,
      message: 'Postgres migrations applied successfully.',
    };
  } catch (err: any) {
    console.error('[Postgres Migration Error] Failed to run migrations:', err?.message || err);
    throw err;
  }
};
