// screens/Tournament/PredictScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, Alert, ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import api from '../../services/api';

const PredictScreen = ({ route, navigation }) => {
  const { tournamentId, players } = route.params;
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!selectedPlayer) {
      Alert.alert('Selection Required', 'Please select the player you think will win.');
      return;
    }

    const predictionAmount = parseInt(amount);
    if (isNaN(predictionAmount) || predictionAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount of BlazeGold coins.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/predictions/place', {
        tournamentId,
        targetUserId: selectedPlayer.id,
        amount: predictionAmount
      });

      if (res.success) {
        Alert.alert('🔮 Prediction Placed!', 'If your player wins, your reward will be credited automatically!');
        navigation.goBack();
      } else {
        Alert.alert('Failed', res.message || 'Could not place prediction.');
      }
    } catch (error) {
       Alert.alert('Error', 'Insufficient balance or server error.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlayer = ({ item }) => {
    const isSelected = selectedPlayer?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.playerCard, isSelected && styles.activePlayerCard]}
        onPress={() => setSelectedPlayer(item)}
      >
        <Text style={styles.playerEmoji}>🎮</Text>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isSelected && styles.activeText]}>{item.username}</Text>
          <Text style={styles.playerStats}>Win Rate: {item.win_rate || 'N/A'}%</Text>
        </View>
        {isSelected && <Text style={styles.checkIcon}>✅</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A237E', COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WATCH & EARN</Text>
        <Text style={styles.headerSub}>Predict the ultimate winner for 2x Rewards!</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Potential Winner</Text>
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={item => item.id.toString()}
          style={styles.playerList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Text style={styles.inputLabel}>BlazeGold to Wager</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.coinIcon}>🪙</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Coins"
                placeholderTextColor={COLORS.textDim}
              />
            </View>
            <View style={styles.rewardContainer}>
               <Text style={styles.rewardLabel}>Potential Return</Text>
               <Text style={styles.rewardValue}>🪙 {parseInt(amount || 0) * 2}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.predictBtn, loading && { opacity: 0.7 }]}
            onPress={handlePredict}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.predictBtnText}>PLACE PREDICTION</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: SPACING.base },
  backBtn: { marginBottom: 10 },
  backText: { color: COLORS.white, fontWeight: '700' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 1 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { flex: 1, padding: SPACING.base },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 15 },
  playerList: { flex: 1 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.bg3
  },
  activePlayerCard: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary
  },
  playerEmoji: { fontSize: 24, marginRight: 12 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  activeText: { color: COLORS.primary },
  playerStats: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  checkIcon: { fontSize: 20 },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg3,
    backgroundColor: COLORS.bg
  },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, marginBottom: 10, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: RADIUS.md,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.bg3
  },
  coinIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, height: 50, color: COLORS.text, fontSize: 18, fontWeight: '900' },
  rewardContainer: {
    flex: 1,
    backgroundColor: '#1B5E20',
    borderRadius: RADIUS.md,
    padding: 10,
    justifyContent: 'center'
  },
  rewardLabel: { fontSize: 10, color: '#A5D6A7', fontWeight: '800', textAlign: 'center' },
  rewardValue: { fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  predictBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
    marginBottom: 20
  },
  predictBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 }
});

export default PredictScreen;
