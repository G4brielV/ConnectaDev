# ConnectaDev — Manual de Identidade Visual e Diretrizes de UI

> **Versão:** 1.0  |  **Status:** Documento Oficial de Engenharia e Design  |  **Projeto:** ConnectaDev  
> **Data de Emissão:** Setembro de 2026  |  **Público-Alvo:** Equipes de Design, Engenharia de Software e Prompts de IA

---

## 1. Visão Geral e Posicionamento da Marca

### 1.1. Manifesto e Proposta de Valor
O **ConnectaDev** é um ecossistema digital concebido para impulsionar e conectar novos talentos de tecnologia ao mercado de trabalho. Unindo orientação vocacional, formação prática, fórum colaborativo e oportunidades de estágio geolocalizadas, a plataforma transforma o ingresso na área tech em uma jornada estruturada, engajadora e comunitária.

A identidade visual foi desenhada para romper com o padrão genérico e frio de ferramentas corporativas de TI, adotando um equilíbrio entre **rigor técnico** (trilhas de circuito, nós de rede e código) e **calor humano** (paleta com tons terrosos suaves e azul-petróleo acolhedor).

### 1.2. Atributos da Marca e Tom de Voz
* **Acessível e Encorajador:** Comunicação desmistificada, acolhendo quem está no primeiro contato com programação.
* **Técnico e Confiável:** Rigor arquitetural e precisão visual que geram credibilidade junto a empresas recrutadoras.
* **Colaborativo e Horizontal:** Foco em comunidade, mentoria e troca mútua entre estudantes e desenvolvedores experientes.
* **Gamificado e Dinâmico:** Progressão tangível que estimula a continuidade dos estudos através de conquistas e trilhas.

---

## 2. Logotipo e Arquitetura da Marca

### 2.1. Conceito e Anatomia do Símbolo
O símbolo gráfico do ConnectaDev é estruturado por três conceitos centrais interdependentes:
1. **Trilhas de Circuito Integrado:** Representam a infraestrutura técnica, o pensamento lógico e os caminhos de aprendizado.
2. **Nós de Conexão (*Nodes*):** Simbolizam os pontos de contato entre desenvolvedores juniores, empresas parceiras, eventos e comunidades.
3. **Seta Ascendente em 45°:** Expressa a evolução de carreira, o crescimento individual e a entrada triunfante no mercado de trabalho.

### 2.2. Construção Tipográfica (*Wordmark*)
O *wordmark* é construído em fonte sem serifa geométrica humanista em caixa mista, adotando uma diferenciação de pesos para reforçar os dois núcleos do nome:
* **Connecta:** Tipografia em peso *Regular* ou *Medium* (peso 500), simbolizando relacionamento, integração e comunidade.
* **Dev:** Tipografia em peso *Bold* ou *ExtraBold* (peso 700/800), fixando a competência técnica e o perfil desenvolvedor.

### 2.3. Área de Proteção e Reduções Mínimas
A área de respiro mínima ao redor do logotipo corresponde à altura da letra capital **"C"**. Nenhum elemento gráfico, texto ou borda deve invadir este perímetro.

#### Dimensões Mínimas para Reprodução:
* **Mídia Digital (Telas):**
  * Logotipo completo: Mínimo de `140px` de largura.
  * Ícone isolado (Favicon / App Icon): Mínimo de `24x24px`.
* **Mídia Impressa:**
  * Logotipo completo: Mínimo de `35mm` de largura.
  * Ícone isolado: Mínimo de `8x8mm`.

### 2.4. Regras de Uso e Proibições
* 🚫 **Proibido distorcer:** Nunca alterar a proporção horizontal ou vertical da marca.
* 🚫 **Proibido alterar cores fora do manual:** Não utilizar gradientes não homologados ou cores fora da paleta oficial.
* 🚫 **Proibido inverter a direção da seta:** O vetor deve sempre apontar para o quadrante superior direito (crescimento e futuro).
* 🚫 **Proibido aplicar sombras complexas:** O logo não deve conter *drop shadows* difusas ou relevos skeuomórficos.

---

## 3. Paleta Cromática Oficial e Tokens

### 3.1. Matriz de Cores Institucionais e Funcionais

