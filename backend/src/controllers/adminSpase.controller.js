import { db } from "../libs/db.js";
import { isSpaseId } from "../spases/spase.service.js";
import { presenceLeaseMs } from "../spases/spase.history.js";

const userFields = { id: true, name: true, username: true, image: true };
const activeWhere = (now) => ({ closedAt: null, emptySince: null,
    lastOccupiedAt: { gt: new Date(now.getTime() - presenceLeaseMs) } });
export async function getSpaseTotals(client = db, now = new Date()) {
    const [totals] = await client.$queryRaw`SELECT COUNT(*)::int AS "total",
        (COUNT(*) FILTER (WHERE "closedAt" IS NOT NULL))::int AS "ended",
        (COUNT(*) FILTER (WHERE "closedAt" IS NULL AND "emptySince" IS NULL AND "lastOccupiedAt" > ${new Date(now.getTime() - presenceLeaseMs)}))::int AS "active",
        (COUNT(*) FILTER (WHERE "closedAt" IS NULL AND ("emptySince" IS NOT NULL OR "lastOccupiedAt" IS NULL OR "lastOccupiedAt" <= ${new Date(now.getTime() - presenceLeaseMs)})))::int AS "inactive"
        FROM "CodingSpase"`;
    return totals;
}
const statusOf = (spase, now) => spase.closedAt ? "ENDED"
    : !spase.emptySince && spase.lastOccupiedAt > new Date(now.getTime() - presenceLeaseMs) ? "ACTIVE" : "INACTIVE";
