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

  console.log(`Seeded ${questions.length} quiz questions.`);
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