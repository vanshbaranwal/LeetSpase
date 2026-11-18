// Local integration check: isolated PostgreSQL schema, real HTTP + Socket.IO,
// and a deterministic local CodeBox stand-in. Requires frontend dependencies.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import * as Y from "yjs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

dotenv.config({ quiet: true });
const originalUrl = new URL(process.env.DATABASE_URL);
assert(["localhost", "127.0.0.1"].includes(originalUrl.hostname), "This check only runs against local PostgreSQL.");
const schema = "spase_history_test_" + randomUUID().replaceAll("-", "");
const adminDb = new pg.Client({ connectionString: originalUrl.toString() });
const sockets = [];
const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const { io: connect } = requireFrontend("socket.io-client");
let database, http, coding, judge, stopExpiry;
const waitUntil = async (fn, message) => {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await fn()) return;
        await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw Error(message);
};
const listen = (server) => new Promise((resolve) => server.listen(0, "0.0.0.0", () => resolve("http://127.0.0.1:" + server.address().port)));
try {
    await adminDb.connect();
    await adminDb.query('CREATE SCHEMA "' + schema + '"');
    const sql = execFileSync(process.execPath, [
        fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url)),
        "migrate", "diff", "--from-empty", "--to-schema-datamodel",
        fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url)), "--script",
    ], { encoding: "utf8" });
    await adminDb.query('SET search_path TO "' + schema + '"');
    await adminDb.query(sql);
    originalUrl.searchParams.set("schema", schema);
    process.env.DATABASE_URL = originalUrl.toString();
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.JWT_SECRET = randomUUID();
    process.env.JUDGE0_API_KEY = "local-test-only";
    const tokens = new Map();
    let failJudge = false;
    let runtimeError = false;
    judge = createServer(async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (failJudge) { res.statusCode = 503; res.end(JSON.stringify({ error: "Simulated judge outage" })); return; }
        if (req.method === "POST") {
            let body = ""; for await (const part of req) body += part;
            res.end(JSON.stringify(JSON.parse(body).submissions.map((submission) => {
                const token = randomUUID();
                tokens.set(token, String(submission.stdin.trim().split(/\s+/).map(Number).reduce((a, b) => a + b, 0)));
                return { token };
            })));
        } else {
            const url = new URL(req.url, "http://localhost");
            res.end(JSON.stringify({ submissions: url.searchParams.get("tokens").split(",").map((token) => ({
                token, stdout: runtimeError ? null : tokens.get(token), stderr: runtimeError ? "Traceback (most recent call last):\nNameError: undefined variable" : null, compile_output: null, time: "0.01", memory: 1024,
                status: runtimeError ? { id: 11, description: "Runtime Error" } : { id: 3, description: "Accepted" },
            })) }));
        }
    });
    process.env.JUDGE0_API_URL = await listen(judge);
    database = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
    globalThis.prisma = database;
    const service = await import("../src/spases/spase.service.js");
    const history = await import("../src/spases/spase.history.js");
    const { attachCodingSpases } = await import("../src/spases/spase.socket.js");
    const { spaseRoutes } = await import("../src/routes/spase.routes.js");
    const { default: adminRoutes } = await import("../src/routes/admin.routes.js");
    const { deleteAccount } = await import("../src/controllers/profile.controller.js");
    const app = express();
    app.use(express.json(), cookieParser());
    http = createServer(app);
    coding = attachCodingSpases(http);
    app.use("/api/v1/spases", spaseRoutes(coding.finishPreviousSession));
    app.use("/api/v1/admin", adminRoutes);
    const { authMiddleware } = await import("../src/middleware/auth.middleware.js");
    app.delete("/account", authMiddleware, deleteAccount);
    const base = await listen(http);
    const users = await Promise.all(["host", "member", "other", "admin"].map((name) =>
        database.user.create({ data: { name, username: name, email: name + "@history.test", role: name === "admin" ? "ADMIN" : "USER" } })));
    const [host, member, other, admin] = users;
    const request = async (user, path, method = "GET", body) => {
        const response = await fetch(base + path, { method,
            headers: { Cookie: "jwt=" + jwt.sign({ id: user.id }, process.env.JWT_SECRET),
                "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
        return { status: response.status, data: await response.json() };
    };
    const ok = async (...args) => {
        const response = await request(...args);
        assert(response.status < 300, JSON.stringify(response));
        return response.data;
    };
    const open = async (spase, user, sessionId) => {
        const ticket = await ok(user, "/api/v1/spases/" + spase.id + "/session", "POST", sessionId ? { sessionId } : {});
        const socket = connect(base, { transports: ["websocket"], auth: { ticket: ticket.ticket },
            extraHeaders: { Origin: process.env.FRONTEND_URL }, reconnection: false });
        sockets.push(socket);
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(Error("Socket did not become ready")), 5000);
            socket.once("spase:ready", () => { clearTimeout(timeout); resolve(); });
            socket.once("connect_error", (error) => { clearTimeout(timeout); reject(error); });
        });
        return { socket, sessionId: ticket.sessionId };
    };
    const event = (socket, name, payload = {}) => new Promise((resolve, reject) => {
        socket.timeout(5000).emit(name, payload, (error, result) => error ? reject(error) : resolve(result));
    });
    const spase = await ok(host, "/api/v1/spases", "POST", { guestMode: "EDITOR" });
    assert.equal(await database.codingSpaseVisit.count(), 0, "Creating/reserving does not invent attendance.");
    assert.equal((await request(host, "/api/v1/admin/spases")).status, 403);
    const anonymous = await fetch(base + "/api/v1/admin/spases");
    assert.equal(anonymous.status, 401);
    let hostConnection = await open(spase, host);
    await ok(member, "/api/v1/spases/join", "POST", { code: spase.code });
    let memberConnection = await open(spase, member);
    assert.equal(await database.codingSpaseVisit.count(), 2);
    const beforeDuplicate = await database.codingSpaseVisit.findMany({ orderBy: { id: "asc" } });
    await assert.rejects(promisify(execFile)(process.execPath, ["src/index.js"], {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env: { ...process.env, PORT: String(http.address().port) }, timeout: 10000,
    }), (error) => error.code === 1 && error.stderr.includes("already in use"));
    assert.deepEqual(await database.codingSpaseVisit.findMany({ orderBy: { id: "asc" } }), beforeDuplicate,
        "A duplicate backend must not reset active visits.");
    memberConnection.socket.disconnect();
    await waitUntil(async () => Boolean((await database.codingSpaseVisit.findFirst({ where: { sessionId: memberConnection.sessionId } })).disconnectedAt), "Disconnect not tracked");
    memberConnection = await open(spase, member, memberConnection.sessionId);
    assert.equal(await database.codingSpaseVisit.count(), 2, "Reconnect must resume the visit.");
    memberConnection = await open(spase, member);
    assert.equal(await database.codingSpaseVisit.count({ where: { leaveReason: "TAB_REPLACED" } }), 1);
    assert.equal((await event(memberConnection.socket, "spase:leave")).ok, true);
    assert.equal(await database.codingSpaseVisit.count({ where: { leaveReason: "LEFT" } }), 1);
    await ok(member, "/api/v1/spases/join", "POST", { code: spase.code });
    memberConnection = await open(spase, member);
    assert.equal((await event(hostConnection.socket, "spase:remove", { userId: member.id })).ok, true);
    assert.equal(await database.codingSpaseVisit.count({ where: { leaveReason: "REMOVED" } }), 1);
    await ok(other, "/api/v1/spases/join", "POST", { code: spase.code });
    const otherConnection = await open(spase, other);
    const problem = await database.problem.create({ data: {
        title: "History test sum", titleKey: "history-test-sum", description: "Sum two integers.", difficulty: "EASY",
        tags: ["Math"], userId: admin.id, examples: [], constraints: "Small integers",
        testcases: [{ input: "1 2", output: "3" }, { input: "2 3", output: "5" }],
        codeSnippet: { PYTHON: "print(sum(map(int, input().split())))", JAVASCRIPT: "console.log(3)" }, referenceSolutions: {},
    } });
    assert.equal((await event(hostConnection.socket, "spase:problem", { problemId: problem.id, language: "PYTHON" })).ok, true);
    assert.equal((await event(hostConnection.socket, "spase:problem", { problemId: problem.id, language: "JAVASCRIPT" })).ok, true);
    assert.equal((await event(hostConnection.socket, "spase:problem", { problemId: problem.id, language: "PYTHON" })).ok, true);
    assert.equal(await database.codingSpaseActivity.count(), 3);
    const editTarget = await database.codingSpase.findUnique({ where: { id: spase.id } });
    const baseDocument = await database.codingSpaseDocument.findFirst({ where: { spaseId: spase.id, language: "PYTHON" } });
    const firstDoc = new Y.Doc(), secondDoc = new Y.Doc();
    Y.applyUpdate(firstDoc, baseDocument.state); Y.applyUpdate(secondDoc, baseDocument.state);
    const vector = Y.encodeStateVector(firstDoc);
    firstDoc.getText("code").insert(0, "# Host edit\n"); secondDoc.getText("code").insert(0, "# Member edit\n");
    const target = { problemId: problem.id, language: "PYTHON", revision: editTarget.revision };
    const updates = await Promise.all([
        event(hostConnection.socket, "spase:edit", { ...target, update: Buffer.from(Y.encodeStateAsUpdate(firstDoc, vector)) }),
        event(otherConnection.socket, "spase:edit", { ...target, update: Buffer.from(Y.encodeStateAsUpdate(secondDoc, vector)) }),
    ]);
    assert(updates.every((reply) => reply.ok));
    const merged = new Y.Doc();
    Y.applyUpdate(merged, (await database.codingSpaseDocument.findFirst({ where: { spaseId: spase.id, language: "PYTHON" } })).state);
    assert(merged.getText("code").toString().includes("# Host edit"));
    assert(merged.getText("code").toString().includes("# Member edit"));
    assert.equal((await event(hostConnection.socket, "spase:edit", { ...target, revision: target.revision - 1, update: Buffer.from([0]) })).code, "PROBLEM_CHANGED");
    firstDoc.destroy(); secondDoc.destroy(); merged.destroy();
    const synchronizedJobs = [];
    otherConnection.socket.on("spase:jobs", (jobs) => synchronizedJobs.push(...jobs));
    for (const mode of ["run", "submit"]) {
        const snapshot = await database.codingSpase.findUnique({ where: { id: spase.id } });
        const requestId = randomUUID();
        assert.equal((await event(hostConnection.socket, "spase:execute", {
            mode, requestId, problemId: problem.id, language: "PYTHON", revision: snapshot.revision,
        })).ok, true);
        await waitUntil(async () => (await database.codingSpaseJob.findFirst({ where: { requestId } }))?.state === "FINISHED", "Execution did not finish");
        const job = await database.codingSpaseJob.findFirst({ where: { requestId } });
        assert(job.startedAt && job.completedAt && job.completedAt >= job.startedAt);
        assert.equal(job.problemTitle, problem.title);
        assert.equal(job.result.status, "accepted");
        assert(Array.isArray(job.result.testCases), "Run and Submit must include shared diagnostic details.");
        await waitUntil(() => synchronizedJobs.some((item) => item.id === job.id && item.state === "FINISHED"), "Result not synchronized");
    }
    runtimeError = true;
    const diagnosticRequest = randomUUID();
    const diagnosticSnapshot = await database.codingSpase.findUnique({ where: { id: spase.id } });
    assert.equal((await event(hostConnection.socket, "spase:execute", {
        mode: "submit", requestId: diagnosticRequest, problemId: problem.id, language: "PYTHON", revision: diagnosticSnapshot.revision,
    })).ok, true);
    await waitUntil(async () => (await database.codingSpaseJob.findFirst({ where: { requestId: diagnosticRequest } }))?.state === "FINISHED", "Diagnostic submit did not complete");
    const diagnosticJob = await database.codingSpaseJob.findFirst({ where: { requestId: diagnosticRequest } });
    assert.equal(diagnosticJob.result.status, "wrong answer");
    assert(diagnosticJob.result.testCases[0].stderr.includes("NameError"));
    await waitUntil(() => synchronizedJobs.some((job) => job.id === diagnosticJob.id && job.result?.testCases?.[0].stderr.includes("NameError")), "Submit diagnostics were not shared");
    runtimeError = false;
    failJudge = true;
    const failedRequest = randomUUID();
    const snapshot = await database.codingSpase.findUnique({ where: { id: spase.id } });
    const failedPayload = { mode: "run", requestId: failedRequest, problemId: problem.id, language: "PYTHON", revision: snapshot.revision };
    assert.equal((await event(hostConnection.socket, "spase:execute", failedPayload)).ok, true);
    await waitUntil(async () => (await database.codingSpaseJob.findFirst({ where: { requestId: failedRequest } }))?.state === "FAILED", "Judge failure not tracked");
    assert((await database.codingSpaseJob.findFirst({ where: { requestId: failedRequest } })).completedAt);
    failJudge = false;
    assert.equal((await event(hostConnection.socket, "spase:execute", failedPayload)).ok, true);
    assert.equal(await database.codingSpaseJob.count(), 4, "Retried request IDs must not create duplicate jobs.");
    let details = await ok(admin, "/api/v1/admin/spases/" + spase.id);
    assert.equal(details.spase.uniqueParticipants, 3);
    assert.equal(details.jobs.total, 4);
    assert(!JSON.stringify(details).includes("sourceCode"), "Admin lists must omit code snapshots.");
    assert(!JSON.stringify(details).includes("testCases"), "Admin lists must omit judge output blobs.");
    const totals = (await ok(admin, "/api/v1/admin/spases")).totals;
    assert.deepEqual(totals, { total: 1, ended: 0, active: 1, inactive: 0 });
    assert.equal((await ok(admin, "/api/v1/admin/spases?status=ACTIVE&q=other")).total, 1);
    assert.equal((await request(admin, "/api/v1/admin/spases?from=2026-02-30")).status, 400);
    assert.equal((await request(admin, "/api/v1/admin/spases?page=-1")).status, 400);
    assert.equal((await request(admin, "/api/v1/admin/spases?status=FAKE")).status, 400);
    assert.equal((await event(hostConnection.socket, "spase:leave", { nextHostId: other.id })).ok, true);
    const transferred = await database.codingSpase.findUnique({ where: { id: spase.id } });
    assert.equal(transferred.creatorId, host.id);
    assert.equal(transferred.hostId, other.id);
    assert.equal((await event(otherConnection.socket, "spase:end")).ok, true);
    assert.equal(await database.codingSpaseVisit.count({ where: { leftAt: null } }), 0);
    details = await ok(admin, "/api/v1/admin/spases/" + spase.id);
    assert.equal(details.spase.endedBy.id, other.id);
    assert.equal(details.spase.closeReason, "HOST_ENDED");
    await database.user.delete({ where: { id: other.id } });
    details = await ok(admin, "/api/v1/admin/spases/" + spase.id);
    assert.equal(details.spase.host, null);
    assert.equal(details.spase.uniqueParticipants, 3);
    assert.equal(details.participants.items.find((person) => !person.user).visitCount, 1);
    const empty = await service.createSpase(host.id, "VIEWER");
    await database.codingSpase.update({ where: { id: empty.id }, data: { emptySince: new Date(Date.now() - 301000) } });
    await assert.rejects(service.withSpase(empty.id, () => {}), { code: "SPASE_UNAVAILABLE" });
    const expired = await database.codingSpase.findUnique({ where: { id: empty.id } });
    assert.equal(expired.closeReason, "EMPTY_TIMEOUT");
    assert(expired.closedAt && !expired.code);
    const viewerSpase = await service.createSpase(host.id, "VIEWER");
    hostConnection = await open(viewerSpase, host);
    await service.joinSpase(viewerSpase.code, member.id);
    memberConnection = await open(viewerSpase, member);
    const extras = await Promise.all([0, 1, 2, 3].map((index) => database.user.create({
        data: { username: "capacity" + index, email: "capacity" + index + "@history.test" },
    })));
    for (const guest of extras.slice(0, 3)) await service.joinSpase(viewerSpase.code, guest.id);
    await assert.rejects(service.joinSpase(viewerSpase.code, extras[3].id), { code: "SPASE_FULL" });
    const roster = await service.withSpase(viewerSpase.id, service.listMembers);
    assert.equal(roster.length, 5);
    assert.equal(new Set(roster.map(({ colorIndex }) => colorIndex)).size, 5);
    assert.equal((await event(memberConnection.socket, "spase:execute", { mode: "run", requestId: randomUUID() })).code, "SPASE_FORBIDDEN");
    assert.equal((await event(memberConnection.socket, "spase:edit", { update: Buffer.from([0]) })).code, "SPASE_FORBIDDEN");
    assert.equal((await event(memberConnection.socket, "spase:end")).code, "SPASE_FORBIDDEN");
    assert.equal((await event(memberConnection.socket, "spase:problem", { problemId: problem.id })).code, "SPASE_FORBIDDEN");
    memberConnection.socket.disconnect();
    await waitUntil(async () => Boolean((await database.codingSpaseVisit.findFirst({ where: { sessionId: memberConnection.sessionId } })).disconnectedAt), "Viewer disconnect not tracked");
    const staleTime = new Date(Date.now() - 70000);
    await database.codingSpaseVisit.updateMany({ where: { sessionId: memberConnection.sessionId }, data: { lastSeenAt: staleTime } });
    await service.withSpase(viewerSpase.id, (tx) => history.expireVisits(tx, viewerSpase.id));
    assert.equal(await database.codingSpaseVisit.count({ where: { leaveReason: "CONNECTION_LOST" } }), 1);
    memberConnection = await open(viewerSpase, member, memberConnection.sessionId);
    assert.equal(await database.codingSpaseVisit.count({ where: { sessionId: memberConnection.sessionId } }), 2);
    assert.equal((await request(host, "/account", "DELETE", { confirmation: "DELETE" })).status, 200);
    const deletedHost = await database.codingSpase.findUnique({ where: { id: viewerSpase.id } });
    assert.equal(deletedHost.closeReason, "HOST_ACCOUNT_DELETED");
    assert.equal(deletedHost.hostId, null);
    for (let i = 0; i < 23; i++) await service.createSpase(admin.id, "EDITOR");
    const pageOne = await ok(admin, "/api/v1/admin/spases");
    const pageTwo = await ok(admin, "/api/v1/admin/spases?page=2");
    assert.equal(pageOne.items.length, 20);
    assert.equal(pageTwo.items.length, 6);
    assert.equal(pageOne.total, 26);
    assert(!pageOne.items.some((item) => pageTwo.items.some((otherItem) => otherItem.id === item.id)));
    assert.equal(pageOne.totals.total, pageOne.totals.active + pageOne.totals.ended + pageOne.totals.inactive);
    const recoveryId = pageOne.items[0].id;
    const sweepId = pageOne.items[1].id;
    await service.withSpase(recoveryId, async (tx, snapshot) => {
        await history.connectVisit(tx, snapshot, { userId: admin.id, sessionId: randomUUID() });
        await tx.codingSpaseVisit.updateMany({ where: { spaseId: recoveryId }, data: { lastSeenAt: new Date(Date.now() - 70000) } });
        await tx.codingSpase.update({ where: { id: recoveryId }, data: { emptySince: null, lastOccupiedAt: new Date(Date.now() - 70000) } });
    });
    await database.codingSpase.update({ where: { id: sweepId }, data: { emptySince: new Date(Date.now() - 301000) } });
    const { createSpaseExpiry } = await import("../src/spases/spase.expiry.js");
    stopExpiry = await createSpaseExpiry(service.withSpase, () => false).start();
    assert.equal((await database.codingSpaseVisit.findFirst({ where: { spaseId: recoveryId } })).leaveReason, "CONNECTION_LOST");
    assert((await database.codingSpase.findUnique({ where: { id: recoveryId } })).emptySince);
    assert.equal((await database.codingSpase.findUnique({ where: { id: sweepId } })).closeReason, "EMPTY_TIMEOUT");
    console.log("PASS: socket-confirmed visits, reconnects, tab replacement, departures, removal, host transfer/end, execution timestamps and shared results, expiry, deleted-account retention, admin authorization, filters, and pagination.");
} finally {
    stopExpiry?.();
    if (database) await database.codingSpase.updateMany({ where: { closedAt: null }, data: { closedAt: new Date(), code: null } });
    sockets.forEach((socket) => socket.disconnect());
    if (coding) await new Promise((resolve) => coding.io.close(resolve));
    else if (http) await new Promise((resolve) => http.close(resolve));
    if (judge) await new Promise((resolve) => judge.close(resolve));
    await database?.$disconnect();
    if (/^spase_history_test_[a-f0-9]{32}$/.test(schema)) await adminDb.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await adminDb.end();
}
