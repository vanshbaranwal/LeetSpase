import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ quiet: true });
const url = new URL(process.env.DATABASE_URL);
assert(["localhost", "127.0.0.1"].includes(url.hostname), "Migration checks require local PostgreSQL.");
const schema = "spase_migration_test_" + randomUUID().replaceAll("-", "");
const client = new pg.Client({ connectionString: url.toString() });
const host = randomUUID(), guest = randomUUID(), openId = randomUUID(), endedId = randomUUID(), problem = randomUUID();
try {
    await client.connect();
    await client.query('CREATE SCHEMA "' + schema + '"');
    await client.query('SET search_path TO "' + schema + '"');
    const migrations = new URL("../prisma/migrations/", import.meta.url);
    const names = readdirSync(migrations, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map(({ name }) => name).sort();
    for (const name of names) {
        if (name === "20261118000000_expire_empty_spases") {
            await client.query(`INSERT INTO "User" ("id","username","email","updatedAt") VALUES ($1,'oldhost','oldhost@test.invalid',now()),($2,'oldguest','oldguest@test.invalid',now())`, [host, guest]);
            await client.query(`INSERT INTO "CodingSpase" ("id","code","hostId","guestMode","createdAt","closedAt")
                VALUES ($1,'ABC23',$3,'EDITOR',now()-interval '1 day',NULL),($2,NULL,$3,'VIEWER',now()-interval '2 days',now()-interval '1 day')`, [openId, endedId, host]);
            for (const spase of [openId, endedId]) for (const [id, color] of [[host, 0], [guest, 1]]) {
                await client.query(`INSERT INTO "CodingSpaseMember" ("spaseId","userId","reservedUntil","colorIndex") VALUES ($1,$2,now(),$3)`, [spase, id, color]);
            }
            await client.query(`INSERT INTO "Problem" ("id","title","titleKey","description","difficulty","tags","userId","examples","constraints","testcases","codeSnippet","referenceSolutions","updatedAt")
                VALUES ($1,'Legacy sum','legacy-sum','Add integers','EASY',ARRAY['Math'],$2,'[]','Small integers','[]','{}','{}',now())`, [problem, host]);
            for (const actor of [guest, randomUUID()]) {
                await client.query(`INSERT INTO "CodingSpaseJob" ("id","spaseId","requestId","userId","actorName","problemId","language","mode","sourceCode","state")
                    VALUES ($1,$2,$3,$4,'Earlier actor',$5,'PYTHON','run','print(3)','FINISHED')`, [randomUUID(), openId, randomUUID(), actor, problem]);
            }
        }
        await client.query(readFileSync(new URL(name + "/migration.sql", migrations), "utf8"));
    }
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpaseParticipant"')).rows[0].count, 4);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpaseVisit"')).rows[0].count, 0);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpase" WHERE "creatorKnown"=false AND "creatorId" IS NULL')).rows[0].count, 2);
    const ended = (await client.query('SELECT * FROM "CodingSpase" WHERE "id"=$1', [endedId])).rows[0];
    assert.equal(ended.closeReason, "HOST_ENDED"); assert.equal(ended.endedById, host);
    const jobs = (await client.query('SELECT * FROM "CodingSpaseJob"')).rows;
    assert(jobs.every((job) => job.problemTitle === "Legacy sum" && job.completedAt === null));
    assert.equal(jobs.filter((job) => job.userId === null).length, 1);
    await client.query('DELETE FROM "User" WHERE "id"=$1', [host]);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpase" WHERE "hostId" IS NULL')).rows[0].count, 2);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpaseParticipant"')).rows[0].count, 4);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM "CodingSpaseJob"')).rows[0].count, 2);
    console.log("PASS: all migrations apply from scratch; legacy sessions, known participants and jobs survive; missing timestamps stay unavailable; account deletion preserves history.");
} finally {
    await client.query("ROLLBACK");
    await client.query('SET search_path TO public');
    if (/^spase_migration_test_[a-f0-9]{32}$/.test(schema)) await client.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await client.end();
}
