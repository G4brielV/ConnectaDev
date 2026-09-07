import {
  QuizQuestion,
  QuizQuestionsResponse,
} from "../schemas/quiz.schemas";

const questions: QuizQuestion[] = [
  {
    id: "project-role-affinity",
    type: "multiple-choice",
    prompt: "Quando você imagina um aplicativo sendo criado, qual parte do processo te dá mais vontade de participar?",
    options: [
      { 
        id: "visual-experience", 
        label: "Criar o visual, organizar as telas e garantir que seja fácil e bonito de usar" 
      },
      { 
        id: "core-logic", 
        label: "Fazer as regras funcionarem, criar a lógica por trás e garantir que os dados sejam processados corretamente" 
      },
      { 
        id: "data-insights", 
        label: "Analisar informações, descobrir padrões escondidos e usar dados para prever resultados" 
      },
      { 
        id: "infra-security", 
        label: "Garantir que a estrutura esteja no ar, protegida contra invasões e funcionando sem travar" 
      },
    ],
  },
  {
    id: "problem-solving-style",
    type: "multiple-choice",
    prompt: "Diante de um desafio complexo, qual costuma ser sua reação natural?",
    options: [
      { 
        id: "step-by-step", 
        label: "Divido o problema em partes pequenas e resolvo uma por uma com calma" 
      },
      { 
        id: "hands-on-trial", 
        label: "Gosto de testar na prática direto, errando e corrigindo até dar certo" 
      },
      { 
        id: "collaborative", 
        label: "Discuto o problema com outras pessoas para encontrar caminhos juntos" 
      },
      { 
        id: "analytical-research", 
        label: "Pesquiso a fundo como outras pessoas resolveram aquilo antes de tentar" 
      },
    ],
  },
  {
    id: "rewarding-tasks",
    type: "multiple-choice",
    prompt: "Em tarefas da escola, trabalho ou rotina, qual tipo de atividade te traz mais satisfação ao concluir?",
    options: [
      { 
        id: "creative-design", 
        label: "Ajeitar apresentações, artes, textos ou layouts para ficarem impecáveis" 
      },
      { 
        id: "logic-math", 
        label: "Resolver enigmas de lógica, contas ou organizar planilhas complexas" 
      },
      { 
        id: "investigation", 
        label: "Descobrir o motivo de algo não estar funcionando e consertar" 
      },
      { 
        id: "organization-lead", 
        label: "Organizar ideias do grupo, planejar etapas e definir responsabilidades" 
      },
    ],
  },
  {
    id: "current-goal",
    type: "multiple-choice",
    prompt: "Qual é o seu objetivo principal ao usar o ConnectaDev hoje?",
    options: [
      { 
        id: "academic-prep", 
        label: "Me preparar para o ENEM e vestibulares regionais (UFPE, UPE/SSA, IFPE) focando em cursos de TI" 
      },
      { 
        id: "career-transition", 
        label: "Entrar direto no mercado de tecnologia da Região Metropolitana do Recife através de qualificações rápidas" 
      },
      { 
        id: "explore-tech", 
        label: "Descobrir se a área de tecnologia realmente combina comigo antes de tomar uma decisão" 
      },
      { 
        id: "build-projects", 
        label: "Aprender a criar meus próprios projetos, ideias de negócios ou sistemas" 
      },
    ],
  },
  {
    id: "dream-project",
    type: "open",
    prompt: "Conta para a gente: se você pudesse criar qualquer tecnologia ou resolver um problema do seu dia a dia (ou da sua comunidade na RMR) usando tecnologia, o que seria e por quê?",
  },
];

export function getQuizQuestions(): QuizQuestionsResponse {
  return { questions };
}