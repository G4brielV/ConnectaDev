import type { InitialState } from '@react-navigation/native';
import { fetchQuizDiagnosis, QuizDiagnosisStatus } from '../../shared/api/quizApi';

// Onboarding pós-cadastro: Home fica na base da pilha e a intro do quiz por cima,
// assim "voltar" e o fim do quiz caem na Home sem flash de tela.
export const QUIZ_ONBOARDING_STATE: InitialState = {
  index: 1,
  routes: [{ name: 'Home' }, { name: 'QuizIntro' }],
};

export function needsQuizOnboarding(status: QuizDiagnosisStatus): boolean {
  return !status.completed;
}

/**
 * Consulta se o usuário precisa passar pela intro do quiz.
 * Em falha (rede, 401, servidor) assume `false` para não bloquear o acesso ao app.
 */
export async function checkQuizOnboarding(
  token: string,
  loadDiagnosis: typeof fetchQuizDiagnosis = fetchQuizDiagnosis,
): Promise<boolean> {
  try {
    return needsQuizOnboarding(await loadDiagnosis(token));
  } catch {
    return false;
  }
}

export function resolveInitialNavigationState(
  isAuthenticated: boolean,
  needsQuiz: boolean | null,
): InitialState | undefined {
  return isAuthenticated && needsQuiz ? QUIZ_ONBOARDING_STATE : undefined;
}
