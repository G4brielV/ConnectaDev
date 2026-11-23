import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useGamification } from "@/entities/gamification";
import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { colors, fonts, radius } from "@/shared/config/theme";

const XP_PER_LEVEL = 100;

// Cartão de nível do Stitch ("Cursos Recomendados - ConnectaDev").
export function XpProgressBar() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { totalXp, currentLevel, currentStreak, isLoading } = useGamification();
  const levelStartXp = (currentLevel - 1) * XP_PER_LEVEL;
  const nextLevelXp = currentLevel * XP_PER_LEVEL;
  const progress = Math.min(
    1,
    Math.max(0, (totalXp - levelStartXp) / (nextLevelXp - levelStartXp)),
  );

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
        <View style={styles.metrics}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver ofensiva de ${currentStreak} dias`}
            hitSlop={6}
            onPress={() => navigation.navigate("Streak")}
            style={styles.metricPill}
          >
            <MaterialCommunityIcons name="fire" size={15} color={colors.flame} />
            <Text style={styles.streakText}>{currentStreak}</Text>
          </Pressable>
          <View style={styles.metricPill}>
            <MaterialCommunityIcons name="lightning-bolt" size={15} color={colors.primary} />
            <Text style={styles.xpText}>{isLoading ? "…" : `${totalXp} XP`}</Text>
          </View>
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={styles.track}
      >
        <View style={[styles.value, { width: `${progress * 100}%` }]} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderBottomColor: colors.light,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  levelGroup: { alignItems: "center", flexDirection: "row", gap: 8 },
  levelIcon: {
    alignItems: "center",
    backgroundColor: `${colors.primaryTint}55`,
    borderRadius: 8,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.sans.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  level: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 14 },
  metrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: `${colors.primaryTint}40`,
    borderColor: `${colors.primarySoft}80`,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  streakText: { color: colors.flame, fontFamily: fonts.sans.bold, fontSize: 12 },
  xpText: { color: colors.primary, fontFamily: fonts.sans.bold, fontSize: 12 },
  track: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    height: 6,
    overflow: "hidden",
  },
  value: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: "100%",
  },
});
