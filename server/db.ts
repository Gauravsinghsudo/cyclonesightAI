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
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined })
  : null;

// Keep the desktop/demo build usable before PostgreSQL is configured. When
// DATABASE_URL is set, PostgreSQL remains the source of truth.
const localStorePath = path.join(process.cwd(), 'data', 'users_db.json');
type LocalStore = { users: StoredUser[]; sessions: Array<{ token: string; userId: string; createdAt: string; expiresAt: string }> };

function readLocalStore(): LocalStore {
  try {
    const parsed = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    return { users: Array.isArray(parsed.users) ? parsed.users : [], sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
  } catch {
    return { users: [], sessions: [] };
  }
}

function writeLocalStore(store: LocalStore) {
  fs.mkdirSync(path.dirname(localStorePath), { recursive: true });
  fs.writeFileSync(localStorePath, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function publicUser(user: StoredUser): UserProfile {
  const { passwordHash: _passwordHash, salt: _salt, ...userProfile } = user;
  return userProfile;
}

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

  // Retain verification for accounts created before the versioned format.
  // Successful legacy sign-ins are upgraded immediately below.
  return /^[a-f0-9]{128}$/i.test(value) ? { iterations: 1_000, hash: value } : null;
}

function mapUser(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username || undefined,
    role: row.role,
    organization: row.organization || undefined,
    createdAt: new Date(row.created_at).toISOString(),
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
  async createUser(params: { name: string; email: string; password: string; role?: UserProfile['role']; organization?: string }): Promise<UserProfile> {
    if (!pool) {
      const store = readLocalStore();
      const email = params.email.trim().toLowerCase();
      if (store.users.some((user) => user.email.toLowerCase() === email)) throw new Error('An account with this email address already exists. Please sign in instead.');
      const salt = crypto.randomBytes(16).toString('hex');
      const user: StoredUser = {
        id: `usr_${crypto.randomUUID()}`, name: params.name.trim(), email, role: params.role || 'researcher',
        organization: params.organization?.trim() || 'Coastal Emergency Management', createdAt: new Date().toISOString(),
        savedCyclones: ['DANA', 'REMAL'], alertSubscribedBasins: ['Bay of Bengal'],
        preferences: { windUnit: 'kmh', pressureUnit: 'hpa', defaultChannel: 'TIR1' }, passwordHash: hashPassword(params.password, salt), salt,
      };
      store.users.push(user);
      writeLocalStore(store);
      return publicUser(user);
    }
    const client = await pool.connect();
    try {
      const email = params.email.trim().toLowerCase();
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
      await client.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [id]);
      await client.query("INSERT INTO saved_cyclones (user_id, cyclone_name) VALUES ($1, 'DANA'), ($1, 'REMAL')", [id]);
      await client.query("INSERT INTO alert_subscribed_basins (user_id, basin_name) VALUES ($1, 'Bay of Bengal')", [id]);
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
    const result = await pool.query(`${userSelect} WHERE lower(u.email) = $1 OR lower(COALESCE(u.username, '')) = $1`, [value]);
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return { ...mapUser(row), passwordHash: row.password_hash, salt: row.password_salt };
  },

  verifyPassword(storedUser: StoredUser, passwordAttempt: string): boolean {
    const stored = parsePasswordHash(storedUser.passwordHash);
    if (!stored || !/^[a-f0-9]{32}$/i.test(storedUser.salt)) return false;
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
    await pool.query(`INSERT INTO user_sessions (token, user_id, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 days')`, [token, userId]);
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
    const result = await pool.query(`${userSelect} JOIN user_sessions s ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > CURRENT_TIMESTAMP`, [token]);
    return result.rowCount ? mapUser(result.rows[0]) : null;
  },

  async invalidateSession(token: string): Promise<void> {
    if (!token) return;
    if (!pool) {
      const store = readLocalStore();
      store.sessions = store.sessions.filter((session) => session.token !== token);
      writeLocalStore(store);
      return;
    }
    await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
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
