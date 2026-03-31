import mysql, { Pool } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __bizwiseDbPool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __bizwiseDbSchemaInit__: Promise<void> | undefined;
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "false" ? undefined : {},
};

export function hasDatabaseConfig() {
  return Boolean(
    dbConfig.host &&
      dbConfig.user &&
      dbConfig.password &&
      dbConfig.database
  );
}

function getPool() {
  if (!hasDatabaseConfig()) {
    return null;
  }

  if (!global.__bizwiseDbPool__) {
    global.__bizwiseDbPool__ = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      enableKeepAlive: true,
    });
  }

  return global.__bizwiseDbPool__;
}

export async function getDatabase() {
  const pool = getPool();

  if (!pool) {
    return null;
  }

  if (!global.__bizwiseDbSchemaInit__) {
    global.__bizwiseDbSchemaInit__ = initializeSchema(pool);
  }

  await global.__bizwiseDbSchemaInit__;
  return pool;
}

async function initializeSchema(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NULL,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NULL,
      email VARCHAR(255) NULL,
      address VARCHAR(255) NULL,
      website VARCHAR(255) NULL,
      note TEXT NULL,
      card_image LONGTEXT NULL,
      created_at DATETIME(3) NOT NULL,
      recognized_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL
    )
  `);

  try {
    await pool.query(`
      CREATE INDEX idx_contacts_user_created
      ON contacts (user_id, created_at)
    `);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Duplicate key name")) {
      throw error;
    }
  }

  try {
    await pool.query(`
      ALTER TABLE contacts
      ADD COLUMN user_id VARCHAR(64) NULL
    `);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Duplicate column name")) {
      throw error;
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_insights (
      contact_id VARCHAR(64) PRIMARY KEY,
      company_summary TEXT NOT NULL,
      company_news JSON NOT NULL,
      industry_updates JSON NOT NULL,
      icebreakers JSON NOT NULL,
      follow_ups JSON NOT NULL,
      source VARCHAR(32) NOT NULL,
      generated_at DATETIME(3) NOT NULL,
      updated_at DATETIME(3) NOT NULL,
      CONSTRAINT fk_contact_insights_contact
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
        ON DELETE CASCADE
    )
  `);

  try {
    await pool.query(`
      ALTER TABLE contact_insights
      ADD COLUMN company_news JSON NOT NULL
    `);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Duplicate column name")) {
      throw error;
    }
  }
}
