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

  console.log(
    `Seeded ${questions.length} quiz questions and ${courses.length} courses.`,
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