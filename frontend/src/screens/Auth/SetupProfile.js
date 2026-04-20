// screens/Auth/SetupProfile.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';
import { updateProfileState } from '../../store/slices/authSlice';

const SetupProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    ff_uid: '',
    ff_username: '',
    referral_code: ''
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFinish = async () => {
    const { username, ff_uid, ff_username } = formData;
    if (!username || !ff_uid || !ff_username) {
      Alert.alert('Required Fields', 'Username, FF ID, and IGN are mandatory.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/setup-profile', formData);
      if (res.success) {
        // Update local auth state with new profile data
        dispatch(updateProfileState(res.data.user));
        Alert.alert('🔥 AWESOME!', 'Profile setup complete. Welcome to BlazeStrike!', [
            { text: 'ENTER LOBBY', onPress: () => {} } // Redux state change will handle navigation
        ]);
      } else {
        Alert.alert('Error', res.message || 'Username or FF ID already taken.');
      }
    } catch (error) {
      Alert.alert('Oops!', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#1A0A00', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>WELCOME <Text style={styles.accent}>PLAYER</Text></Text>
            <Text style={styles.subtitle}>Setup your gaming profile to start earning</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>APP USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Unique username"
                placeholderTextColor={COLORS.textDim}
                value={formData.username}
                onChangeText={(v) => handleInputChange('username', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FREE FIRE UID</Text>
              <TextInput
                style={styles.input}
                placeholder="10-12 digit ID"
                placeholderTextColor={COLORS.textDim}
                keyboardType="numeric"
                value={formData.ff_uid}
                onChangeText={(v) => handleInputChange('ff_uid', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>IN-GAME NAME (IGN)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Hunter007"
                placeholderTextColor={COLORS.textDim}
                value={formData.ff_username}
                onChangeText={(v) => handleInputChange('ff_username', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>REFERRAL CODE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter friend code for ₹10"
                placeholderTextColor={COLORS.textDim}
                autoCapitalize="characters"
                value={formData.referral_code}
                onChangeText={(v) => handleInputChange('referral_code', v)}
              />
            </View>

            <TouchableOpacity 
              style={[styles.finishBtn, loading && { opacity: 0.7 }]} 
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.finishBtnText}>FINISH SETUP  →</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            By continuing, you agree that your gameplay will be monitored for fair play.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: SPACING.xl, paddingTop: 80, paddingBottom: 40 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  accent: { color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  card: {
    backgroundColor: COLORS.bg3,
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.md
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 8, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    height: 55,
    paddingHorizontal: 15,
    color: COLORS.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.bg4
  },
  finishBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.primary
  },
  finishBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  note: { textAlign: 'center', color: COLORS.textDim, fontSize: 11, marginTop: 30, lineHeight: 18 }
});

export default SetupProfile;
