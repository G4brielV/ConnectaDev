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

// Layout da tela "Quiz Vocacional: Diagnóstico & Perfil" do Stitch, com dados reais da análise
export function QuizResultPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<QuizResultRouteProp>();
  const { token } = useAuth();
  const summary = useMemo(() => buildQuizResultSummary(route.params.result), [route.params.result]);
  const [firstCourse, setFirstCourse] = useState<FirstCourseState>({ status: 'loading' });

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

  const goHome = () => navigation.navigate('Home');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={goHome}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Fechar resultado"
          >
            <Feather name="x" size={22} color={colors.textPrimary} />
          </Pressable>
          <Logo size={28} showWordmark={false} />
          <Text style={styles.headerBrand}>CONNECTADEV</Text>
        </View>
        <Text style={styles.headerTitle}>Resultado{'\n'}do Quiz</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={styles.progressValue} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.completedBadge}>
            <Feather name="award" size={16} color={colors.accent} />
            <Text style={styles.completedBadgeText}>QUIZ CONCLUÍDO</Text>
          </View>
          <Text style={styles.title}>
            Seu perfil tem match com{' '}
            <Text style={styles.titleHighlight}>{summary.areaPrincipal}</Text>!
          </Text>
          <Text style={styles.subtitle}>
            Analisamos suas respostas e já temos os próximos passos para você.
          </Text>
        </View>

        <View style={styles.areaCard}>
          <View style={[styles.glow, styles.glowTopRight]} />
          <View style={[styles.glow, styles.glowBottomLeft]} />
          <Text style={styles.cardLabel}>ÁREA RECOMENDADA</Text>
          <Text style={styles.areaTitle}>{summary.areaPrincipal}</Text>
          {summary.areasSecundarias.length > 0 && (
            <Text style={styles.areaSecondary}>
              Também combina com {summary.areasSecundarias.join(' • ')}
            </Text>
          )}

          {summary.tecnologias.length > 0 && (
            <View style={styles.techBlock}>
              <Text style={styles.cardLabel}>TECNOLOGIAS PARA COMEÇAR</Text>
              <View style={styles.chips}>
                {summary.tecnologias.map((technology) => (
                  <View key={technology} style={styles.techChip}>
                    <Text style={styles.techChipText}>{technology}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.demandRow}>
            <Feather name="map-pin" size={18} color={colors.primary} />
            <Text style={styles.demandText}>
              Alinhada à demanda do <Text style={styles.demandStrong}>Porto Digital & Região</Text>.
            </Text>
          </View>
        </View>

        {summary.justificativa.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Pontos fortes identificados</Text>
            </View>
            <Text style={styles.bodyText}>{summary.justificativa}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="play-circle" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Seu primeiro curso</Text>
          </View>
          <FirstCourseCard state={firstCourse} onSeeAll={() => navigation.navigate('Courses')} />
        </View>

        <View style={styles.actions}>
          <Button
            title="Ver todos os cursos recomendados"
            rightIcon="arrow-right"
            onPress={() => navigation.navigate('Courses')}
          />
          <Button title="Ir para a Home" variant="soft" onPress={goHome} />
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
            ? 'Ainda não temos um curso para essa área. Veja as outras recomendações.'
            : 'Não foi possível carregar a recomendação agora.'}
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
        {course.tags.length > 0 && (
          <Text style={styles.courseCategory}>{course.tags.slice(0, 2).join(' & ').toUpperCase()}</Text>
        )}
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.chips}>
          <View style={styles.metaChip}>
            <Feather name="bar-chart-2" size={12} color={colors.secondary} />
            <Text style={styles.metaChipText}>{course.level}</Text>
          </View>
          <View style={styles.metaChip}>
            <Feather name="book-open" size={12} color={colors.secondary} />
            <Text style={styles.metaChipText}>Curso gratuito</Text>
          </View>
        </View>
        <View style={styles.courseCta}>
          <Text style={styles.courseCtaText}>Começar curso grátis</Text>
          <Feather name="arrow-right" size={16} color={colors.primary} />
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
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.primary,
  },
  headerTitle: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'right',
    paddingRight: 8,
  },
  progressTrack: {
    height: 6,
    marginHorizontal: 16,
    borderRadius: 3,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressValue: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: '#6c582d',
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  areaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 20,
    gap: 12,
    overflow: 'hidden',
    ...shadow.card,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  glowTopRight: {
    width: 160,
    height: 160,
    top: -48,
    right: -48,
    backgroundColor: '#bce6fe',
  },
  glowBottomLeft: {
    width: 144,
    height: 144,
    bottom: -48,
    left: -48,
    backgroundColor: '#a3f0ee',
  },
  cardLabel: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.primary,
  },
  areaTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
    marginTop: -6,
  },
  areaSecondary: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.secondary,
    marginTop: -6,
  },
  techBlock: {
    gap: 8,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techChip: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  techChipText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.accent,
  },
  demandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    padding: 10,
  },
  demandText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  demandStrong: {
    fontFamily: fonts.sans.semiBold,
    color: colors.textPrimary,
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
    fontSize: 16,
    color: colors.textPrimary,
  },
  bodyText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  courseLoading: {
    paddingVertical: 24,
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
    height: 140,
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
    gap: 8,
  },
  courseCategory: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
  },
  courseTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
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
    gap: 6,
    marginTop: 4,
  },
  courseCtaText: {
    fontFamily: fonts.sans.bold,
    fontSize: 14,
    color: colors.primary,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  link: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
