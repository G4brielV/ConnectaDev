import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CourseRecommendation } from '@/shared/api/coursesApi';
import { chunky, colors, fonts, radius, shadow } from '@/shared/config/theme';
import { courseCategory, levelTone } from '../lib/courseCardView';

interface CourseCardProps {
  course: CourseRecommendation;
  /** O curso mais indicado ganha o cabeçalho em degradê do Stitch. */
  featured: boolean;
  /** Área principal do quiz, subtítulo do card em destaque. */
  areaLabel: string;
  saved: boolean;
  saving: boolean;
  ratingDisabled: boolean;
  onOpen: () => void;
  onReview: () => void;
  onRate: () => void;
  onSave: () => void;
}

// Card da tela "Cursos Recomendados - ConnectaDev" do Stitch.
export function CourseCard({
  course,
  featured,
  areaLabel,
  saved,
  saving,
  ratingDisabled,
  onOpen,
  onReview,
  onRate,
  onSave,
}: CourseCardProps) {
  const tone = levelTone(course.level);

  return (
    <View style={styles.shadowWrap}>
      <View style={styles.card}>
        {featured ? (
          <FeaturedHeader course={course} areaLabel={areaLabel} onOpen={onOpen} />
        ) : (
          <ImageHeader course={course} onOpen={onOpen} />
        )}

        <View style={styles.body}>
          <View style={styles.chipsRow}>
            <View style={[styles.chip, { backgroundColor: tone.background, borderColor: tone.border }]}>
              <MaterialCommunityIcons name="signal-cellular-2" size={12} color={tone.text} />
              <Text style={[styles.chipText, { color: tone.text }]}>{course.level}</Text>
            </View>
            <View style={[styles.chip, styles.chipFree]}>
              <Text style={[styles.chipText, styles.chipFreeText]}>🎓 Curso gratuito</Text>
            </View>
            {featured ? (
              <View style={[styles.chip, styles.chipNeutral]}>
                <Text style={[styles.chipText, styles.chipNeutralText]} numberOfLines={1}>
                  {course.provider}
                </Text>
              </View>
            ) : null}
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={styles.saveButton}
              accessibilityRole="button"
              accessibilityLabel={saved ? `Curso ${course.title} salvo` : `Salvar curso ${course.title}`}
              accessibilityState={{ selected: saved, disabled: saving }}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={saved ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </View>

          {course.tags.length > 0 ? (
            <View style={styles.skills}>
              {featured ? <Text style={styles.skillsLabel}>HABILIDADES ENSINADAS</Text> : null}
              <View style={styles.tagRow}>
                {course.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onOpen}
              style={({ pressed }) => [
                styles.cta,
                featured && styles.ctaFeatured,
                pressed && styles.ctaPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Começar o curso ${course.title}`}
            >
              <Text style={styles.ctaText}>Começar Curso Grátis</Text>
              <Feather name="arrow-right" size={16} color={colors.textOnPrimary} />
            </Pressable>
            <Pressable
              onPress={onReview}
              style={({ pressed }) => [styles.review, pressed && styles.reviewPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Fazer revisão com IA do curso ${course.title}`}
            >
              <Text style={styles.reviewEmoji}>🧠</Text>
              <Text style={styles.reviewText}>Fazer Revisão com IA</Text>
              <View style={styles.reviewXp}>
                <Text style={styles.reviewXpText}>+50 XP</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.rateRow}>
            <Text style={styles.rateQuestion}>
              {course.userRating
                ? `Você deu ${course.userRating.rating}/5`
                : 'O que você acha deste curso?'}
            </Text>
            <Pressable
              onPress={onRate}
              disabled={ratingDisabled}
              style={[styles.rateButton, ratingDisabled && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel={`Avaliar curso ${course.title}`}
            >
              <Text style={styles.rateButtonText}>
                ★ {course.userRating ? 'Editar avaliação' : 'Avaliar Curso'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

interface HeaderProps {
  course: CourseRecommendation;
  onOpen: () => void;
}

function FeaturedHeader({ course, areaLabel, onOpen }: HeaderProps & { areaLabel: string }) {
  const gradientId = `course-featured-${course.id}`;
  const watermark = course.tags[0] ?? '';

  return (
    <Pressable
      onPress={onOpen}
      style={styles.featuredHeader}
      accessibilityRole="button"
      accessibilityLabel={`Abrir curso ${course.title}`}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.primaryDeepest} />
            <Stop offset="0.55" stopColor={colors.primaryDeep} />
            <Stop offset="1" stopColor={colors.dark} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      <View style={styles.glow} />
      {watermark ? (
        <Text style={styles.watermark} numberOfLines={1}>
          {watermark}
        </Text>
      ) : null}

      <View style={styles.matchSoft}>
        <Text style={styles.matchEmoji}>🎯</Text>
        <Text style={styles.matchSoftText}>Match</Text>
      </View>

      <View>
        {areaLabel ? (
          <Text style={styles.featuredArea} numberOfLines={1}>
            {areaLabel}
          </Text>
        ) : null}
        <Text style={styles.featuredTitle}>{course.title}</Text>
      </View>
    </Pressable>
  );
}

function ImageHeader({ course, onOpen }: HeaderProps) {
  const gradientId = `course-fade-${course.id}`;
  const category = courseCategory(course.tags);

  return (
    <Pressable
      onPress={onOpen}
      style={styles.imageHeader}
      accessibilityRole="button"
      accessibilityLabel={`Abrir curso ${course.title}`}
    >
      <Image
        source={{ uri: course.thumbnail }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity="0.2" />
            <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor={colors.dark} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>

      <View style={styles.imageTopRow}>
        <View style={styles.matchSolid}>
          <Text style={styles.matchEmoji}>👍</Text>
          <Text style={styles.matchSolidText}>MATCH</Text>
        </View>
        <View style={styles.providerPill}>
          <Text style={styles.providerText} numberOfLines={1}>
            {course.provider}
          </Text>
        </View>
      </View>

      <View>
        {category ? <Text style={styles.imageCategory}>{category}</Text> : null}
        <Text style={styles.imageTitle} numberOfLines={2}>
          {course.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: 24, marginBottom: 20, ...shadow.card },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredHeader: {
    justifyContent: 'space-between',
    minHeight: 150,
    overflow: 'hidden',
    padding: 20,
    gap: 16,
  },
  glow: {
    position: 'absolute',
    right: -32,
    bottom: -32,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(135, 212, 210, 0.16)',
  },
  watermark: {
    position: 'absolute',
    right: 16,
    top: 12,
    maxWidth: '70%',
    fontFamily: fonts.mono.medium,
    fontSize: 44,
    color: colors.textOnPrimary,
    opacity: 0.1,
  },
  matchSoft: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchEmoji: { fontSize: 11 },
  matchSoftText: { fontFamily: fonts.sans.bold, fontSize: 11, color: '#6EE7B7' },
  featuredArea: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.primaryTint,
    marginBottom: 4,
  },
  featuredTitle: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 20,
    lineHeight: 25,
    color: colors.textOnPrimary,
  },
  imageHeader: {
    height: 176,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.dark,
  },
  imageTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  matchSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchSolidText: { fontFamily: fonts.sans.extraBold, fontSize: 11, color: colors.textOnPrimary },
  providerPill: {
    flexShrink: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  providerText: { fontFamily: fonts.sans.bold, fontSize: 10, color: colors.textOnPrimary },
  imageCategory: {
    fontFamily: fonts.sans.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#6EE7B7',
  },
  imageTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.textOnPrimary,
  },
  body: { padding: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.sans.semiBold, fontSize: 12 },
  chipFree: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  chipFreeText: { color: '#065F46' },
  chipNeutral: { backgroundColor: '#F1F5F9', borderColor: '#F1F5F9', maxWidth: 160 },
  chipNeutralText: { color: '#334155' },
  saveButton: { marginLeft: 'auto', padding: 2 },
  skills: { marginBottom: 16 },
  skillsLabel: {
    fontFamily: fonts.sans.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F1F5F9', borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: fonts.sans.medium, fontSize: 12, color: '#334155' },
  actions: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cta: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaFeatured: { height: 48 },
  ctaPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  ctaText: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.textOnPrimary },
  review: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.primarySoft}AA`,
    backgroundColor: `${colors.primaryTint}26`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewPressed: { backgroundColor: `${colors.primaryTint}55` },
  reviewEmoji: { fontSize: 15 },
  reviewText: { fontFamily: fonts.sans.semiBold, fontSize: 13, color: colors.primaryDeep },
  reviewXp: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  reviewXpText: { fontFamily: fonts.sans.bold, fontSize: 10, color: colors.textOnPrimary },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rateQuestion: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 12, color: '#64748B' },
  rateButton: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateButtonText: { fontFamily: fonts.sans.semiBold, fontSize: 12, color: '#D97706' },
  disabled: { opacity: 0.5 },
});
