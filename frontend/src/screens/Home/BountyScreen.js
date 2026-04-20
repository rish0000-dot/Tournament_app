// screens/Home/BountyScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert,
  Image, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const BountyScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [mostWanted, setMostWanted] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMostWanted();
  }, []);

  const fetchMostWanted = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bounty/most-wanted');
      if (res.success) {
        setMostWanted(res.data);
      }
    } catch (error) {
      console.error('Most Wanted fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setScreenshot(response.assets[0]);
      }
    });
  };

  const handleSubmitClaim = async () => {
    if (!screenshot || !selectedTarget) {
      Alert.alert('Incomplete', 'Please select a target and upload a screenshot proof.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('targetUserId', selectedTarget.id);
      formData.append('screenshot', {
        uri: screenshot.uri,
        type: screenshot.type,
        name: screenshot.fileName || 'bounty_proof.jpg',
      });

      const res = await api.post('/bounty/claim', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        Alert.alert('🔥 SUCCESS!', `Bounty of ₹${res.data.reward} claimed! Logic verified via OCR.`);
        setClaimModalVisible(false);
        setScreenshot(null);
        fetchMostWanted();
      } else {
        Alert.alert('Claim Failed', res.message || 'Verification failed. Ensure the screenshot clearly shows the kill.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while submitting the claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBountyItem = ({ item }) => (
    <View style={styles.bountyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.targetInfo}>
          <Text style={styles.targetIcon}>👤</Text>
          <View>
            <Text style={styles.targetName}>{item.username}</Text>
            <Text style={styles.targetFFID}>FF ID: {item.ff_id || '----'}</Text>
          </View>
        </View>
        <LinearGradient colors={['#FF1744', '#D50000']} style={styles.priceBadge}>
          <Text style={styles.priceText}>₹{parseFloat(item.current_bounty).toFixed(0)}</Text>
        </LinearGradient>
      </View>
      <Text style={styles.cardDesc}>
        {item.username} is on a streak! Kill them in any tournament to claim this bounty.
      </Text>
      <TouchableOpacity
        style={styles.claimBtn}
        onPress={() => {
          setSelectedTarget(item);
          setClaimModalVisible(true);
        }}
      >
        <Text style={styles.claimBtnText}>CLAIM BOUNTY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#310000', COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BOUNTY HUNTER</Text>
        <Text style={styles.headerSub}>Earn extra cash by taking down high-value targets</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.red} />
        </View>
      ) : (
        <FlatList
          data={mostWanted}
          renderItem={renderBountyItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🕊️</Text>
              <Text style={styles.emptyText}>No bounties at the moment. Peace in the server!</Text>
            </View>
          }
        />
      )}

      {/* Claim Modal */}
      <Modal visible={claimModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CLAIM BOUNTY</Text>
            <Text style={styles.modalSub}>Target: {selectedTarget?.username}</Text>

            <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
              {screenshot ? (
                <Image source={{ uri: screenshot.uri }} style={styles.previewImage} />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📸</Text>
                  <Text style={styles.uploadText}>Upload Proof Screenshot</Text>
                  <Text style={styles.uploadNote}>Must show the kill message clearly</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setClaimModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isSubmitting && { opacity: 0.5 }]}
                onPress={handleSubmitClaim}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnText}>
                  {isSubmitting ? 'VERIFYING...' : 'SUBMIT CLAIM'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: SPACING.base },
  backBtn: { marginBottom: 10 },
  backText: { color: COLORS.text, fontWeight: '700' },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.red,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 23, 68, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  list: { padding: SPACING.base },
  bountyCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.2)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  targetInfo: { flexDirection: 'row', alignItems: 'center' },
  targetIcon: { fontSize: 32, marginRight: 12 },
  targetName: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  targetFFID: { fontSize: 12, color: COLORS.textDim },
  priceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  priceText: { color: COLORS.white, fontWeight: '900', fontSize: 16 },
  cardDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 15 },
  claimBtn: {
    backgroundColor: 'rgba(255,23,68,0.1)',
    borderWidth: 1,
    borderColor: COLORS.red,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center'
  },
  claimBtnText: { color: COLORS.red, fontWeight: '900', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: SPACING.xl },
  modalContent: { backgroundColor: COLORS.bg2, borderRadius: RADIUS.xxl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.borderLight },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 5 },
  modalSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  uploadBox: {
    height: 200,
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 25
  },
  uploadIcon: { fontSize: 40, marginBottom: 10 },
  uploadText: { color: COLORS.text, fontWeight: '700' },
  uploadNote: { fontSize: 11, color: COLORS.textDim, marginTop: 4 },
  previewImage: { width: '100%', height: '100%' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.bg4 },
  modalConfirm: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.red },
  modalBtnText: { color: COLORS.white, fontWeight: '900' }
});

export default BountyScreen;
