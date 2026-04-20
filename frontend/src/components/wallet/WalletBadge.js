// components/wallet/WalletBadge.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

const WalletBadge = ({ label, value, icon, color = COLORS.primary, onPress }) => (
  <TouchableOpacity style={[styles.badge, { borderColor: color + '30' }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.icon}>{icon}</Text>
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg3,
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 8,
    borderWidth: 1,
  },
  icon: { fontSize: 18 },
  label: { fontSize: 9, color: COLORS.textDim, fontWeight: '700', letterSpacing: 1 },
  value: { fontSize: 14, fontWeight: '900', marginTop: 1 },
});

export default WalletBadge;
