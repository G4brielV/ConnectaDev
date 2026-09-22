import { StyleSheet, Text, View } from "react-native";
import { useGamification } from "@/entities/gamification";

const XP_PER_LEVEL = 100;

export function XpProgressBar() {
  const { totalXp, currentLevel, isLoading } = useGamification();
  const levelStartXp = (currentLevel - 1) * XP_PER_LEVEL;
  const nextLevelXp = currentLevel * XP_PER_LEVEL;
  const progress = Math.min(
    1,
    Math.max(0, (totalXp - levelStartXp) / (nextLevelXp - levelStartXp)),
  );

  return (
    <View accessibilityLabel="Progresso de experiência" style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.level}>Nível {currentLevel}</Text>
        <Text style={styles.xp}>
          {isLoading ? "Carregando XP..." : `${totalXp} XP`}
        </Text>
      </View>
      <View accessibilityRole="progressbar" style={styles.track}>
        <View style={[styles.value, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.caption}>
        {Math.max(0, nextLevelXp - totalXp)} XP para o nível {currentLevel + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  level: {
    color: "#033649",
    fontSize: 13,
    fontWeight: "800",
  },
  xp: {
    color: "#B46B00",
    fontSize: 13,
    fontWeight: "800",
  },
  track: {
    backgroundColor: "#E8DDCB",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  value: {
    backgroundColor: "#036564",
    borderRadius: 999,
    height: "100%",
  },
  caption: {
    color: "#60717A",
    fontSize: 11,
    marginTop: 6,
  },
});
