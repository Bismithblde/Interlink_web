require("dotenv").config();
const express = require("express");

const defaultAllowedOrigins = ["http://localhost:5173"];

const configureCors = (app) => {
  const allowedOrigins = (
    process.env.CLIENT_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const resolveAllowedOrigin = (origin) => {
    if (!origin) return null;
    if (allowedOrigins.length === 0 && defaultAllowedOrigins.includes(origin)) {
      return origin;
    }
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    return null;
  };

  app.use((req, res, next) => {
    const requestOrigin = req.get("origin");
    const allowOrigin = resolveAllowedOrigin(requestOrigin);

    if (allowOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowOrigin);
      res.setHeader("Vary", "Origin");
    }

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.get("Access-Control-Request-Headers") || "Content-Type,Authorization"
    );
    res.setHeader("Access-Control-Max-Age", "600");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  });
};

const createApp = () => {
  const app = express();

  configureCors(app);

  app.use(express.json());

  const authRoutes = require("./auth/routes");
  app.use("/auth", authRoutes);

  const scheduleRoutes = require("./schedule/routes");
  app.use("/schedules", scheduleRoutes);

  const matchRoutes = require("./matchmaking/routes");
  app.use("/matchmaking", matchRoutes);

  const connectionRoutes = require("./connections/routes");
  app.use("/connections", connectionRoutes);

  const inboxRoutes = require("./inbox/routes");
  app.use("/inbox", inboxRoutes);

  app.get("/", (_req, res) => {
    res.send("Hello from InterLink Backend!");
  });

  return app;
};

module.exports = {
  createApp,
  defaultAllowedOrigins,
};

