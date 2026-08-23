# 🚀 Trilha Tech - Seu Guia para o Futuro em Tecnologia

**Projeto MVP - Disciplina de Engenharia de Software / Projetos Acadêmicos**

O **Trilha Tech** é um aplicativo móvel voltado para jovens do 3º ano do Ensino Médio, vestibulandos e pessoas em transição de carreira residentes na **Região Metropolitana do Recife (RMR)**. O objetivo principal do app é democratizar e orientar o acesso ao ecossistema de tecnologia e inovação de Pernambuco, fornecendo direcionamento personalizado de estudos (ENEM e vestibulares regionais), oportunidades de carreira e integração com o ecossistema local.

Diferente de plataformas genéricas de estudo, o Trilha Tech conecta o perfil do usuário diretamente às demandas e oportunidades do mercado tech de Pernambuco, oferecendo rotas customizadas, geolocalização de eventos/pontos de apoio e acompanhamento contínuo de evolução.

---

## 🚀 Escopo do MVP (Produto Mínimo Viável)

Para esta fase inicial, focamos na entrega do valor central e em funcionalidades estratégicas para direcionamento do estudante:

* **Teste Vocacional & Rota Customizada:** Questionário interativo inicial que mapeia aptidões e interesses do usuário, moldando e recomendando materiais de estudo focados no ENEM e vestibulares da região (ex: SSA/UPE, UFPE, IFPE).
* **Quizzes e Desafios Gamificados:** Avaliação contínua da progressão do usuário com quizes por disciplina/área e desafios práticos para fixação de conhecimento.
* **Geolocalização & Mapa da RMR:** Mapeamento interativo de eventos de tecnologia, feiras de conhecimento, bibliotecas públicas, pontos de apoio e polos de inovação no Grande Recife.
* **Cron Job para Vagas de Estágio:** Automação de varredura (crawler/cron service) para agregação periódica de oportunidades de estágio, jovem aprendiz e bolsas de estudo para a área tech na região.
* **Fórum de Tecnologia:** Comunidade integrada para troca de dúvidas, networking, dicas de estudo e relatos de transição de carreira com mentores e alunos da RMR.

---

## 🛠 Tecnologias Utilizadas

O projeto adota uma arquitetura robusta e escalável dividida em microsserviços/módulos para suportar persistência de dados relacionais e rotinas automatizadas.

* **Front-end:** **React Native** - Para desenvolvimento móvel híbrido (Android/iOS) focado em alta performance, usabilidade e suporte a mapas e geolocalização.
* **Back-end:** **Node.js** (Express / NestJS) - Para construção de APIs RESTful eficientes, gerenciamento das regras de negócio, autenticação e execução do serviço de Cron Job.
* **Banco de Dados:** **PostgreSQL** - Banco de dados relacional escolhido para estruturar adequadamente usuários, fóruns, histórico de quizzes, oportunidades e dados geoespaciais.

---

## ⚙️ Como executar o projeto localmente

*(Instruções para a equipe de desenvolvimento e avaliadores)*

### Pré-requisitos:
* **Node.js** (versão LTS recomendada)
* **PostgreSQL** instalado e executando localmente (ou via Docker)
* Gerenciador de pacotes (**NPM** ou **Yarn**)
* Emulador Android/iOS ou o aplicativo **Expo Go** instalado no smartphone físico.

### Passo a passo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/trilha-tech-app.git
   ```

2. **Acesse a pasta do projeto:**
   ```bash
   cd trilha-tech-app
   ```

3. **Configuração do Backend & Banco de Dados:**
   * Acesse a pasta do backend: `cd backend`
   * Instale as dependências: `npm install`
   * Crie um arquivo `.env` baseado no `.env.example`:
     ```env
     PORT=3000
     DATABASE_URL=postgres://usuario:senha@localhost:5432/trilhatech_db
     JWT_SECRET=sua_chave_secreta
     ```
   * Execute as migrações do banco de dados: `npm run migrate` ou `npx prisma db push`
   * Inicie o servidor backend: `npm run dev`

4. **Configuração do Frontend (React Native):**
   * Em outro terminal, acesse a pasta do frontend: `cd frontend`
   * Instale as dependências: `npm install`
   * Inicie o servidor de desenvolvimento: `npm start` ou `npx expo start`
   * Digitalize o código QR com o app Expo Go no seu celular ou pressione `a` para rodar no emulador Android / `i` no emulador iOS.

---

## 👥 Equipe

* **Luan Vinícius**
* **Gabriel Vinícius**
* **Thalyson Kauan**

---

*Projeto desenvolvido com foco na democratização do acesso à tecnologia e inovação na Região Metropolitana do Recife (RMR).*
