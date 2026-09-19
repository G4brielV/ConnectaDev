import { z } from "zod";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const AI_REQUEST_TIMEOUT_MS = 25_000;

export interface CourseData {
  id: string;
  title: string;
  provider: string;
  level: string;
  tags: string[];
}

export interface AreaData {
  name: string;
  technologies: string[];
}

export interface GeneratedQuestionItem {
  statement: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  explanation: string;
}

const generatedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      statement: z.string().min(10),
      options: z.array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
        }),
      ).length(4),
      correctOptionId: z.string().min(1),
      explanation: z.string().min(10),
    }),
  ).min(3).max(5),
});

function generateContextualFallbackQuestions(course: CourseData): GeneratedQuestionItem[] {
  const mainTag = course.tags[0] || "Programação";
  const secTag = course.tags[1] || course.tags[0] || "Tecnologia";

  return [
    {
      statement: `No contexto de ${course.title}, qual é a finalidade central ao aplicar os conceitos de ${mainTag}?`,
      options: [
        { id: "A", label: `Resolver problemas de software estruturando soluções com boas práticas de ${mainTag}.` },
        { id: "B", label: "Eliminar a necessidade de testes e depuração de código." },
        { id: "C", label: "Garantir que a aplicação funcione apenas em computadores de alta performance." },
        { id: "D", label: "Substituir bancos de dados relacionais por variáveis globais." },
      ],
      correctOptionId: "A",
      explanation: `Em ${course.title}, o domínio de ${mainTag} visa criar sistemas robustos e manuteníveis, seguindo padrões de engenharia recomendados para o nível ${course.level}.`,
    },
    {
      statement: `Ao trabalhar com ${secTag}, qual das seguintes práticas é mais recomendada para iniciantes e profissionais de nível ${course.level}?`,
      options: [
        { id: "A", label: "Ignorar a documentação e focar apenas em copiar trechos prontos de código." },
        { id: "B", label: `Compreender os fundamentos teóricos e exercitar a implementação prática de ${secTag}.` },
        { id: "C", label: "Utilizar comandos sem entender seus efeitos e parâmetros." },
        { id: "D", label: "Nunca refatorar nem organizar o código desenvolvido." },
      ],
      correctOptionId: "B",
      explanation: `O aprendizado efetivo de ${secTag} exige consolidar conceitos fundamentais e colocar em prática os exercícios propostos no conteúdo de ${course.title}.`,
    },
    {
      statement: `Qual benefício é esperado ao concluir os tópicos de ${course.tags.slice(0, 3).join(", ")} abordados neste curso?`,
      options: [
        { id: "A", label: "Desenvolver autonomia técnica para aplicar as ferramentas em projetos reais e no mercado." },
        { id: "B", label: "Não precisar mais de versionamento de código com Git." },
        { id: "C", label: "Tornar o código imune a erros de lógica automaticamente." },
        { id: "D", label: "Evitar o uso de estruturas de dados básicas." },
      ],
      correctOptionId: "A",
      explanation: `Os conteúdos práticos de ${course.title} capacitam o estudante a construir soluções alinhadas às demandas atuais do ecossistema de tecnologia.`,
    },
    {
      statement: `Em relação à arquitetura e fluxo de trabalho com ${mainTag}, o que caracteriza uma boa tomada de decisão?`,
      options: [
        { id: "A", label: "Adotar complexidade desnecessária antes de validar os requisitos básicos." },
        { id: "B", label: "Modularizar o código, facilitando a legibilidade, testes e manutenção contínua." },
        { id: "C", label: "Concentrar todas as responsabilidades em um único arquivo extenso." },
        { id: "D", label: "Desativar avisos do compilador e do linter." },
      ],
      correctOptionId: "B",
      explanation: "Modularidade e clareza de responsabilidades são princípios fundamentais para garantir a longevidade e escalabilidade de qualquer projeto.",
    },
    {
      statement: `Qual a importância de realizar revisões e testes práticos após assistir às aulas de ${course.title}?`,
      options: [
        { id: "A", label: "Fixar o conhecimento na memória de longo prazo e identificar lacunas de compreensão." },
        { id: "B", label: "Apenas cumprir requisitos burocráticos sem impacto no aprendizado." },
        { id: "C", label: "Substituir a necessidade de escrever código na prática." },
        { id: "D", label: "Acelerar a reprodução de erros conhecidos." },
      ],
      correctOptionId: "A",
      explanation: "A prática deliberada com feedback imediato reforça as conexões neurais e consolida as habilidades técnicas adquiridas nas videoaulas.",
    },
  ];
}

