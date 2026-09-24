# Prompt-base para o Google Stitch

Prefixo obrigatório de todo `generate_screen_from_text` do projeto **ConnectaDev Mobile**. Cole o bloco abaixo e acrescente a descrição da tela em seguida. Fonte: `Identidade_Visual.md`.

```text
Mobile app screen (portrait, iOS/Android, light mode) for "ConnectaDev", a platform that guides high-school students and career changers in Recife (Brazil) into tech: vocational quiz, learning paths, coding challenges, forum, tech events, internship listings and a map of public study spots. Tone: welcoming, technical, community-driven, gamified. All UI text in Brazilian Portuguese.

Design system (strict):
- Primary #036564 (Emerald Teal): primary buttons/CTAs, active states, progress fill, links.
- Secondary #033649 (Deep Petróleo): headers, H2 titles, nav bars.
- Dark #031634 (Midnight Navy): H1 titles, high-contrast text, dark modals.
- Accent #cdb380 (Gold Sand): XP, badges, achievements, highlighted job tags, stars. Never as text on light background.
- Light #e8ddcb (Soft Cream): card backgrounds, subtle borders, neutral tags.
- Canvas #F9F8F5, surface #FFFFFF, body text #222222. Success #198754, danger #d9534f.
- Font: Plus Jakarta Sans (H1 26px bold, H2 20px semibold, H3 16px semibold, body 14px regular). Code/tags: JetBrains Mono 12px medium.
- Radius: 4px small, 8px cards/buttons/inputs, 16px large surfaces, pill for chips.
- Card shadow: 0 4px 12px rgba(3,22,52,0.08). Cards have 1px #e8ddcb border.
- Buttons: 48px tall. Primary = #036564 bg + white text. Secondary = #033649 bg + white text. Outline = 1.5px #036564 border, transparent bg.
- Icons: thin-stroke line icons (Lucide/Feather style, 1.5–2px stroke, 24px grid, rounded ends). No emojis.
- Progress bars: track #e8ddcb, fill #036564. Modality tags (Remoto/Híbrido/Presencial): #e8ddcb bg + #033649 text.
- Bottom tab bar (when present): Início, Revisão, Fórum, Vagas — active tab in #036564, inactive in muted gray.
- Empty states: simple geometric illustration in #033649 with #036564/#cdb380 focal points, always with a next-step CTA.

Screen:
```

## Descrições por tela (adicionar após o prefixo)

| Tela | Descrição sugerida |
| --- | --- |
| Login | Logo no topo, campos e-mail e senha, botão primário "Entrar", link "Criar conta". |
| Register | Nome, e-mail, senha, confirmar senha, botão primário "Cadastrar", link "Já tenho conta". |
| Home | Saudação com nome + avatar com anel de nível, card de XP/streak, atalhos para Quiz, Cursos, Revisão, Vagas, seção "Próximos eventos". |
| ReviewHub | Lista de tópicos por área com progresso, CTA "Revisar agora". |
| KnowledgeReview | Stepper de nós conectados no topo, pergunta, cards de múltipla escolha (seleção com borda 2px #036564), botão "Próxima". |
| ReviewResult | Card escuro #031634 com XP ganho em #cdb380, acertos/erros, botões "Refazer" e "Voltar". |
| Quiz | Igual ao KnowledgeReview, mas perguntas vocacionais; resultado com radar chart. |
| Courses | Lista de cards com thumbnail, título, plataforma (tag), duração. |
| Forum | Feed de discussões com borda 1px #e8ddcb, chip de upvote, badge "Solução". |
| Jobs | Cards com logo da empresa, título, tags de modalidade, borda esquerda 4px #cdb380 quando destaque. |
