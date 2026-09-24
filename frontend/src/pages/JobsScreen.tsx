import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "Estágio" | "Jovem Aprendiz" | "Bolsa";
  stipend: string;
  tags: string[];
  postedAt: string;
}

const JOBS_DATA: JobItem[] = [
  {
    id: "job-1",
    title: "Estágio em Desenvolvimento Front-end (React)",
    company: "Empresa Residente Porto Digital",
    location: "Bairro do Recife, PE (Híbrido)",
    type: "Estágio",
    stipend: "R$ 1.600 + VT + VR",
    tags: ["React", "TypeScript", "HTML/CSS"],
    postedAt: "Hoje",
  },
  {
    id: "job-2",
    title: "Jovem Aprendiz em Suporte de TI",
    company: "Hub de Tecnologia & Logística",
    location: "Boa Viagem, Recife - PE",
    type: "Jovem Aprendiz",
    stipend: "R$ 980 + Capacitação Técnica",
    tags: ["Redes", "Hardware", "Linux"],
    postedAt: "Ontem",
  },
  {
    id: "job-3",
    title: "Bolsa de Iniciação e Residência Tech",
    company: "Instituto de Inovação & Ensino PE",
    location: "Várzea, Recife - PE",
    type: "Bolsa",
    stipend: "R$ 700 / mês",
    tags: ["Lógica", "Python", "Pesquisa"],
    postedAt: "Há 2 dias",
  },
  {
    id: "job-4",
    title: "Estagiário de Dados e Automação (Python)",
    company: "Fintech Parceira Porto Digital",
    location: "Santo Amaro, Recife - PE",
    type: "Estágio",
    stipend: "R$ 1.800 + Benefícios",
    tags: ["Python", "SQL", "Pandas"],
    postedAt: "Há 3 dias",
  },
];

export function JobsScreen() {
  const [selectedFilter, setSelectedFilter] = useState<string>("Todas");

  const filteredJobs = selectedFilter === "Todas"
    ? JOBS_DATA
    : JOBS_DATA.filter((job) => job.type === selectedFilter);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.badge}>OPORTUNIDADES LOCAIS 💼</Text>
          <Text style={styles.title}>Vagas de Tecnologia</Text>
          <Text style={styles.subtitle}>
            Estágios, vagas de jovem aprendiz e bolsas de formação em empresas e instituições na Região Metropolitana do Recife.
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {["Todas", "Estágio", "Jovem Aprendiz", "Bolsa"].map((filter) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Job Cards */}
        <View style={styles.jobsList}>
          {filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTypeBadge}>{job.type}</Text>
                <Text style={styles.jobPostedAt}>{job.postedAt}</Text>
              </View>

              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>🏢 {job.company}</Text>
              <Text style={styles.jobLocation}>📍 {job.location}</Text>

              <View style={styles.stipendRow}>
                <Text style={styles.stipendLabel}>Bolsa / Remuneração:</Text>
                <Text style={styles.stipendValue}>{job.stipend}</Text>
              </View>

              <View style={styles.tagsRow}>
                {job.tags.map((tag) => (
                  <Text key={tag} style={styles.tagChip}>{tag}</Text>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes de ${job.title}`}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Ver Detalhes da Vaga  →</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2F1",
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#036564",
    borderColor: "#036564",
  },
  filterText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  jobTypeBadge: {
    backgroundColor: "#E0F2F1",
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: "uppercase",
  },
  jobPostedAt: {
    fontSize: 12,
    color: "#94A3B8",
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  jobCompany: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  stipendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  stipendLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  stipendValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#036564",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  tagChip: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applyButton: {
    backgroundColor: "#036564",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
