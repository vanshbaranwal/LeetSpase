
import { randomInt, randomUUID } from "node:crypto";
import * as Y from "yjs";
import { db } from "../libs/db.js";
import { getJudge0LanguageId } from "../libs/judge0.lib.js";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const hostColorIndex = 0;
const memberColorIndexes = [1, 2, 3, 4];
const capacity = memberColorIndexes.length + 1;
const leaseMs = 90_000;
export const maxUpdateBytes = 384 * 1024;
const maxDocumentBytes = 2 * 1024 * 1024;

export const spaseError = (status, code, message) => Object.assign(new Error(message), { status, code });
const spaseMissing = () => spaseError(404, "SPASE_UNAVAILABLE", "That spase is unavailable.");
const spaseFull = () => spaseError(409, "SPASE_FULL", "This spase already has five participants.");
const sessionReplaced = () => spaseError(409, "SESSION_REPLACED", "Spase opened in another tab.");
const accessDenied = () => spaseError(403, "SPASE_FORBIDDEN", "You do not have permission to do that in this spase.");

const newLease = () => new Date(Date.now() + leaseMs);
const memberKey = (spaseId, userId) => ({ spaseId_userId: { spaseId, userId } });
const activeMembers = (spase, now) => ({
    spaseId: spase.id,
    removedAt: null,
    OR: [{ userId: spase.hostId }, { reservedUntil: { gt: now } }],
});

export const isSpaseId = (value) => typeof value === "string" && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);

export const withSpase = (spaseId, action) => db.$transaction(async (tx) => {
    if (!isSpaseId(spaseId)) throw spaseMissing();
    const [spase] = await tx.$queryRaw`SELECT * FROM "CodingSpase" WHERE "id" = ${spaseId} FOR UPDATE`;
    if (!spase || spase.closedAt) throw spaseMissing();
    return action(tx, spase);
});

export const createSpase = async (userId, guestMode) => {
    if (!["EDITOR", "VIEWER"].includes(guestMode)) {
        throw spaseError(400, "INVALID_MODE", "Choose Editor or View only for guests.");
    }
    for (let attempt = 0; attempt < 8; attempt++) {
        const code = Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
        try {
            return await db.codingSpase.create({
                data: { code, hostId: userId, guestMode, members: { create: { userId, reservedUntil: newLease(), colorIndex: hostColorIndex } } },
                select: { id: true, code: true },
            });
        } catch (error) {
            if (error.code !== "P2002") throw error;
        }
    }
    throw spaseError(503, "SPASE_CODE_UNAVAILABLE", "A spase code could not be assigned. Try again.");
};

const reserve = async (tx, spase, userId, { mustExist = false, sessionId } = {}) => {
    const where = memberKey(spase.id, userId);
    const member = await tx.codingSpaseMember.findUnique({ where });
    if (member?.removedAt || (mustExist && !member)) throw accessDenied();
    const now = new Date();
    const isHost = userId === spase.hostId;
    const hasSeat = member && (isHost || member.reservedUntil > now);
    let colorIndex = isHost ? hostColorIndex : member?.colorIndex;
    if (!isHost && (!hasSeat || !memberColorIndexes.includes(colorIndex))) {
        const others = await tx.codingSpaseMember.findMany({
            where: { ...activeMembers(spase, now), NOT: { userId } },
            select: { colorIndex: true },
        });
        if (others.length >= capacity) throw spaseFull();
        const used = new Set(others.map((other) => other.colorIndex));
        const available = memberColorIndexes.filter((index) => !used.has(index));
        if (!available.includes(colorIndex)) colorIndex = available[randomInt(available.length)];
    }
    const reservedUntil = newLease();
    return tx.codingSpaseMember.upsert({
        where,
        create: { spaseId: spase.id, userId, reservedUntil, colorIndex },
        update: { reservedUntil, colorIndex, ...(sessionId ? { sessionId } : {}) },
    });
};

