// screens/Profile/KYCScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, Image, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const KYCScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('PAN'); // PAN or AADHAAR
  const [documentUri, setDocumentUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8
    });
    if (!result.didCancel && result.assets?.[0]) {
      setDocumentUri(result.assets[0]);
    }
  };

  const handleKYCSubmit = async () => {
    if (!fullName || !idNumber || !documentUri) {
      Alert.alert('Incomplete Details', 'Sab details bharo aur Document upload karo!');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('id_number', idNumber);
      formData.append('id_type', idType);
      formData.append('document', {
        uri: documentUri.uri,
        type: documentUri.type || 'image/jpeg',
        name: 'kyc_doc.jpg',
      });

      const res = await api.post('/users/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        Alert.alert('Kyc Submitted', 'Hum 24-48 hours mein verify karenge.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Submission failed');
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
        <Text style={styles.title}>KYC VERIFICATION</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
             Withdrawals and High-Prize tournaments require a verified KYC.
             Data is encrypted and never shared. 🔒
          </Text>
        </View>

        <View style={styles.inputGroup}>
           <Text style={styles.label}>FULL NAME (AS PER ID)</Text>
           <TextInput
             style={styles.input}
             value={fullName}
             onChangeText={setFullName}
             placeholder="John Doe"
             placeholderTextColor={COLORS.textDim}
           />
        </View>

        <View style={styles.typeSelector}>
           <TouchableOpacity 
             style={[styles.typeBtn, idType === 'PAN' && styles.activeType]}
             onPress={() => setIdType('PAN')}
           >
              <Text style={[styles.typeText, idType === 'PAN' && styles.activeTypeText]}>PAN CARD</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.typeBtn, idType === 'AADHAAR' && styles.activeType]}
             onPress={() => setIdType('AADHAAR')}
           >
              <Text style={[styles.typeText, idType === 'AADHAAR' && styles.activeTypeText]}>AADHAAR</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
           <Text style={styles.label}>{idType} NUMBER</Text>
           <TextInput
             style={styles.input}
             value={idNumber}
             onChangeText={setIdNumber}
             placeholder={idType === 'PAN' ? 'ABCDE1234F' : '1234 5678 9012'}
             placeholderTextColor={COLORS.textDim}
             autoCapitalize="characters"
           />
        </View>

        <Text style={styles.label}>DOCUMENT PHOTO</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
          {documentUri ? (
            <Image source={{ uri: documentUri.uri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
               <Text style={styles.uplaodText}>Tap to capture front side</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleKYCSubmit}
          disabled={loading}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.submitGrad}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>SUBMIT KYC</Text>}
          </LinearGradient>
        </TouchableOpacity>
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
  content: { padding: SPACING.base },
  infoCard: { backgroundColor: 'rgba(255,102,0,0.1)', padding: 15, borderRadius: RADIUS.lg, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,102,0,0.2)' },
  infoText: { color: COLORS.primary, fontSize: 13, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: COLORS.bg2, height: 55, borderRadius: RADIUS.md, paddingHorizontal: 15, color: COLORS.white, fontSize: 16, borderWidth: 1, borderColor: COLORS.bg3 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, height: 45, borderRadius: RADIUS.md, backgroundColor: COLORS.bg2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.bg3 },
  activeType: { borderColor: COLORS.primary, backgroundColor: COLORS.bg3 },
  typeText: { color: COLORS.textDim, fontWeight: '800', fontSize: 12 },
  activeTypeText: { color: COLORS.primary },
  uploadBox: { height: 180, backgroundColor: COLORS.bg2, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.bg3, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 30 },
  preview: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center' },
  uplaodText: { color: COLORS.textDim, fontWeight: '700' },
  submitBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.primary },
  submitGrad: { height: 60, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 }
});

export default KYCScreen;
