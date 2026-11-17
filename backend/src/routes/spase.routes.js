
import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createSpase, joinSpase, openSession, isSpaseId, spaseError } from "../spases/spase.service.js";

const attempts = new Map();
const limitWindow = 60_000;

const limitSpaseRequests = (userId, action, max) => {
    const now = Date.now();
    for (const [key, item] of attempts) {
        if (item.expiresAt <= now) attempts.delete(key);
    }
    const key = `${action}:${userId}`;
    const entry = attempts.get(key) ?? { count: 0, expiresAt: now + limitWindow };
    if (entry.count >= max) throw spaseError(429, "TOO_MANY_ATTEMPTS", "Too many spase requests. Try again in a minute.");
    entry.count++;
    attempts.set(key, entry);
};

export const ticketOptions = { audience: "leetspase-spase", algorithms: ["HS256"] };

export function spaseRoutes(onTakeover) {
    const router = express.Router();
    router.use(authMiddleware);

    const handle = (fn) => async (req, res) => {
        try {
            res.set("Cache-Control", "no-store");
            await fn(req, res);
        } catch (error) {
            if (!error.status) console.error("Coding spase request failed", error);
            res.status(error.status ?? 500).json({
                code: error.status ? error.code : "SPASE_ERROR",
                message: error.status ? error.message : "The spase request could not be completed.",
            });
        }
    };

    router.post("/", handle(async (req, res) => {
        limitSpaseRequests(req.user.id, "create", 6);
        const spase = await createSpase(req.user.id, req.body?.guestMode);
        res.status(201).json(spase);
    }));

    router.post("/join", handle(async (req, res) => {
        limitSpaseRequests(req.user.id, "join", 12);
        res.json(await joinSpase(req.body?.code, req.user.id));
    }));

    router.post("/:spaseId/session", handle(async (req, res) => {
        const { spaseId } = req.params;
        const requestedSessionId = req.body?.sessionId;
        if (requestedSessionId != null && !isSpaseId(requestedSessionId)) {
            throw spaseError(400, "INVALID_SESSION", "That spase session is invalid.");
        }
        limitSpaseRequests(req.user.id, "session", 30);
        const sessionId = await openSession(spaseId, req.user.id, requestedSessionId);
        if (!requestedSessionId) await onTakeover(spaseId, req.user.id, sessionId);
        const ticket = jwt.sign({ spaseId, userId: req.user.id, sessionId }, process.env.JWT_SECRET, {
            algorithm: "HS256", audience: ticketOptions.audience, expiresIn: "45s",
        });
        res.json({ ticket, sessionId });
    }));

    return router;
}