export const joinSpase = async (input, userId) => {
    const code = typeof input === "string" ? input.trim().toUpperCase() : "";
    if (code.length !== 5 || [...code].some((character) => !alphabet.includes(character))) throw spaseMissing();
    const match = await db.codingSpase.findUnique({ where: { code }, select: { id: true } });
    if (!match) throw spaseMissing();
    return withSpase(match.id, async (tx, spase) => {
        if (spase.code !== code) throw spaseMissing();
        await reserve(tx, spase, userId);
        return { id: spase.id };
    });
};

export const openSession = (spaseId, userId, requestedSessionId) => withSpase(spaseId, async (tx, spase) => {
    if (requestedSessionId) {
        await requireSession(tx, spase, { userId, sessionId: requestedSessionId });
        await reserve(tx, spase, userId, { mustExist: true });
        return requestedSessionId;
    }
    const sessionId = randomUUID();
    await reserve(tx, spase, userId, { mustExist: true, sessionId });
    return sessionId;
});

export const requireSession = async (tx, spase, identity, permission) => {
    const member = await tx.codingSpaseMember.findUnique({
        where: memberKey(spase.id, identity.userId),
        include: { user: { select: { status: true, name: true, username: true } } },
    });
    if (!member || member.removedAt || member.user.status !== "ACTIVE") throw accessDenied();
    if (member.sessionId !== identity.sessionId) throw sessionReplaced();
    const isHost = spase.hostId === identity.userId;
    const canEdit = isHost || spase.guestMode === "EDITOR";
    if ((permission === "host" && !isHost) || (permission === "edit" && !canEdit)) throw accessDenied();
    return { isHost, canEdit, colorIndex: member.colorIndex, displayName: member.user.name || member.user.username };
};

export const renewSession = (spaseId, identity) => withSpase(spaseId, async (tx, spase) => {
    await requireSession(tx, spase, identity);
    return reserve(tx, spase, identity.userId, { mustExist: true });
});

export const removeMember = async (tx, spase, userId) => {
    if (userId === spase.hostId || !isSpaseId(userId)) throw accessDenied();
    await tx.codingSpaseMember.updateMany({
        where: { spaseId: spase.id, userId, removedAt: null },
        data: { removedAt: new Date(), sessionId: null, reservedUntil: new Date(0) },
    });
};

export const leaveSpase = async (tx, spase, userId, nextHostId) => {
    if (userId === spase.hostId) {
        const nextHost = isSpaseId(nextHostId) && nextHostId !== userId && await tx.codingSpaseMember.findFirst({
            where: { ...activeMembers(spase, new Date()), userId: nextHostId, user: { status: "ACTIVE" } },
            select: { userId: true },
        });
        if (!nextHost) {
            throw spaseError(409, "HOST_REQUIRED", "Choose a current member to take over as host.");
        }
        await tx.codingSpaseMember.update({
            where: memberKey(spase.id, nextHost.userId),
            data: { colorIndex: hostColorIndex },
        });
        await tx.codingSpase.update({ where: { id: spase.id }, data: { hostId: nextHost.userId } });
    }

    await tx.codingSpaseMember.update({
        where: memberKey(spase.id, userId),
        data: {
            sessionId: null,
            reservedUntil: new Date(0),
            ...(spase.hostId === userId ? { colorIndex: null } : {}),
        },
    });
};

export const listMembers = async (tx, spase) => {
    const members = await tx.codingSpaseMember.findMany({
        where: activeMembers(spase, new Date()),
        include: { user: { select: { name: true, username: true, image: true } } },
        orderBy: { userId: "asc" },
    });
    return members.map(({ userId, user, colorIndex }) => ({
        id: userId,
        name: user.name || user.username,
        image: user.image,
        colorIndex,
        role: spase.hostId === userId ? "HOST" : spase.guestMode,
    }));
};

