/**
 * Conteúdo do mapa de fases: uma trilha por área do quiz vocacional, cada
 * uma com 3 unidades x 5 fases (3 comuns, 1 baú bônus opcional, 1 chefão).
 *
 * - Os recursos são vídeos específicos (não playlists inteiras), todos
 *   conferidos no oEmbed do YouTube quando foram adicionados.
 * - `tags` usa o mesmo vocabulário de `courses.tags`: é o que liga a fase aos
 *   cursos extras do catálogo recomendados pelo perfil do quiz.
 * - As questões NÃO vivem aqui: são geradas pela IA e cacheadas em
 *   `trail_questions` (ver `npm run trails:exams`).
 */

export const XP_BY_KIND = { STANDARD: 20, BONUS: 50, BOSS: 100 } as const;
export const PASSING_BY_KIND = { STANDARD: 60, BONUS: 50, BOSS: 70 } as const;

export type LessonKind = keyof typeof XP_BY_KIND;

export interface SeedResource {
  title: string;
  url: string;
  provider: string;
  kind: "VIDEO" | "COURSE" | "ARTICLE";
}

export interface SeedPhase {
  title: string;
  description: string;
  kind: LessonKind;
  tags: string[];
  resources: SeedResource[];
}

export interface SeedUnit {
  title: string;
  phases: SeedPhase[];
}

export interface SeedTrack {
  title: string;
  description: string;
  area: string;
  units: SeedUnit[];
}

function video(id: string, title: string, provider: string): SeedResource {
  return { title, url: `https://www.youtube.com/watch?v=${id}`, provider, kind: "VIDEO" };
}

const CEV = "Curso em Vídeo";
const CFTV = "Código Fonte TV";

