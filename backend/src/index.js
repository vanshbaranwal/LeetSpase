import { createServer } from "node:http";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import { db } from "./libs/db.js";
import executionRoute from "./routes/executeCode.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import profileRoutes from "./routes/profile.routes.js";

import { attachCodingSpases } from "./spases/spase.socket.js";
import { spaseRoutes } from "./routes/spase.routes.js";

dotenv.config();

const app = express();
const server = createServer(app);
let isReady = false;
const { finishPreviousSession, startExpiry } = attachCodingSpases(server, { isReady: () => isReady });

app.use(
    cors({
        origin: process.env.FRONTEND_URL?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [],
        credentials: true
    })
);

app.use((req, res, next) => {
    if (!isReady) return res.status(503).set("Retry-After", "1").json({ message: "The backend is starting. Please retry shortly." });
    next();
});

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("LeetSpase🔥 - by VanshBaranwal");
});

app.get("/health", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.status(200).json({
        success: true,
        status: "healthy",
        service: "LeetSpase API",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problems", problemRoutes);
app.use("/api/v1/execute-code", executionRoute);
app.use("/api/v1/submission", submissionRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1/spases", spaseRoutes(finishPreviousSession));

async function startServer(){
    try {
        await db.$connect();
        // Bind first: a duplicate process must not reset presence in a live backend.
        await new Promise((resolve, reject) => {
            const onError = (error) => reject(error.code === "EADDRINUSE"
                ? new Error(`Port ${process.env.PORT} is already in use. Stop the existing backend before starting another copy.`)
                : error);
            server.once("error", onError);
            server.listen(process.env.PORT, "0.0.0.0", () => {
                server.off("error", onError);
                resolve();
            });
        });
        await startExpiry();
        isReady = true;
        console.log(`Database connected; backend listening on port ${process.env.PORT}.`);

    } catch (error) {
        console.error("Backend startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
