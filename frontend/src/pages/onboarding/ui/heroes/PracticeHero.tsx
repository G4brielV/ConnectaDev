import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';

interface FloatingBadgeProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  titleColor: string;
  subtitle: string;
  style: object;
}

function FloatingBadge({ icon, iconColor, title, titleColor, subtitle, style }: FloatingBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <View style={styles.badgeIcon}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <View>
        <Text style={[styles.badgeTitle, { color: titleColor }]}>{title}</Text>
        <Text style={styles.badgeSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

// Ilustração "Boas-Vindas 2" do Stitch: mockup de celular com snippet e badges flutuantes
export function PracticeHero() {
  return (
    <View style={styles.card}>
      <View style={styles.stage}>
        <FloatingBadge
          icon="book-open"
          iconColor={colors.secondary}
          title="UFPE / UPE"
          titleColor={colors.secondary}
          subtitle="Simulados"
          style={styles.badgeTopLeft}
        />
        <FloatingBadge
          icon="award"
          iconColor={colors.accent}
          title="+150 XP"
          titleColor={colors.primary}
          subtitle="Lógica Pura"
          style={styles.badgeTopRight}
        />

        <View style={styles.phone}>
          <View style={styles.phoneSpeaker} />
          <View style={styles.codeBlock}>
            <View style={styles.codeHeader}>
              <View style={styles.trafficLights}>
                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <View style={[styles.dot, { backgroundColor: '#87d4d2' }]} />
              </View>
              <Text style={styles.fileName}>main.py</Text>
            </View>
            <Text style={styles.code}>
              <Text style={styles.codeKeyword}>def </Text>
              <Text style={styles.codeFn}>aprova_dev</Text>():{'\n'}
              {'  '}skills = [<Text style={styles.codeString}>"lógica"</Text>]{'\n'}
              {'  '}<Text style={styles.codeKeyword}>return</Text> vaga.start()
            </Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
          <View style={styles.phoneHomeBar} />
        </View>

        <View style={styles.practiceTag}>
          <Feather name="code" size={14} color={colors.textOnPrimary} />
          <Text style={styles.practiceTagText}>{'</> Prática'}</Text>
        </View>

        <View style={styles.evolutionCard}>
          <View style={styles.evolutionHeader}>
            <Text style={styles.evolutionLabel}>Evolução</Text>
            <Feather name="trending-up" size={14} color={colors.primary} />
          </View>
          <View style={styles.sparkline}>
            {[10, 16, 12, 20, 18, 26].map((h, i) => (
              <View key={i} style={[styles.sparkBar, { height: h }]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.creamSoft,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  stage: {
    width: '100%',
    maxWidth: 280,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 6,
    paddingRight: 10,
    ...shadow.card,
  },
  badgeTopLeft: {
    top: 16,
    left: 8,
    transform: [{ rotate: '-6deg' }],
  },
  badgeTopRight: {
    top: 32,
    right: 4,
    transform: [{ rotate: '6deg' }],
  },
  badgeIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
  },
  badgeSubtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  phone: {
    width: 156,
    height: 192,
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: 8,
    justifyContent: 'space-between',
    zIndex: 1,
    ...shadow.card,
  },
  phoneSpeaker: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  phoneHomeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  codeBlock: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 8,
    gap: 6,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trafficLights: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fileName: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: '#a3f0ee',
  },
  code: {
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    lineHeight: 13,
    color: colors.light,
  },
  codeKeyword: {
    color: colors.accent,
  },
  codeFn: {
    color: '#a3f0ee',
  },
  codeString: {
    color: '#bce6fe',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: {
    width: '75%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#87d4d2',
  },
  practiceTag: {
    position: 'absolute',
    bottom: -4,
    left: 32,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...shadow.card,
  },
  practiceTagText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.textOnPrimary,
  },
  evolutionCard: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    zIndex: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 8,
    gap: 4,
    ...shadow.card,
  },
  evolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  evolutionLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 26,
  },
  sparkBar: {
    width: 5,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
});
