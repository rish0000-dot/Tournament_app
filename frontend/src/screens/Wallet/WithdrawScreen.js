// screens/Wallet/WithdrawScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import api from '../../services/api';
import { fetchWallet } from '../../store/slices/walletSlice';

const WithdrawScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const { realCash } = useSelector(s => s.wallet);
  const dispatch = useDispatch();

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 10) {
      Alert.alert('Error', 'Minimum withdrawal ₹10 hai');
      return;
    }
    if (parseFloat(amount) > realCash) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    if (method === 'upi' && !upiId) {
      Alert.alert('Error', 'UPI ID required');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/wallet/withdraw', {
        amount: parseFloat(amount),
        method,
        upi_id: upiId
      });
      if (res.success) {
        dispatch(fetchWallet());
        Alert.alert('✅ Withdrawal Initiated!', res.message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Withdraw Money</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(255,215,0,0.1)', 'transparent']}
          style={styles.balanceCard}
        >
          <Text style={styles.balLabel}>Available Balance</Text>
          <Text style={styles.balAmount}>₹{realCash.toFixed(2)}</Text>
        </LinearGradient>

        <Text style={styles.inputLabel}>AMOUNT TO WITHDRAW</Text>
        <View style={styles.inputRow}>
          <Text style={styles.rupeeMark}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Min ₹10"
            placeholderTextColor={COLORS.textDim}
          />
        </View>

        <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodToggle}>
          {[
            { key: 'upi', label: '📱 UPI (Instant)' },
            { key: 'bank', label: '🏦 Bank (24hr)' }
          ].map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodBtn, method === m.key && styles.methodBtnActive]}
              onPress={() => setMethod(m.key)}
            >
              <Text style={[styles.methodText, method === m.key && { color: COLORS.primary }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === 'upi' && (
          <>
            <Text style={styles.inputLabel}>UPI ID / VPA</Text>
            <TextInput
              style={styles.upiInput}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="example@upi"
              placeholderTextColor={COLORS.textDim}
              autoCapitalize="none"
            />
          </>
        )}

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>⚡ UPI withdrawals are instant (24/7).</Text>
          <Text style={styles.noticeText}>🏦 Bank transfers may take up to 24-48 business hours.</Text>
          <Text style={styles.noticeText}>💳 Verify your KYC for withdrawals above ₹1,000.</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, (loading || !amount) && styles.btnDisabled]}
          onPress={handleWithdraw}
          disabled={loading || !amount}
        >
          <LinearGradient
            colors={[COLORS.green, '#00a050']}
            style={styles.confirmGrad}
          >
            <Text style={styles.confirmBtnText}>
              {loading ? '⏳ PROCESSING...' : `WITHDRAW ₹${amount || '0'}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: 56,
    paddingBottom: SPACING.md
  },
  backBtn: { padding: 8 },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '700' },
  titleText: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  scroll: { flex: 1, padding: SPACING.base },
  balanceCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)'
  },
  balLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, fontWeight: '700' },
  balAmount: { fontSize: FONTS.sizes.hero, fontWeight: '900', color: COLORS.gold, marginTop: 4 },
  inputLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 20
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  rupeeMark: { fontSize: FONTS.sizes.xl, color: COLORS.textMuted, paddingHorizontal: SPACING.base, fontWeight: '700' },
  amountInput: {
    flex: 1,
    fontSize: FONTS.sizes.xl,
    fontWeight: '900',
    color: COLORS.text,
    padding: SPACING.base
  },
  methodToggle: { flexDirection: 'row', gap: 12 },
  methodBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,69,0,0.1)' },
  methodText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '700' },
  upiInput: {
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.base,
    color: COLORS.text,
    fontSize: FONTS.sizes.base,
    fontWeight: '600'
  },
  noticeBox: { backgroundColor: COLORS.bg2, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: 16, gap: 8 },
  noticeText: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, fontWeight: '500' },
  confirmBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 32 },
  btnDisabled: { opacity: 0.5 },
  confirmGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  confirmBtnText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '900', letterSpacing: 2 },
});

export default WithdrawScreen;
