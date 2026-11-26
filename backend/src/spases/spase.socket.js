
import { connectVisit, disconnectVisit, expireVisits, endSpase } from "./spase.history.js";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { ticketOptions } from "../routes/spase.routes.js";
import {
    chooseProblem, editDocument, leaveSpase, listMembers, listSpaseJobs, readSpaseDocument,
    removeMember, renewSession, requireSession, spaseError, spaseSummary, withSpase,
} from "./spase.service.js";
import { enqueueSpaseJob, startSpaseQueue } from "./spase.queue.js";
import { createSpaseExpiry } from "./spase.expiry.js";

const channel = (spaseId) => `coding-spase:${spaseId}`;
const memberKey = (spaseId, userId) => `${spaseId}:${userId}`;
const errorPayload = (error) => {
    if (!error.status) console.error("Coding spase event failed", error);
    return {
        ok: false, code: error.status ? error.code : "SPASE_ERROR",
        message: error.status ? error.message : "The spase request could not be completed.",
    };
};

export function attachCodingSpases(server, { isReady = () => true } = {}) {
    const origins = new Set(process.env.FRONTEND_URL?.split(",").map((value) => value.trim()).filter(Boolean));
    const io = new Server(server, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        cors: { origin: [...origins] },
        allowRequest: (request, done) => done(null, isReady() && origins.has(request.headers.origin)),
        maxHttpBufferSize: 512 * 1024,
    });
    const connected = new Map();
    const queue = startSpaseQueue(io, channel);
    const expiry = createSpaseExpiry(withSpase, (spaseId) =>
        [...connected.values()].some((socket) => socket.connected && socket.data.identity.spaseId === spaseId));

    const evict = (socket, code, message) => {
        socket.emit("spase:ended", { code, message });
        socket.disconnect(true);
    };

    const finishPreviousSession = (spaseId, userId, sessionId) => {
        const current = connected.get(memberKey(spaseId, userId));
        if (current && current.data.identity.sessionId !== sessionId) {
            evict(current, "SESSION_REPLACED", "Spase opened in another tab.");
        }
    };

    const publishMembers = (spaseId) => withSpase(spaseId, async (tx, spase) => {
        await expiry.updatePresence(tx, spase);
        await expireVisits(tx, spaseId);
        const members = await listMembers(tx, spase);
        const roster = members.map((member) => {
            const participant = connected.get(memberKey(spaseId, member.id));
            if (participant) {
                participant.data.canEdit = member.role !== "VIEWER";
                participant.data.colorIndex = member.colorIndex;
            }
            return { ...member, online: Boolean(participant) };
        });
        io.to(channel(spaseId)).emit("spase:members", roster);
    });

    const publishMembersSafely = (spaseId) => void publishMembers(spaseId).catch((error) => {
        if (error.code !== "SPASE_UNAVAILABLE") console.error("Could not update spase presence", error);
    });

    io.use(async (socket, next) => {
        try {
            const identity = jwt.verify(socket.handshake.auth?.ticket, process.env.JWT_SECRET, ticketOptions);
            socket.data.identity = identity;
            await renewSession(identity.spaseId, identity);
            next();
        } catch (error) {
            const invalid = error.status ? errorPayload(error) : { code: "INVALID_TICKET", message: "Reconnect to your spase." };
            const failure = new Error(invalid.message);
            failure.data = { code: invalid.code };
            next(failure);
        }
    });

    io.on("connection", (socket) => {
        const identity = socket.data.identity;
        const { spaseId, userId } = identity;
        const key = memberKey(spaseId, userId);
        const spaseChannel = channel(spaseId);

        const requireCurrentSocket = () => {
            if (connected.get(key) !== socket) throw spaseError(409, "SESSION_REPLACED", "Spase opened in another tab.");
        };

        const register = (event, permission, action, after, { acknowledgeBeforeBroadcast = false } = {}) => {
            socket.on(event, async (payload, ack) => {
                if (typeof ack !== "function") return;
                let acknowledged = false;
                try {
                    requireCurrentSocket();
                    const result = await withSpase(spaseId, async (tx, spase) => {
                        requireCurrentSocket();
                        const member = await requireSession(tx, spase, identity, permission);
                        return action(tx, spase, payload, member);
                    });
                    const reply = { ok: true, ...result?.response };
                    if (acknowledgeBeforeBroadcast) {
                        ack(reply);
                        acknowledged = true;
                    }
                    if (after) await after(result, payload);
                    if (!acknowledged) ack(reply);
                } catch (error) {
                    const reply = errorPayload(error);
                    if (!acknowledged) ack(reply);
                }
            });
        };

        register("spase:sync", undefined, async (tx, spase, _, member) => {
            const document = await readSpaseDocument(tx, spase);
            return { response: {
                spase: spaseSummary(spase), document, jobs: await listSpaseJobs(tx, spaseId),
                canEdit: member.canEdit, isHost: member.isHost,
            } };
        }, () => { publishMembersSafely(spaseId); queue.kick(spaseId); });

        register("spase:problem", "host",
            (tx, spase, payload) => chooseProblem(tx, spase, payload?.problemId, payload?.language, userId),
            (selection) => io.to(spaseChannel).emit("spase:workspace", selection));

        register("spase:edit", "edit",
            (tx, spase, payload) => editDocument(tx, spase, payload, payload?.update),
            (_, payload) => socket.to(spaseChannel).emit("spase:edit", payload));

        register("spase:execute", "edit",
            (tx, spase, payload, member) => enqueueSpaseJob(tx, spase, identity, member, payload),
            async () => { await queue.emitJobs(spaseId); queue.kick(spaseId); });

        register("spase:remove", "host",
            (tx, spase, payload) => removeMember(tx, spase, payload?.userId),
            async (_, payload) => {
                const removed = connected.get(memberKey(spaseId, payload.userId));
                if (removed) evict(removed, "SPASE_FORBIDDEN", "The host removed you from the spase.");
                await publishMembers(spaseId);
            });

        register("spase:leave", undefined,
            (tx, spase, payload) => leaveSpase(tx, spase, userId, payload?.nextHostId),
            () => evict(socket, "SPASE_LEFT", "You left the spase."),
            { acknowledgeBeforeBroadcast: true });

        register("spase:end", "host", (tx, spase) => endSpase(tx, spase, "HOST_ENDED", userId), () => {
            io.to(spaseChannel).emit("spase:ended", { code: "SPASE_UNAVAILABLE", message: "The host ended the spase." });
            io.in(spaseChannel).disconnectSockets();
        }, { acknowledgeBeforeBroadcast: true });

        let cursorAt = 0;
        socket.on("spase:cursor", (payload) => {
            if (!socket.data.canEdit || connected.get(key) !== socket || Date.now() - cursorAt < 65) return;
            const { anchor, head, problemId, language, revision } = payload ?? {};
            if (!Buffer.isBuffer(anchor) || !Buffer.isBuffer(head) || anchor.length > 64 || head.length > 64 ||
                typeof problemId !== "string" || problemId.length > 40 ||
                typeof language !== "string" || language.length > 16 || !Number.isInteger(revision)) return;

            cursorAt = Date.now();
            socket.to(spaseChannel).volatile.emit("spase:cursor", {
                anchor, head, problemId, language, revision, userId, name: socket.data.displayName,
                colorIndex: socket.data.colorIndex,
            });
        });

        const heartbeat = setInterval(() => {
            if (connected.get(key) !== socket) return;
            void renewSession(spaseId, identity).then(() => {
                publishMembersSafely(spaseId);
            }).catch((error) => {
                const details = errorPayload(error);
                evict(socket, details.code, details.message);
            });
        }, 20_000);
        heartbeat.unref();

        socket.on("disconnect", () => {
            clearInterval(heartbeat);
            if (connected.get(key) !== socket) return;
            connected.delete(key);
            io.to(spaseChannel).emit("spase:cursor-left", userId);
            void withSpase(spaseId, async (tx, spase) => {
                // A reconnect may have won the lock while this disconnect waited.
                if (connected.has(key)) return;
                await disconnectVisit(tx, spaseId, identity);
                await expiry.updatePresence(tx, spase);
            }).then(() => publishMembersSafely(spaseId)).catch((error) => {
                if (error.code !== "SPASE_UNAVAILABLE") console.error("Could not record disconnect", error);
            });
        });

        void withSpase(spaseId, async (tx, spase) => {
            const member = await requireSession(tx, spase, identity);
            if (!socket.connected) return;
            const previous = connected.get(key);
            if (previous) evict(previous, "SESSION_REPLACED", "Spase opened in another tab.");
            socket.data.canEdit = member.canEdit;
            socket.data.displayName = member.displayName;
            socket.data.colorIndex = member.colorIndex;
            connected.set(key, socket);
            await socket.join(spaseChannel);
            await connectVisit(tx, spase, identity);
            await expiry.updatePresence(tx, spase);
        }).then(() => {
            if (socket.connected && connected.get(key) === socket) {
                socket.emit("spase:ready");
                publishMembersSafely(spaseId);
            }
        }).catch((error) => {
            const details = errorPayload(error);
            evict(socket, details.code, details.message);
        });
    });

    let stopExpiry;
    io.engine.on("close", () => stopExpiry?.());
    const startExpiry = async () => { stopExpiry = await expiry.start(); };
    return { io, finishPreviousSession, startExpiry };
}