| Amostra | Nome Técnico | HEX | RGB / CMYK | Aplicação Principal na UI |
| :---: | :--- | :---: | :--- | :--- |
| `![#036564](https://img.shields.io/badge/-%23036564-036564)` | **Emerald Teal**<br>*(Primária)* | `#036564` | **RGB:** (3, 101, 100)<br>**CMYK:** C97 M0 Y1 K60 | Botões principais de ação (CTAs), nós ativos, barras de progresso e links de conversão. |
| `![#033649](https://img.shields.io/badge/-%23033649-033649)` | **Deep Petróleo**<br>*(Secundária)* | `#033649` | **RGB:** (3, 54, 73)<br>**CMYK:** C96 M26 Y0 K71 | Headers de navegação, sidebars, títulos H1/H2 e rodapés institucionais. |
| `![#031634](https://img.shields.io/badge/-%23031634-031634)` | **Midnight Navy**<br>*(Fundo Dark / Base)* | `#031634` | **RGB:** (3, 22, 52)<br>**CMYK:** C94 M58 Y0 K80 | Fundo estrutural do Dark Mode, texto de altíssimo contraste e modais complexos. |
| `![#cdb380](https://img.shields.io/badge/-%23cdb380-cdb380)` | **Gold Sand**<br>*(Destaque / Acento)* | `#cdb380` | **RGB:** (205, 179, 128)<br>**CMYK:** C0 M13 Y38 K20 | Sistema de XP, badges de conquistas, tags de vagas em destaque e estrelas de avaliação. |
| `![#e8ddcb](https://img.shields.io/badge/-%23e8ddcb-e8ddcb)` | **Soft Cream**<br>*(Neutro Claro)* | `#e8ddcb` | **RGB:** (232, 221, 203)<br>**CMYK:** C0 M5 Y13 K9 | Cards de vagas, fundos de fórum em Light Mode, bordas suaves e tags neutras. |

### 3.2. Acessibilidade e Contraste (WCAG 2.1)
Para garantir conformidade de nível **AA** e **AAA** com as diretrizes internacionais de acessibilidade (WCAG 2.1):
* **Texto em Fundo Claro (`#e8ddcb`):** Utilizar tipografia em `#031634` (*Contraste 10.8:1 - AAA*) ou `#033649` (*Contraste 8.2:1 - AAA*). **Não** utilizar texto em `#cdb380` sobre fundo claro.
* **Texto em Fundo Escuro (`#031634`):** Utilizar tipografia em `#FFFFFF` (*Contraste 16.5:1 - AAA*) ou `#e8ddcb` (*Contraste 11.2:1 - AAA*).
* **Botões Primários (`#036564`):** Utilizar tipografia branca `#FFFFFF` (*Contraste 4.6:1 - AA para textos normais e AAA para textos grandes/negrito*).

### 3.3. Tokens de Estilo em CSS / Design Tokens

```css
:root {
  /* Cores Institucionais ConnectaDev */
  --cdev-color-primary: #036564;       /* Emerald Teal */
  --cdev-color-secondary: #033649;     /* Deep Petróleo */
  --cdev-color-dark: #031634;          /* Midnight Navy */
  --cdev-color-accent: #cdb380;        /* Gold Sand */
  --cdev-color-light: #e8ddcb;         /* Soft Cream */

  /* Cores de Superfície e Estados */
  --cdev-bg-canvas-light: #F9F8F5;
  --cdev-bg-surface-light: #FFFFFF;
  --cdev-bg-canvas-dark: #031634;
  --cdev-bg-surface-dark: #07224d;

  /* Cores de Feedback e Semântica */
  --cdev-status-success: #198754;
  --cdev-status-warning: #cdb380;
  --cdev-status-danger: #d9534f;
  --cdev-status-info: #036564;

  /* Raios de Borda e Sombras */
  --cdev-radius-sm: 4px;
  --cdev-radius-md: 8px;
  --cdev-radius-lg: 16px;
  --cdev-radius-pill: 9999px;
  --cdev-shadow-card: 0 4px 12px rgba(3, 22, 52, 0.08);
}
```

---

## 4. Sistema Tipográfico

### 4.1. Famílias Tipográficas Homologadas
1. **Tipografia Principal (UI e Institucional):** `Plus Jakarta Sans` *(alternativas fallback: Inter ou Arial)*.  
   Empregada em todos os títulos, botões, navegação e corpo de texto.
2. **Tipografia Monoespaçada (Técnica e Código):** `JetBrains Mono` *(alternativas fallback: Fira Code ou Courier New)*.  
   Empregada em blocos de código do fórum, snippets de tasks técnicas, badges de linguagens e tokens de API.

### 4.2. Escala de Tamanhos e Hierarquia Visual

| Elemento | Família | Tamanho (Desktop / Mobile) | Peso | Cor Padrão |
| :--- | :--- | :---: | :---: | :---: |
| **Título H1** | Plus Jakarta Sans | `32px` / `26px` | Bold (700) | `#031634` |
| **Título H2** | Plus Jakarta Sans | `24px` / `20px` | SemiBold (600) | `#033649` |
| **Título H3** | Plus Jakarta Sans | `18px` / `16px` | SemiBold (600) | `#036564` |
| **Corpo de Texto (Body)** | Plus Jakarta Sans | `15px` / `14px` | Regular (400) | `#222222` |
| **Bloco de Código / Tag** | JetBrains Mono | `13px` / `12px` | Medium (500) | `#033649` |

---

## 5. Especificações Visuais por Épico de Produto

