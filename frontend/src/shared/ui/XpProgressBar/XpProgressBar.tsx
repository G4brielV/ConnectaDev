import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGamification } from "@/entities/gamification";
import { colors, fonts, radius, shadow } from "@/shared/config/theme";

const XP_PER_LEVEL = 100;

// Cartão de nível do Stitch ("Cursos Recomendados - ConnectaDev").
export function XpProgressBar() {
  const { totalXp, currentLevel, isLoading } = useGamification();
  const levelStartXp = (currentLevel - 1) * XP_PER_LEVEL;
  const nextLevelXp = currentLevel * XP_PER_LEVEL;
  const progress = Math.min(
    1,
    Math.max(0, (totalXp - levelStartXp) / (nextLevelXp - levelStartXp)),
  );
  const missingXp = Math.max(0, nextLevelXp - totalXp);

  return (
    <View accessibilityLabel="Progresso de experiência" style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.levelGroup}>
          <View style={styles.levelIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.eyebrow}>ESTUDANTE</Text>
            <Text style={styles.level}>Nível {currentLevel}</Text>
          </View>
        </View>
        <View style={styles.xpPill}>
          <Text style={styles.xpText}>{isLoading ? "Carregando XP…" : `${totalXp} XP`}</Text>
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={styles.track}
      >
        <View style={[styles.value, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.caption}>{currentLevel === 1 ? "Início da jornada" : "Em evolução"}</Text>
        <Text style={styles.goal}>
          Faltam {missingXp} XP para o <Text style={styles.goalLevel}>Nível {currentLevel + 1}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    ...shadow.card,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  levelGroup: { alignItems: "center", flexDirection: "row", gap: 8 },
  levelIcon: {
    alignItems: "center",
    backgroundColor: `${colors.primaryTint}55`,
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.sans.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  level: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 14 },
  xpPill: {
    backgroundColor: `${colors.primaryTint}40`,
    borderColor: `${colors.primarySoft}80`,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  xpText: { color: colors.primary, fontFamily: fonts.sans.bold, fontSize: 12 },
  track: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden",
  },
  value: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: "100%",
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  caption: { color: colors.textMuted, fontFamily: fonts.sans.medium, fontSize: 11 },
  goal: { color: colors.textBody, fontFamily: fonts.sans.semiBold, fontSize: 11 },
  goalLevel: { color: colors.primary, fontFamily: fonts.sans.bold },
});
