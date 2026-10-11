import { getLanguageName, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";
import { db } from "../libs/db.js";


export const executeCode = async(req, res) => {
    try {
        const { source_code, language_id, problemId } = req.body;

        const userId = req.user.id;

        if(typeof source_code !== "string" || !source_code.trim()){
            return res.status(400).json({
                error: "source code is required"
            });
        }

        if(typeof problemId !== "string" || !problemId.trim()){
            return res.status(400).json({
                error: "problem ID is required"
            });
        }

        const language = getLanguageName(language_id);

        if(language === "unknown"){
            return res.status(400).json({
                error: "unsupported language"
            });
        }

        // Hidden inputs and expected outputs are loaded only inside the backend.
        const problem = await db.problem.findUnique({
            where: {
                id: problemId
            },
            select: {
                testcases: true
            }
        });

        if(!problem){
            return res.status(404).json({
                error: "problem not found"
            });
        }

        if(!Array.isArray(problem.testcases) || problem.testcases.length === 0){
            return res.status(500).json({
                error: "problem test cases are not configured"
            });
        }

        const hasInvalidTestcase = problem.testcases.some((testcase) =>
            !testcase ||
            typeof testcase.input !== "string" ||
            typeof testcase.output !== "string"
        );

        if(hasInvalidTestcase){
            return res.status(500).json({
                error: "problem test cases are not configured correctly"
            });
        }

        const hiddenTestcases = problem.testcases.map(({ input, output }) => ({
            input,
            output
        }));

        // prepare each testcase for judge0 batch submission
        const submissions = hiddenTestcases.map(({ input, output }) => ({
            source_code,
            language_id,
            stdin: input,
            expected_output: output
        }));

        // send batch of submissions to judge0
        const submitResponse = await submitBatch(submissions);

        const tokens = submitResponse.map((res) => res.token);

        // poll judge0 for results of all submitted testcases
        const results = await pollBatchResults(tokens);

        console.log(`result-----------------`);
        console.log(results);

        // analyze testcase result
        let allPassed = true;
        const detailedResults = results.map((result, i) => {
            const stdout = result.stdout?.trim();
            const expected_output = hiddenTestcases[i].output.trim();
            const passed = result.status?.id === 3 && stdout === expected_output;

            if(!passed) allPassed = false;

            return{
                testCase: i+1,
                passed,
                stdout,
                expected: expected_output,
                stderr: result.stderr || null,
                compile_output: result.compile_output || null,
                status: result.status?.description || "Unknown",
                memory: result.memory ? `${result.memory} KB` : undefined,
                time: result.time ? `${result.time} s` : undefined
            };
            
            // console.log(`\ntestcase #${i+1}`);
            // console.log(`input ${stdin[i]}`);
            // console.log(`expected output for the testcase ${expected_output}`);
            // console.log(`actual output ${stdout}`);

            // console.log(`matched: ${[passed]}`);
        });

        console.log(detailedResults);


        // store submission summary
        const submission = await db.submission.create({
            data: {
                userId,
                problemId,
                sourceCode: source_code,
                language,
                stdin: hiddenTestcases.map((testcase) => testcase.input).join("\n"),
                stdout: JSON.stringify(detailedResults.map((r) => r.stdout)),
                stderr: detailedResults.some((r) => r.stderr) ? JSON.stringify(detailedResults.map((r) => r.stderr)) : null,
                compileOutput: detailedResults.some((r) => r.compile_output) ? JSON.stringify(detailedResults.map((r) => r.compile_output)) : null,
                status: allPassed ? "accepted" : "wrong answer",
                memory: detailedResults.some((r) => r.memory) ? JSON.stringify(detailedResults.map((r) => r.memory)) : null,
                time: detailedResults.some((r) => r.time) ? JSON.stringify(detailedResults.map((r) => r.time)) : null,
            },
        });

        // if all passed = true mark problem as solved for the curretn user
        if(allPassed){
            await db.problemSolved.upsert({
                where: {
                    userId_problemId: {
                        userId,
                        problemId
                    }
                },
                update: {},
                create: {
                    userId,
                    problemId
                }
            });  
        }

        // save individual testcase results using detailedResults 

        const testCaseResults = detailedResults.map((result) => ({
            submissionId: submission.id,
            testCase: result.testCase,
            passed: result.passed,
            stdout: result.stdout,
            expected: result.expected,
            stderr: result.stderr,
            compileOutput: result.compile_output,
            status: result.status,
            memory: result.memory,
            time: result.time
        }));


        await db.testCaseResult.createMany({
            data: testCaseResults
        });

        res.status(200).json({
            success: true,
            message: "code executed! successfully",
            submission: {
                id: submission.id,
                problemId: submission.problemId,
                sourceCode: submission.sourceCode,
                language: submission.language,
                status: submission.status,
                memory: submission.memory,
                time: submission.time,
                createdAt: submission.createdAt,
                testCases: detailedResults.map((result) => ({
                    testCase: result.testCase,
                    passed: result.passed,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    compileOutput: result.compile_output,
                    status: result.status,
                    memory: result.memory,
                    time: result.time
                }))
            }
        });
    } catch (error) {
        console.error("error while executing the code: ", error);
        
        return res.status(500).json({
            success: false,
            error: "error while executing the code"
        });
    }
};
