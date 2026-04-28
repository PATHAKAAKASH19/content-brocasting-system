import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import storageService from "./services/storage.service.js";

import config from "./config/config.js";
import { validateEnv } from "./config/validateEnv.js";
import supabase from "./config/supabase.js";
import { testDatabaseConnection } from "./utils/dbHelpers.js";


import authRoutes from "./routes/auth.routes.js";
import contentRoutes from "./routes/content.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import broadcastRoutes from "./routes/broadcast.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
validateEnv();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/broadcast", broadcastRoutes);




app.get("/", (req, res) => {
  res.json({
    message: "Content Broadcasting System API",
    status: "running",
    environment: config.nodeEnv,
    endpoints: {
      auth: "/api/auth",
      content: "/api/content",
      schedule: "/api/schedule",
      broadcast: "/api/broadcast",
      health: "/health",
    },
  });
});

app.get("/health", async (req, res) => {
  const dbStatus = await testDatabaseConnection();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

app.use("*path", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

app.listen(config.port, async () => {
  console.log(`server is running on port ${process.env.PORT}`);

  const dbStatus = await testDatabaseConnection();

  await storageService.initBucket();
  if (dbStatus.connected) {
    console.log(`${dbStatus.message}\n`);
  } else {
    console.log(`Database error: ${dbStatus.message}\n`);
  }
});
