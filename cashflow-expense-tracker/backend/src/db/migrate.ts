import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool, withTransaction } from './pool.js';

const MIGRATION_LOCK_ID = 7_310_001;

const MIGRATION_001 = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(100) NOT NULL,
  email         varchar(255) NOT NULL,
  password_hash text         NOT NULL,
  currency      char(3)      NOT NULL DEFAULT 'INR',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT users_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at') THEN
    CREATE TRIGGER users_set_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash  char(64)    NOT NULL UNIQUE,
  family_id   uuid        NOT NULL,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_by uuid        REFERENCES refresh_tokens (id) ON DELETE SET NULL,
  user_agent  varchar(255),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx   ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);

CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       varchar(50) NOT NULL,
  color      char(7)     NOT NULL DEFAULT '#6366F1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT categories_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT categories_id_user_uk UNIQUE (id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_uidx ON categories (user_id, lower(name));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'categories_set_updated_at') THEN
    CREATE TRIGGER categories_set_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS expenses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category_id  uuid          NOT NULL,
  amount       numeric(12,2) NOT NULL,
  description  varchar(255)  NOT NULL,
  expense_date date          NOT NULL,
  notes        text,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT expenses_amount_positive CHECK (amount > 0),
  CONSTRAINT expenses_description_not_blank CHECK (length(btrim(description)) > 0),
  CONSTRAINT expenses_category_fk FOREIGN KEY (category_id, user_id)
    REFERENCES categories (id, user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_category_date_idx ON expenses (user_id, category_id, expense_date);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'expenses_set_updated_at') THEN
    CREATE TRIGGER expenses_set_updated_at
      BEFORE UPDATE ON expenses
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS budgets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category_id uuid          NOT NULL,
  month       date          NOT NULL,
  amount      numeric(12,2) NOT NULL,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT budgets_amount_positive CHECK (amount > 0),
  CONSTRAINT budgets_month_first_day CHECK (EXTRACT(DAY FROM month) = 1),
  CONSTRAINT budgets_category_fk FOREIGN KEY (category_id, user_id)
    REFERENCES categories (id, user_id) ON DELETE CASCADE,
  CONSTRAINT budgets_user_month_category_uk UNIQUE (user_id, month, category_id)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'budgets_set_updated_at') THEN
    CREATE TRIGGER budgets_set_updated_at
      BEFORE UPDATE ON budgets
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
`;

const MIGRATION_002 = `
CREATE OR REPLACE FUNCTION fn_budget_summary(p_user_id uuid, p_month date)
RETURNS TABLE (
  category_id    uuid,
  category_name  varchar,
  color          char(7),
  budget_id      uuid,
  budget_amount  numeric,
  spent          numeric,
  remaining      numeric,
  expense_count  bigint
)
LANGUAGE sql STABLE AS $$
  WITH bounds AS (
    SELECT date_trunc('month', p_month)::date AS m_start,
           (date_trunc('month', p_month) + interval '1 month')::date AS m_end
  ),
  spending AS (
    SELECT e.category_id, SUM(e.amount) AS spent, COUNT(*) AS expense_count
    FROM expenses e, bounds b
    WHERE e.user_id = p_user_id
      AND e.expense_date >= b.m_start
      AND e.expense_date <  b.m_end
    GROUP BY e.category_id
  )
  SELECT c.id,
         c.name,
         c.color,
         bu.id,
         bu.amount,
         COALESCE(s.spent, 0),
         CASE WHEN bu.amount IS NULL THEN NULL ELSE bu.amount - COALESCE(s.spent, 0) END,
         COALESCE(s.expense_count, 0)
  FROM categories c
  CROSS JOIN bounds b
  LEFT JOIN budgets bu
         ON bu.category_id = c.id AND bu.user_id = p_user_id AND bu.month = b.m_start
  LEFT JOIN spending s ON s.category_id = c.id
  WHERE c.user_id = p_user_id
    AND (bu.id IS NOT NULL OR s.spent IS NOT NULL)
  ORDER BY COALESCE(s.spent, 0) DESC, c.name;
$$;

CREATE OR REPLACE FUNCTION fn_monthly_totals(p_user_id uuid, p_year int)
RETURNS TABLE (month int, total numeric, expense_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT m.month,
         COALESCE(SUM(e.amount), 0),
         COUNT(e.id)
  FROM generate_series(1, 12) AS m(month)
  LEFT JOIN expenses e
         ON e.user_id = p_user_id
        AND e.expense_date >= make_date(p_year, m.month, 1)
        AND e.expense_date <  make_date(p_year, m.month, 1) + interval '1 month'
  GROUP BY m.month
  ORDER BY m.month;
$$;

CREATE OR REPLACE FUNCTION fn_category_totals(p_user_id uuid, p_from date, p_to date)
RETURNS TABLE (category_id uuid, category_name varchar, color char(7), total numeric, expense_count bigint)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.name, c.color, SUM(e.amount), COUNT(*)
  FROM expenses e
  JOIN categories c ON c.id = e.category_id
  WHERE e.user_id = p_user_id
    AND e.expense_date BETWEEN p_from AND p_to
  GROUP BY c.id, c.name, c.color
  ORDER BY SUM(e.amount) DESC;
$$;
`;

export const MIGRATIONS: Array<{ name: string; sql: string }> = [
  { name: '001_schema.sql', sql: MIGRATION_001 },
  { name: '002_functions.sql', sql: MIGRATION_002 },
];

/** Applies every embedded migration that has not been applied yet, in filename order. */
export async function runMigrations(log: (msg: string) => void = console.log): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       varchar(255) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

  for (const { name, sql } of MIGRATIONS) {
    const applied = await withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_ID]);
      const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (done.rowCount) return false;
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      return true;
    });
    if (applied) log(`Applied migration ${name}`);
  }
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isEntryPoint) {
  runMigrations()
    .then(() => console.log('Migrations complete'))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
