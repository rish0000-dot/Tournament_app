// App.js — Root Entry Point
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

// Polyfill store properly
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './src/store/slices/authSlice';
import walletReducer from './src/store/slices/walletSlice';
import tournamentReducer from './src/store/slices/tournamentSlice';
import uiReducer from './src/store/slices/uiSlice';

const appStore = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    tournaments: tournamentReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

const App = () => {
  return (
    <Provider store={appStore}>
      <AppNavigator />
      <Toast />
    </Provider>
  );
};

export default App;

// ============================================
// screens/Auth/SplashScreen.js
// ============================================
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { loadUser } from '../../store/slices/authSlice';
import { fetchWallet } from '../../store/slices/walletSlice';
import { COLORS, FONTS } from '../../constants/theme';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(async () => {
      const result = await dispatch(loadUser());
      if (loadUser.fulfilled.match(result) && result.payload) {
        dispatch(fetchWallet());
        // Navigation handled by AppNavigator state
      } else {
        navigation.replace('Login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#0A0A0F', '#1a0500', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <Text style={styles.logoFire}>🔥</Text>
        <Text style={styles.logo}>BLAZE<Text style={styles.logoAccent}>STRIKE</Text></Text>
        <Text style={styles.tagline}>⚡ DOMINATE THE BATTLEFIELD</Text>
      </Animated.View>

      <Animated.Text style={[styles.loading, { opacity: opacityAnim }]}>
        Loading...
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoFire: { fontSize: 64, marginBottom: 8 },
  logo: { fontSize: 48, fontWeight: '900', letterSpacing: 4, color: COLORS.text },
  logoAccent: { color: COLORS.primary },
  tagline: { fontSize: 11, letterSpacing: 4, color: COLORS.textMuted, marginTop: 8, fontWeight: '700' },
  loading: { position: 'absolute', bottom: 60, color: COLORS.textDim, fontSize: FONTS.sizes.sm, letterSpacing: 2 },
});

export default SplashScreen;

// ============================================
// screens/Wallet/DepositScreen.js
// ============================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { useDispatch } from 'react-redux';
import { fetchWallet } from '../../store/slices/walletSlice';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const DepositScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (depositAmount) => {
    const amt = parseFloat(depositAmount || amount);
    if (!amt || amt < 10) { Alert.alert('Error', 'Minimum deposit is ₹10'); return; }

    try {
      setLoading(true);
      const res = await api.post('/wallet/deposit/initiate', { amount: amt });
      if (!res.success) throw new Error(res.message);

      const options = {
        description: 'BlazeStrike Wallet',
        image: 'https://blazestrike.gg/logo.png',
        currency: 'INR',
        key: res.data.razorpay_key,
        amount: res.data.amount,
        order_id: res.data.order_id,
        name: 'BlazeStrike',
        prefill: { contact: res.data.user.phone, name: res.data.user.name },
        theme: { color: '#FF4500' },
      };

      const data = await RazorpayCheckout.open(options);

      // Confirm payment
      const confirm = await api.post('/wallet/deposit/confirm', {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });

      if (confirm.success) {
        dispatch(fetchWallet());
        Alert.alert('✅ Success!', `₹${amt} wallet mein add ho gaya!`);
        navigation.goBack();
      }
    } catch (e) {
      if (e.code !== 2) Alert.alert('Failed', e.description || 'Deposit failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Money</Text>
        <View />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Quick Select Amount</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.presetBtn, amount == a && styles.presetSelected]}
              onPress={() => setAmount(a.toString())}
            >
              <Text style={[styles.presetText, amount == a && { color: COLORS.primary }]}>₹{a}</Text>
              {a === 100 && <Text style={styles.bonusTag}>+50 Bonus</Text>}
              {a === 200 && <Text style={styles.bonusTag}>+100 Bonus</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Custom Amount</Text>
        <View style={styles.inputRow}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.input}
            value={amount.toString()}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount (min ₹10)"
            placeholderTextColor={COLORS.textDim}
          />
        </View>

        {parseFloat(amount) >= 100 && (
          <View style={styles.bonusCard}>
            <Text style={styles.bonusTitle}>🎁 First Deposit Bonus</Text>
            <Text style={styles.bonusDesc}>
              +₹{Math.min(parseFloat(amount) * 0.5, 100).toFixed(0)} bonus cash milega! (50% upto ₹100)
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.payBtn, loading && styles.disabled]}
          onPress={() => handleDeposit()}
          disabled={loading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.payGrad}>
            <Text style={styles.payText}>
              {loading ? '⏳ Processing...' : `Pay ₹${amount || '0'} via Razorpay`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.payMethods}>
          <Text style={styles.payMethodsTitle}>Accepted Payments</Text>
          <View style={styles.payMethodsRow}>
            {['UPI', 'Paytm', 'Cards', 'NetBanking'].map(m => (
              <View key={m} style={styles.payMethod}>
                <Text style={styles.payMethodText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  scroll: { flex: 1, padding: SPACING.base },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, marginTop: 20 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  presetBtn: { width: '30%', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.md, alignItems: 'center' },
  presetSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  presetText: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text },
  bonusTag: { fontSize: FONTS.sizes.xs, color: COLORS.gold, fontWeight: '700', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 12 },
  rupeeSymbol: { fontSize: FONTS.sizes.xl, color: COLORS.textMuted, paddingHorizontal: SPACING.base },
  input: { flex: 1, fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text, padding: SPACING.base },
  bonusCard: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.md, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.gold, marginBottom: 20 },
  bonusTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
  bonusDesc: { fontSize: FONTS.sizes.sm, color: COLORS.text },
  payBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 24 },
  disabled: { opacity: 0.5 },
  payGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  payText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: 1 },
  payMethods: { alignItems: 'center' },
  payMethodsTitle: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, letterSpacing: 2, marginBottom: 12 },
  payMethodsRow: { flexDirection: 'row', gap: 12 },
  payMethod: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.borderLight },
  payMethodText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '600' },
});

export default DepositScreen;
