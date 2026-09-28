import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { fetchStreakOverview, StreakOverview, StreakWeekDay } from '@/shared/api/streakApi';
import { DailyPracticeStatus, fetchTrailMap, TrailMapPhase } from '@/shared/api/trailMapApi';
import { chunky, colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import {
  buildMonthGrid,
  dayCellState,
  MONTH_WEEKDAY_HEADERS,
  monthTitle,
  shiftMonth,
  streakHeadline,
  streakMessage,
  weekDoneCount,
} from '../streakCalendar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Streak'>;

const MASCOT = require('../../../../assets/streak/streak-mascot.jpg');

// Layout da tela "Minha Ofensiva - ConnectaDev" do Stitch (sem Bloqueio de
// Ofensiva e sem bônus de XP, que ainda não existem no produto).
export function StreakPage() {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();

  const [overview, setOverview] = useState<StreakOverview | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingMonth, setIsChangingMonth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nextPhase, setNextPhase] = useState<TrailMapPhase | null>(null);
  const [practice, setPractice] = useState<DailyPracticeStatus | null>(null);

  const load = useCallback(
    async (targetMonth?: string) => {
      if (!token) return;
      try {
        const loaded = await fetchStreakOverview(token, targetMonth);
        setOverview(loaded);
        setMonth(loaded.month.month);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar sua ofensiva agora.',
        );
      } finally {
        setIsLoading(false);
        setIsChangingMonth(false);
      }
    },
    [token],
  );

  // Recarrega no foco: quem volta da prática já vê o dia marcado.
  useFocusEffect(
    useCallback(() => {
      void load();
      if (!token) return;
      // O CTA leva à prática do dia, o jeito mais curto de salvar a ofensiva; sem
      // ela (sem quiz), cai na fase atual e, sem nenhuma das duas, some.
      fetchTrailMap(token)
        .then((map) => {
          const current = map.units
            .flatMap((unit) => unit.phases)
            .find((phase) => phase.id === map.currentPhaseId);
          setNextPhase(current ?? null);
          setPractice(map.dailyPractice.available ? map.dailyPractice : null);
        })
        .catch(() => {
          setNextPhase(null);
          setPractice(null);
        });
    }, [load, token]),
  );

  const changeMonth = (amount: number) => {
    if (!month) return;
    setIsChangingMonth(true);
    void load(shiftMonth(month, amount));
  };

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home', { tab: 'trail' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.flame} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={close}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={8}
        >
          <Feather name="x" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Minha ofensiva</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => load(month ?? undefined)} accessibilityRole="button">
              <Text style={styles.retryText}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : null}

        {overview ? (
          <>
            <Hero overview={overview} />
            <WeekCard week={overview.week} />
            <CalendarCard
              overview={overview}
              isChangingMonth={isChangingMonth}
              onPrevious={() => changeMonth(-1)}
              onNext={() => changeMonth(1)}
            />
            <MilestonesCard overview={overview} />
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {practice ? (
          <Pressable
            onPress={() => navigation.navigate('DailyPractice')}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel={
              practice.rewardAvailable
                ? `Praticar agora, vale até ${practice.maxXp} XP`
                : 'Praticar agora, treino livre'
            }
          >
            <MaterialCommunityIcons name="fire" size={20} color={colors.flameSoft} />
            <Text style={styles.ctaText}>Praticar agora</Text>
            {practice.rewardAvailable ? (
              <View style={styles.ctaXp}>
                <Text style={styles.ctaXpText}>+{practice.maxXp} XP</Text>
              </View>
            ) : null}
          </Pressable>
        ) : nextPhase ? (
          <Pressable
            onPress={() => navigation.navigate('TrailPhase', { lessonId: nextPhase.id })}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Estudar agora: ${nextPhase.title}, vale ${nextPhase.xpReward} XP`}
          >
            <MaterialCommunityIcons name="fire" size={20} color={colors.flameSoft} />
            <Text style={styles.ctaText}>Estudar agora</Text>
            <View style={styles.ctaXp}>
              <Text style={styles.ctaXpText}>+{nextPhase.xpReward} XP</Text>
            </View>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate('Home', { tab: 'trail' })}
          style={styles.secondary}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Voltar para a trilha</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Hero({ overview }: { overview: StreakOverview }) {
  const lit = overview.currentStreak > 0;
  return (
    <View style={styles.card}>
      <View style={styles.heroInner}>
        <View style={[styles.mascotRing, !lit && styles.mascotRingOff]}>
          <Image
            source={MASCOT}
            style={[styles.mascot, !lit && styles.mascotOff]}
            accessibilityIgnoresInvertColors
          />
        </View>
        <View style={styles.tierChip}>
          <Text style={styles.tierText}>{overview.tier.toUpperCase()}</Text>
        </View>
        <Text style={styles.heroTitle}>{streakHeadline(overview.currentStreak)}</Text>
        <Text style={styles.heroMessage}>{streakMessage(overview)}</Text>

        <View style={styles.heroChips}>
          <View style={styles.recordChip}>
            <MaterialCommunityIcons name="trophy" size={14} color={colors.accentInk} />
            <Text style={styles.recordText}>Recorde: {overview.longestStreak} {overview.longestStreak === 1 ? 'dia' : 'dias'}</Text>
          </View>
          {overview.activeToday ? (
            <View style={[styles.statusChip, styles.statusDone]}>
              <Feather name="check" size={13} color={colors.primary} />
              <Text style={[styles.statusText, styles.statusTextDone]}>Estudou hoje</Text>
            </View>
          ) : overview.atRisk ? (
            <View style={[styles.statusChip, styles.statusRisk]}>
              <Feather name="alert-triangle" size={13} color={colors.flame} />
              <Text style={[styles.statusText, styles.statusTextRisk]}>Em risco hoje</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function WeekCard({ week }: { week: StreakWeekDay[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Feather name="calendar" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Semana atual</Text>
        </View>
        <View style={styles.counterChip}>
          <Text style={styles.counterText}>{weekDoneCount(week)}/7 dias</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {week.map((day) => (
          <View key={day.day} style={styles.weekDay}>
            <Text style={[styles.weekLabel, day.isToday && styles.weekLabelToday]}>
              {day.isToday ? 'Hoje' : day.label}
            </Text>
            <WeekBubble day={day} />
          </View>
        ))}
      </View>
    </View>
  );
}

function WeekBubble({ day }: { day: StreakWeekDay }) {
  const description = {
    done: 'estudou',
    pending: 'ainda não estudou',
    missed: 'não estudou',
    upcoming: 'ainda não chegou',
  }[day.status];

  let content: React.ReactNode;
  let style;
  if (day.status === 'done' && day.isToday) {
    style = styles.bubbleToday;
    content = <MaterialCommunityIcons name="fire" size={22} color={colors.flameSoft} />;
  } else if (day.status === 'done') {
    style = styles.bubbleDone;
    content = <Feather name="check" size={18} color={colors.accentFixed} />;
  } else if (day.status === 'pending') {
    style = styles.bubblePending;
    content = <MaterialCommunityIcons name="fire" size={20} color={colors.lockedNode} />;
  } else if (day.status === 'missed') {
    style = styles.bubbleMissed;
    content = <Feather name="minus" size={16} color={colors.textMuted} />;
  } else {
    style = styles.bubbleUpcoming;
    content = <MaterialCommunityIcons name="lock-clock" size={17} color={colors.lockedNode} />;
  }

  return (
    <View style={[styles.bubble, style]} accessibilityLabel={`${day.label}: ${description}`}>
      {content}
    </View>
  );
}

interface CalendarCardProps {
  overview: StreakOverview;
  isChangingMonth: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

function CalendarCard({ overview, isChangingMonth, onPrevious, onNext }: CalendarCardProps) {
  const grid = useMemo(() => buildMonthGrid(overview.month.month), [overview.month.month]);
  const activeDays = useMemo(() => new Set(overview.month.activeDays), [overview.month.activeDays]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Calendário de ofensiva</Text>
          <Text style={styles.monthTitle}>{monthTitle(overview.month.month)}</Text>
        </View>
        <View style={styles.monthNav}>
          {isChangingMonth ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Pressable
            onPress={onPrevious}
            style={styles.monthButton}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            hitSlop={6}
          >
            <Feather name="chevron-left" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={onNext}
            disabled={overview.month.isCurrent}
            style={[styles.monthButton, overview.month.isCurrent && styles.monthButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            accessibilityState={{ disabled: overview.month.isCurrent }}
            hitSlop={6}
          >
            <Feather name="chevron-right" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarRow}>
        {MONTH_WEEKDAY_HEADERS.map((header, index) => (
          <Text key={`${header}-${index}`} style={styles.calendarHeader}>
            {header}
          </Text>
        ))}
      </View>
      {grid.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.calendarRow}>
          {week.map((cell, cellIndex) => {
            if (!cell.day) return <View key={cellIndex} style={styles.calendarCell} />;
            const state = dayCellState(cell.day, activeDays, overview.today);
            return (
              <View key={cell.day} style={styles.calendarCell}>
                <View
                  style={[
                    styles.dayDot,
                    state === 'active' && styles.dayActive,
                    state === 'todayActive' && styles.dayTodayActive,
                    state === 'today' && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      state === 'past' && styles.dayTextPast,
                      state === 'active' && styles.dayTextActive,
                      state === 'todayActive' && styles.dayTextTodayActive,
                      state === 'today' && styles.dayTextToday,
                    ]}
                  >
                    {cell.dayOfMonth}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <LegendItem color={colors.primary} label="Hoje" />
        <LegendItem color={colors.accentFixed} label="Dia estudado" />
        <LegendItem color={colors.lockedSurface} label="Sem estudo" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function MilestonesCard({ overview }: { overview: StreakOverview }) {
  const achieved = overview.milestones.filter((milestone) => milestone.achieved).length;
  const nextIndex = overview.milestones.findIndex((milestone) => !milestone.achieved);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Marcos de ofensiva</Text>
        <Text style={styles.milestoneCount}>
          {achieved}/{overview.milestones.length} conquistados
        </Text>
      </View>

      <View style={styles.milestoneGrid}>
        {overview.milestones.map((milestone, index) => {
          const isNext = index === nextIndex;
          const locked = !milestone.achieved && !isNext;
          return (
            <View
              key={milestone.days}
              style={[
                styles.milestone,
                milestone.isNew && styles.milestoneNew,
                locked && styles.milestoneLocked,
              ]}
            >
              <View
                style={[
                  styles.milestoneIcon,
                  milestone.achieved && styles.milestoneIconDone,
                  milestone.isNew && styles.milestoneIconNew,
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    milestone.isNew
                      ? 'party-popper'
                      : milestone.achieved
                        ? 'check-decagram'
                        : locked
                          ? 'lock'
                          : 'fire'
                  }
                  size={20}
                  color={
                    milestone.isNew
                      ? colors.accentInk
                      : milestone.achieved
                        ? colors.primary
                        : locked
                          ? colors.textMuted
                          : colors.flame
                  }
                />
              </View>
              <View style={styles.milestoneTexts}>
                <Text style={styles.milestoneDays}>{milestone.days} DIAS</Text>
                <Text style={[styles.milestoneTitle, locked && styles.milestoneTitleLocked]} numberOfLines={1}>
                  {milestone.title}
                </Text>
                {milestone.isNew ? (
                  <Text style={styles.milestoneNewText}>Novo! 🎉</Text>
                ) : milestone.achieved ? (
                  <Text style={styles.milestoneDoneText}>Conquistado ✓</Text>
                ) : isNext ? (
                  <>
                    <View style={styles.milestoneTrack}>
                      <View
                        style={[
                          styles.milestoneFill,
                          { width: `${Math.round((milestone.progress / milestone.days) * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.milestoneProgress}>
                      {milestone.progress} / {milestone.days}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.milestoneLockedText}>Bloqueado</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
    paddingTop: 4,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
  },
  headerTitle: { fontFamily: fonts.sans.extraBold, fontSize: 17, color: colors.textPrimary },
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 170, gap: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF3F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 13, color: colors.danger },
  retryText: { fontFamily: fonts.sans.bold, fontSize: 13, color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 16,
    ...shadow.card,
  },
  heroInner: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  mascotRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    backgroundColor: colors.flameSoft,
    borderWidth: 3,
    borderColor: colors.flame,
  },
  mascotRingOff: { borderColor: colors.lockedNode, backgroundColor: colors.lockedSurface },
  mascot: { width: '100%', height: '100%', borderRadius: 60 },
  mascotOff: { opacity: 0.45 },
  tierChip: {
    marginTop: 6,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tierText: { fontFamily: fonts.mono.medium, fontSize: 11, letterSpacing: 0.8, color: colors.accentInk },
  heroTitle: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroMessage: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 290,
  },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 },
  recordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recordText: { fontFamily: fonts.mono.medium, fontSize: 12, color: colors.accentInk },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDone: { backgroundColor: `${colors.primaryTint}66` },
  statusRisk: { backgroundColor: colors.flameSoft },
  statusText: { fontFamily: fonts.mono.medium, fontSize: 12 },
  statusTextDone: { color: colors.primary },
  statusTextRisk: { color: colors.flame },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.sans.extraBold, fontSize: 17, color: colors.textPrimary },
  counterChip: {
    backgroundColor: `${colors.primaryTint}66`,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.primary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 8, flex: 1 },
  weekLabel: { fontFamily: fonts.sans.semiBold, fontSize: 11, color: colors.textMuted },
  weekLabelToday: { fontFamily: fonts.sans.extraBold, color: colors.primary },
  bubble: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bubbleDone: { backgroundColor: colors.accentInk },
  bubbleToday: {
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDeepest,
  },
  bubblePending: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  bubbleMissed: { backgroundColor: colors.lockedSurface },
  bubbleUpcoming: { backgroundColor: colors.creamSoft },
  monthTitle: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.creamSoft,
  },
  monthButtonDisabled: { opacity: 0.35 },
  calendarRow: { flexDirection: 'row' },
  calendarHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.textMuted,
    paddingBottom: 6,
  },
  calendarCell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: colors.accentFixed },
  dayTodayActive: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 2, borderColor: colors.primary },
  dayText: { fontFamily: fonts.sans.semiBold, fontSize: 13, color: colors.textPrimary },
  dayTextPast: { color: colors.lockedNode },
  dayTextActive: { fontFamily: fonts.sans.extraBold, color: colors.accentInk },
  dayTextTodayActive: { fontFamily: fonts.sans.extraBold, color: colors.textOnPrimary },
  dayTextToday: { fontFamily: fonts.sans.extraBold, color: colors.primary },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    paddingVertical: 8,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.sans.medium, fontSize: 11, color: colors.textMuted },
  milestoneCount: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.textMuted },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  milestone: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: 10,
    backgroundColor: colors.surface,
  },
  milestoneNew: { backgroundColor: colors.accentFixed, borderColor: colors.accentDeep },
  milestoneLocked: { backgroundColor: colors.canvas, borderColor: colors.creamSoft },
  milestoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lockedSurface,
  },
  milestoneIconDone: { backgroundColor: `${colors.primaryTint}66` },
  milestoneIconNew: { backgroundColor: colors.surface },
  milestoneTexts: { flex: 1, gap: 3 },
  milestoneDays: { fontFamily: fonts.mono.medium, fontSize: 9, letterSpacing: 0.6, color: colors.textMuted },
  milestoneTitle: { fontFamily: fonts.sans.extraBold, fontSize: 14, color: colors.textPrimary },
  milestoneTitleLocked: { color: colors.textMuted },
  milestoneDoneText: { fontFamily: fonts.sans.semiBold, fontSize: 11, color: colors.primary },
  milestoneNewText: { fontFamily: fonts.sans.extraBold, fontSize: 11, color: colors.accentInk },
  milestoneLockedText: { fontFamily: fonts.sans.medium, fontSize: 11, color: colors.textMuted },
  milestoneTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.flameSoft,
    overflow: 'hidden',
  },
  milestoneFill: { height: '100%', minWidth: 4, borderRadius: radius.pill, backgroundColor: colors.flame },
  milestoneProgress: { fontFamily: fonts.mono.medium, fontSize: 10, color: colors.textMuted },
  footer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light,
    ...shadow.card,
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
    gap: 8,
  },
  ctaPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
  ctaXp: {
    backgroundColor: colors.primaryTint,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ctaXpText: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.primaryDeepest },
  secondary: { height: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.primary },
});
