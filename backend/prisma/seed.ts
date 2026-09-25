import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const questions = [
  {
    statement: "Quando você se depara com um problema que não sabe resolver, qual costuma ser sua primeira reação?",
    type: "MULTIPLE_CHOICE",
    sequence: 1,
    options: [
      {
        id: "A",
        label: "Tento entender o problema por partes até encontrar uma possível solução.",
      },
      {
        id: "B",
        label: "Procuro informações e referências para entender melhor a situação.",
      },
      {
        id: "C",
        label: "Experimento diferentes possibilidades até descobrir o que funciona.",
      },
      {
        id: "D",
        label: "Observo o cenário como um todo antes de decidir por onde começar.",
      },
    ],
  },

  {
    statement: "Que tipo de atividade tende a prender mais a sua atenção?",
    type: "MULTIPLE_CHOICE",
    sequence: 2,
    options: [
      {
        id: "A",
        label: "Encontrar padrões ou relações que não são imediatamente evidentes.",
      },
      {
        id: "B",
        label: "Criar algo novo a partir de uma ideia.",
      },
      {
        id: "C",
        label: "Investigar por que algo não está funcionando como deveria.",
      },
      {
        id: "D",
        label: "Organizar informações e transformar uma situação complexa em algo mais simples.",
      },
    ],
  },

  {
    statement: "Imagine que você recebeu uma tarefa com várias formas possíveis de ser realizada. Como você prefere agir?",
    type: "MULTIPLE_CHOICE",
    sequence: 3,
    options: [
      {
        id: "A",
        label: "Escolho uma abordagem e começo a testar rapidamente.",
      },
      {
        id: "B",
        label: "Analiso as alternativas antes de escolher a que parece mais adequada.",
      },
      {
        id: "C",
        label: "Busco uma maneira de tornar o processo mais rápido ou automático.",
      },
      {
        id: "D",
        label: "Procuro entender como a escolha pode afetar as outras partes do trabalho.",
      },
    ],
  },

  {
    statement: "Qual situação costuma despertar mais sua curiosidade?",
    type: "MULTIPLE_CHOICE",
    sequence: 4,
    options: [
      {
        id: "A",
        label: "Entender como algo funciona por trás do que é apresentado.",
      },
      {
        id: "B",
        label: "Descobrir o motivo de algo apresentar um comportamento inesperado.",
      },
      {
        id: "C",
        label: "Entender o que os dados ou informações de uma situação podem revelar.",
      },
      {
        id: "D",
        label: "Imaginar como uma solução poderia ser diferente ou melhor.",
      },
    ],
  },

  {
    statement: "Como você costuma lidar com tarefas que exigem bastante atenção aos detalhes?",
    type: "MULTIPLE_CHOICE",
    sequence: 5,
    options: [
      {
        id: "A",
        label: "Gosto de revisar cuidadosamente para evitar pequenos erros.",
      },
      {
        id: "B",
        label: "Consigo me concentrar nos detalhes quando eles são importantes para o resultado.",
      },
      {
        id: "C",
        label: "Prefiro entender primeiro a ideia geral e depois olhar os detalhes necessários.",
      },
      {
        id: "D",
        label: "Tento encontrar formas de reduzir a quantidade de trabalho manual envolvida.",
      },
    ],
  },

  {
    statement: "Quando você precisa aprender algo completamente novo, qual abordagem combina mais com você?",
    type: "MULTIPLE_CHOICE",
    sequence: 6,
    options: [
      {
        id: "A",
        label: "Prefiro entender os conceitos antes de começar a praticar.",
      },
      {
        id: "B",
        label: "Aprendo melhor colocando a mão na massa e experimentando.",
      },
      {
        id: "C",
        label: "Costumo pesquisar diferentes fontes até construir minha própria compreensão.",
      },
      {
        id: "D",
        label: "Prefiro aprender através de exemplos e situações práticas.",
      },
    ],
  },

  {
    statement: "Em um projeto em equipe, qual tipo de contribuição você naturalmente tende a assumir?",
    type: "MULTIPLE_CHOICE",
    sequence: 7,
    options: [
      {
        id: "A",
        label: "Pensar em como transformar ideias em algo concreto.",
      },
      {
        id: "B",
        label: "Analisar informações e ajudar o grupo a tomar decisões.",
      },
      {
        id: "C",
        label: "Identificar possíveis problemas antes que eles aconteçam.",
      },
      {
        id: "D",
        label: "Organizar tarefas, processos e dependências entre as atividades.",
      },
    ],
  },

  {
    statement: "Se você pudesse melhorar alguma coisa em um processo que utiliza frequentemente, o que provavelmente faria?",
    type: "MULTIPLE_CHOICE",
    sequence: 8,
    options: [
      {
        id: "A",
        label: "Tentaria simplificar a experiência para quem utiliza o processo.",
      },
      {
        id: "B",
        label: "Tentaria eliminar etapas desnecessárias.",
      },
      {
        id: "C",
        label: "Procuraria formas de automatizar parte do processo.",
      },
      {
        id: "D",
        label: "Analisaria os resultados para descobrir onde estão os principais problemas.",
      },
    ],
  },

  {
    statement: "Qual dessas situações provavelmente seria mais interessante para você resolver?",
    type: "MULTIPLE_CHOICE",
    sequence: 9,
    options: [
      {
        id: "A",
        label: "Uma situação em que existem muitas informações diferentes e é preciso encontrar o que realmente importa.",
      },
      {
        id: "B",
        label: "Uma situação em que algo apresenta falhas e ninguém sabe exatamente a causa.",
      },
      {
        id: "C",
        label: "Uma situação em que é necessário criar uma solução que ainda não existe.",
      },
      {
        id: "D",
        label: "Uma situação em que várias partes precisam funcionar juntas de maneira confiável.",
      },
    ],
  },

  {
    statement: "Pensando em uma carreira na área de tecnologia, qual tipo de resultado provavelmente traria mais satisfação para você?",
    type: "MULTIPLE_CHOICE",
    sequence: 10,
    options: [
      {
        id: "A",
        label: "Criar uma solução que facilite ou transforme a forma como as pessoas realizam alguma atividade.",
      },
      {
        id: "B",
        label: "Descobrir algo importante a partir de informações que inicialmente pareciam desconectadas.",
      },
      {
        id: "C",
        label: "Fazer com que um sistema ou processo funcione de maneira confiável e eficiente.",
      },
      {
        id: "D",
        label: "Encontrar e solucionar problemas que poderiam comprometer o funcionamento de algo.",
      },
    ],
  },
] as const;

