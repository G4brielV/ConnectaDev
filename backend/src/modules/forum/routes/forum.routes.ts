import { FastifyInstance } from "fastify";
import {
  createCommentController,
  createPostController,
  getPostController,
  listCommentsController,
  listPostsController,
  listTopicsController,
  removeCommentController,
  removePostController,
  updateCommentController,
  updatePostController,
  reactToPostController,
} from "../controllers/forum.controller";

export async function forumRoutes(fastify: FastifyInstance) {
  fastify.get("/api/forum/topics", listTopicsController);
  fastify.get("/api/forum/posts", listPostsController);
  fastify.get("/api/forum/posts/:postId", getPostController);
  fastify.post("/api/forum/posts", createPostController);
  fastify.patch("/api/forum/posts/:postId", updatePostController);
  fastify.delete("/api/forum/posts/:postId", removePostController);
  fastify.get("/api/forum/posts/:postId/comments", listCommentsController);
  fastify.post("/api/forum/posts/:postId/comments", createCommentController);
  fastify.post("/api/forum/posts/:postId/reactions", reactToPostController);
  fastify.patch("/api/forum/comments/:commentId", updateCommentController);
  fastify.delete("/api/forum/comments/:commentId", removeCommentController);
}