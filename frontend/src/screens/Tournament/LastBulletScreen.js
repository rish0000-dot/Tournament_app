// screens/Tournament/LastBulletScreen.js
// Premium 1v1 Last Bullet Challenge — Triggered after Top 2 finish a tournament
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Vibration
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const LastBulletScreen = ({ navigation, route }) => {
  const { challengeId, opponent, tournament, prizeBoost } = route.params || {};
  const [status, setStatus] = useState('pending'); // pending, accepted, active, completed
  const [timer, setTimer] = useState(300); // 5 min to accept
  const [roomInfo, setRoomInfo] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance vibration
    Vibration.vibrate([0, 100, 50, 100]);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Countdown
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 0) {
          clearInterval(interval);
          handleExpired();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExpired = () => {
    setStatus('expired');
    Alert.alert('Challenge Expired', 'The 1v1 Last Bullet challenge has expired.');
  };

  const handleAccept = async () => {
    try {
      Vibration.vibrate(200);
      const res = await api.post(`/tournaments/last-bullet/${challengeId}/accept`);
      if (res.success) {
        setStatus('accepted');
        setRoomInfo(res.data);

        // Shake effect
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept challenge');
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Challenge?',
      'You will forfeit the 1v1 prize boost. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#200000', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Animated.Text style={[styles.mainIcon, { opacity: glowOpacity }]}>🎯</Animated.Text>
        <Text style={styles.title}>LAST BULLET</Text>
        <Text style={styles.subtitle}>1v1 SUDDEN DEATH CHALLENGE</Text>
      </View>

      {/* VS Card */}
      <Animated.View style={[styles.vsCard, { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }]}>
        <LinearGradient colors={['rgba(255,0,0,0.1)', 'rgba(255,69,0,0.05)']} style={styles.vsGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.playerSide}>
            <Text style={styles.playerEmoji}>🔥</Text>
            <Text style={styles.playerLabel}>YOU</Text>
            <Text style={styles.playerName}>Rank #1</Text>
          </View>

          <View style={styles.vsCenter}>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsDivider} />
          </View>

          <View style={styles.playerSide}>
            <Text style={styles.playerEmoji}>💀</Text>
            <Text style={styles.playerLabel}>RIVAL</Text>
            <Text style={styles.playerName}>{opponent?.username || 'Rank #2'}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Prize Boost */}
      <View style={styles.prizeSection}>
        <Text style={styles.prizeLabel}>🏆 PRIZE BOOST</Text>
        <Text style={styles.prizeAmount}>₹{prizeBoost || '500'}</Text>
        <Text style={styles.prizeDesc}>Winner takes the prize boost on top of tournament winnings</Text>
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>⏰ Challenge expires in</Text>
        <Text style={[styles.timerValue, timer < 60 && { color: COLORS.error }]}>{formatTime(timer)}</Text>
      </View>

      {/* Room Info (after accept) */}
      {status === 'accepted' && roomInfo && (
        <View style={styles.roomCard}>
          <LinearGradient colors={[COLORS.bg3, COLORS.bg4]} style={styles.roomGrad}>
            <Text style={styles.roomTitle}>🎮 1v1 ROOM</Text>
            <View style={styles.roomRow}>
              <Text style={styles.roomLabel}>Room ID</Text>
              <Text style={styles.roomValue}>{roomInfo.room_id}</Text>
            </View>
            <View style={styles.roomRow}>
              <Text style={styles.roomLabel}>Password</Text>
              <Text style={styles.roomValue}>{roomInfo.room_password}</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Action Buttons */}
      {status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <LinearGradient colors={[COLORS.primary, '#CC3700']} style={styles.acceptGrad}>
              <Text style={styles.acceptText}>⚔️ ACCEPT CHALLENGE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'accepted' && (
        <View style={styles.actions}>
          <View style={styles.waitingBadge}>
            <Text style={styles.waitingText}>⏳ Waiting for opponent...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: { position: 'absolute', top: 55, left: 20, zIndex: 10, width: 44, height: 44, justifyContent: 'center' },
  backText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },

  titleSection: { alignItems: 'center', marginTop: 100 },
  mainIcon: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.error, letterSpacing: 6 },
  subtitle: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 4, marginTop: 6, fontWeight: '700' },

  vsCard: { marginHorizontal: 20, marginTop: 30, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,0,0,0.3)', ...SHADOWS.primary },
  vsGrad: { flexDirection: 'row', alignItems: 'center', padding: 24 },
  playerSide: { flex: 1, alignItems: 'center' },
  playerEmoji: { fontSize: 40, marginBottom: 8 },
  playerLabel: { fontSize: 10, color: COLORS.textDim, fontWeight: '800', letterSpacing: 3 },
  playerName: { fontSize: 14, color: COLORS.text, fontWeight: '700', marginTop: 4 },
  vsCenter: { alignItems: 'center', paddingHorizontal: 16 },
  vsText: { fontSize: 32, fontWeight: '900', color: COLORS.error, letterSpacing: 4 },
  vsDivider: { width: 2, height: 40, backgroundColor: COLORS.error, opacity: 0.3, marginTop: 8 },

  prizeSection: { alignItems: 'center', marginTop: 25, paddingHorizontal: 30 },
  prizeLabel: { fontSize: 12, color: COLORS.gold, fontWeight: '800', letterSpacing: 3 },
  prizeAmount: { fontSize: 42, fontWeight: '900', color: COLORS.gold, marginTop: 4, ...SHADOWS.gold },
  prizeDesc: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },

  timerSection: { alignItems: 'center', marginTop: 20 },
  timerLabel: { fontSize: 11, color: COLORS.textDim, fontWeight: '700' },
  timerValue: { fontSize: 28, fontWeight: '900', color: COLORS.primary, letterSpacing: 4, marginTop: 4 },

  roomCard: { marginHorizontal: 20, marginTop: 20, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.primary },
  roomGrad: { padding: 20 },
  roomTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primary, letterSpacing: 3, marginBottom: 12, textAlign: 'center' },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roomLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  roomValue: { fontSize: 16, color: COLORS.white, fontWeight: '900', letterSpacing: 2 },

  actions: { marginTop: 30, paddingHorizontal: 20 },
  acceptBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.primary },
  acceptGrad: { height: 58, justifyContent: 'center', alignItems: 'center' },
  acceptText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  declineBtn: { alignItems: 'center', marginTop: 16 },
  declineText: { color: COLORS.textDim, fontSize: 13, fontWeight: '600' },
  waitingBadge: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  waitingText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
});

export default LastBulletScreen;
