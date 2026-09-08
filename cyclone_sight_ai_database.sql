-- CYCLONE SIGHT AI database schema
-- PostgreSQL 14+; run this file against an empty database.

BEGIN;

CREATE TYPE user_role AS ENUM (
  'meteorologist',
  'disaster_manager',
  'coastal_official',
  'researcher',
  'public'
);

CREATE TYPE wind_unit AS ENUM ('kmh', 'kt', 'ms');
CREATE TYPE pressure_unit AS ENUM ('hpa', 'mbar');

CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(320) NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'researcher',
  organization VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_email_normalized CHECK (email = lower(email))
);

CREATE TABLE user_preferences (
  user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wind_unit wind_unit NOT NULL DEFAULT 'kmh',
  pressure_unit pressure_unit NOT NULL DEFAULT 'hpa',
  default_channel VARCHAR(30) NOT NULL DEFAULT 'TIR1'
);

CREATE TABLE saved_cyclones (
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cyclone_name VARCHAR(100) NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, cyclone_name),
  CONSTRAINT saved_cyclones_name_uppercase CHECK (cyclone_name = upper(cyclone_name))
);

CREATE TABLE alert_subscribed_basins (
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basin_name VARCHAR(100) NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, basin_name)
);

CREATE TABLE mosdac_accounts (
  user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mosdac_accounts_username_unique UNIQUE (username)
);

CREATE TABLE mosdac_account_feeds (
  user_id VARCHAR(50) NOT NULL REFERENCES mosdac_accounts(user_id) ON DELETE CASCADE,
  feed_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, feed_name)
);

CREATE TABLE user_sessions (
  token CHAR(64) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT user_sessions_expiry_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX user_sessions_expires_at_idx ON user_sessions(expires_at);
CREATE INDEX saved_cyclones_cyclone_name_idx ON saved_cyclones(cyclone_name);

-- Remove expired authentication sessions. This can be scheduled periodically.
-- DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;

COMMIT;
