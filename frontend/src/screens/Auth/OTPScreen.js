// screens/Auth/OTPScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Keyboard
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOTP, sendOTP } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { isLoading, phone } = useSelector(state => state.auth);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text, index) => {
    if (text.length > 1) text = text[text.length - 1];
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (index === OTP_LENGTH - 1 && text) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        Keyboard.dismiss();
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Enter OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }

    const result = await dispatch(verifyOTP({ phone, otp: code }));
    if (verifyOTP.fulfilled.match(result)) {
      if (result.payload.data?.needsProfileSetup) {
        navigation.replace('SetupProfile');
      }
      // else: AppNavigator will auto-switch to Main
    } else {
      Alert.alert('Invalid OTP', result.payload || 'Verification failed. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    await dispatch(sendOTP(phone));
    setTimer(30);
    Alert.alert('OTP Resent', 'A new OTP has been sent to your phone.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1a0800', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.logoEmoji}>🔐</Text>
        <Text style={styles.title}>VERIFY OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneHighlight}>+91 {phone}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectionColor={COLORS.primary}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, isLoading && { opacity: 0.7 }]}
          onPress={() => handleVerify()}
          disabled={isLoading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.verifyGrad}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.verifyText}>VERIFY & PROCEED</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={styles.resendText}>
            {timer > 0 
              ? `Resend OTP in ${timer}s` 
              : 'Resend OTP'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: { position: 'absolute', top: 55, left: 20, zIndex: 10, width: 44, height: 44, justifyContent: 'center' },
  backText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logoEmoji: { fontSize: 50, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: 4, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  phoneHighlight: { color: COLORS.primary, fontWeight: '800' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40, marginBottom: 40, gap: 10 },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg3,
    borderWidth: 2,
    borderColor: COLORS.bg4,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bg4,
    ...SHADOWS.primary,
  },
  verifyBtn: { width: '100%', borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 25, ...SHADOWS.primary },
  verifyGrad: { height: 56, justifyContent: 'center', alignItems: 'center' },
  verifyText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  resendText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
});

export default OTPScreen;
