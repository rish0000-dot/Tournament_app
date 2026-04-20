// screens/Profile/MissionsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export const MissionsScreen = ({ navigation }) => {
  const [missions, setMissions] = useState([]);
  const [adCount, setAdCount] = useState(0);

  useEffect(() => { loadMissions(); }, []);

  const loadMissions = async () => {
    try {
      const res = await api.get('/coins/missions');
      if (res.success) setMissions(res.data.missions);
    } catch (_) {}
  };

  const handleWatchAd = async () => {
    try {
      const res = await api.post('/coins/ad-watch');
      if (res.success) {
        setAdCount(res.data.ads_watched_today);
        Alert.alert('🪙 BlazeGold Earned!', `+5 BlazeGold! Aaj ${res.data.ads_remaining} ads baaki hain.`);
      } else {
        Alert.alert('Limit Reached', res.data.message || 'Aaj ke liye maximum ads dekh liye!');
      }
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const missionIcon = (type) => {
    const icons = { play_tournaments: '🎮', get_kills: '💥', watch_match: '📺', refer_friend: '👥', login_streak: '🔥' };
    return icons[type] || '🎯';
  };

  const missionLabel = (type) => {
    const labels = { play_tournaments: 'Play Tournaments', get_kills: 'Get Kills', watch_match: 'Watch a Match', refer_friend: 'Refer a Friend', login_streak: 'Login Streak' };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>🎯 Daily Missions</Text>
        <View />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Earn coins info */}
        <LinearGradient colors={[COLORS.bg3, COLORS.bg2]} style={styles.earnCard}>
          <Text style={styles.earnTitle}>Ways to Earn BlazeGold 🪙</Text>
          {[
            { label: '1st Place in Tournament', coins: '+150' },
            { label: '2nd Place', coins: '+80' },
            { label: '3rd Place', coins: '+50' },
            { label: 'Per Kill', coins: '+3' },
            { label: 'Daily Login', coins: '+10' },
            { label: 'Watch Ad (max 5)', coins: '+5' },
            { label: 'Mission Complete', coins: '+15-50' },
            { label: 'Refer a Friend', coins: '+200' },
          ].map(item => (
            <View key={item.label} style={styles.earnRow}>
              <Text style={styles.earnLabel}>{item.label}</Text>
              <Text style={styles.earnCoins}>{item.coins}</Text>
            </View>
          ))}
          <View style={styles.streakBox}>
            <Text style={styles.streakTitle}>🔥 Win Streak Multiplier</Text>
            <Text style={styles.streakInfo}>2 wins = 1.5x • 3 wins = 2x • 5 wins = 3x • 10 wins = 5x</Text>
          </View>
        </LinearGradient>

        {/* Watch Ad */}
        <TouchableOpacity style={styles.adCard} onPress={handleWatchAd}>
          <LinearGradient colors={['rgba(0,245,255,0.1)', 'transparent']} style={styles.adGrad}>
            <Text style={styles.adIcon}>📺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.adTitle}>Watch Ad • Earn 5 🪙</Text>
              <Text style={styles.adSub}>Daily limit: 5 ads = 25 BlazeGold max</Text>
            </View>
            <View style={styles.adReward}><Text style={styles.adRewardText}>+5 🪙</Text></View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily missions */}
        <Text style={styles.sectionTitle}>Today's Missions</Text>
        {missions.length === 0 ? (
          <Text style={styles.empty}>Missions load ho rahe hain...</Text>
        ) : missions.map(m => (
          <View key={m.id} style={[styles.missionCard, m.completed && styles.missionCompleted]}>
            <Text style={styles.missionIcon}>{missionIcon(m.mission_type)}</Text>
            <View style={styles.missionInfo}>
              <Text style={styles.missionLabel}>{missionLabel(m.mission_type)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((m.progress / m.target) * 100, 100)}%` }]} />
              </View>
              <Text style={styles.missionProgress}>{m.progress}/{m.target}</Text>
            </View>
            <View style={styles.missionReward}>
              {m.completed
                ? <Text style={styles.completedBadge}>✅ Done</Text>
                : <><Text style={styles.missionCoins}>+{m.coin_reward}</Text><Text style={styles.missionCoinIcon}>🪙</Text></>
              }
            </View>
          </View>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

// ============================================
// screens/Profile/NotificationsScreen.js
// ============================================
export const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/users/notifications').then(res => {
      if (res.success) setNotifications(res.data.notifications);
    }).catch(() => {});
  }, []);

  const notifIcon = (type) => {
    const icons = { tournament_registered: '🎮', room_released: '🔑', prize_credited: '💰', deposit_success: '💳', withdrawal_success: '✅', coin_expiry_warning: '⚠️', bounty_claimed: '🩸', system: '📢' };
    return icons[type] || '🔔';
  };

  return (
    <View style={styles2.container}>
      <View style={styles2.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles2.back}>← Back</Text></TouchableOpacity>
        <Text style={styles2.title}>🔔 Notifications</Text>
        <View />
      </View>
      <ScrollView>
        {notifications.length === 0
          ? <Text style={styles2.empty}>Koi notification nahi abhi</Text>
          : notifications.map(n => (
            <View key={n.id} style={[styles2.notifCard, !n.is_read && styles2.unread]}>
              <Text style={styles2.notifIcon}>{notifIcon(n.type)}</Text>
              <View style={styles2.notifContent}>
                <Text style={styles2.notifTitle}>{n.title}</Text>
                <Text style={styles2.notifBody}>{n.body}</Text>
                <Text style={styles2.notifTime}>{require('moment')(n.sent_at).fromNow()}</Text>
              </View>
              {!n.is_read && <View style={styles2.unreadDot} />}
            </View>
          ))
        }
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

// ============================================
// screens/Profile/KYCScreen.js
// ============================================
export const KYCScreen = ({ navigation }) => {
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [pan, setPan] = useState(null);
  const [aadhaarNum, setAadhaarNum] = useState('');
  const [panNum, setPanNum] = useState('');
  const [loading, setLoading] = useState(false);
  const { launchImageLibrary } = require('react-native-image-picker');

  const pickImage = async (setter) => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (!res.didCancel && res.assets?.[0]) setter(res.assets[0]);
  };

  const handleSubmit = async () => {
    if (!aadhaarFront || !aadhaarBack || !pan || !aadhaarNum || !panNum) {
      Alert.alert('Error', 'Sab documents aur numbers required hain');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('aadhaar_front', { uri: aadhaarFront.uri, type: 'image/jpeg', name: 'aadhaar_front.jpg' });
      formData.append('aadhaar_back', { uri: aadhaarBack.uri, type: 'image/jpeg', name: 'aadhaar_back.jpg' });
      formData.append('pan', { uri: pan.uri, type: 'image/jpeg', name: 'pan.jpg' });
      formData.append('aadhaar_number', aadhaarNum);
      formData.append('pan_number', panNum);
      const res = await api.post('/users/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.success) Alert.alert('✅ Submitted!', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', e.message || 'KYC submission failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles3.container}>
      <View style={styles3.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles3.back}>← Back</Text></TouchableOpacity>
        <Text style={styles3.title}>🪪 KYC Verification</Text>
        <View />
      </View>
      <ScrollView style={styles3.scroll}>
        <View style={styles3.infoCard}>
          <Text style={styles3.infoTitle}>Why KYC?</Text>
          <Text style={styles3.infoText}>₹1,000 se zyada withdraw karne ke liye KYC required hai. Documents secure hain.</Text>
        </View>
        {[
          { label: 'Aadhaar Front', state: aadhaarFront, setter: setAadhaarFront },
          { label: 'Aadhaar Back', state: aadhaarBack, setter: setAadhaarBack },
          { label: 'PAN Card', state: pan, setter: setPan },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles3.uploadBtn} onPress={() => pickImage(item.setter)}>
            <Text style={styles3.uploadIcon}>{item.state ? '✅' : '📷'}</Text>
            <Text style={styles3.uploadLabel}>{item.state ? item.label + ' (Uploaded)' : 'Upload ' + item.label}</Text>
          </TouchableOpacity>
        ))}
        <TextInput style={styles3.input} placeholder="Aadhaar Number (12 digits)" placeholderTextColor={COLORS.textDim} value={aadhaarNum} onChangeText={setAadhaarNum} keyboardType="numeric" maxLength={12} />
        <TextInput style={styles3.input} placeholder="PAN Number (e.g. ABCDE1234F)" placeholderTextColor={COLORS.textDim} value={panNum} onChangeText={setPanNum} autoCapitalize="characters" maxLength={10} />
        <TouchableOpacity style={[styles3.submitBtn, loading && styles3.disabled]} onPress={handleSubmit} disabled={loading}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles3.submitGrad}>
            <Text style={styles3.submitText}>{loading ? '⏳ Submitting...' : 'Submit KYC'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

// ============================================
// screens/Home/BountyScreen.js
// ============================================
export const BountyScreen = ({ navigation }) => {
  const [bounties, setBounties] = useState([]);

  useEffect(() => {
    api.get('/bounty/most-wanted').then(res => {
      if (res.success) setBounties(res.data.bounties);
    }).catch(() => {});
  }, []);

  return (
    <View style={styles4.container}>
      <View style={styles4.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles4.back}>← Back</Text></TouchableOpacity>
        <Text style={styles4.title}>🩸 Bounty Hunter</Text>
        <View />
      </View>
      <ScrollView>
        <View style={styles4.infoCard}>
          <Text style={styles4.infoTitle}>How Bounty Works</Text>
          <Text style={styles4.infoText}>
            • Har tournament win se target player ka bounty badhta hai{'\n'}
            • Tournament mein unhe kill karo → Bounty claim karo{'\n'}
            • Screenshot proof required{'\n'}
            • Top players pe ₹500–₹5,000 tak bounty!
          </Text>
        </View>
        <Text style={styles4.sectionTitle}>🎯 Most Wanted</Text>
        {bounties.map((b, i) => (
          <View key={b.id} style={styles4.bountyCard}>
            <Text style={styles4.bountyRank}>#{i+1}</Text>
            <View style={styles4.bountyInfo}>
              <Text style={styles4.bountyName}>{b.username}</Text>
              <Text style={styles4.bountyDetails}>{b.total_wins} wins • {b.current_win_streak} streak</Text>
            </View>
            <View style={styles4.bountyAmountBox}>
              <Text style={styles4.bountyAmountLabel}>Bounty</Text>
              <Text style={styles4.bountyAmount}>₹{parseFloat(b.amount).toFixed(0)}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  scroll: { flex: 1 },
  earnCard: { margin: SPACING.base, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.borderLight },
  earnTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  earnLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  earnCoins: { fontSize: FONTS.sizes.sm, color: COLORS.gold, fontWeight: '800' },
  streakBox: { marginTop: 12, backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.md, padding: SPACING.md },
  streakTitle: { fontSize: FONTS.sizes.sm, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  streakInfo: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  adCard: { margin: SPACING.base, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cyanGlow },
  adGrad: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: 12 },
  adIcon: { fontSize: 28 },
  adTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  adSub: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  adReward: { backgroundColor: COLORS.goldGlow, borderRadius: RADIUS.sm, padding: 8 },
  adRewardText: { color: COLORS.gold, fontWeight: '900', fontSize: FONTS.sizes.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, paddingHorizontal: SPACING.base, marginBottom: 12 },
  missionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, marginHorizontal: SPACING.base, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight, gap: 12 },
  missionCompleted: { opacity: 0.6 },
  missionIcon: { fontSize: 28 },
  missionInfo: { flex: 1, gap: 4 },
  missionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  progressBar: { height: 4, backgroundColor: COLORS.bg5, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  missionProgress: { fontSize: FONTS.sizes.xs, color: COLORS.textDim },
  missionReward: { alignItems: 'center' },
  missionCoins: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.gold },
  missionCoinIcon: { fontSize: FONTS.sizes.sm },
  completedBadge: { fontSize: FONTS.sizes.sm, color: COLORS.green, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textDim, padding: SPACING.xl },
});

const styles2 = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  empty: { textAlign: 'center', color: COLORS.textDim, padding: SPACING.xxxl },
  notifCard: { flexDirection: 'row', padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 12, alignItems: 'flex-start' },
  unread: { backgroundColor: 'rgba(255,69,0,0.05)' },
  notifIcon: { fontSize: 24, width: 36 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.text },
  notifBody: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: FONTS.sizes.xs, color: COLORS.textDim, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
});

const styles3 = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  scroll: { flex: 1, padding: SPACING.base },
  infoCard: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.base, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  infoTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  infoText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 20 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.base, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, gap: 12 },
  uploadIcon: { fontSize: 24 },
  uploadLabel: { fontSize: FONTS.sizes.base, color: COLORS.text, fontWeight: '500' },
  input: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.base, color: COLORS.text, marginBottom: 12, fontSize: FONTS.sizes.base },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 8 },
  disabled: { opacity: 0.5 },
  submitGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  submitText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800' },
});

const styles4 = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  infoCard: { margin: SPACING.base, backgroundColor: 'rgba(255,23,68,0.08)', borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)' },
  infoTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.error, marginBottom: 8 },
  infoText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, lineHeight: 22 },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, padding: SPACING.base, marginBottom: 4 },
  bountyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.base, marginHorizontal: SPACING.base, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)', gap: 12 },
  bountyRank: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.error, width: 36 },
  bountyInfo: { flex: 1 },
  bountyName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  bountyDetails: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  bountyAmountBox: { alignItems: 'center', backgroundColor: 'rgba(255,23,68,0.1)', borderRadius: RADIUS.md, padding: SPACING.md },
  bountyAmountLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  bountyAmount: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.error },
});
