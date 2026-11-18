
import { endSpase, expireVisits } from "./spase.history.js";
import { db } from "../libs/db.js";

export const emptySpaseTimeoutMs = 5 * 60 * 1000;

export const emptySpaseDeadline = (spase) => spase.emptySince
    ? spase.emptySince.getTime() + emptySpaseTimeoutMs
    : null;

export const closeEmptySpase = (tx, spase) =>
    endSpase(tx, spase, "EMPTY_TIMEOUT", null, new Date(emptySpaseDeadline(spase)));

export function createSpaseExpiry(withSpase, hasConnections) {
    let running = false;

    const updatePresence = (tx, spase) => {
        if (hasConnections(spase.id)) {
            return tx.codingSpase.update({
                where: { id: spase.id },
                data: { emptySince: null, lastOccupiedAt: new Date() },
            });
        }
        if (!spase.emptySince) {
            return tx.codingSpase.update({
                where: { id: spase.id }, data: { emptySince: new Date() },
            });
        }
    };

    const sweep = async () => {
        if (running) return;
        running = true;
        try {
            const stale = await db.codingSpaseVisit.findMany({
                where: { leftAt: null, disconnectedAt: { not: null }, lastSeenAt: { lte: new Date(Date.now() - 60_000) } },
                select: { spaseId: true }, distinct: ["spaseId"], take: 100,
            });
            for (const { spaseId } of stale) {
                try { await withSpase(spaseId, (tx) => expireVisits(tx, spaseId)); }
                catch (error) { if (error.code !== "SPASE_UNAVAILABLE") throw error; }
            }
            const due = await db.codingSpase.findMany({
                where: { closedAt: null, emptySince: { lte: new Date(Date.now() - emptySpaseTimeoutMs) } },
                select: { id: true },
                take: 100,
            });
            for (const { id } of due) {
                try {
                    await withSpase(id, updatePresence);
                } catch (error) {
                    if (error.code !== "SPASE_UNAVAILABLE") throw error;
                }
            }
        } finally {
            running = false;
        }
    };

    const start = async () => {
        // Connections disappear on restart. Preserve existing empty deadlines and
        // recover interrupted sessions from the last persisted presence update.
        await db.$executeRaw`
            UPDATE "CodingSpase"
            SET "emptySince" = COALESCE("lastOccupiedAt", "createdAt")
            WHERE "closedAt" IS NULL AND "emptySince" IS NULL
        `;
        await db.codingSpaseVisit.updateMany({ where: { leftAt: null }, data: { disconnectedAt: new Date() } });
        await sweep();
        const timer = setInterval(() => {
            void sweep().catch((error) => console.error("Spase expiry failed", error));
        }, 5_000);
        timer.unref();
        return () => clearInterval(timer);
    };

    return { updatePresence, start };
}
