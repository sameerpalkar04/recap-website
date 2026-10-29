import pg from 'pg';

const { Pool } = pg;
let pool;
let ready = false;

export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not configured; account history endpoints are unavailable.');
    return false;
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_SIZE) || 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
  pool.on('error', (error) => console.error('PostgreSQL pool error:', error.message));

  const client = await pool.connect();
  try {
    // Serialize schema creation so scaled API replicas can start together safely.
    await client.query('SELECT pg_advisory_lock(72198431)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        picture TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS saved_recaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        show_name VARCHAR(120) NOT NULL,
        show_key VARCHAR(120) NOT NULL,
        season_no INTEGER NOT NULL CHECK (season_no > 0),
        episode_no INTEGER NOT NULL CHECK (episode_no > 0),
        summary TEXT NOT NULL,
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, show_key, season_no, episode_no)
      );
      CREATE INDEX IF NOT EXISTS saved_recaps_user_date_idx ON saved_recaps (user_id, generated_at DESC);
    `);
    ready = true;
  } finally {
    await client.query('SELECT pg_advisory_unlock(72198431)').catch(() => undefined);
    client.release();
  }
  console.info('PostgreSQL account and recap storage is ready');
  return true;
}

function getPool() {
  if (!ready || !pool) {
    const error = new Error('Account storage is unavailable. Configure and start PostgreSQL.');
    error.status = 503;
    throw error;
  }
  return pool;
}

export function isDatabaseReady() {
  return ready;
}

export async function upsertGoogleUser(profile) {
  const result = await getPool().query(`
    INSERT INTO app_users (id, email, name, picture)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name,
      picture = EXCLUDED.picture, updated_at = NOW()
    RETURNING id, email, name, picture
  `, [profile.sub, profile.email, profile.name || profile.email, profile.picture || '']);
  return result.rows[0];
}

function recapRow(row) {
  return {
    id: row.id,
    show: row.show_name,
    seasonNo: row.season_no,
    episodeNo: row.episode_no,
    summary: row.summary,
    generatedAt: new Date(row.generated_at).toISOString(),
  };
}

export async function saveUserRecap(userId, recap) {
  const showKey = recap.show.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const result = await getPool().query(`
    INSERT INTO saved_recaps (user_id, show_name, show_key, season_no, episode_no, summary)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, show_key, season_no, episode_no) DO UPDATE SET
      show_name = EXCLUDED.show_name, summary = EXCLUDED.summary, generated_at = NOW()
    RETURNING id, show_name, season_no, episode_no, summary, generated_at
  `, [userId, recap.show, showKey, recap.seasonNo, recap.episodeNo, recap.summary]);
  return recapRow(result.rows[0]);
}

export async function listUserRecaps(userId, limit = 100) {
  const result = await getPool().query(`
    SELECT id, show_name, season_no, episode_no, summary, generated_at
    FROM saved_recaps WHERE user_id = $1 ORDER BY generated_at DESC LIMIT $2
  `, [userId, Math.min(100, Math.max(1, Number(limit) || 100))]);
  return result.rows.map(recapRow);
}

export async function deleteUserRecap(userId, recapId) {
  const result = await getPool().query('DELETE FROM saved_recaps WHERE user_id = $1 AND id::text = $2', [userId, recapId]);
  return result.rowCount > 0;
}

export async function closeDatabase() {
  ready = false;
  if (pool) await pool.end();
}