export const listSpaseJobs = (tx, spaseId) => tx.codingSpaseJob.findMany({
    where: { spaseId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 15,
    select: {
        id: true, actorName: true, problemId: true, language: true, mode: true,
        state: true, result: true, error: true, createdAt: true,
    },
});

export const spaseSummary = ({ id, code, guestMode, hostId, problemId, language, revision }) => ({
    id, code, guestMode, hostId, problemId, language, revision,
});

const documentKey = (spase) => ({ spaseId_problemId_language: {
    spaseId: spase.id, problemId: spase.problemId, language: spase.language,
} });

const requireDocument = (spase, target) => {
    if (!spase.problemId || !spase.language || spase.problemId !== target?.problemId || spase.language !== target?.language || spase.revision !== target?.revision) {
        throw spaseError(409, "PROBLEM_CHANGED", "The host switched problems or languages. Wait for the workspace to sync.");
    }
    return documentKey(spase);
};

export const chooseProblem = async (tx, spase, problemId, requestedLanguage) => {
    const problem = typeof problemId === "string" && await tx.problem.findUnique({
        where: { id: problemId },
        select: { id: true, codeSnippet: true },
    });
    if (!problem) throw spaseError(404, "PROBLEM_UNAVAILABLE", "That problem is unavailable.");
    const languages = Object.keys(problem.codeSnippet || {}).filter((language) => getJudge0LanguageId(language));
    const language = requestedLanguage ?? (languages.includes(spase.language) ? spase.language : languages[0]);
    if (!languages.includes(language)) throw spaseError(400, "INVALID_LANGUAGE", "Choose an available language.");

    const updatedSpase = await tx.codingSpase.update({ where: { id: spase.id }, data: { problemId, language, revision: { increment: 1 } } });
    const where = documentKey(updatedSpase);
    const existing = await tx.codingSpaseDocument.findUnique({ where });
    if (existing) return { spase: spaseSummary(updatedSpase), document: existing.state };

    const doc = new Y.Doc();
    try {
        doc.getText("code").insert(0, problem.codeSnippet[language] || "");
        const state = Y.encodeStateAsUpdate(doc);
        await tx.codingSpaseDocument.create({ data: { ...where.spaseId_problemId_language, state } });
        return { spase: spaseSummary(updatedSpase), document: state };
    } finally {
        doc.destroy();
    }
};

export const readSpaseDocument = async (tx, spase) => {
    if (!spase.problemId || !spase.language) return null;
    const document = await tx.codingSpaseDocument.findUnique({ where: documentKey(spase) });
    return document?.state ?? null;
};

export const editDocument = async (tx, spase, target, input) => {
    const where = requireDocument(spase, target);
    const update = Buffer.isBuffer(input) || input instanceof Uint8Array ? input : null;
    if (!update?.length || update.length > maxUpdateBytes) {
        throw spaseError(400, "INVALID_EDIT", "This edit exceeds the spase update limit.");
    }
    const document = await tx.codingSpaseDocument.findUniqueOrThrow({ where });
    const doc = new Y.Doc();
    try {
        Y.applyUpdate(doc, document.state);
        try {
            Y.applyUpdate(doc, update);
        } catch {
            throw spaseError(400, "INVALID_EDIT", "This edit could not be read.");
        }
        const code = doc.getText("code");
        if (!code.toDelta().every(({ insert }) => typeof insert === "string")) {
            throw spaseError(400, "INVALID_EDIT", "Spase documents can only contain text.");
        }
        const state = Y.encodeStateAsUpdate(doc);
        if (state.length > maxDocumentBytes) {
            throw spaseError(400, "DOCUMENT_LIMIT", "The shared document has reached its size limit.");
        }
        await tx.codingSpaseDocument.update({ where, data: { state } });
    } finally {
        doc.destroy();
    }
};

export const getSnapshot = async (tx, spase, target) => {
    const document = await tx.codingSpaseDocument.findUniqueOrThrow({ where: requireDocument(spase, target) });
    const doc = new Y.Doc();
    try {
        Y.applyUpdate(doc, document.state);
        const text = doc.getText("code").toString();
        if (!text.trim()) throw spaseError(400, "EMPTY_CODE", "Write some code before running or submitting.");
        return text;
    } finally {
        doc.destroy();
    }
};