/**
 * Replace the `externalUrl` values with the final course or playlist links.
 * Keep `areas` aligned with the diagnosis catalog in submitQuiz.service.ts.
 * The recommendation service matches `tags` against tecnologiasSugeridas.
 */
const courses = [
  {
    title: "Fundamentos de Desenvolvimento Web",
    provider: "Youtube",
    level: "Iniciante",
    thumbnail: "https://i3.ytimg.com/vi/jgQjeqGRdgA/maxresdefault.jpg",
    externalUrl: "https://www.youtube.com/watch?v=jgQjeqGRdgA&list=PLHz_AreHm4dkZ9-atkcmcBaMZdmLHft8n&index=3",
    areas: ["Desenvolvimento de Software"],
    tags: ["HTML", "CSS", "JavaScript", "Lógica de Programação"],
  },
  {
    title: "JavaScript e TypeScript na Prática",
    provider: "Youtube",
    level: "Intermediário",
    thumbnail: "https://i3.ytimg.com/vi/uzEhd3Lugik/maxresdefault.jpg",
    externalUrl: "https://www.youtube.com/watch?v=uzEhd3Lugik&list=PLT1M213fLL7nT-Y0VDnEzMf9oqx-ENmG-",
    areas: ["Desenvolvimento de Software"],
    tags: ["JavaScript", "TypeScript", "Node.js", "React"],
  },
  {
    title: "Python para Dados",
    provider: "Youtube",
    level: "Iniciante",
    thumbnail: "https://i3.ytimg.com/vi/BS8mv11SJeo/maxresdefault.jpg",
    externalUrl: "https://www.youtube.com/watch?v=BS8mv11SJeo&list=PL_b3PX9XGVYMW1w-68YmDv2kAl5Gfiuvx",
    areas: ["Dados e Inteligência Artificial"],
    tags: ["Python", "Dados", "Pandas", "SQL"],
  },
  {
    title: "Introdução à Inteligência Artificial",
    provider: "Youtube",
    level: "Intermediário",
    thumbnail: "https://i3.ytimg.com/vi/jQMbuK6URws/maxresdefault.jpg",
    externalUrl: "https://www.youtube.com/watch?v=jQMbuK6URws&list=PLHz_AreHm4dm24MhlWJYiR_Rm7TFtvs6S",
    areas: ["Dados e Inteligência Artificial"],
    tags: ["Python", "Machine Learning", "Inteligência Artificial", "Dados"],
  },
  {
  title: "Fundamentos de UI e UX",
  provider: "YouTube",
  level: "Iniciante",
  thumbnail: "https://i3.ytimg.com/vi/W0bPsPHAjrQ/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=W0bPsPHAjrQ&list=PLuDfCQO9tvX0kDmh4cjo30uidCeJ-iZE6",
  areas: ["Design e Experiência do Usuário"],
  tags: ["UI", "UX", "Figma", "Acessibilidade"],
  },
  {
  title: "Prototipação e Pesquisa com Usuários",
  provider: "YouTube",
  level: "Intermediário",
  thumbnail: "https://i3.ytimg.com/vi/ZdE3LsF3NCI/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=ZdE3LsF3NCI&list=PLfaT9CZbt-_QEpLWuhk3wqWOC-TakYNye",
  areas: ["Design e Experiência do Usuário"],
  tags: ["UX", "Pesquisa com Usuários", "Prototipação", "Design"],
  },
  {
  title: "Fundamentos de Cloud Computing",
  provider: "YouTube",
  level: "Iniciante",
  thumbnail: "https://i3.ytimg.com/vi/zaj0IX8dQwA/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=zaj0IX8dQwA&list=PLwlq4XZ8aTmfHJTNreRyqCmXVWhyF5LHo",
  areas: ["Infraestrutura e Redes"],
  tags: ["Cloud", "Azure", "AWS", "Infraestrutura"],
  },
  {
  title: "Linux, Redes e DevOps",
  provider: "YouTube",
  level: "Intermediário",
  thumbnail: "https://i3.ytimg.com/vi/1FZZ7LT3FfA/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=1FZZ7LT3FfA&list=PLPqoPgWuohm6GglkKJ8oW10j9Te_YyeV9",
  areas: ["Infraestrutura e Redes"],
  tags: ["Linux", "Redes", "Docker", "DevOps", "Kubernetes"],
  },
  {
  title: "Fundamentos de Cibersegurança",
  provider: "YouTube",
  level: "Iniciante",
  thumbnail: "https://i3.ytimg.com/vi/KvPtIl-Gz2E/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=KvPtIl-Gz2E&list=PLHz_AreHm4dlaTyjolzCFC6IjLzO8O0XV",
  areas: ["Cibersegurança"],
  tags: ["Cibersegurança", "Segurança", "Redes", "Linux"],
  },
  {
  title: "Segurança de Aplicações Web",
  provider: "YouTube",
  level: "Intermediário",
  thumbnail: "https://i3.ytimg.com/vi/KvPtIl-Gz2E/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=KvPtIl-Gz2E&list=PLHz_AreHm4dlaTyjolzCFC6IjLzO8O0XV",
  areas: ["Cibersegurança"],
  tags: ["Cibersegurança", "OWASP", "Web Security", "APIs"],
  },
  {
  title: "Fundamentos de Gestão de Produtos",
  provider: "YouTube",
  level: "Iniciante",
  thumbnail: "https://i3.ytimg.com/vi/dMEo7mq-n3s/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=dMEo7mq-n3s&list=PLX-4skTGVrWXT8l5bmqDEBtiU4LOMT0Pv",
  areas: ["Gestão de Produtos de Tecnologia"],
  tags: ["Produto", "Product Management", "Agile", "Scrum"],
  },
  {
  title: "Discovery, Métricas e Roadmap",
  provider: "YouTube",
  level: "Intermediário",
  thumbnail: "https://i3.ytimg.com/vi/eCLthWcwC60/maxresdefault.jpg",
  externalUrl: "https://www.youtube.com/watch?v=eCLthWcwC60",
  areas: ["Gestão de Produtos de Tecnologia"],
  tags: ["Produto", "Discovery", "Métricas", "Roadmap", "Agile"],
},
] as const;

