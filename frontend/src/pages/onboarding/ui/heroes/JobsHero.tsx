import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';

interface JobCardProps {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
}

function JobCard({ icon, iconBg, iconColor, title, subtitle, trailing }: JobCardProps) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobInfo}>
        <View style={[styles.jobIcon, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.jobTexts}>
          <Text style={styles.jobTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.jobSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>
      {trailing}
    </View>
  );
}

// Ilustração "Boas-Vindas 3" do Stitch: radar de vagas do Porto Digital
export function JobsHero() {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.regionPill}>
          <View style={styles.liveDot} />
          <Text style={styles.regionText}>PORTO DIGITAL • RECIFE</Text>
        </View>
        <View style={styles.countPill}>
          <Feather name="zap" size={14} color={colors.dark} />
          <Text style={styles.countText}>+1.2k vagas</Text>
        </View>
      </View>

      <View style={styles.jobList}>
        <JobCard
          icon="terminal"
          iconBg={colors.creamSoft}
          iconColor={colors.secondary}
          title="Dev Júnior React / Node"
          subtitle="Cais do Apolo • Híbrido"
          trailing={
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>NOVO</Text>
            </View>
          }
        />
        <JobCard
          icon="package"
          iconBg={colors.accentSoft}
          iconColor="#6c582d"
          title="Estágio em QA & Dados"
          subtitle="Bairro do Recife • Remoto"
          trailing={<Feather name="check-circle" size={18} color={colors.primary} />}
        />
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.avatars}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Feather name="code" size={14} color={colors.textOnPrimary} />
          </View>
          <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: colors.secondary }]}>
            <Feather name="share-2" size={14} color={colors.textOnPrimary} />
          </View>
          <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: colors.accent }]}>
            <Feather name="navigation" size={14} color={colors.dark} />
          </View>
        </View>
        <View style={styles.matchPill}>
          <Feather name="check-circle" size={14} color={colors.primary} />
          <Text style={styles.matchText}>Match Direto</Text>
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
    gap: 16,
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadow.card,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  regionText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    color: colors.primary,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.dark,
  },
  jobList: {
    gap: 8,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    ...shadow.card,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTexts: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  jobSubtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  newTag: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newTagText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    color: colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.creamSoft,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  matchText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.secondary,
  },
});
