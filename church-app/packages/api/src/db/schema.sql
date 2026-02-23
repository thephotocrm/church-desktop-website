-- Church App Database Schema
-- Run against PostgreSQL 15+

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Enums
-- ============================================
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE global_role AS ENUM ('super_admin', 'admin', 'pastor', 'staff', 'member');
CREATE TYPE group_role AS ENUM ('group_leader', 'moderator', 'group_member');
CREATE TYPE livestream_provider AS ENUM ('youtube', 'custom');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE dm_thread_status AS ENUM ('active', 'archived');
CREATE TYPE audit_action AS ENUM (
  'user_approved', 'user_suspended', 'role_changed',
  'group_created', 'group_deleted', 'member_added', 'member_removed',
  'broadcast_sent', 'permission_changed', 'sermon_created', 'sermon_deleted',
  'event_created', 'event_deleted'
);

-- ============================================
-- Users
-- ============================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status        user_status NOT NULL DEFAULT 'pending',
  global_role   global_role NOT NULL DEFAULT 'member',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- Email verification tokens
CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_resets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Groups
-- ============================================
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  image_url   TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       group_role NOT NULL DEFAULT 'group_member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members (group_id);
CREATE INDEX idx_group_members_user ON group_members (user_id);

-- ============================================
-- Sermons
-- ============================================
CREATE TABLE sermons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  speaker       VARCHAR(100) NOT NULL,
  date          DATE NOT NULL,
  audio_url     TEXT,
  video_url     TEXT,
  thumbnail_url TEXT,
  series_name   VARCHAR(255),
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sermons_date ON sermons (date DESC);

-- ============================================
-- Events
-- ============================================
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  location     VARCHAR(255),
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  image_url    TEXT,
  rsvp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_starts_at ON events (starts_at);

CREATE TABLE event_rsvps (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id  UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status    rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- Announcements
-- ============================================
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      VARCHAR(255) NOT NULL,
  body       TEXT NOT NULL,
  author_id  UUID NOT NULL REFERENCES users(id),
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_created ON announcements (created_at DESC);

-- ============================================
-- Group Messages (Chat)
-- ============================================
CREATE TABLE group_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_messages_group ON group_messages (group_id, created_at DESC);

-- ============================================
-- Direct Messages
-- ============================================
CREATE TABLE dm_threads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id  UUID NOT NULL REFERENCES users(id),
  user_b_id  UUID NOT NULL REFERENCES users(id),
  status     dm_thread_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- enforce ordering to prevent duplicates
);

CREATE TABLE dm_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id  UUID NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dm_messages_thread ON dm_messages (thread_id, created_at DESC);

-- Block list for DMs
CREATE TABLE user_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Mute list (per group or DM)
CREATE TABLE user_mutes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  thread_id  UUID REFERENCES dm_threads(id) ON DELETE CASCADE,
  muted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (group_id IS NOT NULL OR thread_id IS NOT NULL)
);

-- ============================================
-- Giving / Donations
-- ============================================
CREATE TABLE donation_funds (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a default fund
INSERT INTO donation_funds (name, description) VALUES ('General Fund', 'General church giving');

CREATE TABLE donations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id),
  fund_id           UUID REFERENCES donation_funds(id),
  amount            INTEGER NOT NULL, -- cents
  currency          VARCHAR(3) NOT NULL DEFAULT 'usd',
  recurring         BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_session_id VARCHAR(255),
  stripe_payment_id VARCHAR(255),
  status            donation_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_user ON donations (user_id, created_at DESC);

-- Store Stripe customer IDs per user
CREATE TABLE stripe_customers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id  VARCHAR(255) NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Livestream
-- ============================================
CREATE TABLE livestream_config (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider           livestream_provider NOT NULL DEFAULT 'youtube',
  youtube_video_id   VARCHAR(50),
  title              VARCHAR(255) NOT NULL DEFAULT 'Sunday Service',
  description        TEXT,
  thumbnail_override TEXT,
  is_live            BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by         UUID REFERENCES users(id),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a default config row (singleton pattern)
INSERT INTO livestream_config (title) VALUES ('Sunday Service');

-- ============================================
-- Push Notification Tokens
-- ============================================
CREATE TABLE push_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  platform   VARCHAR(10) NOT NULL, -- 'ios', 'android'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);

-- ============================================
-- Audit Log
-- ============================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID NOT NULL REFERENCES users(id),
  action      audit_action NOT NULL,
  target_type VARCHAR(50), -- 'user', 'group', 'sermon', etc.
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sermons_updated_at BEFORE UPDATE ON sermons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
