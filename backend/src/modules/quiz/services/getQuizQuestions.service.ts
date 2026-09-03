import {
  QuizQuestion,
  QuizQuestionsResponse,
} from "../schemas/quiz.schemas";

const questions: QuizQuestion[] = [
  {
    id: "technology-interests",
    type: "multiple-choice",
    prompt: "Qual área da tecnologia mais desperta sua curiosidade?",
    options: [
      { id: "development", label: "Desenvolvimento de software" },
      { id: "data", label: "Dados e inteligência artificial" },
      { id: "design", label: "Design e experiência do usuário" },
      { id: "infrastructure", label: "Infraestrutura e redes" },
    ],
  },
  {
    id: "learning-routine",
    type: "open",
    prompt: "Como você costuma organizar sua rotina de estudos?",
  },
  {
    id: "problem-solving",
    type: "multiple-choice",
    prompt: "Quando encontra um problema difícil, qual é sua primeira atitude?",
    options: [
      { id: "research", label: "Pesquiso e estudo soluções" },
      { id: "experiment", label: "Testo possibilidades na prática" },
      { id: "collaborate", label: "Peço ajuda e troco ideias" },
      { id: "plan", label: "Divido o problema em partes menores" },
    ],
  },
];

export function getQuizQuestions(): QuizQuestionsResponse {
  return { questions };
}
