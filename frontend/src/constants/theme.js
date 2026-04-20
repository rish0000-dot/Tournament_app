// constants/theme.js
export const COLORS = {
  // Primary
  primary: '#FF4500',
  primaryDark: '#CC2200',
  primaryLight: '#FF6B35',
  primaryGlow: 'rgba(255,69,0,0.2)',

  // Secondary
  gold: '#FFD700',
  goldDark: '#FFA500',
  goldGlow: 'rgba(255,215,0,0.2)',

  // Accent
  cyan: '#00F5FF',
  cyanGlow: 'rgba(0,245,255,0.15)',
  green: '#00E676',
  red: '#FF1744',

  // Backgrounds
  bg: '#0A0A0F',
  bg2: '#111118',
  bg3: '#1A1A24',
  bg4: '#22222E',
  bg5: '#2A2A38',

  // Text
  text: '#F0F0FF',
  textMuted: '#8888AA',
  textDim: '#555566',

  // Border
  border: 'rgba(255,69,0,0.2)',
  borderLight: 'rgba(255,255,255,0.08)',

  // Status
  success: '#00E676',
  warning: '#FFD700',
  error: '#FF1744',
  info: '#00F5FF',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const FONTS = {
  // Use system fonts for RN — custom fonts need asset linking
  display: 'System',   // Replace with Orbitron after linking
  heading: 'System',  // Replace with Rajdhani
  body: 'System',     // Replace with Barlow

  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
    hero: 48,
  },

  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primary: {
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
};

// constants/api.js
export const API_BASE_URL = 'https://api.blazestrike.gg/api'; // Change for dev: 'http://10.0.2.2:5000/api'
export const SOCKET_URL = 'https://api.blazestrike.gg';

export const ENDPOINTS = {
  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  SETUP_PROFILE: '/auth/setup-profile',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',

  // Users
  ME: '/users/me',
  UPDATE_PROFILE: '/users/me',
  UPLOAD_AVATAR: '/users/avatar',
  KYC: '/users/kyc',
  LEADERBOARD: '/users/leaderboard',
  NOTIFICATIONS: '/users/notifications',

  // Tournaments
  TOURNAMENTS: '/tournaments',
  MY_TOURNAMENTS: '/tournaments/my',
  JOIN_TOURNAMENT: (id) => `/tournaments/${id}/join`,
  TOURNAMENT_DETAIL: (id) => `/tournaments/${id}`,
  SUBMIT_RESULT: (id) => `/tournaments/${id}/result`,

  // Wallet
  WALLET: '/wallet',
  DEPOSIT_INITIATE: '/wallet/deposit/initiate',
  DEPOSIT_CONFIRM: '/wallet/deposit/confirm',
  WITHDRAW: '/wallet/withdraw',
  REDEEM_COINS: '/wallet/redeem-coins',

  // Coins
  AD_WATCH: '/coins/ad-watch',
  MISSIONS: '/coins/missions',
  COIN_HISTORY: '/coins/history',

  // Clans
  CLANS: '/clans',
  CLAN_LEADERBOARD: '/clans/leaderboard',
  JOIN_CLAN: (id) => `/clans/${id}/join`,

  // Bounty
  MOST_WANTED: '/bounty/most-wanted',
  CLAIM_BOUNTY: '/bounty/claim',

  // Predictions
  PREDICT: '/predictions',
};

// constants/tournaments.js
export const TOURNAMENT_MODES = {
  solo_br: { label: 'Solo BR', icon: '🎯', color: '#FF4500', desc: 'Battle Royale Solo' },
  solo_per_kill: { label: 'Per Kill', icon: '💥', color: '#FF6B00', desc: 'Earn per kill' },
  lone_wolf: { label: 'Lone Wolf', icon: '🐺', color: '#9B59B6', desc: 'Restricted mode' },
  cs_challengers: { label: 'CS Challengers', icon: '⚔️', color: '#00F5FF', desc: '4v4 Championship' },
  clash_squad: { label: 'Clash Squad', icon: '🔥', color: '#E74C3C', desc: '4v4 Daily' },
  cs_headshot: { label: 'CS Headshot', icon: '🎯', color: '#F39C12', desc: 'Headshots only' },
  loss_to_win: { label: 'Loss To Win', icon: '🔄', color: '#27AE60', desc: 'Lowest kills wins' },
  free: { label: 'Free Entry', icon: '🎁', color: '#FFD700', desc: 'Zero entry fee' },
  royale_rush: { label: 'Royale Rush', icon: '⚡', color: '#3498DB', desc: 'Speed BR' },
  blind_drop: { label: 'Blind Drop', icon: '🎰', color: '#E91E63', desc: 'Mystery mode 3x prize' },
};

export const PRIZE_DISTRIBUTION_DEFAULT = {
  1: 200, 2: 100, 3: 70, 4: 50, 5: 50,
  6: 50, 7: 50, 8: 50, 9: 50, 10: 50,
};
