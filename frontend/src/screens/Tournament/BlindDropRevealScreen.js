// screens/Tournament/BlindDropRevealScreen.js
// Premium animated reveal for Blind Drop tournaments — reveals the hidden mode
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Vibration
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TOURNAMENT_MODES } from '../../constants/theme';

const BlindDropRevealScreen = ({ navigation, route }) => {
  const { tournament } = route.params || {};
  const [revealed, setRevealed] = useState(false);
  const [revealedMode, setRevealedMode] = useState(null);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Spin the mystery card
    Animated.sequence([
      // Build suspense with spin
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      // Rapid spin
      Animated.timing(spinAnim, {
        toValue: 5,
        duration: 2500,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start(() => {
      // Phase 2: Reveal!
      Vibration.vibrate([0, 100, 50, 200, 50, 100]);
      setRevealed(true);
      setRevealedMode(tournament?.mode || 'solo_br');

      // Explosion effect
      Animated.parallel([
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 15, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -15, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]),
      ]).start();

      // Auto-navigate after reveal
      setTimeout(() => {
        navigation.replace('TournamentDetail', { id: tournament?.id });
      }, 4000);
    });
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const modeInfo = TOURNAMENT_MODES[revealedMode] || { label: revealedMode, icon: '🎮', color: COLORS.primary };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1a0030', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      {/* Title */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.brandTitle}>BLIND DROP</Text>
        <Text style={styles.brandSub}>🎰 MODE REVEAL</Text>
      </Animated.View>

      {/* Mystery Card / Revealed Card */}
      <View style={styles.cardContainer}>
        {!revealed ? (
          <Animated.View style={[
            styles.mysteryCard,
            { transform: [{ rotate: spin }, { scale: scaleAnim }], opacity: fadeAnim }
          ]}>
            <LinearGradient colors={['#E91E63', '#9C27B0', '#673AB7']} style={styles.mysteryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.mysteryIcon}>❓</Text>
              <Text style={styles.mysteryText}>???</Text>
              <Text style={styles.mysterySubtext}>REVEALING...</Text>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View style={[
            styles.revealedCard,
            { opacity: glowAnim, transform: [{ translateX: shakeAnim }] }
          ]}>
            <LinearGradient
              colors={[modeInfo.color + '30', modeInfo.color + '10', COLORS.bg3]}
              style={styles.revealedGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.revealedIcon}>{modeInfo.icon}</Text>
              <Text style={[styles.revealedMode, { color: modeInfo.color }]}>{modeInfo.label?.toUpperCase()}</Text>
              <View style={[styles.revealedBadge, { borderColor: modeInfo.color }]}>
                <Text style={[styles.revealedBadgeText, { color: modeInfo.color }]}>3X PRIZE 🔥</Text>
              </View>

              {tournament && (
                <View style={styles.tournamentInfo}>
                  <Text style={styles.infoLabel}>{tournament.title}</Text>
                  <Text style={styles.infoValue}>Prize Pool: ₹{tournament.prize_pool}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Bottom text */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        {!revealed ? (
          <Text style={styles.footerText}>Stand by... Mode is being revealed...</Text>
        ) : (
          <Text style={styles.footerText}>Get ready! Match details loading...</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },

  header: { position: 'absolute', top: 80, alignItems: 'center' },
  brandTitle: { fontSize: 32, fontWeight: '900', color: '#E91E63', letterSpacing: 6 },
  brandSub: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 4, marginTop: 6, fontWeight: '700' },

  cardContainer: { justifyContent: 'center', alignItems: 'center' },

  mysteryCard: {
    width: 220, height: 300, borderRadius: RADIUS.xl,
    overflow: 'hidden', borderWidth: 2, borderColor: '#E91E63',
    ...SHADOWS.primary,
  },
  mysteryGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mysteryIcon: { fontSize: 64 },
  mysteryText: { fontSize: 36, fontWeight: '900', color: COLORS.white, letterSpacing: 8, marginTop: 12 },
  mysterySubtext: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 4, marginTop: 8, fontWeight: '700' },

  revealedCard: {
    width: 260, borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 2, borderColor: COLORS.gold,
    ...SHADOWS.gold,
  },
  revealedGrad: { padding: 30, alignItems: 'center' },
  revealedIcon: { fontSize: 64, marginBottom: 12 },
  revealedMode: { fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  revealedBadge: {
    marginTop: 16, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  revealedBadgeText: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  tournamentInfo: { marginTop: 24, alignItems: 'center' },
  infoLabel: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  infoValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  footer: { position: 'absolute', bottom: 80 },
  footerText: { color: COLORS.textDim, fontSize: 12, letterSpacing: 2, fontWeight: '600' },
});

export default BlindDropRevealScreen;
