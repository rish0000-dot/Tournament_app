// screens/Tournament/TournamentsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTournaments, setFilter } from '../../store/slices/tournamentSlice';
import TournamentCard from '../../components/tournament/TournamentCard';
import ModeFilterChip from '../../components/common/ModeFilterChip';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { TOURNAMENT_MODES } from '../../constants/theme';

const TournamentsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { list, isLoading, filters } = useSelector(s => s.tournaments);
  const [activeFilter, setActiveFilter] = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    dispatch(fetchTournaments({ mode: filters.mode, is_free: filters.is_free }));
  }, [filters]);

  const applyFilter = (mode) => {
    setActiveFilter(mode);
    dispatch(setFilter({ mode: mode === 'all' ? null : mode }));
    dispatch(fetchTournaments({ mode: mode === 'all' ? undefined : mode }));
  };

  const toggleFree = () => {
    setFreeOnly(!freeOnly);
    dispatch(setFilter({ is_free: !freeOnly ? true : null }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Tournaments</Text>
        <TouchableOpacity style={[styles.freeToggle, freeOnly && styles.freeToggleActive]} onPress={toggleFree}>
          <Text style={[styles.freeToggleText, freeOnly && styles.freeToggleTextActive]}>
            🎁 FREE ONLY
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        <ModeFilterChip label="All" icon="🎮" selected={activeFilter === 'all'} onPress={() => applyFilter('all')} />
        {Object.entries(TOURNAMENT_MODES).map(([key, val]) => (
          <ModeFilterChip key={key} label={val.label} icon={val.icon}
            selected={activeFilter === key} onPress={() => applyFilter(key)} color={val.color} />
        ))}
      </ScrollView>

      {/* Tournament list */}
      <FlatList
        data={list}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TournamentCard
            tournament={item}
            onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isLoading ? '⏳ Loading tournaments...' : 'Koi tournament nahi mila'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  freeToggle: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: COLORS.borderLight },
  freeToggleActive: { backgroundColor: COLORS.goldGlow, borderColor: COLORS.gold },
  freeToggleText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  freeToggleTextActive: { color: COLORS.gold },
  filters: { maxHeight: 48 },
  filtersContent: { paddingHorizontal: SPACING.base, gap: 8, alignItems: 'center' },
  list: { padding: SPACING.base, paddingBottom: 100 },
  empty: { textAlign: 'center', color: COLORS.textDim, padding: SPACING.xxxl },
});

export default TournamentsScreen;

// ============================================
// screens/Wallet/WalletScreen.js
// ============================================
import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, redeemCoins } from '../../store/slices/walletSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import moment from 'moment';

const WalletScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { realCash, bonusCash, blazegold, transactions, isLoading } = useSelector(s => s.wallet);

  useEffect(() => { dispatch(fetchWallet()); }, []);

  const handleRedeem = () => {
    if (blazegold < 500) return;
    dispatch(redeemCoins(Math.floor(blazegold / 500) * 500));
  };

  const txIcon = (type) => {
    const icons = { deposit: '💳', withdrawal: '🏦', tournament_win: '🏆', tournament_entry: '🎮', coin_redeem: '🪙', bonus: '🎁', referral: '👥' };
    return icons[type] || '💰';
  };

  const txColor = (type) => {
    const pos = ['deposit', 'tournament_win', 'bonus', 'referral', 'coin_redeem'];
    return pos.includes(type) ? COLORS.green : COLORS.error;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Wallet</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceGrid}>
          <LinearGradient colors={['#1a1a00', '#2a2000']} style={[styles.balanceCard, styles.mainBalance]}>
            <Text style={styles.balanceLabel}>Real Cash</Text>
            <Text style={styles.balanceAmount}>₹{realCash.toFixed(2)}</Text>
            <Text style={styles.balanceNote}>Withdrawable anytime</Text>
          </LinearGradient>

          <View style={styles.smallBalances}>
            <View style={[styles.balanceCard, styles.smallCard]}>
              <Text style={styles.smallLabel}>Bonus</Text>
              <Text style={[styles.smallAmount, { color: COLORS.cyan }]}>₹{bonusCash.toFixed(2)}</Text>
              <Text style={styles.smallNote}>Entry only</Text>
            </View>
            <View style={[styles.balanceCard, styles.smallCard]}>
              <Text style={styles.smallLabel}>BlazeGold</Text>
              <Text style={[styles.smallAmount, { color: COLORS.gold }]}>{blazegold} 🪙</Text>
              <Text style={styles.smallNote}>= ₹{(blazegold / 100).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Deposit')}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.actionGrad}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionText}>Add Money</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Withdraw')}>
            <LinearGradient colors={['#00332a', '#001a15']} style={[styles.actionGrad, { borderWidth: 1, borderColor: COLORS.green }]}>
              <Text style={styles.actionIcon}>⬆️</Text>
              <Text style={[styles.actionText, { color: COLORS.green }]}>Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, blazegold < 500 && styles.disabled]}
            onPress={handleRedeem}
            disabled={blazegold < 500}
          >
            <LinearGradient colors={['#332200', '#1a1100']} style={[styles.actionGrad, { borderWidth: 1, borderColor: COLORS.gold }]}>
              <Text style={styles.actionIcon}>🪙</Text>
              <Text style={[styles.actionText, { color: COLORS.gold }]}>Redeem Coins</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* BlazeGold info */}
        <View style={styles.coinInfo}>
          <Text style={styles.coinInfoTitle}>🪙 BlazeGold Info</Text>
          <View style={styles.coinInfoRow}>
            <Text style={styles.coinInfoLabel}>Balance</Text>
            <Text style={styles.coinInfoValue}>{blazegold} BlazeGold</Text>
          </View>
          <View style={styles.coinInfoRow}>
            <Text style={styles.coinInfoLabel}>= Cash Value</Text>
            <Text style={styles.coinInfoValue}>₹{(blazegold / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.coinInfoRow}>
            <Text style={styles.coinInfoLabel}>Min Redeem</Text>
            <Text style={styles.coinInfoValue}>500 coins = ₹5</Text>
          </View>
          <View style={styles.coinInfoRow}>
            <Text style={styles.coinInfoLabel}>Rate</Text>
            <Text style={styles.coinInfoValue}>100 BlazeGold = ₹1</Text>
          </View>
          {blazegold >= 500 && (
            <TouchableOpacity onPress={handleRedeem} style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem {Math.floor(blazegold / 500) * 500} coins → ₹{(Math.floor(blazegold / 500) * 500 / 100).toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction history */}
        <View style={styles.txSection}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.empty}>Koi transaction nahi abhi tak</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.txRow}>
                <Text style={styles.txIcon}>{txIcon(tx.type)}</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txDate}>{moment(tx.created_at).fromNow()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: txColor(tx.type) }]}>
                  {['deposit', 'tournament_win', 'bonus', 'coin_redeem'].includes(tx.type) ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.base, paddingTop: 56 },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  balanceGrid: { padding: SPACING.base, gap: 12 },
  balanceCard: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.base },
  mainBalance: { borderColor: 'rgba(255,215,0,0.3)' },
  balanceLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  balanceAmount: { fontSize: FONTS.sizes.hero, fontWeight: '900', color: COLORS.gold, marginVertical: 4 },
  balanceNote: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  smallBalances: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, backgroundColor: COLORS.bg3 },
  smallLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 1 },
  smallAmount: { fontSize: FONTS.sizes.xl, fontWeight: '900', marginVertical: 2 },
  smallNote: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  actions: { flexDirection: 'row', padding: SPACING.base, gap: 8 },
  actionBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  actionGrad: { padding: SPACING.md, alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 20 },
  actionText: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  disabled: { opacity: 0.4 },
  coinInfo: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.goldGlow },
  coinInfoTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.gold, marginBottom: SPACING.md },
  coinInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  coinInfoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  coinInfoValue: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '700' },
  redeemBtn: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.gold },
  redeemBtnText: { color: COLORS.gold, fontWeight: '800', fontSize: FONTS.sizes.base },
  txSection: { padding: SPACING.base },
  txTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  txIcon: { fontSize: 24, width: 36 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: FONTS.sizes.sm, color: COLORS.text, fontWeight: '500' },
  txDate: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, marginTop: 2 },
  txAmount: { fontSize: FONTS.sizes.base, fontWeight: '800' },
  empty: { textAlign: 'center', color: COLORS.textDim, padding: SPACING.xl },
});

export default WalletScreen;
