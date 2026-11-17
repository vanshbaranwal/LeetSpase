
import { db } from "../libs/db.js";
import { getJudge0LanguageId, getLanguageName } from "../libs/judge0.lib.js";
import {
    executeTestCases, formatExecutionResult, getSampleTestCases, saveExecutionSubmission,
} from "../controllers/codeExecution.controller.js";
import { getSnapshot, isSpaseId, listSpaseJobs, spaseError, withSpase } from "./spase.service.js";

const maxRunMs = 75_000;
const MAX_ACTIVE_JOBS = 5;

export async function enqueueSpaseJob(tx, spase, identity, member, payload) {
    const { mode, requestId } = payload ?? {};
    if (!["run", "submit"].includes(mode) || !isSpaseId(requestId)) {
        throw spaseError(400, "INVALID_EXECUTION", "That execution request is invalid.");
    }

    const where = { spaseId_userId_requestId: { spaseId: spase.id, userId: identity.userId, requestId } };
    if (await tx.codingSpaseJob.findUnique({ where, select: { id: true } })) return;
    const active = await tx.codingSpaseJob.count({ where: { spaseId: spase.id, state: { in: ["QUEUED", "RUNNING"] } } });
    if (active >= MAX_ACTIVE_JOBS) throw spaseError(409, "QUEUE_FULL", "The shared queue is full. Wait for a result.");
    const sourceCode = await getSnapshot(tx, spase, payload);
    await tx.codingSpaseJob.create({
        data: {
            spaseId: spase.id, requestId, userId: identity.userId, actorName: member.displayName,
            problemId: spase.problemId, language: spase.language, mode, sourceCode,
        },
    });
}

export function startSpaseQueue(io, channel) {
    const workers = new Map();
    const emitJobs = (spaseId) => db.$transaction(async (tx) => {
        const jobs = await listSpaseJobs(tx, spaseId);
        io.to(channel(spaseId)).emit("spase:jobs", jobs);
    });

    const nextJob = (spaseId) => withSpase(spaseId, async (tx) => {
        const running = await tx.codingSpaseJob.findFirst({ where: { spaseId, state: "RUNNING" } });
        if (running) {
            const wait = maxRunMs - (Date.now() - running.startedAt.getTime());
            if (wait > 0) return { wait };
            await tx.codingSpaseJob.update({ where: { id: running.id }, data: {
                state: "FAILED", error: "The judge connection was interrupted. Run the code again.",
            } });
        }
        const job = await tx.codingSpaseJob.findFirst({
            where: { spaseId, state: "QUEUED" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });
        if (!job) return {};
        return { job: await tx.codingSpaseJob.update({
            where: { id: job.id }, data: { state: "RUNNING", startedAt: new Date() },
        }) };
    });

    const execute = async (job) => {
        const { spaseId, id, problemId, language, userId, sourceCode } = job;
        const languageId = getJudge0LanguageId(language);
        const judgeLanguage = getLanguageName(languageId);
        const problem = await db.problem.findUnique({ where: { id: problemId }, select: { testcases: true } });
        if (!problem) throw spaseError(404, "PROBLEM_UNAVAILABLE", "That problem is unavailable.");

        const testCases = job.mode === "run" ? getSampleTestCases(problem.testcases) : problem.testcases;
        const { allPassed, detailedResults } = await executeTestCases(sourceCode, languageId, testCases);
        await withSpase(spaseId, async (tx, spase) => {
            const current = await tx.codingSpaseJob.findUnique({ where: { id }, select: { state: true } });
            if (current?.state !== "RUNNING") return;
            let result;
            if (job.mode === "submit") {
                const member = await tx.codingSpaseMember.findUnique({
                    where: { spaseId_userId: { spaseId, userId } },
                    include: { user: { select: { status: true } } },
                });
                if (!member || member.removedAt || member.user.status !== "ACTIVE" ||
                    (spase.hostId !== userId && spase.guestMode !== "EDITOR")) {
                    throw spaseError(403, "SPASE_FORBIDDEN", "The submitter no longer has editor access.");
                }
                const saved = await saveExecutionSubmission(tx, {
                    userId, problemId, sourceCode, language: judgeLanguage,
                    testCases, allPassed, detailedResults,
                });
                result = {
                    submissionId: saved.id,
                    status: allPassed ? "accepted" : "wrong answer",
                    passed: detailedResults.filter(({ passed }) => passed).length,
                    total: detailedResults.length,
                };
            } else {
                const formatted = formatExecutionResult({
                    id, problemId, language: judgeLanguage, allPassed, detailedResults,
                });
                result = JSON.parse(JSON.stringify(formatted));
            }
            await tx.codingSpaseJob.update({ where: { id }, data: { state: "FINISHED", result } });
        });
    };

    const drain = async (spaseId, worker) => {
        try {
            while (true) {
                worker.requested = false;
                const { job, wait } = await nextJob(spaseId);
                await emitJobs(spaseId);
                if (wait) {
                    const timer = setTimeout(() => kick(spaseId), wait);
                    timer.unref();
                    return;
                }
                if (!job) {
                    if (worker.requested) continue;
                    return;
                }
                try {
                    await execute(job);
                } catch (error) {
                    if (!error.status) console.error("Coding spase execution failed", error);
                    await db.codingSpaseJob.updateMany({
                        where: { id: job.id, state: "RUNNING" },
                        data: { state: "FAILED", error: error.status ? error.message : "CodeBox could not complete this request." },
                    });
                }
                await emitJobs(spaseId);
            }
        } catch (error) {
            if (error.code !== "SPASE_UNAVAILABLE") console.error("Coding spase queue failed", error);
        } finally {
            workers.delete(spaseId);
        }
    };

    function kick(spaseId) {
        const worker = workers.get(spaseId);
        if (worker) {
            worker.requested = true;
            return;
        }
        const next = { requested: false };
        workers.set(spaseId, next);
        void drain(spaseId, next);
    }

    return { kick, emitJobs };
}
