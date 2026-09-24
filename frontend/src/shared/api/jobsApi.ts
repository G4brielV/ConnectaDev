import { API_URL } from "../config/api";

export type JobContractType = "Estágio" | "Jovem Aprendiz" | "Bolsa" | "Outro";

export interface JobRecommendation {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  link: string;
  category: string;
  contractType: JobContractType;
  updatedAt: string;
}

export interface JobRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  jobs: JobRecommendation[];
  message?: string;
  canRetry: boolean;
}

export async function fetchJobRecommendations(
  token: string,
): Promise<JobRecommendationsResponse> {
  const response = await fetch(`${API_URL}/api/jobs/recommendations`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sua sessão não é válida. Faça login para continuar."
        : "Não foi possível carregar as vagas recomendadas.",
    );
  }

  return (await response.json()) as JobRecommendationsResponse;
}
