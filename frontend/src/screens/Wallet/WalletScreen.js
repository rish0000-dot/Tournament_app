// screens/Wallet/WalletScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const WalletScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState(null);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      if (res.success) {
        setWalletData(res.data);
      }
    } catch (error) {
      console.error('Wallet fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWallet();
  }, []);

  const handleRedeem = async () => {
    if (!walletData?.wallet?.blazegold || walletData.wallet.blazegold < 500) {
      Alert.alert('Low Balance', 'Minimum 500 BlazeGold is required for redemption.');
      return;
    }

    Alert.alert(
      'Redeem BlazeGold',
      `Redeem 500 BlazeGold for ₹5?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: async () => {
            try {
              const res = await api.post('/wallet/redeem-coins', { coins: 500 });
              if (res.success) {
                Alert.alert('Success!', res.message);
                fetchWallet();
              }
            } catch (error) {
              Alert.alert('Error', 'Redemption failed. Check your connection.');
            }
          }
        }
      ]
    );
  };

  if (loading && !walletData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const { wallet, recent_transactions = [], coin_transactions = [] } = walletData || {};

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.bg]} style={styles.header}>
        <Text style={styles.headerTitle}>MY WALLET</Text>
        
        {/* Balance Cards */}
        <View style={styles.balanceContainer}>
          <View style={styles.mainBalanceCard}>
            <Text style={styles.balanceLabel}>TOTAL CASH</Text>
            <Text style={styles.balanceValue}>₹{wallet?.real_cash?.toFixed(2)}</Text>
            <View style={styles.balanceSubRow}>
               <Text style={styles.balanceSubText}>Deposit: ₹{wallet?.real_cash - wallet?.total_won > 0 ? (wallet?.real_cash - wallet?.total_won).toFixed(2) : '0.00'}</Text>
               <Text style={styles.balanceSubText}>Winning: ₹{wallet?.total_won?.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.coinBalanceCard}>
             <View style={styles.coinInfo}>
                <Text style={styles.coinValue}>🪙 {wallet?.blazegold}</Text>
                <Text style={styles.coinLabel}>BlazeGold Coins</Text>
             </View>
             <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
                <Text style={styles.redeemBtnText}>REDEEM</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('Deposit')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>ADD CASH</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: COLORS.bg3 }]} 
            onPress={() => navigation.navigate('Withdraw')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        {recent_transactions.length === 0 && coin_transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          [...recent_transactions, ...coin_transactions]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 15)
            .map((tx, idx) => (
              <View key={tx.id || idx} style={styles.txRow}>
                <View style={styles.txIconContainer}>
                  <Text style={styles.txIcon}>
                    {tx.type === 'deposit' ? '💰' : tx.type === 'withdrawal' ? '📤' : tx.type === 'redeem' ? '🔄' : '🎮'}
                  </Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.description || tx.type.toUpperCase()}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={[styles.txAmount, { color: (tx.amount > 0 && tx.type !== 'withdrawal') ? COLORS.success : COLORS.error }]}>
                  {tx.amount > 0 && tx.type !== 'withdrawal' ? '+' : ''}{tx.amount}
                  {tx.blazegold ? ' 🪙' : ' ₹'}
                </Text>
              </View>
            ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: SPACING.base, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, textAlign: 'center', marginBottom: 25, letterSpacing: 2 },
  balanceContainer: { gap: 15 },
  mainBalanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginBottom: 5 },
  balanceValue: { color: COLORS.white, fontSize: 36, fontWeight: '900' },
  balanceSubRow: { flexDirection: 'row', gap: 20, marginTop: 10 },
  balanceSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  coinBalanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.lg,
    padding: 15
  },
  coinValue: { fontSize: 20, fontWeight: '900', color: COLORS.gold },
  coinLabel: { fontSize: 12, color: COLORS.textDim, fontWeight: '700' },
  redeemBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 15, paddingVertical: 8, borderRadius: RADIUS.sm },
  redeemBtnText: { color: COLORS.bg, fontWeight: '900', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md
  },
  actionIcon: { fontSize: 18, marginRight: 8 },
  actionText: { fontWeight: '900', color: COLORS.bg, letterSpacing: 1, fontSize: 12 },
  content: { flex: 1, padding: SPACING.base },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textMuted, marginBottom: 15, marginTop: 10, letterSpacing: 1 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    padding: 15,
    borderRadius: RADIUS.lg,
    marginBottom: 10
  },
  txIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  txDate: { fontSize: 11, color: COLORS.textDim, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '900' },
  emptyContainer: { paddingVertical: 50, alignItems: 'center' },
  emptyText: { color: COLORS.textDim },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }
});

export default WalletScreen;