function generateContextualFallbackQuestionsForArea(area: AreaData): GeneratedQuestionItem[] {
  const mainTech = area.technologies[0] || "as ferramentas da área";
  const secTech = area.technologies[1] || area.technologies[0] || "as tecnologias mais usadas";
  const techList = area.technologies.slice(0, 3).join(", ") || area.name;

  return [
    {
      statement: `Qual é o objetivo central de um profissional que atua em ${area.name}?`,
      options: [
        { id: "A", label: `Entregar soluções que resolvam problemas reais aplicando ${mainTech} com boas práticas.` },
        { id: "B", label: "Evitar qualquer contato com outras áreas da empresa." },
        { id: "C", label: "Garantir que somente computadores de alta performance rodem o sistema." },
        { id: "D", label: "Substituir toda documentação por conversas informais." },
      ],
      correctOptionId: "A",
      explanation: `Em ${area.name}, o foco é gerar valor resolvendo problemas concretos, e ${mainTech} é uma das ferramentas usadas para isso.`,
    },
    {
      statement: `Ao começar a estudar ${secTech}, qual abordagem é mais recomendada para quem está entrando em ${area.name}?`,
      options: [
        { id: "A", label: "Decorar comandos sem entender o que cada um faz." },
        { id: "B", label: `Entender os fundamentos e praticar ${secTech} em projetos pequenos e reais.` },
        { id: "C", label: "Pular a base teórica e ir direto para ferramentas avançadas." },
        { id: "D", label: "Nunca revisar o que foi feito depois de pronto." },
      ],
      correctOptionId: "B",
      explanation: `Aprender ${secTech} exige consolidar os fundamentos e praticar de forma incremental, construindo repertório para ${area.name}.`,
    },
    {
      statement: `Qual benefício se espera ao dominar ${techList} dentro de ${area.name}?`,
      options: [
        { id: "A", label: "Autonomia para atuar em projetos reais e se posicionar no mercado da área." },
        { id: "B", label: "Nunca mais precisar aprender nada novo." },
        { id: "C", label: "Tornar qualquer sistema imune a falhas automaticamente." },
        { id: "D", label: "Eliminar a necessidade de trabalhar em equipe." },
      ],
      correctOptionId: "A",
      explanation: `As tecnologias sugeridas para ${area.name} formam a base prática que o mercado espera de quem está começando na área.`,
    },
    {
      statement: `Em ${area.name}, o que caracteriza uma boa tomada de decisão técnica?`,
      options: [
        { id: "A", label: "Adotar a solução mais complexa antes de validar os requisitos." },
        { id: "B", label: "Escolher soluções claras, mensuráveis e fáceis de manter, alinhadas ao problema." },
        { id: "C", label: "Concentrar todo o conhecimento em uma única pessoa." },
        { id: "D", label: "Ignorar feedback de usuários e colegas." },
      ],
      correctOptionId: "B",
      explanation: "Independentemente da área, decisões técnicas boas priorizam clareza, manutenção e aderência ao problema real.",
    },
    {
      statement: `Por que revisar o conhecimento após estudar conteúdos de ${area.name} é importante?`,
      options: [
        { id: "A", label: "Fixa o aprendizado na memória de longo prazo e revela lacunas de compreensão." },
        { id: "B", label: "Serve apenas para cumprir uma formalidade." },
        { id: "C", label: "Substitui a necessidade de praticar." },
        { id: "D", label: "Acelera a repetição de erros conhecidos." },
      ],
      correctOptionId: "A",
      explanation: "A prática deliberada com feedback imediato consolida as habilidades e mostra o que ainda precisa ser estudado.",
    },
  ];
}

