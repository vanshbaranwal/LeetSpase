import { getLanguageName, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";
import { db } from "../libs/db.js";

const requestError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const getExecutionRequest = (req) => {
    const { source_code, language_id, problemId } = req.body;

    if(typeof source_code !== "string" || !source_code.trim()){
        throw requestError("source code is required");
    }

    if(typeof problemId !== "string" || !problemId.trim()){
        throw requestError("problem ID is required");
    }

    const language = getLanguageName(language_id);
    if(language === "unknown"){
        throw requestError("unsupported language");
    }

    return { source_code, language_id, problemId, language };
};

const validateTestCases = (testCases) => {
    if(!Array.isArray(testCases) || testCases.length === 0){
        throw requestError("problem test cases are not configured", 500);
    }

    const hasInvalidTestCase = testCases.some((testCase) =>
        !testCase ||
        typeof testCase.input !== "string" ||
        typeof testCase.output !== "string"
    );

    if(hasInvalidTestCase){
        throw requestError("problem test cases are not configured correctly", 500);
    }
};

const executeTestCases = async(sourceCode, languageId, testCases) => {
    validateTestCases(testCases);

    const judgeSubmissions = testCases.map(({ input, output }) => ({
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
        expected_output: output
    }));

    const submitted = await submitBatch(judgeSubmissions);
    const tokens = submitted.map(({ token }) => token);
    const results = await pollBatchResults(tokens);

    let allPassed = true;
    const detailedResults = results.map((result, index) => {
        const stdout = result.stdout?.trim();
        const expected = testCases[index].output.trim();
        const passed = result.status?.id === 3 && stdout === expected;

        if(!passed) allPassed = false;

        return {
            testCase: index + 1,
            passed,
            stdout,
            expected,
            stderr: result.stderr || null,
            compileOutput: result.compile_output || null,
            status: result.status?.description || "Unknown",
            memory: result.memory ? `${result.memory} KB` : null,
            time: result.time ? `${result.time} s` : null
        };
    });

    return { allPassed, detailedResults };
};

const serializeMetrics = (results, field) => {
    const values = results.map((result) => result[field]);
    return values.some(Boolean) ? JSON.stringify(values) : null;
};

const formatExecutionResult = ({
    id = null,
    problemId,
    sourceCode,
    language,
    allPassed,
    detailedResults,
    createdAt = new Date()
}) => ({
    id,
    problemId,
    sourceCode,
    language,
    status: allPassed ? "accepted" : "wrong answer",
    memory: serializeMetrics(detailedResults, "memory"),
    time: serializeMetrics(detailedResults, "time"),
    createdAt,
    testCases: detailedResults.map((result) => ({
        testCase: result.testCase,
        passed: result.passed,
        stdout: result.stdout,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
        status: result.status,
        memory: result.memory,
        time: result.time
    }))
});

const sendExecutionError = (res, error, action) => {
    console.error(`error while ${action} code: `, error);
    return res.status(error.status || 500).json({
        success: false,
        error: error.status ? error.message : `error while ${action} code`
    });
};

export const runCode = async(req, res) => {
    try {
        const { source_code, language_id, problemId, language } = getExecutionRequest(req);
        const problem = await db.problem.findUnique({
            where: { id: problemId },
            select: { examples: true }
        });

        if(!problem) throw requestError("problem not found", 404);

        const languageKey = language.toUpperCase();
        const selectedExample = problem.examples?.[languageKey] || Object.values(problem.examples || {})[0];
        const sampleCases = selectedExample
            ? [{ input: selectedExample.input, output: selectedExample.output }]
            : [];

        const { allPassed, detailedResults } = await executeTestCases(source_code, language_id, sampleCases);

        return res.status(200).json({
            success: true,
            message: allPassed ? "sample test passed" : "sample test failed",
            mode: "run",
            result: formatExecutionResult({
                problemId,
                sourceCode: source_code,
                language,
                allPassed,
                detailedResults
            })
        });
    } catch (error) {
        return sendExecutionError(res, error, "running");
    }
};

export const submitCode = async(req, res) => {
    try {
        const { source_code, language_id, problemId, language } = getExecutionRequest(req);
        const problem = await db.problem.findUnique({
            where: { id: problemId },
            select: { testcases: true }
        });

        if(!problem) throw requestError("problem not found", 404);

        validateTestCases(problem.testcases);
        const hiddenTestCases = problem.testcases.map(({ input, output }) => ({ input, output }));
        const { allPassed, detailedResults } = await executeTestCases(source_code, language_id, hiddenTestCases);

        const submission = await db.$transaction(async(transaction) => {
            const savedSubmission = await transaction.submission.create({
                data: {
                    userId: req.user.id,
                    problemId,
                    sourceCode: source_code,
                    language,
                    stdin: hiddenTestCases.map(({ input }) => input).join("\n"),
                    stdout: JSON.stringify(detailedResults.map(({ stdout }) => stdout)),
                    stderr: detailedResults.some(({ stderr }) => stderr)
                        ? JSON.stringify(detailedResults.map(({ stderr }) => stderr))
                        : null,
                    compileOutput: detailedResults.some(({ compileOutput }) => compileOutput)
                        ? JSON.stringify(detailedResults.map(({ compileOutput }) => compileOutput))
                        : null,
                    status: allPassed ? "accepted" : "wrong answer",
                    memory: serializeMetrics(detailedResults, "memory"),
                    time: serializeMetrics(detailedResults, "time")
                }
            });

            await transaction.testCaseResult.createMany({
                data: detailedResults.map((result) => ({
                    submissionId: savedSubmission.id,
                    testCase: result.testCase,
                    passed: result.passed,
                    stdout: result.stdout,
                    expected: result.expected,
                    stderr: result.stderr,
                    compileOutput: result.compileOutput,
                    status: result.status,
                    memory: result.memory,
                    time: result.time
                }))
            });

            if(allPassed){
                await transaction.problemSolved.upsert({
                    where: {
                        userId_problemId: {
                            userId: req.user.id,
                            problemId
                        }
                    },
                    update: {},
                    create: {
                        userId: req.user.id,
                        problemId
                    }
                });
            }

            return savedSubmission;
        });

        return res.status(200).json({
            success: true,
            message: allPassed ? "solution accepted" : "solution submitted",
            mode: "submit",
            result: formatExecutionResult({
                id: submission.id,
                problemId,
                sourceCode: submission.sourceCode,
                language: submission.language,
                allPassed,
                detailedResults,
                createdAt: submission.createdAt
            })
        });
    } catch (error) {
        return sendExecutionError(res, error, "submitting");
    }
};
