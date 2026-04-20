// screens/Clan/ClanScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const ClanScreen = ({ navigation }) => {
  const [myClan, setMyClan] = useState(null);
  const [topClans, setTopClans] = useState([]);
  const [creating, setCreating] = useState(false);
  const [clanForm, setClanForm] = useState({ name: '', tag: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadClanData(); }, []);

  const loadClanData = async () => {
    try {
      const [profileRes, leaderboardRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/clans/leaderboard'),
      ]);
      if (profileRes.success) setMyClan(profileRes.data.clan);
      if (leaderboardRes.success) setTopClans(leaderboardRes.data.clans.slice(0, 10));
    } catch (_) {} finally { setLoading(false); }
  };

  const handleCreateClan = async () => {
    if (!clanForm.name || !clanForm.tag) { Alert.alert('Error', 'Clan naam aur tag required hai'); return; }
    try {
      const res = await api.post('/clans', clanForm);
      if (res.success) { Alert.alert('✅ Clan Created!', res.message); loadClanData(); setCreating(false); }
    } catch (e) { Alert.alert('Error', e.message || 'Clan create failed'); }
  };

  const handleJoinClan = async (clanId, clanName) => {
    Alert.alert('Join Clan?', `"${clanName}" mein join karna chahte ho?`, [
      { text: 'Join', onPress: async () => {
        try {
          const res = await api.post(`/clans/${clanId}/join`);
          if (res.success) { Alert.alert('✅ Joined!', res.message); loadClanData(); }
        } catch (e) { Alert.alert('Error', e.message || 'Join failed'); }
      }},
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: COLORS.textMuted }}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>👥 Clans</Text>
        </View>

        {/* My Clan */}
        {myClan ? (
          <View style={styles.myClanCard}>
            <LinearGradient colors={['rgba(255,69,0,0.15)', 'transparent']} style={styles.myClanGrad}>
              <Text style={styles.myClanTag}>[{myClan.tag}]</Text>
              <Text style={styles.myClanName}>{myClan.name}</Text>
              <View style={styles.myClanStats}>
                <View style={styles.myClanStat}>
                  <Text style={styles.myClanStatVal}>{myClan.total_members}</Text>
                  <Text style={styles.myClanStatLabel}>Members</Text>
                </View>
                <View style={styles.myClanStat}>
                  <Text style={styles.myClanStatVal}>{myClan.season_points}</Text>
                  <Text style={styles.myClanStatLabel}>Season Pts</Text>
                </View>
                <View style={styles.myClanStat}>
                  <Text style={styles.myClanStatVal}>{myClan.total_wins}</Text>
                  <Text style={styles.myClanStatLabel}>Wins</Text>
                </View>
                <View style={styles.myClanStat}>
                  <Text style={[styles.myClanStatVal, { color: COLORS.gold }]}>₹{parseFloat(myClan.treasury_cash || 0).toFixed(0)}</Text>
                  <Text style={styles.myClanStatLabel}>Treasury</Text>
                </View>
              </View>
              <View style={styles.clanRankBadge}>
                <Text style={styles.clanRankText}>Rank #{myClan.clan_rank || '?'}</Text>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.noClanCard}>
            <Text style={styles.noClanIcon}>🏴</Text>
            <Text style={styles.noClanTitle}>Koi Clan Nahi!</Text>
            <Text style={styles.noClanSub}>Clan banao ya join karo — saath mein jeeto, saath mein kamaao</Text>
            <TouchableOpacity
              style={styles.createClanBtn}
              onPress={() => setCreating(true)}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.createGrad}>
                <Text style={styles.createBtnText}>+ Create Clan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Create clan form */}
        {creating && (
          <View style={styles.createForm}>
            <Text style={styles.createFormTitle}>Create Your Clan</Text>
            <TextInput style={styles.formInput} placeholder="Clan Name (e.g. BlazeMasters)" placeholderTextColor={COLORS.textDim} value={clanForm.name} onChangeText={t => setClanForm({ ...clanForm, name: t })} />
            <TextInput style={styles.formInput} placeholder="Tag (4 letters, e.g. BLZM)" placeholderTextColor={COLORS.textDim} value={clanForm.tag} onChangeText={t => setClanForm({ ...clanForm, tag: t.toUpperCase() })} maxLength={4} />
            <TextInput style={[styles.formInput, { height: 80 }]} placeholder="Description (optional)" placeholderTextColor={COLORS.textDim} value={clanForm.description} onChangeText={t => setClanForm({ ...clanForm, description: t })} multiline />
            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateClan}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.confirmGrad}>
                  <Text style={styles.confirmBtnText}>Create</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clan Season Info */}
        <View style={styles.seasonCard}>
          <Text style={styles.seasonTitle}>🏆 Season Rewards</Text>
          <View style={styles.seasonRow}><Text style={styles.seasonRank}>#1 Clan</Text><Text style={styles.seasonPrize}>₹1,00,000</Text></View>
          <View style={styles.seasonRow}><Text style={styles.seasonRank}>#2 Clan</Text><Text style={styles.seasonPrize}>₹50,000</Text></View>
          <View style={styles.seasonRow}><Text style={styles.seasonRank}>#3 Clan</Text><Text style={styles.seasonPrize}>₹25,000</Text></View>
        </View>

        {/* Top clans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Clans This Season</Text>
          {topClans.map((clan, index) => (
            <View key={clan.id} style={styles.clanRow}>
              <Text style={styles.clanRowRank}>{index + 1 <= 3 ? ['🥇','🥈','🥉'][index] : `#${index+1}`}</Text>
              <View style={styles.clanRowInfo}>
                <Text style={styles.clanRowName}>[{clan.tag}] {clan.name}</Text>
                <Text style={styles.clanRowMembers}>{clan.total_members} members • {clan.season_points} pts</Text>
              </View>
              {!myClan && (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinClan(clan.id, clan.name)}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

// ============================================
// screens/Wallet/WithdrawScreen.js
// ============================================
const WithdrawScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const { realCash } = require('react-redux').useSelector(s => s.wallet);
  const dispatch = require('react-redux').useDispatch();

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 10) { Alert.alert('Error', 'Minimum withdrawal ₹10 hai'); return; }
    if (parseFloat(amount) > realCash) { Alert.alert('Error', 'Insufficient balance'); return; }
    if (method === 'upi' && !upiId) { Alert.alert('Error', 'UPI ID required'); return; }

    try {
      setLoading(true);
      const res = await api.post('/wallet/withdraw', { amount: parseFloat(amount), method, upi_id: upiId });
      if (res.success) {
        dispatch(require('../../store/slices/walletSlice').fetchWallet());
        Alert.alert('✅ Withdrawal Initiated!', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e) { Alert.alert('Error', e.message || 'Withdrawal failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles2.container}>
      <View style={styles2.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles2.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles2.title}>Withdraw Money</Text>
        <View />
      </View>
      <ScrollView style={styles2.scroll}>
        <View style={styles2.balanceCard}>
          <Text style={styles2.balLabel}>Available Balance</Text>
          <Text style={styles2.balAmount}>₹{realCash.toFixed(2)}</Text>
        </View>
        <Text style={styles2.label}>Amount</Text>
        <View style={styles2.inputRow}>
          <Text style={styles2.rupee}>₹</Text>
          <TextInput style={styles2.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Min ₹10" placeholderTextColor={COLORS.textDim} />
        </View>
        <Text style={styles2.label}>Payment Method</Text>
        <View style={styles2.methodRow}>
          {[{ key: 'upi', label: '📱 UPI (Instant)' }, { key: 'bank', label: '🏦 Bank (24hr)' }].map(m => (
            <TouchableOpacity key={m.key} style={[styles2.methodBtn, method === m.key && styles2.methodBtnActive]} onPress={() => setMethod(m.key)}>
              <Text style={[styles2.methodText, method === m.key && { color: COLORS.primary }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {method === 'upi' && (
          <>
            <Text style={styles2.label}>UPI ID</Text>
            <TextInput style={styles2.upiInput} value={upiId} onChangeText={setUpiId} placeholder="yourname@upi" placeholderTextColor={COLORS.textDim} autoCapitalize="none" />
          </>
        )}
        <View style={styles2.infoCard}>
          <Text style={styles2.infoText}>⚡ UPI — Instant transfer</Text>
          <Text style={styles2.infoText}>🏦 Bank — Within 24 hours</Text>
          <Text style={styles2.infoText}>💳 KYC required above ₹1,000</Text>
        </View>
        <TouchableOpacity style={[styles2.btn, loading && styles2.disabled]} onPress={handleWithdraw} disabled={loading}>
          <LinearGradient colors={[COLORS.green, '#00a050']} style={styles2.btnGrad}>
            <Text style={styles2.btnText}>{loading ? '⏳ Processing...' : `Withdraw ₹${amount || '0'}`}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.base, paddingTop: 56 },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  myClanCard: { margin: SPACING.base, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  myClanGrad: { padding: SPACING.xl },
  myClanTag: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.primary, letterSpacing: 4 },
  myClanName: { fontSize: FONTS.sizes.xxl, fontWeight: '900', color: COLORS.text, marginVertical: 4 },
  myClanStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 12 },
  myClanStat: { alignItems: 'center' },
  myClanStatVal: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  myClanStatLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  clanRankBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.sm, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4 },
  clanRankText: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.sm },
  noClanCard: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  noClanIcon: { fontSize: 52, marginBottom: 12 },
  noClanTitle: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  noClanSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  createClanBtn: { borderRadius: RADIUS.md, overflow: 'hidden', width: '100%' },
  createGrad: { padding: SPACING.base, alignItems: 'center' },
  createBtnText: { color: COLORS.white, fontWeight: '800', fontSize: FONTS.sizes.base },
  createForm: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border },
  createFormTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  formInput: { backgroundColor: COLORS.bg4, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.md, color: COLORS.text, marginBottom: 12 },
  formBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: SPACING.md, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  confirmBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  confirmGrad: { padding: SPACING.md, alignItems: 'center' },
  confirmBtnText: { color: COLORS.white, fontWeight: '800' },
  seasonCard: { margin: SPACING.base, backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.goldGlow },
  seasonTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.gold, marginBottom: 12 },
  seasonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  seasonRank: { fontSize: FONTS.sizes.base, color: COLORS.textMuted, fontWeight: '600' },
  seasonPrize: { fontSize: FONTS.sizes.base, color: COLORS.gold, fontWeight: '900' },
  section: { padding: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  clanRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight },
  clanRowRank: { fontSize: 20, width: 36 },
  clanRowInfo: { flex: 1 },
  clanRowName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text },
  clanRowMembers: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  joinBtn: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  joinBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.sm },
});

const styles2 = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, paddingTop: 56 },
  back: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.text },
  scroll: { flex: 1, padding: SPACING.base },
  balanceCard: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.goldGlow },
  balLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2 },
  balAmount: { fontSize: FONTS.sizes.hero, fontWeight: '900', color: COLORS.gold, marginTop: 4 },
  label: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  rupee: { fontSize: FONTS.sizes.xl, color: COLORS.textMuted, paddingHorizontal: SPACING.base },
  input: { flex: 1, fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.text, padding: SPACING.base },
  methodRow: { flexDirection: 'row', gap: 12 },
  methodBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.bg3, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  methodText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  upiInput: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight, padding: SPACING.base, color: COLORS.text, fontSize: FONTS.sizes.base },
  infoCard: { backgroundColor: COLORS.bg3, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: 16, gap: 6 },
  infoText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  btn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 24 },
  disabled: { opacity: 0.5 },
  btnGrad: { padding: SPACING.base + 4, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: 1 },
});

export { ClanScreen, WithdrawScreen };
export default ClanScreen;
