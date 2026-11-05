import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, fonts } from '@/shared/config/theme';

// Símbolo do logo: nós de circuito + seta, extraído do "ConnectaDev Logo Mark" do Stitch
const LOGO_MARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" fill="none">
  <circle cx="18" cy="18" r="16" fill="#036564" fill-opacity="0.12"/>
  <path d="M12 18L16 14M16 22L12 18" stroke="#036564" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 18L20 14M20 22L24 18" stroke="#033649" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="18" r="3" fill="#CDB380"/>
  <path d="M18 6V10M18 26V30" stroke="#036564" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
}

export function Logo({ size = 32, showWordmark = true, showTagline = false }: LogoProps) {
  return (
    <View style={styles.row}>
      <SvgXml xml={LOGO_MARK_SVG} width={size} height={size} />
      {showWordmark && (
        <View>
          <Text style={[styles.wordmark, { fontSize: size * 0.6 }]}>
            Connecta
            <Text style={styles.wordmarkDev}>Dev</Text>
          </Text>
          {showTagline && <Text style={styles.tagline}>ECOSSISTEMA TECH PE</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.sans.medium,
    color: colors.secondary,
    letterSpacing: -0.5,
  },
  wordmarkDev: {
    fontFamily: fonts.sans.bold,
    color: colors.primary,
  },
  tagline: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 8.5,
    letterSpacing: 1.2,
    color: colors.accent,
    marginTop: 2,
  },
});
