import assert from "node:assert/strict";
import test from "node:test";
import { FORUM_TOPICS, isForumTopic } from "../src/modules/forum/constants/forumTopics";
import { createCommentBodySchema, createPostBodySchema, postReactionBodySchema, postVoteBodySchema } from "../src/modules/forum/schemas/forum.schema";

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
    title: "a".repeat(101),
    content: "conteúdo",
  }).success, false);

  assert.equal(createPostBodySchema.safeParse({
    topicSlug: "ia-e-dados",
    title: "título",
    content: "a".repeat(2001),
  }).success, false);

  assert.deepEqual(createPostBodySchema.parse({
    topicSlug: "ia-e-dados",
    title: "título",
    content: "conteúdo",
    tags: ["#react", "#node"],
  }).tags, ["#react", "#node"]);

  assert.equal(createCommentBodySchema.safeParse({ content: "a".repeat(1001) }).success, false);
  assert.equal(createCommentBodySchema.safeParse({ content: " ".repeat(3) }).success, false);

  assert.equal(postReactionBodySchema.safeParse({ value: "LIKE" }).success, true);
  assert.equal(postReactionBodySchema.safeParse({ value: "DISLIKE" }).success, true);
  assert.equal(postReactionBodySchema.safeParse({ value: "LOVE" }).success, false);
  assert.equal(postVoteBodySchema.safeParse({ voteType: "UPVOTE" }).success, true);
  assert.equal(postVoteBodySchema.safeParse({ voteType: "DOWNVOTE" }).success, true);
  assert.equal(postVoteBodySchema.safeParse({ voteType: "LIKE" }).success, false);
});