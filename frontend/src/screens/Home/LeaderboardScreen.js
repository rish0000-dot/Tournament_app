// screens/Home/LeaderboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const LeaderboardScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('MONTHLY'); // WEEKLY, MONTHLY, SEASON

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/leaderboard?period=${filter.toLowerCase()}`);
      if (res.success) {
        setData(res.data.leaderboard);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTop3 = () => {
    if (data.length < 3) return null;
    const [first, second, third] = data;

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        <View style={styles.podiumItem}>
          <View style={[styles.avatarBorder, { borderColor: '#C0C0C0' }]}>
            <View style={styles.avatarInner}>
               <Text style={styles.podiumInitial}>{second.username?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={[styles.rankBox, { backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.rankNum}>2</Text>
            </View>
          </View>
          <Text style={styles.podiumName}>{second.username}</Text>
          <Text style={styles.podiumScore}>₹{second.total_earnings || 0}</Text>
        </View>

        {/* First Place */}
        <View style={[styles.podiumItem, styles.podiumFirst]}>
          <View style={[styles.avatarBorder, { borderColor: COLORS.gold, width: 90, height: 90 }]}>
            <View style={styles.avatarInner}>
               <Text style={[styles.podiumInitial, { fontSize: 36 }]}>{first.username?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={[styles.rankBox, { backgroundColor: COLORS.gold, width: 28, height: 28 }]}>
              <Text style={styles.rankNum}>1</Text>
            </View>
            <Text style={styles.crownText}>👑</Text>
          </View>
          <Text style={[styles.podiumName, { fontSize: 16 }]}>{first.username}</Text>
          <Text style={[styles.podiumScore, { color: COLORS.gold }]}>₹{first.total_earnings || 0}</Text>
        </View>

        {/* Third Place */}
        <View style={styles.podiumItem}>
          <View style={[styles.avatarBorder, { borderColor: '#CD7F32' }]}>
            <View style={styles.avatarInner}>
               <Text style={styles.podiumInitial}>{third.username?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={[styles.rankBox, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.rankNum}>3</Text>
            </View>
          </View>
          <Text style={styles.podiumName}>{third.username}</Text>
          <Text style={styles.podiumScore}>₹{third.total_earnings || 0}</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    if (index < 3) return null;

    return (
      <View style={styles.row}>
        <Text style={styles.rowRank}>{index + 1}</Text>
        <View style={styles.rowAvatar}>
           <Text style={styles.rowInitial}>{item.username?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.username}</Text>
          <Text style={styles.rowStats}>{item.total_kills} Kills • {item.matches_played || 0} Matches</Text>
        </View>
        <Text style={styles.rowEarnings}>₹{item.total_earnings || 0}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>GLOBAL ELITE</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterSection}>
          {['WEEKLY', 'MONTHLY', 'SEASON'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, filter === f && styles.activeFilter]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderTop3()}

            <View style={styles.listContainer}>
              <View style={styles.listHeader}>
                 <Text style={styles.listLabel}>RANK</Text>
                 <Text style={[styles.listLabel, { flex: 1, marginLeft: 20 }]}>PLAYER</Text>
                 <Text style={styles.listLabel}>EARNINGS</Text>
              </View>
              {data.slice(3).map((item, index) => (
                <View key={item.id || index} style={styles.row}>
                  <Text style={styles.rowRank}>{index + 4}</Text>
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowInitial}>{item.username?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.username}</Text>
                    <Text style={styles.rowStats}>{item.total_kills} Kills • {item.matches_played || 0} Matches</Text>
                  </View>
                  <Text style={styles.rowEarnings}>₹{item.total_earnings || 0}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base },
  backBtn: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 3 },
  filterSection: { flexDirection: 'row', paddingHorizontal: SPACING.base, marginTop: 20, gap: 10 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.lg, backgroundColor: COLORS.bg3, alignItems: 'center' },
  activeFilter: { backgroundColor: 'rgba(255,102,0,0.15)', borderWidth: 1, borderColor: COLORS.primary },
  filterText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  activeFilterText: { color: COLORS.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  podiumContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'flex-end', 
    marginTop: 40,
    paddingHorizontal: SPACING.base,
    marginBottom: 40
  },
  podiumItem: { alignItems: 'center', width: '30%' },
  podiumFirst: { width: '40%', marginBottom: 15 },
  avatarBorder: { 
    width: 75, 
    height: 75, 
    borderRadius: 50, 
    borderWidth: 3, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    marginBottom: 12,
    position: 'relative'
  },
  avatarInner: { 
    width: '90%', 
    height: '90%', 
    borderRadius: 50, 
    backgroundColor: COLORS.bg4, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  podiumInitial: { color: COLORS.white, fontSize: 28, fontWeight: '900' },
  rankBox: { 
    position: 'absolute', 
    bottom: -5, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg
  },
  rankNum: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  crownText: { position: 'absolute', top: -25, fontSize: 24 },
  podiumName: { color: COLORS.white, fontSize: 14, fontWeight: '800', marginBottom: 2 },
  podiumScore: { color: COLORS.textMuted, fontSize: 13, fontWeight: '900' },
  listContainer: { paddingHorizontal: SPACING.base },
  listHeader: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 10 },
  listLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.bg2, 
    padding: 15, 
    borderRadius: RADIUS.xl, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.bg3
  },
  rowRank: { color: COLORS.textMuted, fontSize: 14, fontWeight: '900', width: 30 },
  rowAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.bg4, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  rowInitial: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  rowInfo: { flex: 1 },
  rowName: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  rowStats: { color: COLORS.textDim, fontSize: 11, marginTop: 2 },
  rowEarnings: { color: COLORS.gold, fontSize: 16, fontWeight: '900' }
});

export default LeaderboardScreen;
