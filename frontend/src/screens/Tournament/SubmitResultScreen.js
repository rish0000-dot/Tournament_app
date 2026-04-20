// screens/Tournament/SubmitResultScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, Image, ScrollView, ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const SubmitResultScreen = ({ navigation, route }) => {
  const { tournamentId } = route.params;
  const [kills, setKills] = useState('');
  const [rank, setRank] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1280
    });
    if (!result.didCancel && result.assets?.[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!screenshot) {
      Alert.alert('Evidence Missing', 'Please upload a screenshot of your match result.');
      return;
    }
    if (!kills || !rank) {
      Alert.alert('Details Missing', 'Please enter your kills and final rank.');
      return;
    }

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
          res.data.auto_verified ? 'System Verified' : 'Submission Received',
          res.data.auto_verified
            ? 'Our AI has verified your result! Rewards have been added to your wallet.'
            : 'Your result is in queue for manual verification. Expected time: 30-60 mins.',
          [{ text: 'CONTINUE', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'There was an error uploading your result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.bg2, COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SUBMIT RESULT</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📸 UPLOAD PROOF</Text>
          <Text style={styles.instructionText}>
            Capture your final match summary screen. Ensure your IGN, Kills, and Rank are clearly visible.
          </Text>

          <TouchableOpacity 
            style={[styles.screenshotArea, screenshot && { borderStyle: 'solid', borderColor: COLORS.primary }]} 
            onPress={pickImage}
          >
            {screenshot ? (
              <Image source={{ uri: screenshot.uri }} style={styles.preview} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderEmoji}>🖼️</Text>
                <Text style={styles.placeholderText}>Tap to select from gallery</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>TOTAL KILLS</Text>
            <View style={styles.textInputWrapper}>
               <TextInput
                 style={styles.input}
                 value={kills}
                 onChangeText={setKills}
                 keyboardType="numeric"
                 placeholder="00"
                 placeholderTextColor={COLORS.textDim}
                 maxLength={2}
               />
            </View>
          </View>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>FINAL RANK</Text>
            <View style={styles.textInputWrapper}>
               <TextInput
                 style={styles.input}
                 value={rank}
                 onChangeText={setRank}
                 keyboardType="numeric"
                 placeholder="01"
                 placeholderTextColor={COLORS.textDim}
                 maxLength={2}
               />
            </View>
          </View>
        </View>

        <View style={styles.warningBox}>
           <Text style={styles.warningTitle}>⚠️ FAIR PLAY WARNING</Text>
           <Text style={styles.warningText}>
             Submitting fake screenshots or incorrect data will result in immediate permanent ban from the BlazeStrike platform.
           </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.submitGrad}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>VERIFY & SUBMIT</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'space-between'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 2 },
  scroll: { padding: SPACING.base },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.bg3,
    marginBottom: 20,
    ...SHADOWS.md
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.white, marginBottom: 10 },
  instructionText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 20 },
  screenshotArea: {
    height: 220,
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.bg4,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  preview: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  placeholderEmoji: { fontSize: 40, marginBottom: 10 },
  placeholderText: { color: COLORS.textDim, fontSize: 13, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  inputBox: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, marginBottom: 8, textAlign: 'center' },
  textInputWrapper: {
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.bg4,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    width: '100%'
  },
  warningBox: {
    backgroundColor: 'rgba(255,23,68,0.05)',
    padding: 15,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.2)',
    marginBottom: 30
  },
  warningTitle: { color: COLORS.red, fontSize: 12, fontWeight: '900', marginBottom: 5 },
  warningText: { color: 'rgba(255,23,68,0.7)', fontSize: 11, lineHeight: 16 },
  submitBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.primary },
  submitGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 }
});

export default SubmitResultScreen;
