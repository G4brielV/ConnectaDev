import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { XpBreakdownItem } from '@/shared/api/gamificationApi';
import { colors, fonts, radius } from '@/shared/config/theme';
import { totalXpOf, xpItemLabel } from '../model/bonusFeedback';

interface XpBreakdownProps {
  items: XpBreakdownItem[];
}

// Extrato transparente do XP: o da atividade, os bônus e o total.
export function XpBreakdown({ items }: XpBreakdownProps) {
  if (items.length === 0) return null;

  const total = totalXpOf(items);

  return (
    <View style={styles.card} accessibilityLabel={`Você ganhou ${total} XP`}>
      {items.map((item) => (
        <View key={item.kind} style={styles.row}>
          <Text style={styles.label}>{xpItemLabel(item.kind)}</Text>
          <Text style={styles.amount}>+{item.amount} XP</Text>
        </View>
      ))}
      {items.length > 1 ? (
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.totalValue}>
            <MaterialCommunityIcons name="lightning-bolt" size={15} color={colors.accentInk} />
            <Text style={styles.totalAmount}>+{total} XP</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.sans.regular, fontSize: 13, color: colors.accentInk },
  amount: { fontFamily: fonts.mono.medium, fontSize: 13, color: colors.accentInk },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.accentDeep,
    paddingTop: 8,
  },
  totalLabel: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.accentInk },
  totalValue: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  totalAmount: { fontFamily: fonts.sans.extraBold, fontSize: 15, color: colors.accentInk },
});
