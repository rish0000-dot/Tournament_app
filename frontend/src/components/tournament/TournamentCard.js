// components/tournament/TournamentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { TOURNAMENT_MODES } from '../../constants/theme';
import moment from 'moment';

const TournamentCard = ({ tournament: t, onPress, isLive }) => {
  const mode = TOURNAMENT_MODES[t.mode] || TOURNAMENT_MODES.solo_br;
  const slotsLeft = t.total_slots - (t.filled_slots || 0);
  const fillPct = ((t.filled_slots || 0) / t.total_slots) * 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Top color bar */}
      <View style={[styles.colorBar, { backgroundColor: mode.color }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.modeTag}>
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <Text style={[styles.modeLabel, { color: mode.color }]}>{mode.label}</Text>
          </View>
          <View style={styles.badges}>
            {t.is_free && <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>}
            {t.is_blind_drop && <View style={styles.blindBadge}><Text style={styles.blindBadgeText}>BLIND 3X</Text></View>}
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>{t.title}</Text>

        {/* Prize + Time */}
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.prizeLabel}>Prize Pool</Text>
            <Text style={styles.prizeAmount}>
              {t.is_free ? `${t.prize_pool} 🪙` : `₹${parseFloat(t.prize_pool).toFixed(0)}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.prizeLabel}>Entry</Text>
            <Text style={[styles.entryFee, t.entry_fee == 0 && { color: COLORS.green }]}>
              {t.entry_fee == 0 ? 'FREE' : `₹${t.entry_fee}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.prizeLabel}>{isLive ? 'Ongoing' : 'Starts'}</Text>
            <Text style={styles.timeText}>
              {isLive ? '🔴 Now' : moment(t.scheduled_at).fromNow()}
            </Text>
          </View>
        </View>

        {/* Slots progress */}
        <View style={styles.slotsRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fillPct}%`, backgroundColor: fillPct > 80 ? COLORS.error : mode.color }]} />
          </View>
          <Text style={styles.slotsText}>
            {slotsLeft > 0 ? `${slotsLeft} slots left` : 'FULL'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    overflow: 'hidden',
  },
  colorBar: { height: 3, width: '100%' },
  content: { padding: SPACING.base },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeIcon: { fontSize: 16 },
  modeLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  badges: { flexDirection: 'row', gap: 6 },
  freeBadge: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.gold },
  freeBadgeText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  blindBadge: { backgroundColor: 'rgba(233,30,99,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E91E63' },
  blindBadgeText: { color: '#E91E63', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,23,68,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.error },
  liveText: { color: COLORS.error, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  title: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  prizeLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 1 },
  prizeAmount: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.gold, marginTop: 2 },
  entryFee: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.text, marginTop: 2 },
  timeText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: COLORS.borderLight, marginHorizontal: 16 },
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBar: { flex: 1, height: 4, backgroundColor: COLORS.bg5, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  slotsText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});

export default TournamentCard;

// ============================================
// components/common/ModeFilterChip.js
// ============================================
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const ModeFilterChip = ({ label, icon, selected, onPress, color = COLORS.primary }) => (
  <TouchableOpacity
    style={[styles.chip, selected && { borderColor: color, backgroundColor: `${color}22` }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.label, selected && { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bg3,
  },
  icon: { fontSize: 14 },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
});

export default ModeFilterChip;

// ============================================
// components/wallet/WalletBadge.js
// ============================================
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const WalletBadge = ({ label, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.badge, { borderColor: `${color}40` }]} onPress={onPress}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: {
    flex: 1, backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md, borderWidth: 1,
    padding: SPACING.sm,
  },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 1 },
  value: { fontSize: FONTS.sizes.base, fontWeight: '900', marginTop: 2 },
});

export default WalletBadge;

// ============================================
// screens/Profile/ProfileScreen.js
// ============================================
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { logout } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { realCash, blazegold } = useSelector(s => s.wallet);

  const menuItems = [
    { icon: '🎯', label: 'My Tournaments', screen: null, action: null },
    { icon: '🏆', label: 'Leaderboard', screen: 'Leaderboard', action: null },
    { icon: '🎯', label: 'Daily Missions', screen: 'Missions', action: null },
    { icon: '🩸', label: 'Bounty Hunter', screen: 'Bounty', action: null },
    { icon: '🔔', label: 'Notifications', screen: 'Notifications', action: null },
    { icon: '🪪', label: 'KYC Verification', screen: 'KYC', action: null },
    { icon: '🚪', label: 'Logout', screen: null, action: () => dispatch(logout()), color: COLORS.error },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient colors={['#1a0500', '#0A0A0F']} style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            {user?.is_kyc_verified && (
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓</Text></View>
            )}
          </View>
          <Text style={styles.username}>{user?.username || 'Setup Profile'}</Text>
          <Text style={styles.ffId}>FF ID: {user?.ff_uid || 'Not linked'}</Text>
          <View style={styles.referralBox}>
            <Text style={styles.referralLabel}>Referral Code</Text>
            <Text style={styles.referralCode}>{user?.referral_code}</Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Wins', value: user?.total_wins || 0, icon: '🏆' },
            { label: 'Total Kills', value: user?.total_kills || 0, icon: '💥' },
            { label: 'Win Streak', value: user?.current_win_streak || 0, icon: '🔥' },
            { label: 'Matches', value: user?.total_matches || 0, icon: '🎮' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Win streak multiplier display */}
        {(user?.current_win_streak || 0) >= 2 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>
              🔥 {user.current_win_streak} Win Streak!
              {user.current_win_streak >= 5 ? ' 3X COINS!' :
               user.current_win_streak >= 3 ? ' 2X COINS!' : ' 1.5X COINS!'}
            </Text>
          </View>
        )}

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.action ? item.action() : item.screen && navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, item.color && { color: item.color }]}>{item.label}</Text>
              {!item.action && <Text style={styles.menuArrow}>›</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: { alignItems: 'center', padding: SPACING.xl, paddingTop: 60 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.gold },
  avatarText: { fontSize: FONTS.sizes.display, fontWeight: '900', color: COLORS.white },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.green, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  verifiedText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  username: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  ffId: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4 },
  referralBox: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: COLORS.gold },
  referralLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2 },
  referralCode: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.gold, letterSpacing: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.base, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  streakBanner: { margin: SPACING.base, backgroundColor: 'rgba(255,69,0,0.15)', borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary },
  streakText: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.primary },
  menu: { padding: SPACING.base },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIcon: { fontSize: 22, width: 36 },
  menuLabel: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.text, fontWeight: '500' },
  menuArrow: { fontSize: FONTS.sizes.xl, color: COLORS.textDim },
});

export default ProfileScreen;
