// screens/Profile/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Mocking for now as the backend route might be empty, but setting up the structure
      const res = await api.get('/users/notifications');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      // Fallback mock for demo
      setNotifications([
        { id: '1', title: 'Tournament Starting!', body: 'Your Match #882 is starting in 30 minutes! Get ready.', time: '10m ago', type: 'ALERT', read: false },
        { id: '2', title: 'KYC Verified', body: 'Congratulations! Your KYC has been successfully verified.', time: '2h ago', type: 'INFO', read: true },
        { id: '3', title: 'Reward Credited', body: '₹50 added to your wallet for Prediction Win on Tournament #870.', time: '5h ago', type: 'SUCCESS', read: true },
        { id: '4', title: 'New Bounty!', body: 'A new target is live. Claim the ₹500 prize now.', time: '1d ago', type: 'BOUNTY', read: true },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllRead = async () => {
     // Optional: Call api to mark all as read
     setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const renderIcon = (type) => {
    switch(type) {
      case 'ALERT': return '🔥';
      case 'SUCCESS': return '💰';
      case 'BOUNTY': return '🎯';
      default: return '🔔';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.item, !item.read && styles.itemUnread]}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconEmoji}>{renderIcon(item.type)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
       <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
         </TouchableOpacity>
         <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
         <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAll}>Mark Read</Text>
         </TouchableOpacity>
       </View>

       {loading ? (
         <View style={styles.center}>
           <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
       ) : (
         <FlatList
           data={notifications}
           renderItem={renderItem}
           keyExtractor={item => item.id}
           contentContainerStyle={styles.list}
           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
           ListEmptyComponent={
             <View style={styles.empty}>
               <Text style={styles.emptyIcon}>📭</Text>
               <Text style={styles.emptyText}>All caught up! No new notifications.</Text>
             </View>
           }
         />
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg2
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: COLORS.white, fontSize: 24 },
  readAll: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  list: { padding: SPACING.base },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg3,
    padding: 15,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  itemUnread: {
    backgroundColor: COLORS.bg4,
    borderColor: 'rgba(255,102,0,0.2)',
    ...SHADOWS.sm
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  iconEmoji: { fontSize: 22 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  time: { fontSize: 10, color: COLORS.textDim },
  body: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { color: COLORS.textDim, fontSize: 15, textAlign: 'center' }
});

export default NotificationsScreen;