const summarySelect = {
    id: true, creatorKnown: true, guestMode: true, createdAt: true, closedAt: true,
    emptySince: true, lastOccupiedAt: true, closeReason: true, historyStartedAt: true,
    host: { select: userFields }, creator: { select: userFields }, endedBy: { select: userFields },
    _count: { select: { participants: true, jobs: true } },
};
const summarize = ({ _count, ...spase }, now) => ({
    ...spase, status: statusOf(spase, now), uniqueParticipants: _count.participants, executions: _count.jobs,
    durationSeconds: Math.max(0, Math.floor(((spase.closedAt ?? now) - spase.createdAt) / 1000)),
});
const invalid = (message) => Object.assign(new Error(message), { status: 400 });
const pageNumber = (value) => {
    if (value === undefined) return 1;
    if (typeof value !== "string" || !/^[1-9]\d{0,5}$/.test(value)) throw invalid("Choose a valid page.");
    return Number(value);
};
const paging = (total, requested, pageSize) => {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requested, pages);
    return { total, pages, page, pageSize, skip: (page - 1) * pageSize };
};
const publicPage = ({ skip: _skip, ...page }, items) => ({ ...page, items });
const handle = (fn) => async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        res.json(await fn(req));
    } catch (error) {
        if (!error.status) console.error("Admin Spase history failed", error);
        res.status(error.status ?? 500).json({ error: error.status ? error.message : "Could not load Spase history." });
    }
};
const dateInput = (value, end = false) => {
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalid("Choose a valid date.");
    const date = new Date(value + "T00:00:00.000Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw invalid("Choose a valid date.");
    if (end) date.setUTCDate(date.getUTCDate() + 1);
    return date;
};

export const getAdminSpases = handle(async (req) => {
    const now = new Date();
    const requested = pageNumber(req.query.page);
    const { status = "", q = "" } = req.query;
    if (typeof q !== "string" || q.length > 100 || !["", "ACTIVE", "INACTIVE", "ENDED"].includes(status)) {
        throw invalid("Choose valid search filters.");
    }
    const from = dateInput(req.query.from);
    const until = dateInput(req.query.to, true);
    if (from && until && from >= until) throw invalid("The end date must be on or after the start date.");
    const conditions = [];
    if (status === "ACTIVE") conditions.push(activeWhere(now));
    if (status === "ENDED") conditions.push({ closedAt: { not: null } });
    if (status === "INACTIVE") conditions.push({ closedAt: null, OR: [{ emptySince: { not: null } }, { lastOccupiedAt: null }, { lastOccupiedAt: { lte: new Date(now.getTime() - presenceLeaseMs) } }] });
    if (from || until) conditions.push({ createdAt: { ...(from ? { gte: from } : {}), ...(until ? { lt: until } : {}) } });
    const query = q.trim();
    if (query) {
        const userMatch = { OR: ["name", "username", "email"].map((field) => ({ [field]: { contains: query, mode: "insensitive" } })) };
        conditions.push({ OR: [{ id: { contains: query, mode: "insensitive" } }, { host: { is: userMatch } },
            { creator: { is: userMatch } }, { participants: { some: { user: { is: userMatch } } } }] });
    }
    const where = conditions.length ? { AND: conditions } : {};
    return db.$transaction(async (tx) => {
        const [count, totals] = await Promise.all([tx.codingSpase.count({ where }), getSpaseTotals(tx, now)]);
        const page = paging(count, requested, 20);
        const items = await tx.codingSpase.findMany({
            where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: page.skip, take: page.pageSize, select: summarySelect,
        });
        return { totals, ...publicPage(page, items.map((item) => summarize(item, now))) };
    }, { isolationLevel: "RepeatableRead" });
});

export const getAdminSpaseDetails = handle(async (req) => {
    if (!isSpaseId(req.params.spaseId)) throw invalid("Invalid Spase ID.");
    const spaseId = req.params.spaseId;
    const requested = Object.fromEntries(["participants", "visits", "activities", "jobs"]
        .map((name) => [name, pageNumber(req.query[name + "Page"])]));
    return db.$transaction(async (tx) => {
        const record = await tx.codingSpase.findUnique({ where: { id: spaseId }, select: summarySelect });
        if (!record) throw Object.assign(new Error("Spase not found."), { status: 404 });
        const where = { spaseId };
        const [peopleCount, visitCount, activityCount, jobCount] = await Promise.all([
            tx.codingSpaseParticipant.count({ where }), tx.codingSpaseVisit.count({ where }),
            tx.codingSpaseActivity.count({ where }), tx.codingSpaseJob.count({ where }),
        ]);
        const pages = Object.fromEntries(Object.entries({ participants: peopleCount, visits: visitCount, activities: activityCount, jobs: jobCount })
            .map(([name, count]) => [name, paging(count, requested[name], 20)]));
        const participantSelect = { id: true, legacy: true, user: { select: userFields } };
        const [participants, visits, activities, jobs] = await Promise.all([
            tx.codingSpaseParticipant.findMany({ where, orderBy: { id: "asc" }, skip: pages.participants.skip, take: 20,
                select: { ...participantSelect, _count: { select: { visits: true } } } }),
            tx.codingSpaseVisit.findMany({ where, orderBy: [{ joinedAt: "desc" }, { id: "desc" }], skip: pages.visits.skip, take: 20,
                select: { id: true, joinedAt: true, lastSeenAt: true, disconnectedAt: true, leftAt: true, leaveReason: true,
                    initialRole: true, role: true, participant: { select: participantSelect } } }),
            tx.codingSpaseActivity.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: pages.activities.skip, take: 20,
                select: { id: true, type: true, problemTitle: true, language: true, createdAt: true, actor: { select: userFields } } }),
            tx.codingSpaseJob.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: pages.jobs.skip, take: 20,
                select: { id: true, mode: true, language: true, problemTitle: true, problemId: true, state: true, error: true,
                    createdAt: true, startedAt: true, completedAt: true, actor: { select: userFields },
                    // Result JSON can contain large test outputs. Extract only the verdict in PostgreSQL below.
                } }),
        ]);
        const jobIds = jobs.map(({ id }) => id);
        let results = [];
        if (jobIds.length) {
            // Prisma parameters keep IDs out of SQL text, and the query never loads source code or output blobs.
            const { Prisma } = await import("../generated/prisma/index.js");
            results = await tx.$queryRaw(Prisma.sql`SELECT "id", "result"->>'status' AS "verdict",
                "result"->>'passed' AS "passed", "result"->>'total' AS "total",
                "result"->>'allPassed' AS "allPassed"
                FROM "CodingSpaseJob" WHERE "id" IN (${Prisma.join(jobIds)})`);
        }
        const resultById = new Map(results.map(({ id, ...result }) => [id, result]));
        return {
            spase: summarize(record, new Date()),
            participants: publicPage(pages.participants, participants.map(({ _count, ...person }) => ({ ...person, visitCount: _count.visits }))),
            visits: publicPage(pages.visits, visits.map((visit) => ({ ...visit, status: visit.leftAt ? "ENDED" : visit.disconnectedAt || Date.now() - visit.lastSeenAt.getTime() > presenceLeaseMs ? "INACTIVE" : "ACTIVE" }))),
            activities: publicPage(pages.activities, activities),
            jobs: publicPage(pages.jobs, jobs.map((job) => ({ ...job, result: resultById.get(job.id) ?? null }))),
        };
    }, { isolationLevel: "RepeatableRead" });
});
