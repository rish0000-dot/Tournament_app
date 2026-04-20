// screens/Auth/SplashScreen.js
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
        // Navigation handled by AppNavigator auth state
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
