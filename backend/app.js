import express from "express";
import { config } from "dotenv";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync } from "node:fs";

import dbConnect from "./config/dbConnect.js";
import authRoutes from "./routes/auth.js";
import authMiddleWare from "./middleware/auth.js";
import classRoutes from "./routes/class.js";
import courseRoutes from "./routes/course.js";
import userRoutes from "./routes/user.js";

const app = express();

config();

// Allow the local React development server to call this API.
const clientOrigins = new Set(
  (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
app.use((req, res, next) => {
  if (clientOrigins.has(req.headers.origin)) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-access-token");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

dbConnect();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "API is working" });
});
app.use("/api", authRoutes);
app.use(authMiddleWare);
app.use("/api/user", userRoutes);
// Match the frontend API paths so /api/course is never mistaken for a class ID.
app.use("/api/class", classRoutes);
app.use("/api/course", courseRoutes);

const port = process.env.PORT || 5000;
const host = process.env.HOST || "127.0.0.1";
const onListening = () => console.log(`Server Listening on ${host}:${port}...`);

if (process.env.HTTPS === "true") {
  const key = readFileSync(process.env.SSL_KEY_FILE);
  const cert = readFileSync(process.env.SSL_CRT_FILE);
  createHttpsServer({ key, cert }, app).listen(port, host, onListening);
} else {
  app.listen(port, host, onListening);
}
