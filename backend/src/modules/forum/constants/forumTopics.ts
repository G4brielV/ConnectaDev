export const FORUM_TOPICS = [
  { slug: "desenvolvimento-de-sistemas", title: "Desenvolvimento de Sistemas" },
  { slug: "ia-e-dados", title: "IA e Dados" },
  { slug: "seguranca-cibernetica", title: "Segurança Cibernética" },
  { slug: "devops-e-cloud", title: "DevOps e Cloud" },
  { slug: "ux-ui-e-produto", title: "UX/UI e Produto" },
  { slug: "carreira-e-estudos", title: "Carreira e Estudos" },
] as const;

export const FORUM_CONTENT_STATUS = {
  PUBLISHED: "PUBLISHED",
  REMOVED: "REMOVED",
} as const;

export function isForumTopic(slug: string): boolean {
  return FORUM_TOPICS.some((topic) => topic.slug === slug);
}