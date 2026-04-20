// screens/Tournament/TournamentDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, FlatList
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTournamentDetail, joinTournament } from '../../store/slices/tournamentSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { TOURNAMENT_MODES } from '../../constants/theme';
import moment from 'moment';

const TournamentDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { selected: tournament, isJoining } = useSelector(s => s.tournaments);
  const { realCash, bonusCash } = useSelector(s => s.wallet);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchTournamentDetail(id)).finally(() => setLoading(false));
    // Refresh every 30 seconds for live data
    const interval = setInterval(() => dispatch(fetchTournamentDetail(id)), 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleJoin = async () => {
    if (!tournament) return;
    const balance = realCash + bonusCash;

    if (tournament.entry_fee > 0 && balance < tournament.entry_fee) {
      Alert.alert(
        'Insufficient Balance',
        `Aapke wallet mein ₹${balance.toFixed(2)} hai. ₹${tournament.entry_fee} chahiye.`,
        [
          { text: 'Add Money', onPress: () => navigation.navigate('Deposit') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    Alert.alert(
      'Join Tournament?',
      tournament.entry_fee > 0
        ? `₹${tournament.entry_fee} wallet se deduct hoga.`
        : 'Free tournament — koi charge nahi!',
      [
        {
          text: 'JOIN', onPress: async () => {
            const result = await dispatch(joinTournament({ id }));
            if (joinTournament.fulfilled.match(result)) {
              Alert.alert('✅ Joined!', 'Room ID match se 15 min pehle milega.');
              dispatch(fetchTournamentDetail(id));
            } else {
              Alert.alert('Error', result.payload || 'Join failed');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading || !tournament) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  const mode = TOURNAMENT_MODES[tournament.mode] || TOURNAMENT_MODES.solo_br;
  const isRegistered = !!tournament.user_registration;
  const isFull = tournament.filled_slots >= tournament.total_slots;
  const isLive = tournament.status === 'live';
  const isCompleted = tournament.status === 'completed';
  const showRoom = tournament.room_revealed && tournament.room_id;
  const distribution = tournament.prize_distribution || {};
  const minutesLeft = moment(tournament.scheduled_at).diff(moment(), 'minutes');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerBadges}>
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>🔴 LIVE</Text></View>}
          {tournament.is_free && <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>}
          {tournament.is_blind_drop && <View style={styles.blindBadge}><Text style={styles.blindBadgeText}>🎰 BLIND 3X</Text></View>}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <LinearGradient
          colors={[`${mode.color}22`, COLORS.bg]}
          style={styles.hero}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        >
          <Text style={styles.heroIcon}>{mode.icon}</Text>
          <Text style={styles.heroMode} style={[styles.heroMode, { color: mode.color }]}>{mode.label}</Text>
          <Text style={styles.heroTitle}>{tournament.title}</Text>

          {/* Prize */}
          <View style={styles.prizeHero}>
            <Text style={styles.prizeHeroLabel}>Prize Pool</Text>
            <Text style={styles.prizeHeroAmount}>
              {tournament.is_free
                ? `${parseFloat(tournament.prize_pool).toFixed(0)} 🪙 BlazeGold`
                : `₹${parseFloat(tournament.prize_pool).toLocaleString()}`}
            </Text>
          </View>

          {/* Countdown */}
          {!isLive && !isCompleted && (
            <View style={styles.countdown}>
              <Text style={styles.countdownLabel}>
                {minutesLeft > 0 ? `Starts in: ${moment(tournament.scheduled_at).fromNow()}` : 'Starting soon...'}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {[
            { label: 'Entry Fee', value: tournament.entry_fee == 0 ? 'FREE' : `₹${tournament.entry_fee}`, icon: '💳' },
            { label: 'Total Slots', value: tournament.total_slots, icon: '👥' },
            { label: 'Filled', value: tournament.filled_slots || 0, icon: '✅' },
            { label: 'Remaining', value: tournament.total_slots - (tournament.filled_slots || 0), icon: '🎯' },
            { label: 'Map', value: tournament.map || 'Any', icon: '🗺️' },
            { label: 'Mode', value: mode.label, icon: mode.icon },
          ].map(item => (
            <View key={item.label} style={styles.infoCard}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
              <Text style={styles.infoLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Room ID — show 15 min before */}
        {isRegistered && (
          <View style={[styles.roomCard, showRoom && styles.roomCardRevealed]}>
            {showRoom ? (
              <>
                <Text style={styles.roomTitle}>🎮 Room Details</Text>
                <View style={styles.roomRow}>
                  <View style={styles.roomItem}>
                    <Text style={styles.roomLabel}>ROOM ID</Text>
                    <Text style={styles.roomValue}>{tournament.room_id}</Text>
                  </View>
                  <View style={styles.roomDivider} />
                  <View style={styles.roomItem}>
                    <Text style={styles.roomLabel}>PASSWORD</Text>
                    <Text style={styles.roomValue}>{tournament.room_password}</Text>
                  </View>
                </View>
                <Text style={styles.roomNote}>⚠️ Abhi Free Fire open karo aur Custom Room join karo</Text>
              </>
            ) : (
              <>
                <Text style={styles.roomTitle}>✅ You are Registered!</Text>
                <Text style={styles.roomHidden}>
                  🔒 Room ID & Password {minutesLeft > 15
                    ? `match se ${minutesLeft - 15} min pehle milegi`
                    : 'abhi milegi — refresh karo!'}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Per Kill info */}
        {tournament.mode === 'solo_per_kill' && tournament.per_kill_rate && (
          <View style={styles.specialRule}>
            <Text style={styles.specialRuleTitle}>⚡ Per Kill Rate</Text>
            <Text style={styles.specialRuleValue}>₹{tournament.per_kill_rate} per kill</Text>
            <Text style={styles.specialRuleNote}>Max 25 kills counted • Min 3 kills required</Text>
          </View>
        )}

        {/* Prize Distribution */}
        {Object.keys(distribution).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Prize Distribution</Text>
            {Object.entries(distribution).map(([rank, prize]) => (
              <View key={rank} style={[styles.prizeRow, parseInt(rank) <= 3 && styles.prizeRowTop]}>
                <Text style={styles.prizeRank}>
                  {rank == 1 ? '🥇' : rank == 2 ? '🥈' : rank == 3 ? '🥉' : `#${rank}`}
                </Text>
                <Text style={styles.prizeRankLabel}>Rank {rank}</Text>
                <Text style={styles.prizeRowAmount}>
                  {tournament.is_free ? `${prize} 🪙` : `₹${prize}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Rules */}
        {tournament.rules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Rules</Text>
            <Text style={styles.rulesText}>{tournament.rules}</Text>
          </View>
        )}

        {/* Registered Players */}
        {tournament.players && tournament.players.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Registered Players ({tournament.players.length})</Text>
            <FlatList
              data={tournament.players.slice(0, 20)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.playerChip}>
                  <Text style={styles.playerChipSlot}>#{item.slot_number || index + 1}</Text>
                  <Text style={styles.playerChipName}>{item.ff_username || item.username}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Submit result if registered + match completed/live */}
        {isRegistered && (isLive || isCompleted) && !tournament.user_result && (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate('SubmitResult', { tournamentId: id })}
          >
            <LinearGradient colors={[COLORS.green, '#00a050']} style={styles.submitGrad}>
              <Text style={styles.submitText}>📸 Submit Result</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {tournament.user_result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Your Result</Text>
            <Text style={styles.resultRank}>Rank #{tournament.user_result.rank}</Text>
            <Text style={styles.resultKills}>{tournament.user_result.kills} Kills</Text>
            <View style={[styles.resultStatus, {
              backgroundColor: tournament.user_result.status === 'verified' ? 'rgba(0,230,118,0.1)' : 'rgba(255,215,0,0.1)'
            }]}>
              <Text style={{ color: tournament.user_result.status === 'verified' ? COLORS.green : COLORS.gold }}>
                {tournament.user_result.status === 'verified' ? '✅ Verified' :
                 tournament.user_result.status === 'rejected' ? '❌ Rejected' : '⏳ Under Review'}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!isRegistered && !isCompleted && (
        <View style={styles.bottomCTA}>
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomPrice}>
              {tournament.entry_fee == 0 ? 'FREE' : `₹${tournament.entry_fee}`}
            </Text>
            <Text style={styles.bottomSlots}>
              {tournament.total_slots - (tournament.filled_slots || 0)} slots left
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, (isFull || isJoining) && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={isFull || isJoining}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.joinGrad}>
              <Text style={styles.joinText}>
                {isFull ? 'FULL' : isJoining ? '⏳ Joining...' : 'JOIN NOW →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textMuted, marginTop: 12, fontSize: FONTS.sizes.base },
  header: { paddingTop: 50, paddingBottom: SPACING.md, paddingHorizontal: SPACING.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 4 },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  headerBadges: { flexDirection: 'row', gap: 8 },
  liveBadge: { backgroundColor: 'rgba(255,23,68,0.2)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  liveBadgeText: { color: COLORS.error, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  freeBadge: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.gold },
  freeBadgeText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '800' },
  blindBadge: { backgroundColor: 'rgba(233,30,99,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  blindBadgeText: { color: '#E91E63', fontSize: FONTS.sizes.xs, fontWeight: '800' },
  hero: { alignItems: 'center', padding: SPACING.xl, paddingBottom: SPACING.xxl },
  heroIcon: { fontSize: 56, marginBottom: 8 },
  heroMode: { fontSize: FONTS.sizes.xs, fontWeight: '800', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  prizeHero: { alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, paddingHorizontal: 32, paddingVertical: 16, borderWidth: 1, borderColor: COLORS.goldGlow },
  prizeHeroLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 3, textTransform: 'uppercase' },
  prizeHeroAmount: { fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.gold, marginTop: 4 },
  countdown: { marginTop: 12 },
  countdownLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.base, gap: 10 },
  infoCard: { flex: 1, minWidth: '30%', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoValue: { fontSize: FONTS.sizes.base, fontWeight: '900', color: COLORS.text },
  infoLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  roomCard: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.borderLight },
  roomCardRevealed: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  roomTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  roomRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  roomItem: { flex: 1, alignItems: 'center' },
  roomLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, marginBottom: 4 },
  roomValue: { fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.primary, letterSpacing: 4 },
  roomDivider: { width: 1, height: 40, backgroundColor: COLORS.borderLight, marginHorizontal: 16 },
  roomNote: { fontSize: FONTS.sizes.xs, color: COLORS.warning, textAlign: 'center' },
  roomHidden: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 8 },
  specialRule: { margin: SPACING.base, backgroundColor: 'rgba(255,107,0,0.1)', borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)', alignItems: 'center' },
  specialRuleTitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, letterSpacing: 2 },
  specialRuleValue: { fontSize: FONTS.sizes.display, fontWeight: '900', color: COLORS.primaryLight, marginVertical: 4 },
  specialRuleNote: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  section: { padding: SPACING.base, marginTop: 4 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.sm, marginBottom: 4, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.borderLight },
  prizeRowTop: { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.05)' },
  prizeRank: { fontSize: 20, width: 32 },
  prizeRankLabel: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  prizeRowAmount: { fontSize: FONTS.sizes.base, fontWeight: '900', color: COLORS.gold },
  rulesText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 22 },
  playerChip: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.sm, padding: SPACING.sm, marginRight: 8, alignItems: 'center', minWidth: 70, borderWidth: 1, borderColor: COLORS.borderLight },
  playerChipSlot: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: '700' },
  playerChipName: { fontSize: FONTS.sizes.xs, color: COLORS.text, marginTop: 2 },
  submitBtn: { margin: SPACING.base, borderRadius: RADIUS.lg, overflow: 'hidden' },
  submitGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  submitText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: 2 },
  resultCard: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  resultTitle: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  resultRank: { fontSize: FONTS.sizes.display, fontWeight: '900', color: COLORS.gold, marginVertical: 4 },
  resultKills: { fontSize: FONTS.sizes.base, color: COLORS.text },
  resultStatus: { marginTop: 12, borderRadius: RADIUS.sm, paddingHorizontal: 16, paddingVertical: 6 },
  bottomCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bg2, borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.base, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bottomInfo: { flex: 1 },
  bottomPrice: { fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.gold },
  bottomSlots: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  joinBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  joinBtnDisabled: { opacity: 0.5 },
  joinGrad: { padding: SPACING.base + 2, alignItems: 'center' },
  joinText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '900', letterSpacing: 2 },
});

export default TournamentDetailScreen;
