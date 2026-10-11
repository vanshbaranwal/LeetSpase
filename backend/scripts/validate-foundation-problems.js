import { readFile } from "node:fs/promises";
import {
    getJudge0LanguageId,
    pollBatchResults,
    submitBatch,
} from "../src/libs/judge0.lib.js";

const datasetFile = process.argv[2] || "foundation-problems.postman_data.json";
const requestedTitle = process.argv.slice(3).join(" ").trim();

if(!/^[a-z0-9-]+\.postman_data\.json$/i.test(datasetFile)){
    throw new Error("invalid Postman dataset filename");
}

const dataUrl = new URL(`../../postman/${datasetFile}`, import.meta.url);

const allRunnerData = JSON.parse(await readFile(dataUrl, "utf8"));
const runnerData = requestedTitle
    ? allRunnerData.filter(({ problem }) => problem.title === requestedTitle)
    : allRunnerData;

if(requestedTitle && runnerData.length === 0){
    throw new Error(`problem not found in dataset: ${requestedTitle}`);
}
let failedProblems = 0;

for(let problemIndex = 0; problemIndex < runnerData.length; problemIndex++){
    const { problem } = runnerData[problemIndex];
    let problemPassed = true;

    console.log(`\n[${problemIndex + 1}/${runnerData.length}] ${problem.title}`);

    for(const [language, sourceCode] of Object.entries(problem.referenceSolutions)){
        const languageId = getJudge0LanguageId(language);
        const submissions = problem.testcases.map(({ input, output }) => ({
            source_code: sourceCode,
            language_id: languageId,
            stdin: input,
            expected_output: output,
        }));

        try {
            const submissionResults = await submitBatch(submissions);
            const tokens = submissionResults.map(({ token }) => token);
            const results = await pollBatchResults(tokens);
            const failedTestIndex = results.findIndex(
                (result) => result.status?.id !== 3
            );

            if(failedTestIndex === -1){
                console.log(`  PASS ${language}: ${results.length}/${results.length}`);
                continue;
            }

            problemPassed = false;
            const failedResult = results[failedTestIndex];
            console.error(
                `  FAIL ${language}: test ${failedTestIndex + 1} - ${failedResult.status?.description || "Unknown error"}`
            );
            if(failedResult.stderr) console.error(`       stderr: ${failedResult.stderr.trim()}`);
            if(failedResult.compile_output) console.error(`       compile: ${failedResult.compile_output.trim()}`);
            if(failedResult.message) console.error(`       message: ${failedResult.message}`);
        } catch (error) {
            problemPassed = false;
            console.error(`  ERROR ${language}: ${error.message}`);
        }
    }

    if(problemPassed){
        console.log("  READY for Postman import");
    } else {
        failedProblems++;
        console.error("  NOT READY - fix the failed reference solution before importing");
    }
}

console.log(`\nValidated ${runnerData.length} problems: ${runnerData.length - failedProblems} ready, ${failedProblems} failed.`);

if(failedProblems > 0){
    process.exitCode = 1;
}
