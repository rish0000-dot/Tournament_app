// components/common/ModeFilterChip.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

const ModeFilterChip = ({ label, icon, selected, onPress, color }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      selected && { backgroundColor: (color || COLORS.primary) + '20', borderColor: color || COLORS.primary },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.label, selected && { color: color || COLORS.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg3,
    borderWidth: 1,
    borderColor: COLORS.bg4,
    gap: 5,
  },
  icon: { fontSize: 14 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
});

export default ModeFilterChip;
