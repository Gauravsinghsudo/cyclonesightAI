import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'meteorologist' | 'disaster_manager' | 'coastal_official' | 'researcher' | 'public';
  organization?: string;
  createdAt: string;
  savedCyclones: string[];
  alertSubscribedBasins: string[];
  mosdacAccount?: { username: string; verified: boolean; connectedAt: string; dataFeeds: string[] };
  preferences: { windUnit: 'kmh' | 'kt' | 'ms'; pressureUnit: 'hpa' | 'mbar'; defaultChannel: string };
}

export interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

async function autoInitPostgresTables(p: Pool) {
  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          email VARCHAR(320) NOT NULL UNIQUE,
          username VARCHAR(100) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          password_salt VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'researcher',
          organization VARCHAR(255),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_preferences (
          user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          wind_unit VARCHAR(10) NOT NULL DEFAULT 'kmh',
          pressure_unit VARCHAR(10) NOT NULL DEFAULT 'hpa',
          default_channel VARCHAR(30) NOT NULL DEFAULT 'TIR1'
        );

        CREATE TABLE IF NOT EXISTS saved_cyclones (
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          cyclone_name VARCHAR(100) NOT NULL,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, cyclone_name)
        );

        CREATE TABLE IF NOT EXISTS alert_subscribed_basins (
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          basin_name VARCHAR(100) NOT NULL,
          subscribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, basin_name)
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          token CHAR(64) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMPTZ NOT NULL
        );
      `);
      console.log('PostgreSQL database tables initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('PostgreSQL table auto-initialization notice:', err?.message || err);
  }
}

if (pool) {
  autoInitPostgresTables(pool);
}

const localStorePath = path.join(process.cwd(), 'data', 'users_db.json');
type LocalStore = { users: StoredUser[]; sessions: Array<{ token: string; userId: string; createdAt: string; expiresAt: string }> };

const PBKDF2_ITERATIONS = 210_000;
const HASH_PREFIX = 'pbkdf2-sha512';

function hashPassword(password: string, salt: string, iterations = PBKDF2_ITERATIONS): string {
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${HASH_PREFIX}$${iterations}$${hash}`;
}

function parsePasswordHash(value: string): { iterations: number; hash: string } | null {
  const parts = value.split('$');
  if (parts.length === 3 && parts[0] === HASH_PREFIX) {
    const iterations = Number(parts[1]);
    if (Number.isInteger(iterations) && iterations >= 100_000 && iterations <= 1_000_000 && /^[a-f0-9]{128}$/i.test(parts[2])) {
      return { iterations, hash: parts[2] };
    }
    return null;
  }
  return /^[a-f0-9]{128}$/i.test(value) ? { iterations: 1_000, hash: value } : null;
}

function seedDefaultUser(): StoredUser {
  const salt = 'a1b2c3d4e5f67890a1b2c3d4e5f67890';
  return {
    id: 'usr_demo_analyst',
    name: 'Dr. Vikram Sarabhai Analyst',
    email: 'analyst@cyclonesight.ai',
    username: 'analyst',
    role: 'meteorologist',
    organization: 'ISRO MOSDAC & IMD RSMC Specialist Unit',
    createdAt: new Date().toISOString(),
    savedCyclones: ['DANA', 'REMAL', 'HUDHUD'],
    alertSubscribedBasins: ['Bay of Bengal', 'Arabian Sea'],
    preferences: { windUnit: 'kmh', pressureUnit: 'hpa', defaultChannel: 'TIR1' },
    passwordHash: hashPassword('password123', salt),
    salt,
  };
}

function readLocalStore(): LocalStore {
  try {
    if (!fs.existsSync(localStorePath)) {
      const initial: LocalStore = { users: [seedDefaultUser()], sessions: [] };
      writeLocalStore(initial);
      return initial;
    }
    const parsed = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    const users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : [seedDefaultUser()];
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    return { users, sessions };
  } catch {
    const initial: LocalStore = { users: [seedDefaultUser()], sessions: [] };
    return initial;
  }
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.mkdirSync(path.dirname(localStorePath), { recursive: true });
    fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    console.warn('Could not write to local JSON store:', err);
  }
}

