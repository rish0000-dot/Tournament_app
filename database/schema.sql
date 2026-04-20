-- ============================================
-- BLAZESTRIKE DATABASE SCHEMA
-- PostgreSQL Migration File
-- Run: psql -U postgres -d blazestrike -f migrate.sql
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  ff_uid VARCHAR(30) UNIQUE,
  ff_username VARCHAR(50),
  avatar_url TEXT,
  fcm_token TEXT,
  language VARCHAR(5) DEFAULT 'hi',
  is_verified BOOLEAN DEFAULT FALSE,
  is_kyc_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  ban_until TIMESTAMP,
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES users(id),
  total_matches INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- KYC TABLE
-- ============================================
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  pan_url TEXT,
  aadhaar_number VARCHAR(20),
  pan_number VARCHAR(15),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WALLET TABLE
-- ============================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  real_cash DECIMAL(12,2) DEFAULT 0.00,
  bonus_cash DECIMAL(12,2) DEFAULT 0.00,
  blazegold INTEGER DEFAULT 0,
  total_deposited DECIMAL(12,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
  total_won DECIMAL(12,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL, -- deposit, withdrawal, tournament_win, tournament_entry, coin_redeem, bonus, referral
  amount DECIMAL(12,2),
  coin_amount INTEGER,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(30), -- upi, paytm, bank, razorpay
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  upi_id VARCHAR(100),
  bank_account VARCHAR(50),
  ifsc_code VARCHAR(20),
  description TEXT,
  tournament_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TOURNAMENTS TABLE
-- ============================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  mode VARCHAR(30) NOT NULL, -- solo_br, solo_per_kill, lone_wolf, cs_challengers, clash_squad, cs_headshot, loss_to_win, free, royale_rush, blind_drop
  entry_fee DECIMAL(8,2) DEFAULT 0,
  prize_pool DECIMAL(12,2) NOT NULL,
  total_slots INTEGER NOT NULL,
  filled_slots INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, registering, live, completed, cancelled
  scheduled_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  room_id VARCHAR(20),
  room_password VARCHAR(20),
  room_released_at TIMESTAMP,
  per_kill_rate DECIMAL(6,2), -- for per_kill mode
  is_free BOOLEAN DEFAULT FALSE,
  is_blind_drop BOOLEAN DEFAULT FALSE,
  blind_revealed_at TIMESTAMP,
  prize_distribution JSONB, -- {"1": 200, "2": 100, "3": 70, ...}
  rules TEXT,
  map VARCHAR(50),
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TOURNAMENT REGISTRATIONS
-- ============================================
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  slot_number INTEGER,
  team_id UUID,
  entry_paid BOOLEAN DEFAULT FALSE,
  payment_transaction_id UUID REFERENCES transactions(id),
  status VARCHAR(20) DEFAULT 'registered', -- registered, checked_in, played, disqualified
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ============================================
-- TOURNAMENT RESULTS
-- ============================================
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES users(id),
  rank INTEGER,
  kills INTEGER DEFAULT 0,
  headshots INTEGER DEFAULT 0,
  survival_time INTEGER, -- seconds
  screenshot_url TEXT,
  ocr_data JSONB, -- raw OCR result
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected, disputed
  rejection_reason TEXT,
  verified_by UUID,
  verified_at TIMESTAMP,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  coin_amount INTEGER DEFAULT 0,
  prize_credited BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- ============================================
-- BLAZEGOLD TRANSACTIONS
-- ============================================
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- positive = earned, negative = spent
  type VARCHAR(30) NOT NULL, -- tournament_rank, kill_bonus, daily_login, ad_watch, mission, streak_bonus, referral, redeem, spend
  tournament_id UUID REFERENCES tournaments(id),
  streak_multiplier DECIMAL(4,2) DEFAULT 1.0,
  expires_at TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- DAILY MISSIONS
-- ============================================
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE DEFAULT CURRENT_DATE,
  mission_type VARCHAR(30), -- play_tournaments, get_kills, watch_match, refer_friend, login_streak
  target INTEGER,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  coin_reward INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date, mission_type)
);

-- ============================================
-- CLANS TABLE
-- ============================================
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  tag VARCHAR(5) UNIQUE NOT NULL,
  emblem VARCHAR(50),
  captain_id UUID REFERENCES users(id),
  description TEXT,
  total_members INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 15,
  treasury_coins INTEGER DEFAULT 0,
  treasury_cash DECIMAL(10,2) DEFAULT 0,
  season_points INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  clan_rank INTEGER,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLAN MEMBERS
-- ============================================
CREATE TABLE clan_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member', -- captain, co-captain, member
  season_points INTEGER DEFAULT 0,
  contribution_coins INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- ============================================
-- BOUNTY SYSTEM
-- ============================================
CREATE TABLE bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_user_id UUID REFERENCES users(id),
  amount DECIMAL(8,2) DEFAULT 0,
  total_claimed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_claimed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bounty_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id),
  claimer_id UUID REFERENCES users(id),
  target_id UUID REFERENCES users(id),
  tournament_id UUID REFERENCES tournaments(id),
  amount_claimed DECIMAL(8,2),
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WATCH & EARN (Spectator Predictions)
-- ============================================
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  user_id UUID REFERENCES users(id),
  prediction_type VARCHAR(30), -- winner, top3, kill_leader
  predicted_user_ids UUID[],
  entry_coins INTEGER DEFAULT 5,
  potential_win DECIMAL(8,2),
  is_correct BOOLEAN,
  payout DECIMAL(8,2) DEFAULT 0,
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LAST BULLET 1v1
-- ============================================
CREATE TABLE last_bullet_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_accepted BOOLEAN DEFAULT FALSE,
  player2_accepted BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, expired
  winner_id UUID REFERENCES users(id),
  room_id VARCHAR(20),
  room_password VARCHAR(20),
  prize_boost DECIMAL(10,2),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(100),
  body TEXT,
  type VARCHAR(30), -- tournament_reminder, prize_credited, bounty_claimed, clan_update, system
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- REPORTS / DISPUTES
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  tournament_id UUID REFERENCES tournaments(id),
  reason VARCHAR(50), -- cheating, fake_screenshot, abuse, hack
  description TEXT,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'open', -- open, reviewing, resolved, dismissed
  resolved_by UUID,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OTP TABLE
-- ============================================
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- USER SESSIONS
-- ============================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  device_id VARCHAR(100),
  fcm_token TEXT,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_ff_uid ON users(ff_uid);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_scheduled ON tournaments(scheduled_at);
CREATE INDEX idx_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_registrations_user ON tournament_registrations(user_id);
CREATE INDEX idx_results_tournament ON tournament_results(tournament_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_coin_tx_user ON coin_transactions(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_bounties_target ON bounties(target_user_id);

-- ============================================
-- INITIAL DATA
-- ============================================
-- Default prize distribution templates
INSERT INTO tournaments (
  title, mode, entry_fee, prize_pool, total_slots,
  scheduled_at, is_free, prize_distribution, status
) VALUES (
  'Free Daily Solo BR', 'solo_br', 0, 500, 50,
  NOW() + INTERVAL '1 hour', TRUE,
  '{"1":200,"2":100,"3":70,"4":50,"5":50,"6":50,"7":50,"8":50,"9":50,"10":50}',
  'upcoming'
);
