import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { fetchCourseRecommendations } from '@/shared/api/coursesApi';
import { Logo } from '@/shared/ui/Logo';
import { Button } from '@/shared/ui/Button/Button';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { buildQuizResultSummary, pickFirstCourse, FirstCourseState } from '../quizResultState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizResult'>;
type QuizResultRouteProp = RouteProp<RootStackParamList, 'QuizResult'>;

const MAX_VISIBLE_TECHS = 5;
const MAX_SECONDARY_AREAS = 2;
const JUSTIFICATION_COLLAPSE_THRESHOLD = 140;

export function QuizResultPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizResultRouteProp>();
  const { token } = useAuth();
  const summary = useMemo(() => buildQuizResultSummary(route.params.result), [route.params.result]);
  const [firstCourse, setFirstCourse] = useState<FirstCourseState>({ status: 'loading' });
  const [showAllTechs, setShowAllTechs] = useState(false);
  const [showFullJustification, setShowFullJustification] = useState(false);

  useEffect(() => {
    if (!token) {
      setFirstCourse({ status: 'error' });
      return;
    }

    let isActive = true;
    fetchCourseRecommendations(token)
      .then((response) => {
        if (isActive) setFirstCourse(pickFirstCourse(response.courses));
      })
      .catch(() => {
        if (isActive) setFirstCourse({ status: 'error' });
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const goHome = () => navigation.navigate('Home', { tab: 'trail' });

  const visibleTechs = showAllTechs
    ? summary.tecnologias
    : summary.tecnologias.slice(0, MAX_VISIBLE_TECHS);
  const hiddenTechCount = Math.max(0, summary.tecnologias.length - MAX_VISIBLE_TECHS);
  const visibleSecondaryAreas = summary.areasSecundarias.slice(0, MAX_SECONDARY_AREAS);
  const canExpandJustification = summary.justificativa.length > JUSTIFICATION_COLLAPSE_THRESHOLD;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={goHome}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Fechar resultado"
          >
            <Feather name="x" size={20} color={colors.textPrimary} />
          </Pressable>
          <Logo size={26} showWordmark={false} />
          <View>
            <Text style={styles.headerEyebrow}>CONNECTADEV</Text>
            <Text style={styles.headerTitle}>Resultado do Quiz</Text>
          </View>
        </View>
        <View style={styles.completedPill}>
          <Feather name="award" size={13} color={colors.accentInk} />
          <Text style={styles.completedPillText}>100%</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressValue} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={[styles.glow, styles.glowTopRight]} />
          <View style={[styles.glow, styles.glowBottomLeft]} />

          <View style={styles.heroTop}>
            <View style={styles.completedBadge}>
              <Feather name="award" size={14} color={colors.accentInk} />
              <Text style={styles.completedBadgeText}>SEU MATCH PRINCIPAL</Text>
            </View>
            <Text style={styles.areaHeadline}>{summary.areaPrincipal}</Text>
            <View style={styles.demandPill}>
              <Feather name="map-pin" size={13} color={colors.primary} />
              <Text style={styles.demandText}>Em alta no Porto Digital & Região</Text>
            </View>
          </View>

          {summary.tecnologias.length > 0 && (
            <View style={styles.cardSection}>
              <Text style={styles.sectionLabel}>TECNOLOGIAS PARA COMEÇAR</Text>
              <View style={styles.chips}>
                {visibleTechs.map((technology) => (
                  <View key={technology} style={styles.techChip}>
                    <Text style={styles.techChipText}>{technology}</Text>
                  </View>
                ))}
                {hiddenTechCount > 0 && (
                  <Pressable
                    onPress={() => setShowAllTechs((previous) => !previous)}
                    style={styles.moreChip}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showAllTechs
                        ? 'Mostrar menos tecnologias'
                        : `Mostrar mais ${hiddenTechCount} tecnologias`
                    }
                  >
                    <Text style={styles.moreChipText}>
                      {showAllTechs ? 'Menos' : `+${hiddenTechCount}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {visibleSecondaryAreas.length > 0 && (
            <View style={styles.cardSection}>
              <Text style={styles.sectionLabel}>TAMBÉM COMBINA</Text>
              <View style={styles.chips}>
                {visibleSecondaryAreas.map((area) => (
                  <View key={area} style={styles.secondaryChip}>
                    <Text style={styles.secondaryChipText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {summary.justificativa.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Por que essa área?</Text>
            </View>
            <Text
              style={styles.bodyText}
              numberOfLines={showFullJustification ? undefined : 3}
            >
              {summary.justificativa}
            </Text>
            {canExpandJustification && (
              <Pressable
                onPress={() => setShowFullJustification((previous) => !previous)}
                hitSlop={8}
                accessibilityRole="button"
                style={styles.expandLink}
              >
                <Text style={styles.expandLinkText}>
                  {showFullJustification ? 'Mostrar menos' : 'Ler mais'}
                </Text>
                <Feather
                  name={showFullJustification ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={colors.primary}
                />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="play-circle" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Seu primeiro curso</Text>
          </View>
          <FirstCourseCard state={firstCourse} onSeeAll={() => navigation.navigate('Courses')} />
        </View>

        <View style={styles.actions}>
          <Button
            title="Ir para minha trilha"
            rightIcon="arrow-right"
            onPress={goHome}
          />
          <Button
            title="Ver cursos recomendados"
            variant="soft"
            onPress={() => navigation.navigate('Courses')}
          />
          <Pressable
            onPress={() => navigation.replace('Quiz')}
            style={styles.link}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.linkText}>Refazer Quiz Vocacional</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FirstCourseCardProps {
  state: FirstCourseState;
  onSeeAll: () => void;
}

function FirstCourseCard({ state, onSeeAll }: FirstCourseCardProps) {
  if (state.status === 'loading') {
    return <ActivityIndicator color={colors.primary} style={styles.courseLoading} />;
  }

  if (state.status !== 'ready') {
    return (
      <View style={styles.courseFallback}>
        <Text style={styles.bodyText}>
          {state.status === 'empty'
            ? 'Ainda não temos um curso para essa área. Explore outras recomendações.'
            : 'Não foi possível carregar o curso agora.'}
        </Text>
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.courseFallbackLink}>Ver cursos →</Text>
        </Pressable>
      </View>
    );
  }

  const { course } = state;
  const openCourse = () => {
    Linking.openURL(course.external_url).catch(() => undefined);
  };

  return (
    <Pressable
      onPress={openCourse}
      style={styles.course}
      accessibilityRole="button"
      accessibilityLabel={`Abrir curso ${course.title}`}
    >
      <View style={styles.courseBanner}>
        <Image source={{ uri: course.thumbnail }} style={styles.courseThumbnail} resizeMode="cover" />
        <View style={styles.courseProvider}>
          <Text style={styles.courseProviderText}>{course.provider}</Text>
        </View>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={styles.courseFooterRow}>
          <View style={styles.metaChip}>
            <Feather name="bar-chart-2" size={12} color={colors.secondary} />
            <Text style={styles.metaChipText}>{course.level}</Text>
          </View>
          <View style={styles.courseCta}>
            <Text style={styles.courseCtaText}>Começar grátis</Text>
            <Feather name="arrow-right" size={15} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.creamSoft,
  },
  headerEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  headerTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completedPillText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.accentInk,
  },
  progressTrack: {
    height: 5,
    marginHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressValue: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    ...shadow.card,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  glowTopRight: {
    width: 150,
    height: 150,
    top: -54,
    right: -54,
    backgroundColor: '#bce6fe',
  },
  glowBottomLeft: {
    width: 130,
    height: 130,
    bottom: -54,
    left: -54,
    backgroundColor: '#a3f0ee',
  },
  heroTop: {
    gap: 8,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.9,
    color: colors.accentInk,
  },
  areaHeadline: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: colors.primary,
  },
  demandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demandText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.secondary,
  },
  cardSection: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.creamSoft,
  },
  sectionLabel: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.9,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  techChip: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  techChipText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.accent,
  },
  moreChip: {
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  moreChipText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.primary,
  },
  secondaryChip: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  secondaryChipText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    color: colors.secondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 16,
    gap: 10,
    ...shadow.card,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  bodyText: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  expandLink: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandLinkText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  courseLoading: {
    paddingVertical: 20,
  },
  courseFallback: {
    gap: 8,
  },
  courseFallbackLink: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  course: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  courseBanner: {
    height: 132,
    backgroundColor: colors.creamSoft,
  },
  courseThumbnail: {
    width: '100%',
    height: '100%',
  },
  courseProvider: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(3, 22, 52, 0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  courseProviderText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.surface,
  },
  courseBody: {
    padding: 14,
    gap: 10,
  },
  courseTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  courseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  metaChipText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 11,
    color: colors.secondary,
  },
  courseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  courseCtaText: {
    fontFamily: fonts.sans.bold,
    fontSize: 13,
    color: colors.primary,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  link: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