// Fatia vertical do mapa de fases: 3 unidades x 5 fases para Desenvolvimento de Software.
// As questoes NAO vivem aqui — sao geradas pela IA no primeiro acesso e cacheadas em trail_questions.
// `courseTitle` liga o recurso a um curso ja cadastrado em `courses` (sem duplicar URL/thumbnail).
const XP_BY_KIND = { STANDARD: 20, BONUS: 50, BOSS: 100 } as const;
const PASSING_BY_KIND = { STANDARD: 60, BONUS: 50, BOSS: 70 } as const;

type LessonKind = keyof typeof XP_BY_KIND;

interface SeedResource {
  title: string;
  courseTitle?: string;
  url?: string;
  kind?: "VIDEO" | "COURSE" | "ARTICLE";
}

interface SeedPhase {
  title: string;
  description: string;
  kind: LessonKind;
  resources: SeedResource[];
}

interface SeedUnit {
  title: string;
  phases: SeedPhase[];
}

const WEB_BASICS = "Fundamentos de Desenvolvimento Web";
const JS_TS = "JavaScript e TypeScript na Pr\u00e1tica";

const learningTracks: Array<{
  title: string;
  description: string;
  area: string;
  units: SeedUnit[];
}> = [
  {
    title: "Trilha de Desenvolvimento de Software",
    description:
      "Do primeiro algoritmo a uma aplica\u00e7\u00e3o completa, no ritmo de quem est\u00e1 come\u00e7ando.",
    area: "Desenvolvimento de Software",
    units: [
      {
        title: "Primeiros Passos na Programa\u00e7\u00e3o",
        phases: [
          {
            title: "L\u00f3gica de Programa\u00e7\u00e3o",
            description: "Vari\u00e1veis, condicionais e repeti\u00e7\u00e3o \u2014 a base de tudo.",
            kind: "STANDARD",
            resources: [{ title: "L\u00f3gica e primeiros algoritmos", courseTitle: WEB_BASICS }],
          },
          {
            title: "HTML: a Estrutura da Web",
            description: "Como uma p\u00e1gina \u00e9 montada: tags, sem\u00e2ntica e acessibilidade.",
            kind: "STANDARD",
            resources: [{ title: "HTML do zero", courseTitle: WEB_BASICS }],
          },
          {
            title: "CSS: Estilo e Layout",
            description: "Cores, espa\u00e7amento, Flexbox e responsividade.",
            kind: "STANDARD",
            resources: [{ title: "CSS e layout responsivo", courseTitle: WEB_BASICS }],
          },
          {
            title: "Ba\u00fa B\u00f4nus: Ferramentas do Dev",
            description: "Editor, terminal e DevTools do navegador.",
            kind: "BONUS",
            resources: [{ title: "Preparando o ambiente", courseTitle: WEB_BASICS }],
          },
          {
            title: "Chef\u00e3o: Sua Primeira P\u00e1gina",
            description: "Tudo da unidade junto: uma p\u00e1gina publicada do zero.",
            kind: "BOSS",
            resources: [{ title: "Projeto guiado da unidade", courseTitle: WEB_BASICS }],
          },
        ],
      },
      {
        title: "L\u00f3gica & JS Moderno",
        phases: [
          {
            title: "Fundamentos do JavaScript",
            description: "Tipos, operadores e o fluxo de execu\u00e7\u00e3o.",
            kind: "STANDARD",
            resources: [{ title: "JavaScript essencial", courseTitle: JS_TS }],
          },
          {
            title: "Estruturas de Dados",
            description: "Arrays e objetos: como guardar e organizar informa\u00e7\u00e3o.",
            kind: "STANDARD",
            resources: [{ title: "Arrays e objetos na pr\u00e1tica", courseTitle: JS_TS }],
          },
          {
            title: "Fun\u00e7\u00f5es & Arrays",
            description: "Fun\u00e7\u00f5es, escopo e os m\u00e9todos map, filter e reduce.",
            kind: "STANDARD",
            resources: [{ title: "Fun\u00e7\u00f5es e m\u00e9todos de array", courseTitle: JS_TS }],
          },
          {
            title: "Ba\u00fa B\u00f4nus: Git e GitHub",
            description: "Versionar o c\u00f3digo e publicar seu primeiro reposit\u00f3rio.",
            kind: "BONUS",
            resources: [{ title: "Controle de vers\u00e3o para iniciantes", courseTitle: JS_TS }],
          },
          {
            title: "Chef\u00e3o: DOM, Eventos & Fetch API",
            description: "Deixar a p\u00e1gina viva e consumir dados de uma API.",
            kind: "BOSS",
            resources: [{ title: "DOM, eventos e requisi\u00e7\u00f5es", courseTitle: JS_TS }],
          },
        ],
      },
      {
        title: "Construindo Aplica\u00e7\u00f5es",
        phases: [
          {
            title: "TypeScript na Pr\u00e1tica",
            description: "Tipagem est\u00e1tica para escrever c\u00f3digo mais seguro.",
            kind: "STANDARD",
            resources: [{ title: "TypeScript do zero", courseTitle: JS_TS }],
          },
          {
            title: "Node.js e APIs REST",
            description: "Construir um servidor e expor endpoints.",
            kind: "STANDARD",
            resources: [{ title: "Node.js e APIs", courseTitle: JS_TS }],
          },
          {
            title: "React: Componentes e Estado",
            description: "Interfaces com componentes reutiliz\u00e1veis.",
            kind: "STANDARD",
            resources: [{ title: "React na pr\u00e1tica", courseTitle: JS_TS }],
          },
          {
            title: "Ba\u00fa B\u00f4nus: Banco de Dados e SQL",
            description: "Modelar dados e escrever as primeiras consultas.",
            kind: "BONUS",
            resources: [{ title: "SQL para desenvolvedores", courseTitle: JS_TS }],
          },
          {
            title: "Chef\u00e3o: Projeto Full Stack",
            description: "Front, back e banco conversando numa aplica\u00e7\u00e3o s\u00f3.",
            kind: "BOSS",
            resources: [{ title: "Projeto full stack guiado", courseTitle: JS_TS }],
          },
        ],
      },
    ],
  },
];

