// screens/Wallet/DepositScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const DepositScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = ['10', '50', '100', '500'];

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      Alert.alert('Invalid Amount', 'Minimum deposit is ₹10');
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would call /wallet/deposit to get a Razorpay order ID
      const res = await api.post('/wallet/deposit', { amount: numAmount });
      
      if (res.success) {
        // Mocking success for demo since actual Razorpay requires native module setup
        Alert.alert(
          'Payment Gateway', 
          'Redirecting to secure payment...',
          [{ text: 'Simulate Success', onPress: () => finalizeDeposit(res.data.order_id) }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeDeposit = async (orderId) => {
    // This would be called by Razorpay callback
    try {
      setLoading(true);
      const res = await api.post('/wallet/deposit/verify', { 
        order_id: orderId,
        payment_id: 'pay_mock_' + Date.now() 
      });
      if (res.success) {
        Alert.alert('Success', '₹' + amount + ' has been added to your wallet!');
        navigation.navigate('Wallet');
      }
    } catch (e) {
      Alert.alert('Verification Failed', 'Something went wrong. Contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ADD CASH</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ENTER AMOUNT (₹)</Text>
          <View style={styles.inputWrapper}>
             <Text style={styles.currency}>₹</Text>
             <TextInput
               style={styles.input}
               value={amount}
               onChangeText={setAmount}
               keyboardType="numeric"
               placeholder="0.00"
               placeholderTextColor={COLORS.textDim}
               autoFocus
             />
          </View>

          <View style={styles.quickAmountRow}>
            {quickAmounts.map(val => (
              <TouchableOpacity 
                key={val} 
                style={[styles.quickBtn, amount === val && styles.activeQuickBtn]}
                onPress={() => setAmount(val)}
              >
                <Text style={[styles.quickText, amount === val && styles.activeQuickText]}>+₹{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
           <Text style={styles.infoText}>🔒 SSL Encrypted Secure Payments</Text>
           <Text style={styles.infoSub}>Supports UPI, Cards, Netbanking & Wallets</Text>
        </View>

        <TouchableOpacity 
          style={[styles.payBtn, loading && { opacity: 0.7 }]} 
          onPress={handleDeposit}
          disabled={loading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.payGrad}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.payText}>PROCEED TO PAY</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
           <Text style={styles.footerTitle}>Why add cash?</Text>
           <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>🔥</Text>
              <Text style={styles.benefitText}>Join premium tournaments with huge prize pools.</Text>
           </View>
           <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>🛡️</Text>
              <Text style={styles.benefitText}>100% Safe & Secure transactions.</Text>
           </View>
           <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>Instant wallet credit after successful payment.</Text>
           </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  content: { padding: SPACING.base },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.bg3,
    marginBottom: 20,
    ...SHADOWS.md
  },
  cardLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, paddingHorizontal: 20, height: 75, borderWidth: 1, borderColor: COLORS.bg4 },
  currency: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginRight: 10 },
  input: { flex: 1, fontSize: 28, fontWeight: '900', color: COLORS.white },
  quickAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  quickBtn: { flex: 1, backgroundColor: COLORS.bg3, marginHorizontal: 4, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.bg4 },
  activeQuickBtn: { borderColor: COLORS.primary, backgroundColor: 'rgba(255,102,0,0.1)' },
  quickText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  activeQuickText: { color: COLORS.primary },
  infoBox: { alignItems: 'center', marginBottom: 30 },
  infoText: { color: COLORS.textDim, fontSize: 12, fontWeight: '700' },
  infoSub: { color: COLORS.textDim, fontSize: 10, marginTop: 4 },
  payBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.primary },
  payGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
  payText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  footer: { marginTop: 40, padding: 20, backgroundColor: COLORS.bg2, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.bg3 },
  footerTitle: { fontSize: 14, fontWeight: '900', color: COLORS.white, marginBottom: 15 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  benefitIcon: { fontSize: 18 },
  benefitText: { flex: 1, fontSize: 12, color: COLORS.textMuted, lineHeight: 18 }
});

export default DepositScreen;