### 5.1. TT-16: Gerenciamento da Gamificação
* **Barras de Progresso e Nível:** Trilhas com base neutra em `#e8ddcb` e preenchimento progressivo em `#036564`, com pulso luminoso ao subir de nível.
* **Distintivos e Badges:** Os selos de maestria adotam gradiente dourado metálico utilizando como base o tom `#cdb380` com contorno sutil em `#033649`.
* **Feedback de Conquista (Modais de XP):** Cards escuros em `#031634` com partículas de iluminação em `#cdb380`.

### 5.2. TT-17: Gerenciamento do Fórum
* **Blocos de Discussão:** Superfícies limpas delimitadas por bordas de `1px` em `#e8ddcb` para manter a clareza de leitura de textos longos.
* **Badge de "Resposta Aceita / Solução":** Fundo em `#036564` com ícone de check e tipografia em branco, posicionando-se de forma destacada no topo da resposta.
* **Votos e Interações:** Botões de upvote estilizados em chips ovais, assumindo preenchimento em `#036564` quando ativados pelo usuário logado.

### 5.3. TT-18 e TT-19: Recomendação de Eventos e Vagas de Estágio
* **Cards de Oportunidade:** Estrutura em card elevado com raio de `8px`, borda sutil e header contendo o logotipo da empresa contratante.
* **Tags de Modalidade:** Tags distintas para Remoto, Híbrido e Presencial, utilizando fundo `#e8ddcb` com texto em `#033649`.
* **Vagas Patrocinadas / Urgentes:** Borda esquerda com destaque de `4px` em `#cdb380` (Gold Sand).

### 5.4. TT-20: Gerenciamento de Geolocalização
* **Pins de Mapa Customizados:** Marcadores vetoriais desenhados em formato de gota invertida com ponto central vazado simulando o nó de circuito da logo. Empresas contratantes recebem pin em `#033649` e eventos comunitários recebem pin em `#036564`.
* **Raio de Proximidade:** Círculo translúcido com preenchimento em `rgba(3, 101, 100, 0.15)` e contorno de `1.5px` em `#036564`.

### 5.5. TT-11 e TT-21: Quiz Vocacional e Curadoria de Cursos
* **Stepper de Etapas do Quiz:** Sequência horizontal de nós conectados por linhas de circuito. A etapa atual é indicada por um anel pulsante em `#036564`.
* **Cards de Seleção Rápida:** Respostas de múltipla escolha apresentadas em cards amplos com efeito hover em `#e8ddcb` e seleção fixa com borda de `2px` em `#036564`.
* **Gráfico de Perfil Vocacional:** Gráfico de teia (*radar chart*) com área preenchida em tom esmeralda e eixos em `#033649`.

### 5.6. TT-1 e TT-7: Gerenciamento de Usuários e Tasks Técnicas
* **Perfis de Desenvolvedor:** Headers modulares com avatar circular delimitado por anel colorido conforme o nível alcançado na plataforma (Bronze, Prata, Ouro em `#cdb380`).
* **Painel de Tasks Técnicas:** Visualização em quadro kanban com cartões concisos, indicadores de prioridade e chips monocromáticos para linguagens de programação.

---

## 6. Biblioteca de Componentes Visuais (UI Components)

### 6.1. Estados de Botões

| Variante | Estado Normal | Estado Hover | Estado Active / Foco |
| :--- | :--- | :--- | :--- |
| **Primary** *(Ação Principal)* | Fundo `#036564` \| Texto Branco | Fundo `#025251` \| Leve elevação | Fundo `#01403f` \| Outline 2px `#cdb380` |
| **Secondary** *(Ação Complementar)* | Fundo `#033649` \| Texto Branco | Fundo `#022735` \| Leve elevação | Fundo `#011d27` \| Outline 2px `#e8ddcb` |
| **Outline / Ghost** | Borda 1.5px `#036564` \| Fundo Transparente | Fundo `#e8ddcb` \| Borda `#036564` | Fundo `#ddcfb9` \| Borda reforçada |

### 6.2. Diretrizes de Ícones e Ilustrações
* **Família de Ícones:** Utilizar pacotes vetoriais com traço regular de `1.5px` a `2px` (como *Lucide Icons* ou *Tabler Icons*), sempre alinhados ao grid de `24x24px`.
* **Terminações e Junções:** Bordas e vértices levemente arredondados (*rounded ends*), alinhando-se organicamente aos circuitos do logotipo ConnectaDev.
* **Ilustrações de Estados Vazios (*Empty States*):** Composições geométricas monocromáticas em `#033649` com pontos focais em `#036564` e `#cdb380`, evitando cenários desoladores e sempre sugerindo um próximo passo de ação ao usuário.

---

## 7. Governança e Atualizações

Qualquer criação de novos componentes, variantes de cor ou alterações no manual de identidade visual devem passar por revisão do time de design e validação de acessibilidade antes de serem incorporados ao repositório central do projeto **ConnectaDev**.