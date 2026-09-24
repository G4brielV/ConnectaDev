import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors, radius } from '@/shared/config/theme';

// Ilustração "Boas-Vindas 1" do Stitch: trilhas de circuito, nós e ponte (Recife) com cores do manual
const ECOSYSTEM_SVG = `
<svg fill="none" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
<path d="M40 250C90 235 150 255 210 240C250 230 290 245 320 240" stroke="#bce6fe" stroke-dasharray="6 6" stroke-linecap="round" stroke-width="4"/>
<path d="M0 270C60 255 130 275 190 260C240 250 280 265 320 258" stroke="#dec38f" stroke-linecap="round" stroke-width="3"/>
<path d="M30 190L160 110L290 190" stroke="#036564" stroke-linecap="round" stroke-width="3"/>
<path d="M160 110V220" stroke="#036564" stroke-linecap="round" stroke-width="3"/>
<path d="M80 159V210M120 135V210M200 135V210M240 159V210" stroke="#3b6378" stroke-dasharray="4 4" stroke-width="2"/>
<rect fill="#036564" height="8" rx="4" width="220" x="50" y="210"/>
<path d="M40 90H100V130H140" stroke="#036564" stroke-linecap="round" stroke-width="2"/>
<path d="M280 90H220V125H185" stroke="#dec38f" stroke-linecap="round" stroke-width="2"/>
<circle cx="40" cy="90" fill="#036564" r="7"/>
<circle cx="40" cy="90" fill="#ffffff" r="3"/>
<circle cx="100" cy="130" fill="#dec38f" r="5"/>
<circle cx="280" cy="90" fill="#dec38f" r="7"/>
<circle cx="280" cy="90" fill="#ffffff" r="3"/>
<circle cx="160" cy="110" fill="#fcdfa9" r="10"/>
<circle cx="160" cy="110" fill="#036564" r="5"/>
<g transform="translate(110, 30)">
<rect fill="#ffffff" height="42" rx="10" width="100"/>
<rect fill="#036564" height="18" rx="5" width="18" x="10" y="12"/>
<path d="M15 18L13 21L15 24M23 18L25 21L23 24M20 17.5L18 24.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<rect fill="#e8ddcb" height="6" rx="3" width="48" x="36" y="14"/>
<rect fill="#dec38f" height="5" rx="2.5" width="30" x="36" y="24"/>
</g>
<g transform="translate(25, 125)">
<circle cx="16" cy="16" fill="#ffffff" r="16"/>
<circle cx="16" cy="16" fill="#e8ddcb" r="12"/>
<path d="M12 16L15 19L21 13" stroke="#036564" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
</g>
<g transform="translate(255, 135)">
<circle cx="16" cy="16" fill="#ffffff" r="16"/>
<circle cx="16" cy="16" fill="#fcdfa9" r="12"/>
<text fill="#524018" font-family="JetBrainsMono_500Medium" font-size="11" x="11" y="20">JS</text>
</g>
</svg>`;

export function EcosystemHero() {
  return (
    <View style={styles.card}>
      <View style={[styles.glow, styles.glowTopRight]} />
      <View style={[styles.glow, styles.glowBottomLeft]} />
      <SvgXml xml={ECOSYSTEM_SVG} width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.creamSoft,
    padding: 16,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  glowTopRight: {
    width: 144,
    height: 144,
    top: -40,
    right: -40,
    backgroundColor: '#bce6fe',
  },
  glowBottomLeft: {
    width: 128,
    height: 128,
    bottom: -32,
    left: -32,
    backgroundColor: colors.accentSoft,
  },
});