function publicUser(user: StoredUser): UserProfile {
  const { passwordHash: _passwordHash, salt: _salt, ...userProfile } = user;
  return userProfile;
}

function mapUser(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username || undefined,
    role: row.role || 'researcher',
    organization: row.organization || undefined,
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    savedCyclones: row.saved_cyclones || [],
    alertSubscribedBasins: row.alert_subscribed_basins || [],
    preferences: {
      windUnit: row.wind_unit || 'kmh',
      pressureUnit: row.pressure_unit || 'hpa',
      defaultChannel: row.default_channel || 'TIR1',
    },
  };
}

const userSelect = `
  SELECT u.*, p.wind_unit, p.pressure_unit, p.default_channel,
    COALESCE((SELECT array_agg(sc.cyclone_name ORDER BY sc.saved_at) FROM saved_cyclones sc WHERE sc.user_id = u.id), ARRAY[]::varchar[]) AS saved_cyclones,
    COALESCE((SELECT array_agg(ab.basin_name ORDER BY ab.subscribed_at) FROM alert_subscribed_basins ab WHERE ab.user_id = u.id), ARRAY[]::varchar[]) AS alert_subscribed_basins
  FROM users u LEFT JOIN user_preferences p ON p.user_id = u.id`;

export const db = {
  isPostgresConnected(): boolean {
    return Boolean(pool);
  },

  async createUser(params: { name: string; email: string; password: string; role?: UserProfile['role']; organization?: string }): Promise<UserProfile> {
    const email = params.email.trim().toLowerCase();

    if (!pool) {
      const store = readLocalStore();
      if (store.users.some((user) => user.email.toLowerCase() === email)) {
        throw new Error('An account with this email address already exists. Please sign in instead.');
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const user: StoredUser = {
        id: `usr_${crypto.randomUUID()}`,
        name: params.name.trim(),
        email,
        role: params.role || 'researcher',
        organization: params.organization?.trim() || 'Coastal Emergency Management',
        createdAt: new Date().toISOString(),
        savedCyclones: ['DANA', 'REMAL'],
        alertSubscribedBasins: ['Bay of Bengal'],
        preferences: { windUnit: 'kmh', pressureUnit: 'hpa', defaultChannel: 'TIR1' },
        passwordHash: hashPassword(params.password, salt),
        salt,
      };
      store.users.push(user);
      writeLocalStore(store);
      return publicUser(user);
    }

    const client = await pool.connect();
    try {
      const existing = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
      if (existing.rowCount) throw new Error('An account with this email address already exists.');
      const id = `usr_${crypto.randomUUID()}`;
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(params.password, salt);
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, password_salt, role, organization)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, params.name.trim(), email, passwordHash, salt, params.role || 'researcher', params.organization?.trim() || 'Coastal Emergency Management'],
      );
      await client.query('INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
      await client.query("INSERT INTO saved_cyclones (user_id, cyclone_name) VALUES ($1, 'DANA'), ($1, 'REMAL') ON CONFLICT DO NOTHING", [id]);
      await client.query("INSERT INTO alert_subscribed_basins (user_id, basin_name) VALUES ($1, 'Bay of Bengal') ON CONFLICT DO NOTHING", [id]);
      await client.query('COMMIT');
      const result = await client.query(`${userSelect} WHERE u.id = $1`, [id]);
      return mapUser(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findUserByEmail(emailOrUsername: string): Promise<StoredUser | null> {
    if (!emailOrUsername) return null;
    const value = emailOrUsername.trim().toLowerCase();
    if (!pool) return readLocalStore().users.find((user) => user.email.toLowerCase() === value || user.username?.toLowerCase() === value) || null;
    try {
      const result = await pool.query(`${userSelect} WHERE lower(u.email) = $1 OR lower(COALESCE(u.username, '')) = $1`, [value]);
      if (!result.rowCount) return null;
      const row = result.rows[0];
      return { ...mapUser(row), passwordHash: row.password_hash, salt: row.password_salt };
    } catch (err) {
      console.warn('PostgreSQL findUserByEmail query error, falling back to local store:', err);
      return readLocalStore().users.find((user) => user.email.toLowerCase() === value || user.username?.toLowerCase() === value) || null;
    }
  },

  verifyPassword(storedUser: StoredUser, passwordAttempt: string): boolean {
    const stored = parsePasswordHash(storedUser.passwordHash);
    if (!stored || !storedUser.salt) return false;
    const hashAttempt = crypto.pbkdf2Sync(passwordAttempt, storedUser.salt, stored.iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hashAttempt, 'hex'), Buffer.from(stored.hash, 'hex'));
  },

  async upgradePasswordHash(storedUser: StoredUser, password: string): Promise<void> {
    const stored = parsePasswordHash(storedUser.passwordHash);
    if (stored && stored.iterations >= PBKDF2_ITERATIONS) return;
    if (!pool) {
      const store = readLocalStore();
      const user = store.users.find((entry) => entry.id === storedUser.id);
      if (!user) return;
      user.salt = crypto.randomBytes(16).toString('hex');
      user.passwordHash = hashPassword(password, user.salt);
      writeLocalStore(store);
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    await pool.query('UPDATE users SET password_hash = $1, password_salt = $2 WHERE id = $3', [hashPassword(password, salt), salt, storedUser.id]);
  },

  async createSession(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    if (!pool) {
      const store = readLocalStore();
      store.sessions = store.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
      store.sessions.push({ token, userId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
      writeLocalStore(store);
      return token;
    }
    try {
      await pool.query(`INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 days')`, [token, userId]);
    } catch (err) {
      console.warn('PostgreSQL session creation notice:', err);
    }
    return token;
  },

  async getUserByToken(token: string): Promise<UserProfile | null> {
    if (!token) return null;
    if (!pool) {
      const store = readLocalStore();
      const session = store.sessions.find((entry) => entry.token === token && new Date(entry.expiresAt).getTime() > Date.now());
      const user = session && store.users.find((entry) => entry.id === session.userId);
      return user ? publicUser(user) : null;
    }
    try {
      const result = await pool.query(`${userSelect} JOIN user_sessions s ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP`, [token]);
      return result.rowCount ? mapUser(result.rows[0]) : null;
    } catch (err) {
      console.warn('PostgreSQL session lookup error:', err);
      const store = readLocalStore();
      const session = store.sessions.find((entry) => entry.token === token && new Date(entry.expiresAt).getTime() > Date.now());
      const user = session && store.users.find((entry) => entry.id === session.userId);
      return user ? publicUser(user) : null;
    }
  },

  async invalidateSession(token: string): Promise<void> {
    if (!token) return;
    if (!pool) {
      const store = readLocalStore();
      store.sessions = store.sessions.filter((session) => session.token !== token);
      writeLocalStore(store);
      return;
    }
    try {
      await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    } catch (err) {
      console.warn('PostgreSQL session deletion notice:', err);
    }
  },

  async toggleSavedCyclone(userId: string, cycloneName: string): Promise<string[]> {
    const name = cycloneName.trim().toUpperCase();
    if (!pool) {
      const store = readLocalStore();
      const user = store.users.find((entry) => entry.id === userId);
      if (!user) throw new Error('Account not found. Please sign in again.');
      user.savedCyclones = user.savedCyclones.includes(name) ? user.savedCyclones.filter((saved) => saved !== name) : [...user.savedCyclones, name];
      writeLocalStore(store);
      return user.savedCyclones;
    }
    const existing = await pool.query('SELECT 1 FROM saved_cyclones WHERE user_id = $1 AND cyclone_name = $2', [userId, name]);
    if (existing.rowCount) await pool.query('DELETE FROM saved_cyclones WHERE user_id = $1 AND cyclone_name = $2', [userId, name]);
    else await pool.query('INSERT INTO saved_cyclones (user_id, cyclone_name) VALUES ($1, $2)', [userId, name]);
    const result = await pool.query('SELECT cyclone_name FROM saved_cyclones WHERE user_id = $1 ORDER BY saved_at', [userId]);
    return result.rows.map((row) => row.cyclone_name);
  },
};