export const learningTracks: SeedTrack[] = [
  {
    title: "Trilha de Desenvolvimento de Software",
    description: "Do primeiro algoritmo a uma aplicação completa, no ritmo de quem está começando.",
    area: "Desenvolvimento de Software",
    units: [
      {
        title: "Primeiros Passos na Programação",
        phases: [
          {
            title: "Lógica de Programação",
            description: "Algoritmos, condicionais e repetição — a base de tudo.",
            kind: "STANDARD",
            tags: ["Lógica de Programação"],
            resources: [
              video("8mei6uVttho", "Introdução a Algoritmos", CEV),
              video("_g05aHdBAEY", "Estruturas Condicionais", CEV),
              video("U5PnCt58Q68", "Estruturas de Repetição", CEV),
            ],
          },
          {
            title: "HTML: a Estrutura da Web",
            description: "Como uma página é montada: tags, semântica e acessibilidade.",
            kind: "STANDARD",
            tags: ["HTML"],
            resources: [
              video("E6CdIawPTh0", "Seu primeiro código HTML", CEV),
              video("HaSgt1hK2Fs", "Semântica no HTML5", CEV),
            ],
          },
          {
            title: "CSS: Estilo e Layout",
            description: "Estilos externos, modelo de caixas e responsividade.",
            kind: "STANDARD",
            tags: ["CSS"],
            resources: [
              video("-i1JVMspDJQ", "Estilos CSS externos", CEV),
              video("3ZFYXkzXhqE", "Modelo de caixas: primeiros passos", CEV),
              video("WcGPSeuJDJ0", "Responsividade para sites", CEV),
            ],
          },
          {
            title: "Baú Bônus: Ferramentas do Dev",
            description: "Editor de código, navegador e as ferramentas do dia a dia.",
            kind: "BONUS",
            tags: ["HTML"],
            resources: [video("UForX7ehChM", "Instalando todas as ferramentas", CEV)],
          },
          {
            title: "Chefão: Sua Primeira Página",
            description: "Tudo da unidade junto: uma página feita do zero e publicada.",
            kind: "BOSS",
            tags: ["HTML", "CSS"],
            resources: [
              video("cKEA0-MOhOs", "Criando um projeto a partir do zero", CEV),
              video("2Y0HXnYpn9E", "Hospedagem grátis no GitHub Pages", CEV),
            ],
          },
        ],
      },
      {
        title: "Lógica & JS Moderno",
        phases: [
          {
            title: "Fundamentos do JavaScript",
            description: "Variáveis, tipos primitivos e operadores.",
            kind: "STANDARD",
            tags: ["JavaScript"],
            resources: [
              video("Vbabsye7mWo", "Variáveis e tipos primitivos", CEV),
              video("hZG9ODUdxHo", "Operadores", CEV),
            ],
          },
          {
            title: "Estruturas de Dados",
            description: "Arrays e objetos: como guardar e organizar informação.",
            kind: "STANDARD",
            tags: ["JavaScript"],
            resources: [
              video("XdkW62tkAgU", "Variáveis compostas (arrays)", CEV),
              video("rtylOuQXdbk", "Objetos em JavaScript", "Hashtag Programação"),
            ],
          },
          {
            title: "Funções & Arrays",
            description: "Funções, escopo e os métodos map, filter e reduce.",
            kind: "STANDARD",
            tags: ["JavaScript"],
            resources: [
              video("mc3TKp2XzhI", "Funções em JavaScript", CEV),
              video("mgnSSwgTiFU", "Map, filter e reduce", "Felipe Rocha • Full Stack Club"),
            ],
          },
          {
            title: "Baú Bônus: Git e GitHub",
            description: "Versionar o código e publicar seu primeiro repositório.",
            kind: "BONUS",
            tags: [],
            resources: [
              video("xEKo29OWILE", "O que é Git e versionamento", CEV),
              video("5BYm7UdCrX0", "Criando o primeiro repositório", CEV),
            ],
          },
          {
            title: "Chefão: DOM, Eventos & Fetch API",
            description: "Deixar a página viva e consumir dados de uma API.",
            kind: "BOSS",
            tags: ["JavaScript"],
            resources: [
              video("WWZX8RWLxIk", "Introdução ao DOM", CEV),
              video("wWnBB-mZIvY", "Eventos DOM", CEV),
              video("qIGYM4S8x50", "Fetch API com projeto", "Hora de Codar"),
            ],
          },
        ],
      },
      {
        title: "Construindo Aplicações",
        phases: [
          {
            title: "TypeScript na Prática",
            description: "Tipagem estática para escrever código mais seguro.",
            kind: "STANDARD",
            tags: ["TypeScript"],
            resources: [video("sv9ekpBTk_A", "TypeScript para iniciantes em 16 minutos", "Alura")],
          },
          {
            title: "Node.js e APIs REST",
            description: "O que é uma API REST e como construir um servidor com Node.js.",
            kind: "STANDARD",
            tags: ["Node.js", "APIs"],
            resources: [
              video("umaXYEbd5vA", "O que é API, REST e RESTful", "Serliv"),
              video("hHM-hr9q4mo", "Saindo do zero em Node.js", "Rocketseat"),
            ],
          },
          {
            title: "React: Componentes e Estado",
            description: "Interfaces com componentes reutilizáveis, propriedades e estado.",
            kind: "STANDARD",
            tags: ["React"],
            resources: [
              video("00nfvN2UTZc", "Componentes e propriedades no React", "Rocketseat"),
              video("2RWsLmu8yVc", "React para completos iniciantes", "Felipe Rocha • Full Stack Club"),
            ],
          },
          {
            title: "Baú Bônus: Banco de Dados e SQL",
            description: "Modelar dados e escrever as primeiras consultas.",
            kind: "BONUS",
            tags: ["SQL"],
            resources: [
              video("Ofktsne-utM", "O que é um banco de dados", CEV),
              video("GaOlyL3Uv9M", "SELECT: primeiras consultas", CEV),
              video("paZNDJAPT4E", "Chaves estrangeiras e JOIN", CEV),
            ],
          },
          {
            title: "Chefão: Projeto Full Stack",
            description: "Front, back e banco conversando numa aplicação só.",
            kind: "BOSS",
            tags: ["React", "Node.js"],
            resources: [
              video("_gHr2Pe5LCY", "React do zero conectando front e back-end", "DevClub"),
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Trilha de Dados e Inteligência Artificial",
    description: "Do primeiro comando em Python ao seu primeiro modelo de Machine Learning.",
    area: "Dados e Inteligência Artificial",
    units: [
      {
        title: "Primeiros Passos com Dados",
        phases: [
          {
            title: "O que é Ciência de Dados",
            description: "O que faz quem trabalha com dados e por que isso importa.",
            kind: "STANDARD",
            tags: ["Dados"],
            resources: [video("ykSILAQQu6o", "O que é ciência de dados", "Nerdologia")],
          },
          {
            title: "Python: Primeiros Comandos",
            description: "Entrada, saída e variáveis na linguagem mais usada em dados.",
            kind: "STANDARD",
            tags: ["Python"],
            resources: [video("31llNGKWDdo", "Primeiros comandos em Python", CEV)],
          },
          {
            title: "Python: Condições e Repetições",
            description: "Tomar decisões e repetir tarefas com if e for.",
            kind: "STANDARD",
            tags: ["Python"],
            resources: [
              video("K10u3XIf1-Q", "Condições em Python", CEV),
              video("cL4YDtFnCt4", "Estrutura de repetição for", CEV),
            ],
          },
          {
            title: "Baú Bônus: Google Colab",
            description: "Programar em Python direto no navegador, sem instalar nada.",
            kind: "BONUS",
            tags: ["Python"],
            resources: [video("5zr9HWWs8nI", "Python online com o Google Colab", "Hashtag Programação")],
          },
          {
            title: "Chefão: Sua Primeira Análise",
            description: "Juntar Python e dados para responder uma pergunta real.",
            kind: "BOSS",
            tags: ["Python", "Dados"],
            resources: [video("HKuEi7HXFxo", "Análise de dados com Python em 10 minutos", "Hashtag Programação")],
          },
        ],
      },
      {
        title: "Manipulando Dados",
        phases: [
          {
            title: "Listas e Dicionários",
            description: "As estruturas do Python para guardar coleções de dados.",
            kind: "STANDARD",
            tags: ["Python"],
            resources: [video("ZWj8o692qGY", "Dicionários em Python", CEV)],
          },
          {
            title: "Pandas: Lendo Tabelas",
            description: "DataFrames: carregar, filtrar e resumir tabelas.",
            kind: "STANDARD",
            tags: ["Pandas", "Python"],
            resources: [video("C0aj3FjN5e0", "Introdução ao Pandas", "Hashtag Programação")],
          },
          {
            title: "SQL: Consultas Essenciais",
            description: "SELECT, filtros e agregações para tirar respostas do banco.",
            kind: "STANDARD",
            tags: ["SQL"],
            resources: [video("dpanYy8IrcU", "Minicurso de SQL", CFTV)],
          },
          {
            title: "Baú Bônus: Estatística Básica",
            description: "Média, mediana, dispersão e como não se enganar com números.",
            kind: "BONUS",
            tags: ["Dados"],
            resources: [video("n1ALcRhrn50", "Estatística para iniciantes em dados", "Meigarom")],
          },
          {
            title: "Chefão: Análise de um Dataset",
            description: "Limpar, explorar e tirar conclusões de uma base real.",
            kind: "BOSS",
            tags: ["Pandas", "Dados"],
            resources: [video("xQhbCc8fwrI", "Projeto prático de análise de dados", "Eficiência Programada")],
          },
        ],
      },
      {
        title: "Visualização e IA",
        phases: [
          {
            title: "Gráficos com Matplotlib",
            description: "Transformar tabelas em gráficos que contam uma história.",
            kind: "STANDARD",
            tags: ["Python", "Dados"],
            resources: [video("FDU-D8ddTU4", "Gráficos no Python com Matplotlib", "Hashtag Programação")],
          },
          {
            title: "O que é Machine Learning",
            description: "Como uma máquina aprende padrões a partir de dados.",
            kind: "STANDARD",
            tags: ["Machine Learning", "Inteligência Artificial"],
            resources: [video("0mtXae5HhTE", "O que é Machine Learning", CEV)],
          },
          {
            title: "Seu Primeiro Modelo",
            description: "Treinar e avaliar um modelo simples com Scikit-learn.",
            kind: "STANDARD",
            tags: ["Machine Learning", "Python"],
            resources: [video("39HBlzFV9vk", "Primeiros passos com Scikit-learn", "Programação Dinâmica")],
          },
          {
            title: "Baú Bônus: Ética na IA",
            description: "Vieses, privacidade e o impacto social da inteligência artificial.",
            kind: "BONUS",
            tags: ["Inteligência Artificial"],
            resources: [video("CjiOJDdahl4", "Implicações éticas e sociais da IA", "Canal USP")],
          },
          {
            title: "Chefão: Projeto de Ponta a Ponta",
            description: "Da pergunta à conclusão: um projeto completo de dados.",
            kind: "BOSS",
            tags: ["Python", "Dados"],
            resources: [video("r2WUzuqleH4", "Projeto completo de análise de dados", "Eficiência Programada")],
          },
        ],
      },
    ],
  },
  {
    title: "Trilha de Design e Experiência do Usuário",
    description: "Entender pessoas, desenhar interfaces e validar ideias com usuários reais.",
    area: "Design e Experiência do Usuário",
    units: [
      {
        title: "Fundamentos do Design",
        phases: [
          {
            title: "O que é UI e UX",
            description: "A diferença entre interface e experiência, e o que cada profissional faz.",
            kind: "STANDARD",
            tags: ["UI", "UX"],
            resources: [video("rbEbsF8o1-8", "A diferença entre UI e UX Design", "Kacio Design")],
          },
          {
            title: "Cores e Tipografia",
            description: "Escolher cores e fontes que comunicam e são legíveis.",
            kind: "STANDARD",
            tags: ["UI", "Design"],
            resources: [video("nhO86T8DZSc", "Tipografia, cores e mais no design de interface", "She is a Creative")],
          },
          {
            title: "Hierarquia Visual",
            description: "Guiar o olhar: tamanho, peso, contraste e espaçamento.",
            kind: "STANDARD",
            tags: ["UI"],
            resources: [video("4YwXnU8EebI", "Princípios de UI: hierarquia", "Kacio Design")],
          },
          {
            title: "Baú Bônus: Primeiros Passos no Figma",
            description: "A ferramenta mais usada para desenhar interfaces.",
            kind: "BONUS",
            tags: ["Figma"],
            resources: [video("5U2Sxj8AEks", "Como usar o Figma do zero", "Andrey Knabbenn")],
          },
          {
            title: "Chefão: Seu Primeiro Projeto no Figma",
            description: "Cor, tipografia e hierarquia juntas numa tela de verdade.",
            kind: "BOSS",
            tags: ["Figma", "UI"],
            resources: [video("L7wLoft_BVc", "Do zero ao primeiro projeto no Figma", "Sujeito Programador")],
          },
        ],
      },
      {
        title: "Pesquisa e Ideação",
        phases: [
          {
            title: "Pesquisa com Usuários",
            description: "Descobrir necessidades reais antes de desenhar qualquer coisa.",
            kind: "STANDARD",
            tags: ["Pesquisa com Usuários", "UX"],
            resources: [video("cBZLwvkLx9Q", "Pesquisa com usuários: uma introdução", "Natalí Garcia")],
          },
          {
            title: "Personas e Jornada do Usuário",
            description: "Representar quem usa o produto e o caminho que essa pessoa percorre.",
            kind: "STANDARD",
            tags: ["UX"],
            resources: [
              video("q_NrzJBS7QI", "Como criar personas", "UXNOW"),
              video("HdktfUSqVzc", "Como criar um mapa da jornada do usuário", "Chief of Design"),
            ],
          },
          {
            title: "Design Thinking",
            description: "Entender, definir, idear, prototipar e testar.",
            kind: "STANDARD",
            tags: ["Design", "UX"],
            resources: [video("GDUNZIYjRr8", "O que é Design Thinking", "Nadine Fronza")],
          },
          {
            title: "Baú Bônus: Wireframes",
            description: "O rascunho de baixa fidelidade que vem antes da tela final.",
            kind: "BONUS",
            tags: ["UX", "Prototipação"],
            resources: [video("INPlcg_BsGc", "O que é um wireframe", "UXNOW")],
          },
          {
            title: "Chefão: Do Problema ao Wireframe",
            description: "Da pesquisa à primeira versão desenhada da solução.",
            kind: "BOSS",
            tags: ["UX", "Prototipação"],
            resources: [video("-khZLAsG3d4", "Como criar wireframes do zero", "Andrey Knabbenn")],
          },
        ],
      },
      {
        title: "Prototipação e Validação",
        phases: [
          {
            title: "Protótipos no Figma",
            description: "Telas navegáveis para testar a ideia antes de programar.",
            kind: "STANDARD",
            tags: ["Prototipação", "Figma"],
            resources: [video("WoLKSlKLFos", "Funções de prototipação no Figma", "UX Club")],
          },
          {
            title: "Acessibilidade Digital",
            description: "Interfaces que funcionam para todas as pessoas.",
            kind: "STANDARD",
            tags: ["Acessibilidade"],
            resources: [video("NUoh6PzyaY0", "Acessibilidade no design de interface", "Chief of Design")],
          },
          {
            title: "Testes de Usabilidade",
            description: "Observar pessoas usando o protótipo e aprender com os tropeços.",
            kind: "STANDARD",
            tags: ["UX", "Pesquisa com Usuários"],
            resources: [video("3u-IYL4EoQ4", "Dicas práticas para testes de usabilidade", "Design Circuit")],
          },
          {
            title: "Baú Bônus: Design System",
            description: "Componentes e regras que mantêm um produto consistente.",
            kind: "BONUS",
            tags: ["UI", "Design"],
            resources: [video("gFTMitjgB3I", "Design System: o que é e como estudar", "Design Circuit")],
          },
          {
            title: "Chefão: Portfólio de UX",
            description: "Contar seu processo de design do problema à validação.",
            kind: "BOSS",
            tags: ["UX", "Design"],
            resources: [video("A9OXOqvRxeE", "Portfólio de UX: estrutura básica", "Design Circuit")],
          },
        ],
      },
    ],
  },
  {
    title: "Trilha de Infraestrutura e Redes",
    description: "Como computadores conversam, o Linux por dentro e as aplicações na nuvem.",
    area: "Infraestrutura e Redes",
    units: [
      {
        title: "Como os Computadores Conversam",
        phases: [
          {
            title: "Hardware e Sistemas Operacionais",
            description: "As peças do computador e o software que coordena tudo.",
            kind: "STANDARD",
            tags: ["Infraestrutura"],
            resources: [video("yjfB-asZVF4", "O que é um sistema operacional", "Eu TI Ensino")],
          },
          {
            title: "Como a Internet Funciona",
            description: "Cabos, roteadores e o caminho de uma página até você.",
            kind: "STANDARD",
            tags: ["Redes"],
            resources: [video("nlO5hySqJFA", "Como a internet funciona", CEV)],
          },
          {
            title: "Endereços IP e DNS",
            description: "Como cada máquina é encontrada na rede e como nomes viram endereços.",
            kind: "STANDARD",
            tags: ["Redes"],
            resources: [
              video("O8DmpmBMUSw", "IP: IPv4 e IPv6", CFTV),
              video("YMmIRoJjICw", "O que é DNS", "Canaltech"),
            ],
          },
          {
            title: "Baú Bônus: Modelo OSI e TCP/IP",
            description: "As camadas que organizam a comunicação em rede.",
            kind: "BONUS",
            tags: ["Redes"],
            resources: [video("KOrWZnGbx7s", "Modelo OSI e TCP/IP", "Léo Matos")],
          },
          {
            title: "Chefão: A Rede da Sua Casa",
            description: "Wi-Fi, roteador, IP e DNS funcionando juntos.",
            kind: "BOSS",
            tags: ["Redes"],
            resources: [video("V2XW8nxNjcc", "Entenda o Wi-Fi de uma vez por todas", "Manual do Mundo")],
          },
        ],
      },
      {
        title: "Linux e Linha de Comando",
        phases: [
          {
            title: "Primeiros Passos no Linux",
            description: "O sistema que roda a maior parte dos servidores do mundo.",
            kind: "STANDARD",
            tags: ["Linux"],
            resources: [video("CT6BZBzbpWA", "O que é Linux", "Diolinux")],
          },
          {
            title: "Terminal: Comandos Essenciais",
            description: "Navegar, criar e manipular arquivos pela linha de comando.",
            kind: "STANDARD",
            tags: ["Linux"],
            resources: [video("JEhVB4VHsTI", "Comandos básicos do Linux", "Diolinux")],
          },
          {
            title: "Permissões e Usuários",
            description: "Quem pode ler, escrever e executar cada arquivo.",
            kind: "STANDARD",
            tags: ["Linux"],
            resources: [video("sq6pd18X63Q", "Permissões no Linux e o chmod", "Diolinux")],
          },
          {
            title: "Baú Bônus: Shell Script",
            description: "Automatizar tarefas repetitivas com scripts.",
            kind: "BONUS",
            tags: ["Linux", "DevOps"],
            resources: [video("d8FcTiZVwNI", "O básico de Shell Script", "Vagner Fonseca")],
          },
          {
            title: "Chefão: Acesso Remoto com SSH",
            description: "Administrar um servidor Linux de outro computador com segurança.",
            kind: "BOSS",
            tags: ["Linux", "Redes"],
            resources: [video("NqW-BeYRBkE", "Como usar chaves SSH no Linux", "Diolinux")],
          },
        ],
      },
      {
        title: "Nuvem e DevOps",
        phases: [
          {
            title: "O que é Cloud Computing",
            description: "Servidores sob demanda: IaaS, PaaS e SaaS.",
            kind: "STANDARD",
            tags: ["Cloud"],
            resources: [video("97l0Ahu2efE", "Cloud computing", CFTV)],
          },
          {
            title: "Docker: Containers",
            description: "Empacotar uma aplicação para rodar igual em qualquer lugar.",
            kind: "STANDARD",
            tags: ["Docker"],
            resources: [video("ntbpIfS44Gw", "O mínimo que você precisa saber sobre Docker", "Diolinux")],
          },
          {
            title: "DevOps e CI/CD",
            description: "Integrar e entregar código com pipelines automáticos.",
            kind: "STANDARD",
            tags: ["DevOps"],
            resources: [video("AZtTd3pFVTY", "Pipeline de CI/CD", CFTV)],
          },
          {
            title: "Baú Bônus: Kubernetes",
            description: "Orquestrar muitos containers em produção.",
            kind: "BONUS",
            tags: ["Kubernetes"],
            resources: [video("tRbFs3CCyPQ", "Iniciando com Kubernetes", "Full Cycle")],
          },
          {
            title: "Chefão: Deploy na Nuvem",
            description: "Do container à aplicação no ar.",
            kind: "BOSS",
            tags: ["Docker", "Cloud"],
            resources: [video("DdoncfOdru8", "Docker do zero com deploy", "Fernanda Kipper")],
          },
        ],
      },
    ],
  },
  {
    title: "Trilha de Cibersegurança",
    description: "Proteger pessoas, redes e aplicações — pensando como quem ataca.",
    area: "Cibersegurança",
    units: [
      {
        title: "Fundamentos de Segurança",
        phases: [
          {
            title: "O que é Cibersegurança",
            description: "Confidencialidade, integridade, disponibilidade e o que a área faz.",
            kind: "STANDARD",
            tags: ["Cibersegurança", "Segurança"],
            resources: [video("oyR4hCJhwMU", "O que saber para começar em cybersecurity", "Daniel Donda")],
          },
          {
            title: "Senhas e Autenticação",
            description: "Senhas fortes, gerenciadores e autenticação em dois fatores.",
            kind: "STANDARD",
            tags: ["Segurança"],
            resources: [video("61mlf8wluyo", "Autenticação em dois fatores", "Dicionário de Informática")],
          },
          {
            title: "Engenharia Social e Phishing",
            description: "Os golpes que exploram pessoas em vez de sistemas.",
            kind: "STANDARD",
            tags: ["Segurança"],
            resources: [video("bgK68RPrIGg", "Engenharia social e phishing", "Fabrizio Rodrigues")],
          },
          {
            title: "Baú Bônus: Carreira em Segurança",
            description: "Por onde começar e quais caminhos existem na área.",
            kind: "BONUS",
            tags: ["Cibersegurança"],
            resources: [video("1QYYgtadygI", "Como começar certo em cybersecurity", "Daniel Donda")],
          },
          {
            title: "Chefão: Proteja sua Vida Digital",
            description: "Os fundamentos da segurança da informação aplicados ao seu dia a dia.",
            kind: "BOSS",
            tags: ["Segurança", "Cibersegurança"],
            resources: [video("Gfh2bxe3hGU", "Segurança da informação: o essencial", "Professora Nattane")],
          },
        ],
      },
      {
        title: "Redes e Ameaças",
        phases: [
          {
            title: "Redes para Segurança",
            description: "O que todo profissional de segurança precisa saber de redes.",
            kind: "STANDARD",
            tags: ["Redes"],
            resources: [video("q0S75nKpmcw", "Redes de computadores explicadas", "Professora Nattane")],
          },
          {
            title: "Malware e Ransomware",
            description: "Vírus, trojans e o sequestro de dados.",
            kind: "STANDARD",
            tags: ["Cibersegurança"],
            resources: [video("zWAmutv21yw", "Ransomware", CFTV)],
          },
          {
            title: "Criptografia",
            description: "Chaves simétricas e assimétricas e como protegem a informação.",
            kind: "STANDARD",
            tags: ["Segurança"],
            resources: [
              video("aTI99jztZds", "Mensagem secreta: entenda a criptografia", "Manual do Mundo"),
              video("qHFbuXpz7e4", "Criptografia: guia básico", CFTV),
            ],
          },
          {
            title: "Baú Bônus: Linux para Segurança",
            description: "Os comandos de terminal que a área usa todo dia.",
            kind: "BONUS",
            tags: ["Linux"],
            resources: [video("QZ2nyxzZXPY", "30 comandos básicos do terminal Linux", "Diolinux")],
          },
          {
            title: "Chefão: Anatomia de um Ataque",
            description: "As etapas de uma invasão e onde cada defesa entra.",
            kind: "BOSS",
            tags: ["Cibersegurança"],
            resources: [video("5ohTiW2Xmb4", "Cyber Kill Chain", "Daniel Donda")],
          },
        ],
      },
      {
        title: "Segurança de Aplicações",
        phases: [
          {
            title: "OWASP Top 10",
            description: "As falhas mais críticas em aplicações web.",
            kind: "STANDARD",
            tags: ["OWASP", "Web Security"],
            resources: [video("WYSXGax0r5w", "OWASP Top 10 explicado", "Solyd Offensive Security")],
          },
          {
            title: "SQL Injection",
            description: "Como o ataque funciona e como o código se protege.",
            kind: "STANDARD",
            tags: ["Web Security"],
            resources: [video("jN8QGOxdhvM", "SQL Injection: do ataque à prevenção", CFTV)],
          },
          {
            title: "Cross-Site Scripting (XSS)",
            description: "Scripts maliciosos na página e como evitá-los.",
            kind: "STANDARD",
            tags: ["Web Security"],
            resources: [video("2LYPyUk-L0k", "XSS: como funciona e como prevenir", CFTV)],
          },
          {
            title: "Baú Bônus: Capture the Flag",
            description: "Competições para praticar segurança jogando.",
            kind: "BONUS",
            tags: ["Cibersegurança"],
            resources: [video("gyCo7qlFQkk", "O que é um CTF", "Felipe Salles")],
          },
          {
            title: "Chefão: Pentest Ético",
            description: "Testar a segurança de um sistema com autorização e método.",
            kind: "BOSS",
            tags: ["Cibersegurança", "Web Security"],
            resources: [video("u6P5T0qxxK4", "Como começar em hacking e pentest", "Solyd Offensive Security")],
          },
        ],
      },
    ],
  },
  {
    title: "Trilha de Gestão de Produtos de Tecnologia",
    description: "Descobrir o que construir, organizar o time e medir se deu certo.",
    area: "Gestão de Produtos de Tecnologia",
    units: [
      {
        title: "O que é Produto",
        phases: [
          {
            title: "O que faz um Product Manager",
            description: "Papéis, responsabilidades e entregas de quem lidera produto.",
            kind: "STANDARD",
            tags: ["Product Management", "Produto"],
            resources: [video("MsSywiiCBMk", "O que faz um Product Manager", "Tera")],
          },
          {
            title: "Proposta de Valor",
            description: "Por que alguém escolheria o seu produto.",
            kind: "STANDARD",
            tags: ["Produto"],
            resources: [video("ukSBRtsyiYs", "Proposta de valor: o que é e como fazer", "Blog Abri Minha Empresa")],
          },
          {
            title: "MVP: Produto Mínimo Viável",
            description: "A menor versão que já testa se a ideia funciona.",
            kind: "STANDARD",
            tags: ["Produto"],
            resources: [video("i6nWH7STrb4", "O que é MVP, com exemplos", "Gabriel Valle")],
          },
          {
            title: "Baú Bônus: Carreira em Produto",
            description: "Como chegar em produto vindo de outras áreas.",
            kind: "BONUS",
            tags: ["Product Management"],
            resources: [video("uUhjSjI3jUQ", "Transição de carreira para Product Manager", "PM3")],
          },
          {
            title: "Chefão: Seu Produto em 1 Página",
            description: "Problema, público, proposta de valor e MVP num Lean Canvas.",
            kind: "BOSS",
            tags: ["Produto"],
            resources: [video("1tKR-TvV0t0", "Lean Canvas: plano de negócio em 1 página", "Blog Abri Minha Empresa")],
          },
        ],
      },
      {
        title: "Métodos Ágeis",
        phases: [
          {
            title: "Manifesto Ágil",
            description: "Os valores e princípios por trás dos times ágeis.",
            kind: "STANDARD",
            tags: ["Agile"],
            resources: [video("Fi6CyA02NNo", "O que é o Manifesto Ágil", "IlustraDev")],
          },
          {
            title: "Scrum",
            description: "Papéis, eventos e artefatos do framework mais usado.",
            kind: "STANDARD",
            tags: ["Scrum", "Agile"],
            resources: [video("3aCww_1RnL0", "Scrum", CFTV)],
          },
          {
            title: "Kanban",
            description: "Visualizar o fluxo de trabalho e limitar o que está em andamento.",
            kind: "STANDARD",
            tags: ["Agile"],
            resources: [video("qJRbAXlhJ3c", "Kanban: guia completo", "Pluga")],
          },
          {
            title: "Baú Bônus: Histórias de Usuário",
            description: "Escrever requisitos do ponto de vista de quem usa.",
            kind: "BONUS",
            tags: ["Agile", "Produto"],
            resources: [video("8lSk5U1Cjhg", "Entenda o que é user story", "K21")],
          },
          {
            title: "Chefão: Planeje uma Sprint",
            description: "Do backlog priorizado ao plano da próxima sprint.",
            kind: "BOSS",
            tags: ["Scrum", "Agile"],
            resources: [video("Pucp6CoCIEk", "Planejamento da sprint na prática", "Agile4Growth")],
          },
        ],
      },
      {
        title: "Discovery e Métricas",
        phases: [
          {
            title: "Product Discovery",
            description: "Descobrir o problema certo antes de construir a solução.",
            kind: "STANDARD",
            tags: ["Discovery"],
            resources: [video("kd5rH2vaZ5E", "O que é Product Discovery", "Canal Valor")],
          },
          {
            title: "Métricas de Produto",
            description: "Como saber se o produto está gerando valor.",
            kind: "STANDARD",
            tags: ["Métricas"],
            resources: [video("VgZCT-CTO20", "Métricas de produto e frameworks", "PM3")],
          },
          {
            title: "Roadmap e Priorização",
            description: "Decidir o que vem primeiro e comunicar o caminho.",
            kind: "STANDARD",
            tags: ["Roadmap"],
            resources: [
              video("yxQUKuKLQbE", "Entendendo priorização", "Diogo Becker"),
              video("K2-6GMQyrGk", "Da visão de produto ao roadmap", "Carol Teixeira"),
            ],
          },
          {
            title: "Baú Bônus: OKRs",
            description: "Objetivos e resultados-chave para alinhar o time.",
            kind: "BONUS",
            tags: ["Métricas"],
            resources: [video("HsqT7PXOjgU", "OKR em 5 minutos", "Frederico Werly")],
          },
          {
            title: "Chefão: Estratégia de Produto",
            description: "Alinhar negócio, tecnologia e UX numa estratégia só.",
            kind: "BOSS",
            tags: ["Produto", "Roadmap"],
            resources: [video("VZNvRZ7D1pM", "Como criar uma estratégia de produto", "PM3")],
          },
        ],
      },
    ],
  },
];