const trails = [
  {
    title: "Fundamentos de Dados e IA",
    description: "Conheça conceitos básicos de dados, modelos e inteligência artificial.",
    area: "Dados e Inteligência Artificial",
    lessons: [
      {
        title: "Primeiros passos com dados",
        sequence: 1,
        xpReward: 50,
        questions: [
          {
            statement: "Qual linguagem é muito usada para análise de dados?",
            type: "MULTIPLE_CHOICE",
            sequence: 1,
            options: [
              { id: "A", label: "Python" },
              { id: "B", label: "HTML" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que uma tabela organiza?",
            type: "MULTIPLE_CHOICE",
            sequence: 2,
            options: [
              { id: "A", label: "Linhas e colunas" },
              { id: "B", label: "Somente imagens" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "Qual comando SQL consulta dados?",
            type: "MULTIPLE_CHOICE",
            sequence: 3,
            options: [
              { id: "A", label: "SELECT" },
              { id: "B", label: "PAINT" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que é um conjunto de dados?",
            type: "MULTIPLE_CHOICE",
            sequence: 4,
            options: [
              { id: "A", label: "Coleção organizada de informações" },
              { id: "B", label: "Um cabo de rede" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que um modelo de IA aprende durante o treinamento?",
            type: "MULTIPLE_CHOICE",
            sequence: 5,
            options: [
              { id: "A", label: "Padrões nos dados" },
              { id: "B", label: "A senha do usuário" },
            ],
            validation: null,
            correctAnswer: "A",
          },
        ],
      },
    ],
  },
  {
    title: "Fundamentos de UI e UX",
    description: "Aprenda princípios iniciais de interface e experiência do usuário.",
    area: "Design e Experiência do Usuário",
    lessons: [
      {
        title: "Conhecendo UI e UX",
        sequence: 1,
        xpReward: 50,
        questions: [
          {
            statement: "O que UI representa?",
            type: "MULTIPLE_CHOICE",
            sequence: 1,
            options: [
              { id: "A", label: "Interface do usuário" },
              { id: "B", label: "Infraestrutura de servidores" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que UX busca melhorar?",
            type: "MULTIPLE_CHOICE",
            sequence: 2,
            options: [
              { id: "A", label: "A experiência da pessoa usuária" },
              { id: "B", label: "A velocidade da internet do bairro" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "Para que serve um protótipo?",
            type: "MULTIPLE_CHOICE",
            sequence: 3,
            options: [
              { id: "A", label: "Testar uma ideia antes da versão final" },
              { id: "B", label: "Substituir o banco de dados" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que é acessibilidade em um produto digital?",
            type: "MULTIPLE_CHOICE",
            sequence: 4,
            options: [
              { id: "A", label: "Permitir que mais pessoas utilizem o produto" },
              { id: "B", label: "Usar somente cores escuras" },
            ],
            validation: null,
            correctAnswer: "A",
          },
          {
            statement: "O que uma pesquisa com usuários ajuda a descobrir?",
            type: "MULTIPLE_CHOICE",
            sequence: 5,
            options: [
              { id: "A", label: "Necessidades e dificuldades reais" },
              { id: "B", label: "A senha do servidor" },
            ],
            validation: null,
            correctAnswer: "A",
          },
        ],
      },
    ],
  },
] as const;

async function main(): Promise<void> {
  for (const question of questions) {
    const existingQuestion = await prisma.quizQuestion.findFirst({
      where: { sequence: question.sequence },
      select: { id: true },
    });

    if (existingQuestion) {
      await prisma.quizQuestion.update({
        where: { id: existingQuestion.id },
        data: {
          statement: question.statement,
          type: question.type,
          sequence: question.sequence,
          isActive: true,
          options: question.options,
          validation: null,
        },
      });
    } else {
      await prisma.quizQuestion.create({
        data: {
          ...question,
          isActive: true,
          validation: null,
        },
      });
    }
  }

  for (const course of courses) {
    const existingCourse = await prisma.course.findFirst({
      where: { title: course.title },
      select: { id: true },
    });

    if (existingCourse) {
      await prisma.course.update({
        where: { id: existingCourse.id },
        data: {
          ...course,
          isActive: true,
        },
      });
    } else {
      await prisma.course.create({
        data: {
          ...course,
          isActive: true,
        },
      });
    }
  }

  const defaultTopic = {
    id: "topic-fundamentos-prog-01",
    title: "Fundamentos de Programação e Lógica",
    description: "Revisão dos conceitos de variáveis, estruturas de decisão, laços e funções.",
    sequence: 1,
    isActive: true,
  };

  await prisma.topic.upsert({
    where: { id: defaultTopic.id },
    update: defaultTopic,
    create: defaultTopic,
  });

  const reviewQuestions = [
    {
      id: "rev-q1",
      topicId: defaultTopic.id,
      statement: "Qual a função principal de uma variável em uma linguagem de programação?",
      sequence: 1,
      options: [
        { id: "A", label: "Executar um bloco de instruções repetidamente." },
        { id: "B", label: "Armazenar dados temporariamente na memória durante a execução do programa." },
        { id: "C", label: "Garantir que o código seja compilado mais rápido." },
        { id: "D", label: "Conectar o programa a um banco de dados externo." },
      ],
      correctOptionId: "B",
      explanation: "Variáveis são espaços alocados na memória do computador identificados por um nome, utilizados para guardar dados manipulados durante a execução.",
      isActive: true,
    },
    {
      id: "rev-q2",
      topicId: defaultTopic.id,
      statement: "Qual estrutura é recomendada quando precisamos executar um bloco de código enquanto uma condição for verdadeira?",
      sequence: 2,
      options: [
        { id: "A", label: "Laço de repetição (como while ou for)." },
        { id: "B", label: "Estrutura condicional if/else isolada." },
        { id: "C", label: "Declaração de constantes." },
        { id: "D", label: "Importação de módulos." },
      ],
      correctOptionId: "A",
      explanation: "Estruturas de repetição (laços como while ou for) permitem iterar e reexecutar instruções até que uma condição de parada seja atingida.",
      isActive: true,
    },
    {
      id: "rev-q3",
      topicId: defaultTopic.id,
      statement: "Em lógica de programação, o que caracteriza uma função pura?",
      sequence: 3,
      options: [
        { id: "A", label: "Uma função que nunca aceita argumentos de entrada." },
        { id: "B", label: "Uma função que sempre imprime valores no terminal diretamente." },
        { id: "C", label: "Uma função que para os mesmos argumentos sempre retorna o mesmo resultado e não gera efeitos colaterais." },
        { id: "D", label: "Uma função que pode alterar livremente variáveis globais do sistema." },
      ],
      correctOptionId: "C",
      explanation: "Funções puras possuem determinismo: dependem exclusivamente de seus parâmetros de entrada e não causam efeitos colaterais no ambiente externo.",
      isActive: true,
    },
    {
      id: "rev-q4",
      topicId: defaultTopic.id,
      statement: "O que acontece quando tentamos acessar um índice inexistente em um array na maioria das linguagens modernas?",
      sequence: 4,
      options: [
        { id: "A", label: "O computador reinicia imediatamente." },
        { id: "B", label: "Retorna undefined ou lança uma exceção de índice fora dos limites (IndexOutOfBounds)." },
        { id: "C", label: "O array expande seu tamanho automaticamente preenchendo com zeros." },
        { id: "D", label: "O valor do primeiro elemento é duplicado silenciosamente." },
      ],
      correctOptionId: "B",
      explanation: "Tentar acessar uma posição fora do intervalo válido de um array resulta em erro de execução (IndexOutOfBoundsException) ou no valor undefined (como no JavaScript).",
      isActive: true,
    },
    {
      id: "rev-q5",
      topicId: defaultTopic.id,
      statement: "Qual operador lógico resulta em 'verdadeiro' apenas se AMBAS as condições comparadas forem verdadeiras?",
      sequence: 5,
      options: [
        { id: "A", label: "Operador OU (OR / ||)" },
        { id: "B", label: "Operador NÃO (NOT / !)" },
        { id: "C", label: "Operador E (AND / &&)" },
        { id: "D", label: "Operador de Atribuição (=)" },
      ],
      correctOptionId: "C",
      explanation: "A conjunção lógica AND (&&) exige a veracidade de todas as proposições envolvidas para retornar verdadeiro.",
      isActive: true,
    },
  ];

  for (const q of reviewQuestions) {
    await prisma.knowledgeReviewQuestion.upsert({
      where: { id: q.id },
      update: q,
      create: q,
    });
  }

  // Mapa de fases: trilha -> unidades -> fases -> recursos.
  for (const track of learningTracks) {
    const existing = await prisma.trail.findFirst({
      where: { title: track.title },
      select: { id: true },
    });

    const trailRecord = existing
      ? await prisma.trail.update({
          where: { id: existing.id },
          data: { description: track.description, area: track.area, isActive: true },
        })
      : await prisma.trail.create({
          data: {
            title: track.title,
            description: track.description,
            area: track.area,
            isActive: true,
          },
        });

    // `sequence` da fase e global na trilha: define a ordem de desbloqueio.
    let phaseSequence = 0;

    for (const [unitIndex, unit] of track.units.entries()) {
      const unitSequence = unitIndex + 1;
      const existingUnit = await prisma.trailUnit.findFirst({
        where: { trailId: trailRecord.id, sequence: unitSequence },
        select: { id: true },
      });

      const unitRecord = existingUnit
        ? await prisma.trailUnit.update({
            where: { id: existingUnit.id },
            data: { title: unit.title, isActive: true },
          })
        : await prisma.trailUnit.create({
            data: {
              trailId: trailRecord.id,
              title: unit.title,
              sequence: unitSequence,
              isActive: true,
            },
          });

      for (const phase of unit.phases) {
        phaseSequence += 1;

        const existingPhase = await prisma.trailLesson.findFirst({
          where: { trailId: trailRecord.id, sequence: phaseSequence },
          select: { id: true },
        });

        const phaseData = {
          unitId: unitRecord.id,
          title: phase.title,
          description: phase.description,
          kind: phase.kind,
          xpReward: XP_BY_KIND[phase.kind],
          passingScore: PASSING_BY_KIND[phase.kind],
          isActive: true,
        };

        const phaseRecord = existingPhase
          ? await prisma.trailLesson.update({ where: { id: existingPhase.id }, data: phaseData })
          : await prisma.trailLesson.create({
              data: { ...phaseData, trailId: trailRecord.id, sequence: phaseSequence },
            });

        // Recursos sao reescritos a cada seed; as questoes geradas pela IA nao sao tocadas.
        await prisma.trailLessonResource.deleteMany({ where: { lessonId: phaseRecord.id } });

        for (const [resourceIndex, resource] of phase.resources.entries()) {
          const course = resource.courseTitle
            ? await prisma.course.findFirst({
                where: { title: resource.courseTitle },
                select: { id: true, externalUrl: true },
              })
            : null;

          const url = resource.url ?? course?.externalUrl;
          if (!url) {
            console.warn(
              `Recurso "${resource.title}" ignorado: sem url e sem curso "${resource.courseTitle}".`,
            );
            continue;
          }

          await prisma.trailLessonResource.create({
            data: {
              lessonId: phaseRecord.id,
              courseId: course?.id ?? null,
              title: resource.title,
              url,
              kind: resource.kind ?? (course ? "COURSE" : "VIDEO"),
              sequence: resourceIndex + 1,
            },
          });
        }
      }
    }
  }

  for (const trail of trails) {
    const existingTrail = await prisma.trail.findFirst({
      where: { title: trail.title },
      select: { id: true },
    });

    const trailRecord = existingTrail
      ? await prisma.trail.update({
          where: { id: existingTrail.id },
          data: {
            description: trail.description,
            area: trail.area,
            isActive: true,
          },
        })
      : await prisma.trail.create({
          data: {
            title: trail.title,
            description: trail.description,
            area: trail.area,
            isActive: true,
          },
        });

    for (const lesson of trail.lessons) {
      const existingLesson = await prisma.trailLesson.findFirst({
        where: { trailId: trailRecord.id, sequence: lesson.sequence },
        select: { id: true },
      });

      const lessonRecord = existingLesson
        ? await prisma.trailLesson.update({
            where: { id: existingLesson.id },
            data: {
              title: lesson.title,
              xpReward: lesson.xpReward,
              isActive: true,
            },
          })
        : await prisma.trailLesson.create({
            data: {
              trailId: trailRecord.id,
              title: lesson.title,
              sequence: lesson.sequence,
              xpReward: lesson.xpReward,
              isActive: true,
            },
          });

      await prisma.trailQuestion.deleteMany({ where: { lessonId: lessonRecord.id } });
      await prisma.trailQuestion.createMany({
        data: lesson.questions.map((question) => ({
          lessonId: lessonRecord.id,
          ...question,
          isActive: true,
        })),
      });
    }
  }

  console.log(
    `Seeded ${questions.length} quiz questions, ${courses.length} courses, ${trails.length} legacy trails, ${learningTracks.length} phase map(s) with ${learningTracks.reduce((total, track) => total + track.units.length, 0)} units, and ${reviewQuestions.length} review questions.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed quiz questions.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });