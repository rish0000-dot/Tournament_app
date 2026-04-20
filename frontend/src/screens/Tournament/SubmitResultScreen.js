// screens/Tournament/SubmitResultScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, Image, ScrollView, ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const SubmitResultScreen = ({ navigation, route }) => {
  const { tournamentId } = route.params;
  const [kills, setKills] = useState('');
  const [rank, setRank] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', quality: 0.8, maxWidth: 1280
    });
    if (!result.didCancel && result.assets?.[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) { Alert.alert('Error', 'Screenshot zaroori hai!'); return; }
    if (!kills || !rank) { Alert.alert('Error', 'Kills aur Rank dono bharo'); return; }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('screenshot', {
        uri: screenshot.uri,
        type: screenshot.type || 'image/jpeg',
        name: 'result.jpg',
      });
      formData.append('kills', kills);
      formData.append('rank', rank);

      const res = await api.post(`/tournaments/${tournamentId}/result`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        Alert.alert(
          res.data.auto_verified ? '✅ Verified!' : '📤 Submitted!',
          res.data.auto_verified
            ? 'Result verify ho gaya! Prize wallet mein credit ho gaya.'
            : 'Result submit ho gaya. 30 min mein verify hoga.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Submit failed. Try again.');
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
        <Text style={styles.title}>Submit Result</Text>
        <View />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instrTitle}>📸 Screenshot kaise lo?</Text>
          <Text style={styles.instrText}>
            1. Match khatam hone ke baad result screen pe jao{'\n'}
            2. Screenshot lo jisme dikhe: Aapka naam + Kills + Rank{'\n'}
            3. Neeche enter karo aur submit karo
          </Text>
        </View>

        {/* Screenshot picker */}
        <TouchableOpacity style={styles.screenshotPicker} onPress={pickImage}>
          {screenshot ? (
            <Image source={{ uri: screenshot.uri }} style={styles.screenshotPreview} resizeMode="cover" />
          ) : (
            <View style={styles.screenshotPlaceholder}>
              <Text style={styles.screenshotIcon}>📸</Text>
              <Text style={styles.screenshotText}>Tap to select screenshot</Text>
              <Text style={styles.screenshotHint}>Gallery se result screen photo select karo</Text>
            </View>
          )}
        </TouchableOpacity>

        {screenshot && (
          <TouchableOpacity style={styles.changePhoto} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        )}

        {/* Kills input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>💥 Kills (in-game se exactly)</Text>
          <TextInput
            style={styles.input}
            value={kills}
            onChangeText={setKills}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.textDim}
            maxLength={2}
          />
        </View>

        {/* Rank input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>🏆 Final Rank (1 = 1st place)</Text>
          <TextInput
            style={styles.input}
            value={rank}
            onChangeText={setRank}
            keyboardType="numeric"
            placeholder="1-50"
            placeholderTextColor={COLORS.textDim}
            maxLength={2}
          />
        </View>

        {/* Anti cheat warning */}
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Fake screenshot = Permanent ban + Prize forfeit.
            Humara system OCR se automatically verify karta hai.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (loading || !screenshot) && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading || !screenshot}
        >
          <LinearGradient colors={[COLORS.green, '#00a050']} style={styles.submitGrad}>
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.submitText}>📤 Submit Result</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

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
  instructions: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  instrTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  instrText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 22 },
  screenshotPicker: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', marginBottom: 12, overflow: 'hidden', height: 200 },
  screenshotPreview: { width: '100%', height: '100%' },
  screenshotPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  screenshotIcon: { fontSize: 48 },
  screenshotText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textMuted },
  screenshotHint: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  changePhoto: { alignItems: 'center', marginBottom: 20 },
  changePhotoText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.base, fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  warning: { backgroundColor: 'rgba(255,23,68,0.08)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)' },
  warningText: { fontSize: FONTS.sizes.xs, color: COLORS.error, lineHeight: 18 },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 12 },
  disabled: { opacity: 0.5 },
  submitGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  submitText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: 2 },
});

export default SubmitResultScreen;

