# AGENTS.md — Contexto do Sistema e Diretrizes para IA

Este documento contém o contexto técnico, regras de negócio e diretrizes de desenvolvimento para agentes de IA atuando no repositório **ConnectaDev**.

---

## 1. Visão Geral do Sistema

* **Projeto:** ConnectaDev (MVP)
* **Finalidade:** Plataforma móvel para orientação, aprendizado e conexão com o ecossistema de tecnologia de Pernambuco.
* **Público-Alvo:** Alunos do 3º ano do Ensino Médio, vestibulandos e pessoas em transição de carreira na Região Metropolitana do Recife (RMR).
* **Contexto Regional:** ENEM, SSA/UPE, UFPE, UFRPE, IFPE e ecossistema tech local.
* **Princípio:** Simplicidade + Utilidade + Personalização + Contexto Regional.

---

## 2. Arquitetura e Stack Tecnológica

* **Front-end:** React Native (TypeScript)
  * Aplicação mobile hibrida (Android/iOS) com suporte a mapas e geolocalização.
* **Back-end:** Node.js + Fastify (TypeScript)
  * API REST, regras de negócio isoladas, autenticação e rotinas agendadas (Cron Jobs).
* **Banco de Dados:** PostgreSQL
  * Modelagem relacional. Uso de `UUID` para chaves primárias.
* **Autenticação:** Better Auth
  * Gerenciamento nativo de usuários. Entidades do sistema associam-se ao usuário via chave estrangeira `user_id` referenciando `"user"(id)`.

---

## 3. Módulos e Dominio de Negócio

1. **Quiz Vocacional (IA):** Coleta respostas, converte em tags e gera recomendações exploratórias de carreiras/áreas.
2. **Desafios de Código:** Exercícios interativos de lógica, programação e SQL (estilo LeetCode).
3. **Trilhas de Aprendizado:** Roteiros de estudo estruturados por área e objetivo.
4. **Indicação de Cursos:** Curadoria de conteúdos abertos e playlists (ex: YouTube).
5. **Gamificação:** Retenção via pontuação, XP, níveis e ofensivas diárias (*streaks*).
6. **Fórum:** Espaço de discussão, dúvidas e networking comunitário.
7. **Eventos Tech:** Agregação de encontros, feiras e iniciativas na RMR.
8. **Vagas & Oportunidades:** Coleta automática (via Cron Job) de vagas de estágio, jovem aprendiz e bolsas.
9. **Mapa de Infraestrutura Pública:** Geolocalização de bibliotecas, pontos Wi-Fi públicos, polos de inovação e locais de estudo na RMR.

---

## 4. Diretrizes de Engenharia e Código

### 4.1. TypeScript
* Tipagem forte e estrita em todo o código. Proibido o uso de `any`.
* Definição explícita de contratos de entrada/saída (DTOs, Schemas e interfaces de API).

### 4.2. Back-end (Fastify)
* Manter arquitetura modular por componentes/domínios.
* Isolar regras de negócio em camada de serviços (*Use Cases / Services*). Não colocar lógica nas rotas.
* Validar payloads e parâmetros rigorosamente na fronteira da API.

### 4.3. Banco de Dados (PostgreSQL)
* Manter integridade referencial rigorosa (FKs, PKs).
* Usar `UUID` para identificadores únicos.
* Coordenadas geográficas tratadas como `DOUBLE PRECISION` / números.

### 4.4. Front-end (React Native)
* Componentização reutilizável e desacoplada da camada de dados.
* Priorizar usabilidade, navegação fluida e experiência do usuário em dispositivos móveis.

---

## 5. Diretrizes de Comportamento do Agente

* **Simplicidade Pragmática:** Escolha a solução mais simples que atenda ao MVP. Evite abstrações ou engenharia excessiva (*overengineering*).
* **Ausência de Suposições Ocultas:** Se algo não estiver especificado no contexto ou no código, declare a suposição de forma explícita antes da solução.
* **Consistência:** Mantenha os padrões sintáticos, de nomes e de arquitetura já existentes no repositório.

---

## 6. Matriz de Prioridade de Decisão

Em caso de conflito de requisitos, aplique a ordem:

1. Segurança da aplicação e integridade dos dados.
2. Diretrizes deste documento (`AGENTS.md`).
3. Requisitos específicos do módulo em desenvolvimento.
4. Padrões globais do repositório.