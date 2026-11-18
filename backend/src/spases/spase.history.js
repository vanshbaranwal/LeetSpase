// Called under the Spase row lock so visits and lifecycle changes commit together.
export const presenceLeaseMs = 60_000;

export async function closeVisits(tx, spaseId, reason, { userId, sessionId, at = new Date() } = {}) {
    return tx.codingSpaseVisit.updateMany({
        where: { spaseId, leftAt: null,
            ...(userId ? { participant: { participantKey: userId } } : {}),
            ...(sessionId ? { sessionId } : {}),
        },
        data: { leftAt: at, leaveReason: reason },
    });
}

export async function connectVisit(tx, spase, identity) {
    const participant = await tx.codingSpaseParticipant.upsert({
        where: { spaseId_participantKey: { spaseId: spase.id, participantKey: identity.userId } },
        create: { spaseId: spase.id, participantKey: identity.userId, userId: identity.userId },
        update: {},
    });
    const now = new Date();
    const visit = await tx.codingSpaseVisit.findFirst({
        where: { participantId: participant.id, sessionId: identity.sessionId, leftAt: null },
    });
    if (visit) {
        return tx.codingSpaseVisit.update({
            where: { id: visit.id }, data: { lastSeenAt: now, disconnectedAt: null },
        });
    }
    const role = spase.hostId === identity.userId ? "HOST" : spase.guestMode;
    return tx.codingSpaseVisit.create({
        data: { spaseId: spase.id, participantId: participant.id, sessionId: identity.sessionId,
            role, initialRole: role, joinedAt: now, lastSeenAt: now },
    });
}

export const touchVisit = (tx, spaseId, identity) => tx.codingSpaseVisit.updateMany({
    where: { spaseId, sessionId: identity.sessionId,
        participant: { participantKey: identity.userId }, leftAt: null },
    data: { lastSeenAt: new Date(), disconnectedAt: null },
});

export const disconnectVisit = (tx, spaseId, identity) => tx.codingSpaseVisit.updateMany({
    where: { spaseId, sessionId: identity.sessionId,
        participant: { participantKey: identity.userId }, leftAt: null },
    data: { disconnectedAt: new Date() },
});

export async function expireVisits(tx, spaseId, now = new Date()) {
    const stale = await tx.codingSpaseVisit.findMany({
        where: { spaseId, leftAt: null, disconnectedAt: { not: null }, lastSeenAt: { lte: new Date(now.getTime() - presenceLeaseMs) } },
        select: { id: true, lastSeenAt: true },
    });
    for (const visit of stale) {
        await tx.codingSpaseVisit.update({ where: { id: visit.id }, data: {
            leftAt: new Date(visit.lastSeenAt.getTime() + presenceLeaseMs), leaveReason: "CONNECTION_LOST",
        } });
    }
}

export async function endSpase(tx, spase, reason, endedById = null, at = new Date()) {
    await closeVisits(tx, spase.id, reason, { at });
    await tx.codingSpaseJob.updateMany({
        where: { spaseId: spase.id, state: { in: ["QUEUED", "RUNNING"] } },
        data: { state: "FAILED", completedAt: at, error: "The spase ended before execution completed." },
    });
    return tx.codingSpase.update({
        where: { id: spase.id },
        data: { closedAt: at, code: null, emptySince: null, closeReason: reason, endedById },
    });
}