// ============================================
// screens/Leaderboard/LeaderboardScreen.js
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const LeaderboardScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  const periods = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/leaderboard?period=${period}`);
      if (res.success) setData(res.data.leaderboard);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const rankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const renderRow = ({ item, index }) => (
    <View style={[styles.row, index < 3 && styles.topRow]}>
      <Text style={[styles.rank, index < 3 && styles.topRank]}>{rankIcon(index)}</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.username}</Text>
        <Text style={styles.playerStats}>{item.total_kills} kills • {item.matches} matches</Text>
      </View>
      <Text style={styles.earnings}>₹{parseFloat(item.total_earnings || 0).toFixed(0)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <View />
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 podium */}
      {!loading && data.length >= 3 && (
        <LinearGradient colors={['rgba(255,215,0,0.08)', 'transparent']} style={styles.podium}>
          <View style={styles.podiumRow}>
            {/* 2nd */}
            <View style={[styles.podiumPlayer, styles.second]}>
              <Text style={styles.podiumAvatar}>{data[1]?.username?.[0]?.toUpperCase()}</Text>
              <Text style={styles.podiumRankBig}>🥈</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{data[1]?.username}</Text>
              <Text style={styles.podiumEarnings}>₹{parseFloat(data[1]?.total_earnings || 0).toFixed(0)}</Text>
            </View>
            {/* 1st */}
            <View style={[styles.podiumPlayer, styles.first]}>
              <Text style={styles.podiumAvatar}>{data[0]?.username?.[0]?.toUpperCase()}</Text>
              <Text style={styles.podiumRankBig}>🥇</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{data[0]?.username}</Text>
              <Text style={[styles.podiumEarnings, { color: COLORS.gold }]}>
                ₹{parseFloat(data[0]?.total_earnings || 0).toFixed(0)}
              </Text>
            </View>
            {/* 3rd */}
            <View style={[styles.podiumPlayer, styles.third]}>
              <Text style={styles.podiumAvatar}>{data[2]?.username?.[0]?.toUpperCase()}</Text>
              <Text style={styles.podiumRankBig}>🥉</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{data[2]?.username}</Text>
              <Text style={styles.podiumEarnings}>₹{parseFloat(data[2]?.total_earnings || 0).toFixed(0)}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data.slice(3)}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => renderRow({ item, index: index + 3 })}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Koi data nahi is period ke liye</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  periodRow: { flexDirection: 'row', padding: SPACING.base, gap: 8 },
  periodBtn: { flex: 1, padding: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.bg3, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  periodBtnActive: { backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primary },
  periodText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  periodTextActive: { color: COLORS.primary },
  podium: { padding: SPACING.base, marginBottom: 8 },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8 },
  podiumPlayer: { alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, width: '30%' },
  first: { borderColor: COLORS.gold, backgroundColor: COLORS.goldGlow, marginBottom: 0, paddingTop: SPACING.xl },
  second: { borderColor: '#C0C0C0' },
  third: { borderColor: '#CD7F32' },
  podiumAvatar: { fontSize: 32, width: 48, height: 48, backgroundColor: COLORS.bg4, borderRadius: 24, textAlign: 'center', lineHeight: 48, overflow: 'hidden' },
  podiumRankBig: { fontSize: 24, marginVertical: 4 },
  podiumName: { fontSize: FONTS.sizes.xs, color: COLORS.text, fontWeight: '700', textAlign: 'center' },
  podiumEarnings: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '700', marginTop: 2 },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: 8, backgroundColor: COLORS.bg3, borderWidth: 1, borderColor: COLORS.borderLight },
  topRow: { borderColor: 'rgba(255,215,0,0.2)' },
  rank: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, width: 36, fontWeight: '700' },
  topRank: { fontSize: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: FONTS.sizes.base, fontWeight: '900', color: COLORS.white },
  playerInfo: { flex: 1 },
  playerName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  playerStats: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  earnings: { fontSize: FONTS.sizes.base, fontWeight: '900', color: COLORS.gold },
  empty: { textAlign: 'center', color: COLORS.textDim, padding: SPACING.xl },
});

export default LeaderboardScreen;
