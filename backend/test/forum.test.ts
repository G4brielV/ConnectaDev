import assert from "node:assert/strict";
import test from "node:test";
import { FORUM_TOPICS, isForumTopic } from "../src/modules/forum/constants/forumTopics";
import { createCommentBodySchema, createPostBodySchema } from "../src/modules/forum/schemas/forum.schema";

test("forum exposes the six stable topics", () => {
  assert.equal(FORUM_TOPICS.length, 6);
  assert.equal(isForumTopic("ia-e-dados"), true);
  assert.equal(isForumTopic("ia-dados"), false);
});

test("forum validates post and comment limits", () => {
  const validPost = createPostBodySchema.safeParse({
    topicSlug: "ia-e-dados",
    title: "Um título válido",
    content: "conteúdo",
  });
  assert.equal(validPost.success, true);

  assert.equal(createPostBodySchema.safeParse({
    topicSlug: "ia-e-dados",
    title: "a".repeat(121),
    content: "conteúdo",
  }).success, false);

  assert.equal(createPostBodySchema.safeParse({
    topicSlug: "ia-e-dados",
    title: "título",
    content: "a".repeat(5001),
  }).success, false);

  assert.equal(createCommentBodySchema.safeParse({ content: "a".repeat(2001) }).success, false);
});