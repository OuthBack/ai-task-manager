export const configuration = () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  database: {
    path: process.env.DATABASE_PATH || "./data/tasks.db",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL,
    model: process.env.GEMINI_MODEL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
  nodeEnv: process.env.NODE_ENV || "development",
});
