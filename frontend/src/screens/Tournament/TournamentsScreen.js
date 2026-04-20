// screens/Tournament/TournamentsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const TournamentsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, SOLO, DUO, SQUAD

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      if (res.success) {
        setTournaments(res.data);
      }
    } catch (error) {
      console.error('Fetch tournaments error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(t => 
    filter === 'ALL' ? true : t.mode.toUpperCase() === filter
  );

  const renderTournament = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
    >
      <View style={styles.cardMain}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
             <View style={[styles.modeBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.badgeText}>{item.is_blind_drop ? '🕵️ BLIND DROP' : item.mode.toUpperCase()}</Text>
             </View>
             {item.is_free && (
               <View style={[styles.modeBadge, { backgroundColor: COLORS.gold }]}>
                  <Text style={styles.badgeText}>FREE ENTRY</Text>
               </View>
             )}
          </View>
          <Text style={styles.timeText}>🕒 {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.mapText}>🗺️ Map: {item.map || 'Bermuda'}</Text>

        <View style={styles.prizeContainer}>
          <View style={styles.prizeSub}>
            <Text style={styles.prizeLabel}>PRIZE POOL</Text>
            <Text style={styles.prizeVal}>₹{item.prize_pool}</Text>
          </View>
          <View style={styles.prizeSub}>
            <Text style={styles.prizeLabel}>ENTRY FEE</Text>
            <Text style={[styles.prizeVal, item.is_free && { color: COLORS.success }]}>
              {item.is_free ? 'FREE' : `₹${item.entry_fee}`}
            </Text>
          </View>
          <View style={styles.prizeSub}>
            <Text style={styles.prizeLabel}>PER KILL</Text>
            <Text style={styles.prizeVal}>₹{item.per_kill || '0'}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Slots: {item.slots_filled}/{item.total_slots}</Text>
            <Text style={styles.progressPercent}>{Math.round((item.slots_filled / item.total_total_slots) * 100 || 0)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(item.slots_filled / item.total_slots) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.joinBtn}>
          <Text style={styles.joinText}>VIEW DETAILS</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <Text style={styles.headerTitle}>TOURNAMENTS</Text>
        <View style={styles.filterContainer}>
          {['ALL', 'SOLO', 'DUO', 'SQUAD'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTournaments}
          renderItem={renderTournament}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎮</Text>
              <Text style={styles.emptyText}>No tournaments available right now. Check back soon!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: SPACING.base },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  filterContainer: { flexDirection: 'row', backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.md },
  filterBtnActive: { backgroundColor: COLORS.bg4, borderWidth: 1, borderColor: COLORS.primary },
  filterText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.primary },
  list: { padding: SPACING.base, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.bg3,
    ...SHADOWS.md
  },
  cardMain: { padding: SPACING.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  timeText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, marginBottom: 5 },
  mapText: { fontSize: 11, color: COLORS.textDim, marginBottom: 15 },
  prizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20
  },
  prizeSub: { alignItems: 'center' },
  prizeLabel: { fontSize: 9, color: COLORS.textDim, fontWeight: '700', marginBottom: 4 },
  prizeVal: { fontSize: 15, fontWeight: '900', color: COLORS.white },
  progressContainer: { marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  progressPercent: { fontSize: 11, color: COLORS.primary, fontWeight: '900' },
  progressBarBg: { height: 6, backgroundColor: COLORS.bg3, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  joinBtn: { height: 45, justifyContent: 'center', alignItems: 'center' },
  joinText: { color: COLORS.white, fontWeight: '900', letterSpacing: 1.5, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 50, marginBottom: 20 },
  emptyText: { color: COLORS.textDim, textAlign: 'center', paddingHorizontal: 50, lineHeight: 20 }
});

export default TournamentsScreen;
