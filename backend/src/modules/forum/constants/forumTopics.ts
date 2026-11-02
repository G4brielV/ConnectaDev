export const FORUM_TOPICS = [
  { slug: "desenvolvimento-de-sistemas", title: "Desenvolvimento de Sistemas", icon: "⌘" },
  { slug: "ia-e-dados", title: "IA e Dados", icon: "◈" },
  { slug: "seguranca-cibernetica", title: "Segurança Cibernética", icon: "◉" },
  { slug: "devops-e-cloud", title: "DevOps e Cloud", icon: "☁" },
  { slug: "ux-ui-e-produto", title: "UX/UI e Produto", icon: "✦" },
  { slug: "carreira-e-estudos", title: "Carreira e Estudos", icon: "↗" },
] as const;

export const FORUM_CONTENT_STATUS = {
  PUBLISHED: "PUBLISHED",
  REMOVED: "REMOVED",
} as const;

export function isForumTopic(slug: string): boolean {
  return FORUM_TOPICS.some((topic) => topic.slug === slug);
}