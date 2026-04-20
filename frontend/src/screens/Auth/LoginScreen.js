// screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, KeyboardAvoidingView, Platform, Animated, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { sendOTP, setPhone } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(s => s.auth);
  const [phone, setPhoneLocal] = useState('');
  const [shake] = useState(new Animated.Value(0));

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) { shakeInput(); return; }
    dispatch(setPhone(phone));
    const result = await dispatch(sendOTP(phone));
    if (sendOTP.fulfilled.match(result)) {
      navigation.navigate('OTP', { phone });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Animated background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A0A00', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Grid overlay */}
      <View style={styles.grid} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>BLAZE<Text style={styles.logoAccent}>STRIKE</Text></Text>
          <Text style={styles.logoTagline}>⚡ INDIA'S #1 FREE FIRE TOURNAMENT</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardCornerTL} />
          <View style={styles.cardCornerBR} />

          <Text style={styles.cardTitle}>Enter Your Number</Text>
          <Text style={styles.cardSubtitle}>Apna mobile number daalo — OTP aayega</Text>

          {/* Phone input */}
          <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shake }] }]}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>🇮🇳  +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textDim}
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={setPhoneLocal}
              selectionColor={COLORS.primary}
            />
          </Animated.View>

          {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {isLoading ? '⏳ Sending...' : 'GET OTP  →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            Login karke aap hamare{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> agree karte hain
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[['2.4L+', 'Players'], ['₹50L+', 'Prize'], ['FREE', 'Entry']].map(([num, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statNum}>{num}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  grid: {
    position: 'absolute', inset: 0,
    opacity: 0.05,
    // Grid pattern via background - simplified for RN
  },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: {
    fontSize: 42, fontWeight: '900', letterSpacing: 4,
    color: COLORS.text,
  },
  logoAccent: { color: COLORS.primary },
  logoTagline: {
    fontSize: 10, fontWeight: '700', letterSpacing: 3,
    color: COLORS.textMuted, marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 24, height: 24,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: COLORS.primary,
  },
  cardCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: COLORS.primary,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl, fontWeight: '800',
    color: COLORS.text, marginBottom: 6,
  },
  cardSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginBottom: 24 },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    marginBottom: 16,
  },
  phonePrefix: {
    backgroundColor: COLORS.bg5,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  phonePrefixText: { color: COLORS.text, fontSize: FONTS.sizes.base, fontWeight: '600' },
  input: {
    flex: 1, paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    color: COLORS.text, fontSize: FONTS.sizes.lg,
    fontWeight: '700', letterSpacing: 3,
  },
  errorText: { color: COLORS.error, fontSize: FONTS.sizes.sm, marginBottom: 12 },
  button: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { padding: SPACING.base + 2, alignItems: 'center' },
  buttonText: {
    color: COLORS.white, fontSize: FONTS.sizes.base,
    fontWeight: '800', letterSpacing: 3,
  },
  terms: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, textAlign: 'center' },
  termsLink: { color: COLORS.primary },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 40, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  statItem: { alignItems: 'center' },
  statNum: {
    fontSize: FONTS.sizes.xxl, fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, marginTop: 2 },
});

export default LoginScreen;

// ============================================
// screens/Auth/OTPScreen.js
// ============================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOTP, sendOTP } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params;
  const dispatch = useDispatch();
  const { isLoading, error, needsProfileSetup } = useSelector(s => s.auth);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (text, index) => {
    const newOTP = [...otp];
    newOTP[index] = text;
    setOtp(newOTP);
    if (text && index < 5) refs.current[index + 1]?.focus();
    if (!text && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;
    const result = await dispatch(verifyOTP({ phone, otp: otpString }));
    if (verifyOTP.fulfilled.match(result)) {
      if (result.payload.data?.needsProfileSetup) {
        navigation.replace('SetupProfile');
      }
      // else navigation happens via Redux state change in AppNavigator
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    dispatch(sendOTP(phone));
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A0A00', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          6-digit OTP bheja gaya hai{'\n'}
          <Text style={styles.phone}>+91 {phone}</Text> pe
        </Text>

        {/* OTP Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={r => refs.current[index] = r}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={t => handleOTPChange(t.slice(-1), index)}
              keyboardType="numeric"
              maxLength={1}
              selectionColor={COLORS.primary}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>⚠️ {error}</Text>}

        <TouchableOpacity
          style={[styles.button, (isLoading || otp.join('').length < 6) && styles.disabled]}
          onPress={handleVerify}
          disabled={isLoading || otp.join('').length < 6}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.btnGrad}>
            <Text style={styles.btnText}>{isLoading ? '⏳ Verifying...' : 'VERIFY & LOGIN'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resend, timer > 0 && styles.resendDisabled]}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: { padding: SPACING.xl, paddingTop: 60 },
  backText: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
  title: { fontSize: FONTS.sizes.display, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, marginBottom: 40, lineHeight: 24 },
  phone: { color: COLORS.primary, fontWeight: '700' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpBox: {
    width: 50, height: 60,
    backgroundColor: COLORS.bg3,
    borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    textAlign: 'center',
    fontSize: FONTS.sizes.xxl, fontWeight: '900',
    color: COLORS.text,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  error: { color: COLORS.error, fontSize: FONTS.sizes.sm, marginBottom: 16 },
  button: { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 20 },
  disabled: { opacity: 0.5 },
  btnGrad: { padding: SPACING.base + 2, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: 2 },
  resend: { textAlign: 'center', color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  resendDisabled: { color: COLORS.textDim },
});

export default OTPScreen;
