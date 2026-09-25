import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { useGamification } from '@/entities/gamification';
import { fetchGamificationSummary, GamificationSummary } from '@/shared/api/gamificationApi';
import { fetchTrailMap, TrailMap, TrailMapPhase } from '@/shared/api/trailMapApi';
import { colors, fonts, radius, shadow, chunky } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { PhaseNode } from './PhaseNode';
import { phaseOffset } from '../trailMapLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Layout da tela "Trilha de Aprendizado - ConnectaDev" do Stitch
export function TrailMapPage() {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();
  const { totalXp, refresh } = useGamification();

  const [map, setMap] = useState<TrailMap | null>(null);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      if (mode === 'refresh') setIsRefreshing(true);

      try {
        const [trailMap] = await Promise.all([fetchTrailMap(token), refresh(true)]);
        setMap(trailMap);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar sua trilha agora.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }

      fetchGamificationSummary(token)
        .then(setSummary)
        .catch(() => {
          // A ofensiva é enfeite do cabeçalho: falhar aqui não tira o mapa do ar.
        });
    },
    [refresh, token],
  );

  // Recarrega ao voltar de uma fase, para o cadeado e as estrelas acompanharem.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openPhase = (phase: TrailMapPhase) => {
    if (!phase.unlocked) {
      setErrorMessage('Conclua a fase anterior para liberar esta.');
      return;
    }
    navigation.navigate('TrailPhase', { lessonId: phase.id });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentPhase = map?.units
    .flatMap((unit) => unit.phases)
    .find((phase) => phase.id === map?.currentPhaseId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>ConnectaDev</Text>
          <Text style={styles.headerTitle}>Trilha</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statPill}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={styles.statText}>{totalXp} XP</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.statText}>{summary?.currentStreak ?? 0} dias</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load('refresh')}
            tintColor={colors.primary}
          />
        }
      >
        {errorMessage ? (
          <View style={styles.banner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!map?.hasDiagnosis ? (
          <EmptyState
            icon="compass"
            title="Descubra sua área primeiro"
            description="O Quiz Vocacional define qual trilha combina com você."
            actionLabel="Fazer o Quiz Vocacional"
            onPress={() => navigation.navigate('QuizIntro')}
          />
        ) : map.units.length === 0 ? (
          <EmptyState
            icon="map"
            title="Trilha em construção"
            description={`Ainda não há fases publicadas para ${map.area}. Enquanto isso, explore os cursos recomendados.`}
            actionLabel="Ver cursos"
            onPress={() => navigation.navigate('Courses')}
          />
        ) : (
          map.units.map((unit) => (
            <View key={unit.id} style={styles.unitBlock}>
              <View style={styles.unitCard}>
                <View style={styles.unitCardTop}>
                  <Text style={styles.unitEyebrow}>UNIDADE {unit.sequence}</Text>
                  <Text style={styles.unitCounter}>
                    {unit.completedPhases}/{unit.totalPhases} Fases
                  </Text>
                </View>
                <Text style={styles.unitTitle}>{unit.title}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${unit.progressPercentage}%` }]} />
                </View>
                <Text style={styles.unitPercentage}>{unit.progressPercentage}%</Text>
              </View>

              <View style={styles.path}>
                {unit.phases.map((phase, index) => (
                  <View
                    key={phase.id}
                    style={[styles.pathRow, { transform: [{ translateX: phaseOffset(index) }] }]}
                  >
                    <PhaseNode phase={phase} onPress={openPhase} />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {map?.finished ? (
          <View style={styles.finishedCard}>
            <Feather name="flag" size={20} color={colors.accent} />
            <Text style={styles.finishedTitle}>Trilha concluída!</Text>
            <Text style={styles.finishedText}>
              Você percorreu as {map.totalPhases} fases de {map.area}.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {currentPhase ? (
        <View style={styles.ctaBar}>
          <Pressable
            onPress={() => openPhase(currentPhase)}
            accessibilityRole="button"
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Continuar fase</Text>
            <View style={styles.ctaXp}>
              <Feather name="zap" size={13} color={colors.textOnPrimary} />
              <Text style={styles.ctaXpText}>+{currentPhase.xpReward} XP</Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}

function EmptyState({ icon, title, description, actionLabel, onPress }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      <Pressable onPress={onPress} style={styles.emptyAction} accessibilityRole="button">
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  brand: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  headerTitle: { fontFamily: fonts.sans.extraBold, fontSize: 22, color: colors.textPrimary },
  headerStats: { flexDirection: 'row', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statText: { fontFamily: fonts.sans.bold, fontSize: 12, color: colors.textPrimary },
  streakEmoji: { fontSize: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF3F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 13, color: colors.danger },
  unitBlock: { marginBottom: 8 },
  unitCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
    ...shadow.card,
  },
  unitCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
  },
  unitCounter: { fontFamily: fonts.sans.semiBold, fontSize: 12, color: colors.textMuted },
  unitTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  unitPercentage: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  path: { alignItems: 'center', paddingVertical: 20, gap: 18 },
  pathRow: { alignItems: 'center' },
  finishedCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.lg,
    padding: 20,
    marginTop: 8,
  },
  finishedTitle: { fontFamily: fonts.sans.bold, fontSize: 16, color: colors.textPrimary },
  finishedText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.creamSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: fonts.sans.bold, fontSize: 17, color: colors.textPrimary },
  emptyText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyAction: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionText: { fontFamily: fonts.sans.semiBold, fontSize: 14, color: colors.textOnPrimary },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  cta: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
  ctaXp: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ctaXpText: { fontFamily: fonts.mono.medium, fontSize: 12, color: colors.textOnPrimary },
});
