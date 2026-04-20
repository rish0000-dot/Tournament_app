// screens/Home/HomeScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Animated, FlatList,
  StatusBar, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTournaments } from '../../store/slices/tournamentSlice';
import { fetchWallet, watchAd } from '../../store/slices/walletSlice';
import { fetchProfile } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { TOURNAMENT_MODES } from '../../constants/theme';
import TournamentCard from '../../components/tournament/TournamentCard';
import WalletBadge from '../../components/wallet/WalletBadge';
import ModeFilterChip from '../../components/common/ModeFilterChip';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { list: tournaments, isLoading } = useSelector(s => s.tournaments);
  const { realCash, blazegold } = useSelector(s => s.wallet);
  const [refreshing, setRefreshing] = useState(false);
  const [bounties, setBounties] = useState([]);
  const [missions, setMissions] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const TICKERS = [
    '⚡ Solo BR LIVE — 48/50 Players', '🔥 Free Tournament — 9PM Tonight',
    '🐺 Lone Wolf Qualifier Open', '💰 ₹50L+ Distributed This Month',
    '🎰 Blind Drop — 3X Prize Now!',
  ];

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    startTicker();
  }, []);

  const startTicker = () => {
    Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -width * 3,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadData = async () => {
    dispatch(fetchTournaments());
    dispatch(fetchWallet());
    dispatch(fetchProfile());
    try {
      const [b, m] = await Promise.all([
        api.get('/bounty/most-wanted'),
        api.get('/coins/missions'),
      ]);
      if (b.success) setBounties(b.data.bounties.slice(0, 3));
      if (m.success) setMissions(m.data.missions.filter(m => !m.completed).slice(0, 2));
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleWatchAd = async () => {
    const result = await dispatch(watchAd());
    if (watchAd.fulfilled.match(result) && result.payload.success) {
      // Show toast: `+${result.payload.data.coins_earned} BlazeGold earned!`
    }
  };

  const filteredTournaments = selectedMode
    ? tournaments.filter(t => t.mode === selectedMode)
    : tournaments;

  const liveTournaments = filteredTournaments.filter(t => t.status === 'live').slice(0, 3);
  const upcomingTournaments = filteredTournaments.filter(t => t.status !== 'live').slice(0, 6);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Kya haal hai, {user?.username || 'Warrior'}! 🔥</Text>
            <Text style={styles.subGreeting}>Aaj kaunsa tournament kheloge?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet summary */}
        <View style={styles.walletRow}>
          <WalletBadge
            label="Real Cash"
            value={`₹${realCash.toFixed(2)}`}
            icon="💰"
            color={COLORS.primary}
            onPress={() => navigation.navigate('Wallet')}
          />
          <WalletBadge
            label="BlazeGold"
            value={`${blazegold} 🪙`}
            icon="⭐"
            color={COLORS.gold}
            onPress={() => navigation.navigate('Wallet')}
          />
          <TouchableOpacity style={styles.addMoneyBtn} onPress={() => navigation.navigate('Deposit')}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.addMoneyGrad}>
              <Text style={styles.addMoneyText}>+ ADD</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Ticker */}
      <View style={styles.ticker}>
        <Animated.View style={[styles.tickerInner, { transform: [{ translateX: tickerAnim }] }]}>
          {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
            <Text key={i} style={styles.tickerText}>{t}  •  </Text>
          ))}
        </Animated.View>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Mode filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeFilter} contentContainerStyle={styles.modeFilterContent}>
          <ModeFilterChip label="All" icon="🎮" selected={!selectedMode} onPress={() => setSelectedMode(null)} />
          {Object.entries(TOURNAMENT_MODES).map(([key, val]) => (
            <ModeFilterChip
              key={key}
              label={val.label}
              icon={val.icon}
              selected={selectedMode === key}
              onPress={() => setSelectedMode(selectedMode === key ? null : key)}
              color={val.color}
            />
          ))}
        </ScrollView>

        {/* Blind Drop Banner */}
        <TouchableOpacity
          style={styles.blindDropBanner}
          onPress={() => navigation.navigate('Tournaments', { filter: 'blind_drop' })}
        >
          <LinearGradient
            colors={['#1a0020', '#3d0030', '#1a0020']}
            style={styles.blindDropGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.blindDropEmoji}>🎰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.blindDropTitle}>BLIND DROP</Text>
              <Text style={styles.blindDropSub}>Mode nahi pata — Prize 3X hoga! Mystery mode</Text>
            </View>
            <View style={styles.blindDropBadge}>
              <Text style={styles.blindDropBadgeText}>3X 🔥</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily Missions */}
        {missions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎯 Daily Missions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Missions')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {missions.map((m) => (
              <View key={m.id} style={styles.missionCard}>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionType}>{m.mission_type.replace(/_/g, ' ').toUpperCase()}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(m.progress / m.target) * 100}%` }]} />
                  </View>
                  <Text style={styles.missionProgress}>{m.progress}/{m.target}</Text>
                </View>
                <View style={styles.missionReward}>
                  <Text style={styles.missionCoin}>+{m.coin_reward}</Text>
                  <Text style={styles.missionCoinLabel}>🪙</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* LIVE NOW */}
        {liveTournaments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>LIVE NOW</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Tournaments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {liveTournaments.map(t => (
              <TournamentCard
                key={t.id}
                tournament={t}
                onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
                isLive
              />
            ))}
          </View>
        )}

        {/* Most Wanted Bounties */}
        {bounties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🩸 Most Wanted</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bounty')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bounties.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bountyCard}
                  onPress={() => navigation.navigate('Bounty')}
                >
                  <Text style={styles.bountyAvatar}>👤</Text>
                  <Text style={styles.bountyName}>{b.username}</Text>
                  <Text style={styles.bountyWins}>{b.total_wins} wins</Text>
                  <View style={styles.bountyAmount}>
                    <Text style={styles.bountyAmountText}>₹{parseFloat(b.amount).toFixed(0)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Upcoming Tournaments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏰ Upcoming</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tournaments')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {upcomingTournaments.length > 0
            ? upcomingTournaments.map(t => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
                />
              ))
            : <Text style={styles.emptyText}>Koi tournament nahi mila. Baad mein check karo!</Text>
          }
        </View>

        {/* Watch Ad Earn Coins */}
        <TouchableOpacity style={styles.adCard} onPress={handleWatchAd}>
          <LinearGradient
            colors={[COLORS.bg3, COLORS.bg4]}
            style={styles.adCardGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.adIcon}>📺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adTitle}>Ad Dekho — Coins Pao</Text>
              <Text style={styles.adSub}>Ek ad = 5 BlazeGold (max 5/day)</Text>
            </View>
            <View style={styles.adReward}>
              <Text style={styles.adRewardText}>+5 🪙</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 50, paddingBottom: SPACING.base, paddingHorizontal: SPACING.base },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  greeting: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text },
  subGreeting: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  notifBtn: { padding: 8, backgroundColor: COLORS.bg3, borderRadius: RADIUS.md },
  notifIcon: { fontSize: 20 },
  walletRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addMoneyBtn: { borderRadius: RADIUS.sm, overflow: 'hidden' },
  addMoneyGrad: { paddingHorizontal: 12, paddingVertical: 8 },
  addMoneyText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '800', letterSpacing: 2 },
  ticker: { backgroundColor: COLORS.primary, height: 32, overflow: 'hidden', justifyContent: 'center' },
  tickerInner: { flexDirection: 'row', alignItems: 'center' },
  tickerText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 2, paddingRight: 8 },
  scroll: { flex: 1 },
  modeFilter: { marginTop: SPACING.md },
  modeFilterContent: { paddingHorizontal: SPACING.base, gap: 8 },
  blindDropBanner: { margin: SPACING.base, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#E91E63' },
  blindDropGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: 12 },
  blindDropEmoji: { fontSize: 32 },
  blindDropTitle: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  blindDropSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  blindDropBadge: { backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: RADIUS.sm, padding: 8, borderWidth: 1, borderColor: COLORS.gold },
  blindDropBadgeText: { color: COLORS.gold, fontWeight: '900', fontSize: FONTS.sizes.base },
  section: { paddingHorizontal: SPACING.base, marginTop: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  missionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg3, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    padding: SPACING.md, marginBottom: 8,
  },
  missionInfo: { flex: 1, gap: 4 },
  missionType: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2 },
  progressBar: { height: 4, backgroundColor: COLORS.bg5, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  missionProgress: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  missionReward: { alignItems: 'center' },
  missionCoin: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.gold },
  missionCoinLabel: { fontSize: FONTS.sizes.sm },
  bountyCard: {
    backgroundColor: COLORS.bg3, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,23,68,0.3)',
    padding: SPACING.md, marginRight: 12,
    alignItems: 'center', width: 120,
  },
  bountyAvatar: { fontSize: 36, marginBottom: 4 },
  bountyName: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  bountyWins: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  bountyAmount: { backgroundColor: 'rgba(255,23,68,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  bountyAmountText: { color: COLORS.error, fontWeight: '900', fontSize: FONTS.sizes.base },
  emptyText: { color: COLORS.textDim, textAlign: 'center', padding: SPACING.xl },
  adCard: { margin: SPACING.base, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight },
  adCardGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: 12 },
  adIcon: { fontSize: 28 },
  adTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  adSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  adReward: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.sm, padding: 8 },
  adRewardText: { color: COLORS.gold, fontWeight: '900', fontSize: FONTS.sizes.base },
});

export default HomeScreen;
