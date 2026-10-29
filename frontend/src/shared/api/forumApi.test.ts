import assert from "node:assert/strict";
import test from "node:test";
import { createForumComment, createForumPost } from "./forumApi";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("createForumComment sends the authenticated comment payload", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    receivedUrl = String(input);
    receivedInit = init;
    return new Response(
      JSON.stringify({
        id: "comment-1",
        postId: "post-1",
        content: "Comentário de teste",
        createdAt: "2026-10-28T20:00:00.000Z",
        updatedAt: "2026-10-28T20:00:00.000Z",
        author: { id: "user-1", name: "Usuário Teste", image: null },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  const comment = await createForumComment("mock-token", "post-1", "Comentário de teste");
  const headers = receivedInit?.headers as Record<string, string>;

  assert.match(receivedUrl, /\/api\/forum\/posts\/post-1\/comments$/);
  assert.equal(receivedInit?.method, "POST");
  assert.equal(headers.Authorization, "Bearer mock-token");
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(receivedInit?.body, JSON.stringify({ content: "Comentário de teste" }));
  assert.equal(comment.content, "Comentário de teste");
  assert.equal(comment.author.name, "Usuário Teste");
});

test("createForumComment exposes the API validation message", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "O conteúdo é obrigatório." }), { status: 400 });

  await assert.rejects(
    () => createForumComment("mock-token", "post-1", ""),
    { message: "O conteúdo é obrigatório." },
  );
});

test("createForumPost sends the selected topic and post content", async () => {
  let receivedUrl = "";
  let receivedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    receivedUrl = String(input);
    receivedInit = init;
    return new Response(
      JSON.stringify({
        id: "post-1",
        topicSlug: "ia-e-dados",
        title: "Primeiro post",
        content: "Conteúdo do post",
        createdAt: "2026-10-28T20:00:00.000Z",
        updatedAt: "2026-10-28T20:00:00.000Z",
        author: { id: "user-1", name: "Usuário Teste", image: null },
        _count: { comments: 0 },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };

  const post = await createForumPost("mock-token", {
    topicSlug: "ia-e-dados",
    title: "Primeiro post",
    content: "Conteúdo do post",
  });
  const headers = receivedInit?.headers as Record<string, string>;

  assert.match(receivedUrl, /\/api\/forum\/posts$/);
  assert.equal(receivedInit?.method, "POST");
  assert.equal(headers.Authorization, "Bearer mock-token");
  assert.equal(receivedInit?.body, JSON.stringify({
    topicSlug: "ia-e-dados",
    title: "Primeiro post",
    content: "Conteúdo do post",
  }));
  assert.equal(post.topicSlug, "ia-e-dados");
  assert.equal(post.title, "Primeiro post");
});