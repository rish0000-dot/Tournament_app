// screens/Profile/SettingsScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { setLanguage } from '../../store/slices/uiSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { language } = useSelector(s => s.ui);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account, wallet balance, and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: () => {
          // In production: call API to delete account
          dispatch(logout());
        }},
      ]
    );
  };

  const SettingRow = ({ icon, label, value, onPress, isSwitch, switchValue, onToggle, danger }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={[styles.settingLabel, danger && { color: COLORS.error }]}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.bg4, true: COLORS.primary + '60' }}
          thumbColor={switchValue ? COLORS.primary : COLORS.textDim}
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Text style={styles.settingArrow}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingRow icon="📱" label="Phone Number" value={user?.phone || '+91 ****'} />
          <SettingRow icon="🎮" label="Free Fire UID" value={user?.ff_uid || 'Not linked'} />
          <SettingRow icon="🌐" label="Language" value={language === 'hi' ? 'हिंदी' : 'English'}
            onPress={() => dispatch(setLanguage(language === 'hi' ? 'en' : 'hi'))} />
          <SettingRow icon="🛡️" label="KYC Verification"
            value={user?.is_kyc_verified ? '✅ Verified' : 'Pending'}
            onPress={() => navigation.navigate('KYC')} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <SettingRow icon="🔔" label="Push Notifications" isSwitch switchValue={pushEnabled} onToggle={setPushEnabled} />
          <SettingRow icon="🔊" label="Sound Effects" isSwitch switchValue={soundEnabled} onToggle={setSoundEnabled} />
          <SettingRow icon="📳" label="Vibration" isSwitch switchValue={vibrationEnabled} onToggle={setVibrationEnabled} />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingRow icon="❓" label="Help & FAQ" onPress={() => {}} />
          <SettingRow icon="📧" label="Contact Support" onPress={() => {}} />
          <SettingRow icon="📜" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>ACTIONS</Text>
        <View style={styles.section}>
          <SettingRow icon="🚪" label="Logout" danger onPress={handleLogout} />
          <SettingRow icon="🗑️" label="Delete Account" danger onPress={handleDeleteAccount} />
        </View>

        {/* Version */}
        <Text style={styles.version}>BlazeStrike v1.0.0 • Built with 🔥</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backText: { color: COLORS.white, fontSize: 28, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 3 },
  scroll: { flex: 1 },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 3,
    paddingHorizontal: 20, marginTop: 24, marginBottom: 8,
  },
  section: {
    marginHorizontal: 16, backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.bg4,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 18 },
  settingLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  settingArrow: { fontSize: 20, color: COLORS.textDim, fontWeight: '300' },

  version: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, marginTop: 30, fontWeight: '600' },
});

export default SettingsScreen;
