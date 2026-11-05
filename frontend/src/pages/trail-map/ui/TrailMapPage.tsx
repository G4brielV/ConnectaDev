import React, { useCallback, useRef, useState } from 'react';
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { useGamification } from '@/entities/gamification';
import { fetchGamificationSummary, GamificationSummary } from '@/shared/api/gamificationApi';
import {
  DailyPracticeStatus,
  fetchTrailMap,
  TrailMap,
  TrailMapPhase,
} from '@/shared/api/trailMapApi';
import { colors, fonts, radius, shadow, chunky } from '@/shared/config/theme';
import { Logo } from '@/shared/ui/Logo';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { PhasePath } from './PhasePath';
import { UnitBanner, UnitHero } from './UnitHeader';
import { focusedUnitId, isUnitExpandedByDefault, unitState } from '../trailMapLayout';

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
  // Só guarda o que a pessoa mudou; o padrão vem do estado da unidade.
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<ScrollView>(null);
  const didAutoScroll = useRef(false);

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
    setErrorMessage(null);
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

  const units = map?.units ?? [];
  const focusedId = focusedUnitId(units, map?.currentPhaseId ?? null);
  const focusedIndex = units.findIndex((unit) => unit.id === focusedId);
  const currentPhase = units
    .flatMap((unit) => unit.phases)
    .find((phase) => phase.id === map?.currentPhaseId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Logo size={34} showWordmark={false} />
          <View style={styles.headerTexts}>
            <Text style={styles.headerEyebrow}>CONNECTADEV</Text>
            <Text style={styles.headerTitle}>Sua trilha</Text>
          </View>
        </View>
        <View style={styles.headerStats}>
          <Pressable
            onPress={() => navigation.navigate('Streak')}
            style={({ pressed }) => [styles.statPill, styles.streakPill, pressed && styles.statPillPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Ver sua ofensiva: ${summary?.currentStreak ?? 0} dias`}
            hitSlop={6}
          >
            <MaterialCommunityIcons name="fire" size={15} color={colors.flame} />
            <Text style={[styles.statText, styles.streakText]}>{summary?.currentStreak ?? 0}</Text>
          </Pressable>
          <View style={[styles.statPill, styles.xpPill]}>
            <MaterialCommunityIcons name="lightning-bolt" size={15} color={colors.primary} />
            <Text style={[styles.statText, styles.xpText]}>{totalXp} XP</Text>
          </View>
        </View>
      </View>

      {map?.trail ? (
        <View style={styles.overall}>
          <View style={styles.overallRow}>
            <Text style={styles.overallArea} numberOfLines={1}>
              {map.area}
            </Text>
            <Text style={styles.overallCount}>
              {map.completedPhases}/{map.totalPhases} fases
            </Text>
          </View>
          <View
            style={styles.overallTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Progresso na trilha"
            accessibilityValue={{ min: 0, max: map.totalPhases, now: map.completedPhases }}
          >
            <View
              style={[
                styles.overallFill,
                { width: `${Math.round((map.completedPhases / Math.max(map.totalPhases, 1)) * 100)}%` },
              ]}
            />
          </View>
          {/* Fora do ScrollView: o mapa abre rolado até a unidade atual e o esconderia. */}
          {map.dailyPractice.available && units.length > 0 ? (
            <DailyPracticeCard
              status={map.dailyPractice}
              onPress={() => navigation.navigate('DailyPractice')}
            />
          ) : null}
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, currentPhase && styles.scrollWithCta]}
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
        ) : units.length === 0 ? (
          <EmptyState
            icon="map"
            title="Trilha em construção"
            description={`Ainda não há fases publicadas para ${map.area}. Enquanto isso, explore os cursos recomendados.`}
            actionLabel="Ver cursos"
            onPress={() => navigation.navigate('Courses')}
          />
        ) : (
          units.map((unit, unitIndex) => {
            const isFocused = unit.id === focusedId;
            const state = unitState(unit);
            const expanded =
              isFocused ||
              (expandedOverrides[unit.id] ?? isUnitExpandedByDefault(unitIndex, focusedIndex));

            return (
              <View
                key={unit.id}
                style={styles.unitBlock}
                onLayout={(event) => {
                  // Abre o mapa já na unidade em andamento, não no topo da trilha.
                  if (!isFocused || didAutoScroll.current) return;
                  const { y } = event.nativeEvent.layout;
                  if (y > 0) scrollRef.current?.scrollTo({ y: y - 8, animated: false });
                  didAutoScroll.current = true;
                }}
              >
                {isFocused ? (
                  <UnitHero unit={unit} />
                ) : (
                  <UnitBanner
                    unit={unit}
                    state={state}
                    expanded={expanded}
                    onToggle={() =>
                      setExpandedOverrides((previous) => ({ ...previous, [unit.id]: !expanded }))
                    }
                  />
                )}
                {expanded ? <PhasePath phases={unit.phases} onPress={openPhase} /> : null}
              </View>
            );
          })
        )}

        {map?.finished ? (
          <View style={styles.finishedCard}>
            <View style={styles.finishedIcon}>
              <MaterialCommunityIcons name="trophy" size={28} color={colors.accentInk} />
            </View>
            <Text style={styles.finishedTitle}>Trilha concluída!</Text>
            <Text style={styles.finishedText}>
              Você venceu todas as fases obrigatórias de {map.area}. Os baús bônus que faltarem
              continuam abertos para mais XP.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {currentPhase ? (
        <View style={styles.ctaBar}>
          <Text style={styles.ctaEyebrow} numberOfLines={1}>
            PRÓXIMA FASE · {currentPhase.title.toUpperCase()}
          </Text>
          <Pressable
            onPress={() => openPhase(currentPhase)}
            accessibilityRole="button"
            accessibilityLabel={`Continuar fase ${currentPhase.title}, vale ${currentPhase.xpReward} XP`}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          >
            <Text style={styles.ctaText}>Continuar fase</Text>
            <View style={styles.ctaXp}>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color={colors.primaryDeepest} />
              <Text style={styles.ctaXpText}>+{currentPhase.xpReward} XP</Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

interface DailyPracticeCardProps {
  status: DailyPracticeStatus;
  onPress: () => void;
}

/** Atalho do hábito diário: revisa a fase atual e mantém a ofensiva. */
function DailyPracticeCard({ status, onPress }: DailyPracticeCardProps) {
  const done = !status.rewardAvailable;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.practiceCard,
        done && styles.practiceCardDone,
        pressed && styles.practiceCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        done
          ? 'Prática do dia feita. Treinar mais'
          : `Fazer a prática do dia, vale até ${status.maxXp} XP`
      }
    >
      <View style={[styles.practiceIcon, done && styles.practiceIconDone]}>
        <MaterialCommunityIcons
          name={done ? 'check-bold' : 'fire'}
          size={19}
          color={done ? colors.primary : colors.flame}
        />
      </View>
      <View style={styles.practiceTexts}>
        <Text style={styles.practiceTitle} numberOfLines={1}>
          Prática do dia
        </Text>
        <Text style={styles.practiceSubtitle} numberOfLines={1}>
          {done ? 'Feita hoje · treine quanto quiser' : 'Revise sua fase e mantenha a ofensiva'}
        </Text>
      </View>
      {done ? (
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      ) : (
        <View style={styles.practiceXp}>
          <MaterialCommunityIcons name="lightning-bolt" size={13} color={colors.accentInk} />
          <Text style={styles.practiceXpText}>+{status.maxXp} XP</Text>
        </View>
      )}
    </Pressable>
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: colors.canvas,
  },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTexts: { flex: 1 },
  headerEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  headerTitle: { fontFamily: fonts.sans.extraBold, fontSize: 20, color: colors.textPrimary },
  overall: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamSoft,
  },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overallArea: { flex: 1, fontFamily: fonts.sans.semiBold, fontSize: 13, color: colors.secondary },
  overallCount: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.textMuted },
  overallTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  overallFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  headerStats: { flexDirection: 'row', gap: 6 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  streakPill: { backgroundColor: colors.flameSoft },
  statPillPressed: { opacity: 0.7 },
  xpPill: { backgroundColor: `${colors.primaryTint}66` },
  statText: { fontFamily: fonts.mono.medium, fontSize: 12 },
  streakText: { color: colors.flame },
  xpText: { color: colors.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  scrollWithCta: { paddingBottom: 150 },
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
  unitBlock: { marginBottom: 20 },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.flame,
    borderBottomWidth: 3,
    borderRadius: 16,
    padding: 10,
    marginTop: 4,
  },
  practiceCardDone: { borderColor: colors.light },
  practiceCardPressed: { borderBottomWidth: 1, transform: [{ translateY: 2 }] },
  practiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.flameSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceIconDone: { backgroundColor: colors.creamSoft },
  practiceTexts: { flex: 1, gap: 1 },
  practiceTitle: { fontFamily: fonts.sans.extraBold, fontSize: 15, color: colors.textPrimary },
  practiceSubtitle: { fontFamily: fonts.sans.regular, fontSize: 12, color: colors.textMuted },
  practiceXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  practiceXpText: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.accentInk },
  finishedCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentFixed,
    borderRadius: 20,
    padding: 20,
    ...shadow.card,
  },
  finishedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedTitle: { fontFamily: fonts.sans.extraBold, fontSize: 18, color: colors.textPrimary },
  finishedText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
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
    left: 12,
    right: 12,
    bottom: 12,
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light,
    ...shadow.card,
  },
  ctaEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
  ctaXp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryTint,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ctaXpText: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.primaryDeepest },
});