const PROMPT_RULES = `Diretrizes pedagógicas:
1. Perguntas desafiadoras e relevantes sobre os conceitos essenciais.
2. Cada pergunta deve ter exatamente 4 opções de resposta, com IDs: "A", "B", "C", "D".
3. Apenas uma alternativa correta por pergunta.
4. Inclua uma explicação didática detalhada ("explanation") explicando o porquê da alternativa correta.

Responda ESTRITAMENTE em formato JSON (sem markdown, sem blocos de código com crases):
{
  "questions": [
    {
      "statement": "Texto do enunciado da pergunta",
      "options": [
        { "id": "A", "label": "Texto da alternativa A" },
        { "id": "B", "label": "Texto da alternativa B" },
        { "id": "C", "label": "Texto da alternativa C" },
        { "id": "D", "label": "Texto da alternativa D" }
      ],
      "correctOptionId": "A",
      "explanation": "Justificativa didática detalhada"
    }
  ]
}`;

function buildCoursePrompt(course: CourseData): string {
  return `Você é o tutor pedagógico de tecnologia do ConnectaDev.
Gere exatamente 5 perguntas didáticas de múltipla escolha para revisar o conhecimento de um estudante que acabou de assistir ao seguinte curso:
- Título do Curso: ${course.title}
- Nível: ${course.level}
- Tecnologias/Tags: ${course.tags.join(", ")}
- Provedor do Conteúdo: ${course.provider}

${PROMPT_RULES}`;
}

function buildAreaPrompt(area: AreaData): string {
  const technologies = area.technologies.length > 0
    ? area.technologies.join(", ")
    : "as tecnologias mais comuns da área";
  return `Você é o tutor pedagógico de tecnologia do ConnectaDev.
Gere exatamente 5 perguntas didáticas de múltipla escolha, em nível iniciante/intermediário, para revisar os conceitos fundamentais de um estudante que está entrando na seguinte área de tecnologia:
- Área: ${area.name}
- Tecnologias sugeridas para o estudante: ${technologies}

${PROMPT_RULES}`;
}

/**
 * Calls Gemini with the given prompt and returns validated questions,
 * falling back to `fallback()` on any failure (missing key, HTTP error, invalid JSON).
 */
async function requestQuestions(
  prompt: string,
  fallback: () => GeneratedQuestionItem[],
  apiKey: string | undefined,
  logLabel: string,
): Promise<GeneratedQuestionItem[]> {
  if (!apiKey) {
    return fallback();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[${logLabel}] Gemini API returned status ${response.status}. Using contextual fallback.`);
      return fallback();
    }

    const responseBody = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = responseBody.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!rawText) {
      return fallback();
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)?.[0];
    const parsed = JSON.parse(jsonMatch || rawText);
    const validated = generatedQuestionsSchema.safeParse(parsed);

    if (validated.success) {
      return validated.data.questions;
    }

    console.warn(`[${logLabel}] Invalid JSON schema returned by Gemini. Using contextual fallback.`);
    return fallback();
  } catch (error) {
    console.warn(`[${logLabel}] Error calling Gemini: ${error instanceof Error ? error.message : String(error)}. Using fallback.`);
    return fallback();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateQuestionsForCourse(
  course: CourseData,
  apiKey: string | undefined = process.env.GEMINI_API_KEY,
): Promise<GeneratedQuestionItem[]> {
  return requestQuestions(
    buildCoursePrompt(course),
    () => generateContextualFallbackQuestions(course),
    apiKey,
    "AI Course Review",
  );
}

export async function generateQuestionsForArea(
  area: AreaData,
  apiKey: string | undefined = process.env.GEMINI_API_KEY,
): Promise<GeneratedQuestionItem[]> {
  return requestQuestions(
    buildAreaPrompt(area),
    () => generateContextualFallbackQuestionsForArea(area),
    apiKey,
    "AI Area Review",
  );
}
