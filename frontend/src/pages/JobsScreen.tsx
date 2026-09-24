import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import {
  fetchJobRecommendations,
  JobContractType,
  JobRecommendation,
} from "../shared/api/jobsApi";
import { XpProgressBar } from "../shared/ui/XpProgressBar/XpProgressBar";

const CONTRACT_FILTERS: Array<"Todas" | JobContractType> = [
  "Estágio",
  "Júnior",
  "Todas",
];

export function JobsScreen() {
  const { token } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [areaPrincipal, setAreaPrincipal] = useState("");
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"Todas" | JobContractType>("Estágio");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadJobs = useCallback(async (): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchJobRecommendations(token);
      setJobs(response.jobs);
      setAreaPrincipal(response.areaPrincipal);
      setHasDiagnosis(response.hasDiagnosis);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as vagas recomendadas.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(
    () =>
      selectedFilter === "Todas"
        ? jobs
        : jobs.filter((job) => job.contractType === selectedFilter),
    [jobs, selectedFilter],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#036564" />
        <Text style={styles.loadingText}>Buscando vagas para sua trilha...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadJobs()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasDiagnosis) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <View style={styles.emptyCard}>
            <Text style={styles.bannerBadge}>RECOMENDAÇÃO PERSONALIZADA</Text>
            <Text style={styles.emptyTitle}>
              Faça o teste vocacional para ver vagas alinhadas ao seu perfil.
            </Text>
            <Text style={styles.emptyText}>
              Sua trilha define as áreas e oportunidades exibidas aqui.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fazer teste vocacional"
              onPress={() => navigation.navigate("Quiz")}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Fazer Teste Vocacional</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <XpProgressBar />
      <FlatList
        data={filteredJobs}
        keyExtractor={(job) => job.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.badge}>VAGAS ALINHADAS À SUA TRILHA</Text>
            <Text style={styles.title}>Vagas para sua trilha</Text>
            <Text style={styles.subtitle}>
              Estágios, posições júnior e outras oportunidades de {areaPrincipal} na Região Metropolitana do Recife.
            </Text>
            <View style={styles.filterRow}>
              {CONTRACT_FILTERS.map((filter) => (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  onPress={() => setSelectedFilter(filter)}
                  style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <JobCard job={item} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma vaga encontrada para este filtro.</Text>
            <Text style={styles.emptyText}>Tente selecionar “Todas” ou volte mais tarde.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function JobCard({ job }: { job: JobRecommendation }) {
  const [linkError, setLinkError] = useState<string | null>(null);

  async function openJob(): Promise<void> {
    setLinkError(null);

    try {
      const canOpen = await Linking.canOpenURL(job.link);
      if (!canOpen) {
        setLinkError("Não foi possível abrir o link desta vaga neste dispositivo.");
        return;
      }

      await Linking.openURL(job.link);
    } catch {
      setLinkError("Não foi possível abrir o link desta vaga neste dispositivo.");
    }
  }

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.contractBadge}>{job.contractType}</Text>
        <Text style={styles.areaBadge}>{job.category}</Text>
      </View>
      <Text style={styles.jobTitle}>{job.title}</Text>
      <Text style={styles.jobCompany}>🏢 {job.company}</Text>
      <Text style={styles.jobLocation}>📍 {job.location}</Text>
      {job.salary ? <Text style={styles.salary}>💰 {job.salary}</Text> : null}
      {linkError ? <Text style={styles.linkError}>{linkError}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${job.title}`} onPress={() => void openJob()} style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Ver Detalhes da Vaga →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { padding: 20, paddingBottom: 40 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  loadingText: { color: "#64748B", fontSize: 13, marginTop: 12 },
  errorText: { color: "#8B1E1E", fontSize: 16, textAlign: "center" },
  retryButton: { backgroundColor: "#036564", borderRadius: 10, marginTop: 20, paddingHorizontal: 20, paddingVertical: 13 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  emptyCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, padding: 22 },
  bannerBadge: { alignSelf: "center", color: "#036564", fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginBottom: 10, textAlign: "center" },
  emptyTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyText: { color: "#64748B", fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: "center" },
  header: { marginBottom: 18 },
  badge: { alignSelf: "flex-start", backgroundColor: "#E0F2F1", borderRadius: 999, color: "#036564", fontSize: 11, fontWeight: "800", paddingHorizontal: 10, paddingVertical: 5 },
  title: { color: "#0F172A", fontSize: 26, fontWeight: "800", marginTop: 10 },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20, marginTop: 6 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  filterChip: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  filterChipActive: { backgroundColor: "#036564", borderColor: "#036564" },
  filterText: { color: "#475569", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "700" },
  jobCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 18 },
  jobHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  contractBadge: { backgroundColor: "#E0F2F1", borderRadius: 6, color: "#036564", fontSize: 11, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 4 },
  areaBadge: { color: "#64748B", fontSize: 11, maxWidth: "55%", textAlign: "right" },
  jobTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700", lineHeight: 23 },
  jobCompany: { color: "#475569", fontSize: 13, fontWeight: "600", marginTop: 8 },
  jobLocation: { color: "#64748B", fontSize: 12, marginTop: 5 },
  salary: { color: "#036564", fontSize: 13, fontWeight: "700", marginTop: 12 },
  linkError: { color: "#8B1E1E", fontSize: 12, lineHeight: 18, marginTop: 10 },
  applyButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 10, marginTop: 16, paddingVertical: 12 },
  applyButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
