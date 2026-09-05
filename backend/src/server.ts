import "dotenv/config";
import fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.routes";
import { errorHandler } from "./shared/middlewares/errorHandler";

const app = fastify({ logger: true });

// Setup CORS
app.register(cors, {
  origin: true, // Allow all origins for mobile dev
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

// Setup Error Handler
app.setErrorHandler(errorHandler);

// Register routes
app.register(authRoutes);

// Health check
app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
