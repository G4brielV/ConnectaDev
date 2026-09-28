export const balancedQuestions = [
  {
    sequence: 1,
    type: "MULTIPLE_CHOICE",
    statement:
      "Quando você se depara com um problema complexo no trabalho ou estudos, qual costuma ser sua primeira atitude?",
    options: [
      { id: "D", label: "Verifico a estabilidade do ambiente e se os recursos de rede/servidor estão operacionais.", targetArea: "Infraestrutura e Redes" },
      { id: "A", label: "Quebro o problema em partes lógicas e começo a construir uma solução passo a passo.", targetArea: "Desenvolvimento de Software" },
      { id: "F", label: "Alinho com as pessoas envolvidas para entender prioridades e organizar a entrega.", targetArea: "Gestão de Produtos de Tecnologia" },
      { id: "C", label: "Procuro entender como isso afeta a experiência da pessoa que está usando o sistema.", targetArea: "Design e Experiência do Usuário" },
      { id: "E", label: "Investigo pontos fracos, brechas de segurança ou riscos de falha crítica no processo.", targetArea: "Cibersegurança" },
      { id: "B", label: "Analiso os dados e o histórico disponível para encontrar tendências ou anomalias.", targetArea: "Dados e Inteligência Artificial" },
    ],
  },
  {
    sequence: 2,
    type: "MULTIPLE_CHOICE",
    statement: "Que tipo de atividade no dia a dia traz mais satisfação para você?",
    options: [
      { id: "C", label: "Desenhar interfaces intuitivas e tornar jornadas de uso simples e agradáveis.", targetArea: "Design e Experiência do Usuário" },
      { id: "E", label: "Proteger sistemas contra acessos indevidos e mitigar vulnerabilidades.", targetArea: "Cibersegurança" },
      { id: "A", label: "Escrever código ou criar automações funcionais que resolvem uma tarefa.", targetArea: "Desenvolvimento de Software" },
      { id: "F", label: "Definir a visão de um produto, priorizar recursos e alinhar a equipe ao negócio.", targetArea: "Gestão de Produtos de Tecnologia" },
      { id: "D", label: "Configurar ambientes, servidores e garantir alta disponibilidade sem interrupções.", targetArea: "Infraestrutura e Redes" },
      { id: "B", label: "Extrair conclusões valiosas a partir de grandes volumes de informações.", targetArea: "Dados e Inteligência Artificial" },
    ],
  },
  {
    sequence: 3,
    type: "MULTIPLE_CHOICE",
    statement: "Ao analisar um aplicativo ou sistema famoso, o que costuma chamar mais sua atenção?",
    options: [
      { id: "F", label: "A estratégia de mercado do produto, suas funcionalidades-chave e proposta de valor.", targetArea: "Gestão de Produtos de Tecnologia" },
      { id: "B", label: "Como ele utiliza dados para personalizar recomendações e prever comportamentos.", targetArea: "Dados e Inteligência Artificial" },
      { id: "D", label: "A capacidade do sistema suportar milhões de acessos simultâneos sem cair.", targetArea: "Infraestrutura e Redes" },
      { id: "A", label: "As funcionalidades, a velocidade de execução e a lógica do sistema.", targetArea: "Desenvolvimento de Software" },
      { id: "C", label: "O visual, a facilidade de navegação e o conforto estético e funcional da interface.", targetArea: "Design e Experiência do Usuário" },
      { id: "E", label: "Os métodos de autenticação, privacidade de dados e mecanismos antifraude.", targetArea: "Cibersegurança" },
    ],
  },
  {
    sequence: 4,
    type: "MULTIPLE_CHOICE",
    statement: "Qual dessas tarefas você escolheria realizar em um projeto de tecnologia?",
    options: [
      { id: "E", label: "Realizar testes de invasão e aplicar regras de conformidade e segurança.", targetArea: "Cibersegurança" },
      { id: "C", label: "Entrevistar usuários reais e desenhar protótipos de telas para testes.", targetArea: "Design e Experiência do Usuário" },
      { id: "B", label: "Criar modelos preditivos, dashboards analíticos ou fluxos de dados.", targetArea: "Dados e Inteligência Artificial" },
      { id: "F", label: "Mapear requisitos, negociar prazos e organizar o roadmap do time de desenvolvimento.", targetArea: "Gestão de Produtos de Tecnologia" },
      { id: "D", label: "Orquestrar contêineres, redes virtuais e pipelines de implantação em nuvem.", targetArea: "Infraestrutura e Redes" },
      { id: "A", label: "Desenvolver APIs, bancos de dados ou regras de negócio do sistema.", targetArea: "Desenvolvimento de Software" },
    ],
  },
  {
    sequence: 5,
    type: "MULTIPLE_CHOICE",
    statement: "Pensando no seu impacto ideal em uma empresa, você prefere ser reconhecido por:",
    options: [
      { id: "B", label: "Gerar insights estratégicos baseados em dados que orientam decisões da empresa.", targetArea: "Dados e Inteligência Artificial" },
      { id: "D", label: "Garantir alta disponibilidade na infraestrutura e tempos de resposta rápidos.", targetArea: "Infraestrutura e Redes" },
      { id: "F", label: "Liderar a estratégia do produto e garantir entregas alinhadas aos objetivos de negócio.", targetArea: "Gestão de Produtos de Tecnologia" },
      { id: "E", label: "Manter a empresa protegida contra vazamentos de dados e ataques cibernéticos.", targetArea: "Cibersegurança" },
      { id: "A", label: "Entregar recursos funcionais e códigos limpos e bem estruturados.", targetArea: "Desenvolvimento de Software" },
      { id: "C", label: "Criar produtos que os clientes amam usar pela facilidade e clareza.", targetArea: "Design e Experiência do Usuário" },
    ],
  },
] as const;
