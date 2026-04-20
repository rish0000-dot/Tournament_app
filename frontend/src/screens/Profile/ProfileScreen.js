// screens/Profile/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Alert, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';
import { logout } from '../../store/slices/authSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      const res = await api.get('/users/profile/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit BlazeStrike?', [
      { text: 'Wait, No', style: 'cancel' },
      { text: 'Yes, Logout', onPress: () => dispatch(logout()) }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header / Profile Card */}
        <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
             <View style={styles.avatarMain}>
                <Text style={styles.avatarEmoji}>🔥</Text>
             </View>
             {user?.is_kyc_verified && (
               <View style={styles.verifiedBadge}>
                 <Text style={styles.verifiedIcon}>✅</Text>
               </View>
             )}
          </View>
          
          <Text style={styles.userName}>{user?.username?.toUpperCase()}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone}</Text>
          <View style={styles.idChip}>
             <Text style={styles.idChipText}>UID: {user?.ff_uid || 'N/A'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats?.total_matches || '0'}</Text>
              <Text style={styles.statSub}>Matches</Text>
            </View>
            <View style={[styles.statBox, styles.statBorder]}>
              <Text style={[styles.statVal, { color: COLORS.success }]}>{stats?.total_wins || '0'}</Text>
              <Text style={styles.statSub}>Wins</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats?.total_kills || '0'}</Text>
              <Text style={styles.statSub}>Kills</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Clan Card */}
          <Text style={styles.sectionLabel}>CLAN DETAILS</Text>
          <TouchableOpacity 
            style={styles.clanCard}
            onPress={() => navigation.navigate('Clan')}
          >
            <LinearGradient 
              colors={['rgba(255,102,0,0.1)', 'transparent']} 
              start={{x:0, y:0}} end={{x:1, y:1}}
              style={styles.clanGrad}
            >
              <View style={styles.clanInfo}>
                <Text style={styles.clanEmoji}>{stats?.clan ? '🛡️' : '🚫'}</Text>
                <View>
                  <Text style={styles.clanName}>
                    {stats?.clan ? stats.clan.name : 'No Clan Joined'}
                  </Text>
                  <Text style={styles.clanStatus}>
                    {stats?.clan ? `${stats.clan.role} • ${stats.clan.points} Season Pts` : 'Join a clan to compete in Season Wars'}
                  </Text>
                </View>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Links */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuList}>
            {[
              { id: 'kyc', title: 'KYC Verification', sub: user?.is_kyc_verified ? 'Verified' : 'Required for large withdrawals', icon: '🆔', page: 'KYC' },
              { id: 'notif', title: 'Notifications', sub: 'Match alerts and updates', icon: '🔔', page: 'Notifications' },
              { id: 'miss', title: 'Daily Missions', sub: 'Earn extra BlazeGold', icon: '🎯', page: 'Missions' },
              { id: 'help', title: 'Help & Support', sub: '24/7 Gamer Support', icon: '🎧', page: 'Help' },
            ].map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.menuItem}
                onPress={() => item.page && navigation.navigate(item.page)}
              >
                <View style={styles.menuIconBox}>
                  <Text style={styles.menuEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.menuInfo}>
                   <Text style={styles.menuTitle}>{item.title}</Text>
                   <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>LOGOUT SYSTEM</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>BlazeStrike v2.4.0-complete</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.bg3
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    ...SHADOWS.primary
  },
  avatarMain: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.bg4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  avatarEmoji: { fontSize: 40 },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifiedIcon: { fontSize: 14 },
  userName: { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  userPhone: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  idChip: {
    backgroundColor: COLORS.bg3,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  idChipText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    marginTop: 30,
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    padding: 15
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statVal: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  statSub: { fontSize: 10, color: COLORS.textDim, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  content: { padding: SPACING.base },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, marginTop: 25, marginBottom: 12, letterSpacing: 2 },
  clanCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.2)'
  },
  clanGrad: { padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clanInfo: { flexDirection: 'row', alignItems: 'center' },
  clanEmoji: { fontSize: 32, marginRight: 15 },
  clanName: { fontSize: 18, fontWeight: '900', color: COLORS.white },
  clanStatus: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  menuList: { gap: 10 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    padding: 15,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bg4
  },
  menuIconBox: {
    width: 45,
    height: 45,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  menuEmoji: { fontSize: 20 },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  menuSub: { fontSize: 11, color: COLORS.textDim, marginTop: 3 },
  arrowIcon: { fontSize: 18, color: COLORS.textDim },
  logoutBtn: {
    marginTop: 40,
    height: 60,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,23,68,0.05)'
  },
  logoutText: { color: COLORS.red, fontWeight: '900', letterSpacing: 2 },
  versionText: { textAlign: 'center', color: COLORS.textDim, fontSize: 10, marginTop: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }
});

export default ProfileScreen;
