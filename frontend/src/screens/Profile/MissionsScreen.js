// screens/Profile/MissionsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const MissionsScreen = ({ navigation }) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      // Mocking for now to ensure a premium visual even if backend routes aren't all hot
      setMissions([
        { id: '1', title: 'First Blood', body: 'Get your first kill in any tournament.', reward: 10, progress: 1, total: 1, completed: true, claimed: true },
        { id: '2', title: 'Top 10 Finisher', body: 'Finish in the Top 10 in 3 Battle Royale matches.', reward: 25, progress: 1, total: 3, completed: false, claimed: false },
        { id: '3', title: 'Sharpshooter', body: 'Win a Solo tournament with 5+ kills.', reward: 50, progress: 0, total: 1, completed: false, claimed: false },
        { id: '4', title: 'Clan Warrior', body: 'Participate in 5 Clan Season matches.', reward: 40, progress: 2, total: 5, completed: false, claimed: false },
        { id: '5', title: 'Oracle', body: 'Place 5 successful predictions in Watch & Earn.', reward: 15, progress: 3, total: 5, completed: false, claimed: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMission = ({ item }) => {
    const progressPercent = Math.min((item.progress / item.total) * 100, 100);

    return (
      <View style={[styles.card, item.completed && styles.cardCompleted]}>
        <View style={styles.cardHeader}>
           <View style={styles.iconBox}>
              <Text style={styles.icon}>{item.completed ? '✅' : '🎯'}</Text>
           </View>
           <View style={styles.titleInfo}>
              <Text style={styles.mTitle}>{item.title}</Text>
              <Text style={styles.mBody}>{item.body}</Text>
           </View>
           <View style={styles.rewardBadge}>
              <Text style={styles.rewardValue}>{item.reward}</Text>
              <Text style={styles.rewardIcon}>🪙</Text>
           </View>
        </View>

        <View style={styles.progressSection}>
           <View style={styles.progBarBg}>
              <View style={[styles.progBarFill, { width: `${progressPercent}%` }]} />
           </View>
           <Text style={styles.progText}>{item.progress}/{item.total}</Text>
        </View>

        {item.completed && !item.claimed && (
          <TouchableOpacity style={styles.claimBtn}>
             <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.claimGrad}>
                <Text style={styles.claimText}>CLAIM REWARD</Text>
             </LinearGradient>
          </TouchableOpacity>
        )}

        {item.claimed && (
          <View style={styles.claimedMarker}>
             <Text style={styles.claimedText}>REWARD COLLECTED</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>DAILY MISSIONS</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.subtitle}>Complete tasks to earn extra BlazeGold coins!</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={missions}
          renderItem={renderMission}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
             <View style={styles.resetInfo}>
                <Text style={styles.resetText}>Missions reset in: <Text style={{color: COLORS.primary}}>14h 22m</Text></Text>
             </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: SPACING.base },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  subtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 15, textAlign: 'center' },
  list: { padding: SPACING.base },
  resetInfo: { alignItems: 'center', marginBottom: 20 },
  resetText: { color: COLORS.textDim, fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: COLORS.bg2, borderRadius: RADIUS.xl, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.bg3 },
  cardCompleted: { borderColor: 'rgba(76,175,80,0.3)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 45, height: 45, borderRadius: RADIUS.md, backgroundColor: COLORS.bg3, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 22 },
  titleInfo: { flex: 1 },
  mTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  mBody: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  rewardBadge: { alignItems: 'center', backgroundColor: COLORS.bg4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bg3 },
  rewardValue: { color: COLORS.gold, fontWeight: '900', fontSize: 12 },
  rewardIcon: { fontSize: 10, marginTop: 2 },
  progressSection: { flexDirection: 'row', alignItems: 'center', marginTop: 15, gap: 10 },
  progBarBg: { flex: 1, height: 6, backgroundColor: COLORS.bg4, borderRadius: 3, overflow: 'hidden' },
  progBarFill: { height: '100%', backgroundColor: COLORS.primary },
  progText: { color: COLORS.textDim, fontSize: 10, fontWeight: '800', width: 30 },
  claimBtn: { marginTop: 15, borderRadius: RADIUS.lg, overflow: 'hidden' },
  claimGrad: { height: 40, justifyContent: 'center', alignItems: 'center' },
  claimText: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  claimedMarker: { marginTop: 15, alignItems: 'center', padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg },
  claimedText: { color: COLORS.textDim, fontSize: 10, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default MissionsScreen;
