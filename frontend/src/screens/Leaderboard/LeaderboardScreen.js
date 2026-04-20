// screens/Leaderboard/LeaderboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const LeaderboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global'); // global, clan, friends
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'clan' ? '/clans/leaderboard' : '/users/leaderboard';
      const res = await api.get(endpoint);
      if (res.success) {
        setLeaderboard(activeTab === 'clan' ? res.data.clans : res.data.users);
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTopThree = () => {
    const top3 = leaderboard.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.topThreeContainer}>
        {/* Second Place */}
        {top3[1] && (
          <View style={[styles.topRankItem, styles.rank2]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.rankBadgeText}>2</Text>
              </View>
              <Text style={styles.avatarEmoji}>🥈</Text>
            </View>
            <Text style={styles.rankName} numberOfLines={1}>
              {activeTab === 'clan' ? top3[1].name : top3[1].username}
            </Text>
            <Text style={styles.rankPoints}>
              {activeTab === 'clan' ? top3[1].season_points : top3[1].total_earnings}
            </Text>
          </View>
        )}

        {/* First Place */}
        {top3[0] && (
          <View style={[styles.topRankItem, styles.rank1]}>
             <View style={styles.crownContainer}>
                <Text style={styles.crownEmoji}>👑</Text>
             </View>
            <View style={[styles.avatarContainer, styles.avatarGold]}>
              <View style={[styles.rankBadge, { backgroundColor: COLORS.gold }]}>
                <Text style={styles.rankBadgeText}>1</Text>
              </View>
              <Text style={styles.avatarEmoji}>🥇</Text>
            </View>
            <Text style={[styles.rankName, styles.rankNameGold]} numberOfLines={1}>
                {activeTab === 'clan' ? top3[0].name : top3[0].username}
            </Text>
            <Text style={[styles.rankPoints, { color: COLORS.gold }]}>
              {activeTab === 'clan' ? top3[0].season_points : top3[0].total_earnings}
            </Text>
          </View>
        )}

        {/* Third Place */}
        {top3[2] && (
          <View style={[styles.topRankItem, styles.rank3]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.rankBadgeText}>3</Text>
              </View>
              <Text style={styles.avatarEmoji}>🥉</Text>
            </View>
            <Text style={styles.rankName} numberOfLines={1}>
              {activeTab === 'clan' ? top3[2].name : top3[2].username}
            </Text>
            <Text style={styles.rankPoints}>
              {activeTab === 'clan' ? top3[2].season_points : top3[2].total_earnings}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderListItem = ({ item, index }) => {
    if (index < 3) return null; // Already rendered in top 3

    return (
      <View style={styles.listItem}>
        <Text style={styles.listRank}>#{index + 1}</Text>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{activeTab === 'clan' ? item.name : item.username}</Text>
          {activeTab === 'clan' && <Text style={styles.listSub}>{item.total_members} members</Text>}
        </View>
        <View style={styles.listEarnings}>
          <Text style={styles.earningsValue}>
             {activeTab === 'clan' ? item.season_points : `₹${parseFloat(item.total_earnings || 0).toFixed(0)}`}
          </Text>
          <Text style={styles.earningsLabel}>
            {activeTab === 'clan' ? 'PTS' : 'EARNED'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <Text style={styles.headerTitle}>LEADERBOARD</Text>
        <View style={styles.tabContainer}>
          {['global', 'clan', 'friends'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderTopThree()}
          <View style={styles.listContainer}>
            {leaderboard.length > 3 ? (
              leaderboard.map((item, index) => {
                const component = renderListItem({ item, index });
                return component ? <View key={item.id || index}>{component}</View> : null;
              })
            ) : (
              leaderboard.length <= 3 && !loading && (
                <Text style={styles.emptyText}>No more players found.</Text>
              )
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: SPACING.base },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    padding: 4
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1
  },
  activeTabText: { color: COLORS.white },
  content: { flex: 1 },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: SPACING.base
  },
  topRankItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 100
  },
  rank1: { marginBottom: 20 },
  rank2: { },
  rank3: { },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.bg3,
    borderWidth: 2,
    borderColor: COLORS.textDim,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  avatarGold: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderColor: COLORS.gold,
    borderWidth: 3
  },
  avatarEmoji: { fontSize: 30 },
  rankBadge: {
    position: 'absolute',
    bottom: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  rankBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
  crownContainer: { position: 'absolute', top: -30, zIndex: 10 },
  crownEmoji: { fontSize: 24 },
  rankName: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center'
  },
  rankNameGold: { fontSize: 16, fontWeight: '900' },
  rankPoints: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryLite || COLORS.textMuted,
    marginTop: 2
  },
  listContainer: {
    backgroundColor: COLORS.bg2,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.base,
    minHeight: 400
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  listRank: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textMuted,
    width: 40
  },
  listInfo: { flex: 1 },
  listName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  listSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  listEarnings: { alignItems: 'flex-end' },
  earningsValue: { fontSize: 16, fontWeight: '900', color: COLORS.gold },
  earningsLabel: { fontSize: 9, color: COLORS.textDim, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textDim, marginTop: 40 }
});

export default LeaderboardScreen;
