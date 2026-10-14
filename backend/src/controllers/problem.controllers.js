import { db } from "../libs/db.js";
import { getJudge0LanguageId, pollBatchResults, submitBatch } from "../libs/judge0.lib.js";
import { publicProblemSelect, publicProblemSummarySelect } from "../libs/problem-selects.js";
import { cleanProblemTitle, createProblemTitleKey } from "../libs/problem-title.js";

const getDailyChallengeDate = () => {
    const timeZone = process.env.DAILY_CHALLENGE_TIMEZONE || "Asia/Kolkata";
    const dateParts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());
    const date = Object.fromEntries(
        dateParts
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, value])
    );

    return new Date(`${date.year}-${date.month}-${date.day}T00:00:00.000Z`);
};

const isYoutubeVideoUrl = (value) => {
    try {
        const url = new URL(value);
        if(!["http:", "https:"].includes(url.protocol)) return false;

        const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
        if(hostname === "youtu.be") return Boolean(url.pathname.slice(1).split("/")[0]);
        if(hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) return false;

        return (
            (url.pathname === "/watch" && Boolean(url.searchParams.get("v"))) ||
            /^\/(shorts|embed|live)\/[^/]+/.test(url.pathname)
        );
    } catch {
        return false;
    }
};



export const createProblem = async(req, res) => {
    
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        hints,
        intuition,
        editorial,
        walkthrough,
        timeComplexity,
        spaceComplexity,
        youtubeUrl,
        testcases,
        codeSnippet,
        referenceSolutions
    } = req.body;

    if(typeof title !== "string" || !title.trim()){
        return res.status(400).json({
            error: "problem title is required"
        });
    }

    const cleanedTitle = cleanProblemTitle(title);
    const titleKey = createProblemTitleKey(title);
    const normalizedYoutubeUrl = typeof youtubeUrl === "string" ? youtubeUrl.trim() : "";

    if(normalizedYoutubeUrl && !isYoutubeVideoUrl(normalizedYoutubeUrl)){
        return res.status(400).json({
            error: "a valid YouTube video URL is required"
        });
    }
    
    // using middleware checkadmin in routes
    // if(req.user.role !== "ADMIN"){
    //     return res.status(403).json({
    //         error: "you are not allowed to create a problem",
    //     });
    // };

    try {
        const existingTitle = await db.problem.findUnique({
            where: { titleKey },
            select: { id: true }
        });

        if(existingTitle){
            return res.status(409).json({
                error: "a problem with this title already exists"
            });
        }

        for(const [language, solutionCode] of Object.entries(referenceSolutions)){
            const languageId = getJudge0LanguageId(language);

            if(!languageId){
                return res.status(400).json({
                    error: `language ${language} is not supported`,
                });
            };

            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output,
            }));
  
            const submissionResults = await submitBatch(submissions);
            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResults(tokens);

            for(let i = 0; i < results.length; i++){
                const result = results[i];
                console.log("result --------", result);
                // console.log(`testcase ${ i + 1 } and language ${ language } ------- result ${ JSON.stringify(result.status.description) }`);

                if(!result.status || result.status.id !== 3){
                    return res.status(400).json({
                        error: `testcase ${i+1} failed for language ${language}`
                    });
                }
            }

        }
        
        const newProblem = await db.problem.create({
            data: {
                title: cleanedTitle,
                titleKey,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                hints,
                intuition,
                editorial,
                walkthrough,
                timeComplexity,
                spaceComplexity,
                youtubeUrl: normalizedYoutubeUrl || null,
                testcases,
                codeSnippet,
                referenceSolutions,
                userId: req.user.id,
            },
            select: publicProblemSelect,
        });

        return res.status(201).json({
            success: true,
            message: "problem created successfully",
            problem: newProblem,
        });
        
    } catch (error) {
        console.log(error);

        if(error.code === "P2002" && error.meta?.target?.includes("titleKey")){
            return res.status(409).json({
                error: "a problem with this title already exists"
            });
        }

        return res.status(500).json({
            error: "error while creating problem",
        });
    }

};

export const getAllProblems = async (req, res) => {
    try {
        const problems = await db.problem.findMany({
            select: {
                ...publicProblemSummarySelect,
                solvedBy: req.user
                    ? {
                        where: {
                            userId: req.user.id
                        },
                        select: {
                            userId: true
                        }
                    }
                    : false
            }
        });

        return res.status(200).json({
            success: true,
            message: "problems fetched successfully",
            problems
        });
    } catch (error) {
        console.error("error fetching problems:", error);

        return res.status(500).json({
            success: false,
            error: "error while fetching problems"
        });
    }
};

export const getProblemOfTheDay = async (req, res) => {
    const challengeDate = getDailyChallengeDate();

    const dailyChallengeSelect = {
        challengeDate: true,
        problem: {
            select: publicProblemSummarySelect
        }
    };

    try {
        let dailyChallenge = await db.dailyChallenge.findUnique({
            where: { challengeDate },
            select: dailyChallengeSelect
        });

        if(!dailyChallenge){
            const problemCount = await db.problem.count();

            if(problemCount === 0){
                return res.status(404).json({
                    success: false,
                    error: "no problems are available for today's challenge"
                });
            }

            const randomOffset = Math.floor(Math.random() * problemCount);
            const selectedProblem = await db.problem.findFirst({
                orderBy: { id: "asc" },
                skip: randomOffset,
                select: { id: true }
            });

            try {
                dailyChallenge = await db.dailyChallenge.create({
                    data: {
                        challengeDate,
                        problemId: selectedProblem.id
                    },
                    select: dailyChallengeSelect
                });
            } catch (error) {
                if(error.code !== "P2002") throw error;

                // Another request created today's record first. Return that
                // record so every user still receives the same challenge.
                dailyChallenge = await db.dailyChallenge.findUnique({
                    where: { challengeDate },
                    select: dailyChallengeSelect
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "problem of the day fetched successfully",
            challengeDate: dailyChallenge.challengeDate,
            problem: dailyChallenge.problem
        });
    } catch (error) {
        console.error("error fetching problem of the day:", error);

        return res.status(500).json({
            success: false,
            error: "failed to fetch problem of the day"
        });
    }
};

export const getProblemById = async(req, res) => {
    const { id } = req.params;

    try {
        const problem = await db.problem.findUnique({
            where: { id },
            select: {
                ...publicProblemSelect,
                testcases: true,
                referenceSolutions: true
            },
        });

        if(!problem){
            return res.status(404).json({
                error: "problem not found"
            });
        }

        const { testcases, ...publicProblem } = problem;
        const sampleTestCases = Array.isArray(testcases)
            ? testcases
                .filter((testCase) =>
                    testCase &&
                    typeof testCase.input === "string" &&
                    typeof testCase.output === "string"
                )
                .slice(0, 3)
                .map(({ input, output }) => ({ input, output }))
            : [];

        return res.status(200).json({
            success: true,
            message: "problem fetched successfully",
            problem: {
                ...publicProblem,
                sampleTestCases
            }
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "error while fetching problem by id"
        });
    }
};

export const updateProblem = async(req, res) => {
    // id
    // id--->problem ( condition)
    // rest same as create
    const { id } = req.params;

    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        hints,
        intuition,
        editorial,
        walkthrough,
        timeComplexity,
        spaceComplexity,
        youtubeUrl,
        testcases,
        codeSnippet,
        referenceSolutions
    } = req.body;

    if(typeof title !== "string" || !title.trim()){
        return res.status(400).json({
            error: "problem title is required"
        });
    }

    const cleanedTitle = cleanProblemTitle(title);
    const titleKey = createProblemTitleKey(title);
    const normalizedYoutubeUrl = typeof youtubeUrl === "string" ? youtubeUrl.trim() : "";

    if(normalizedYoutubeUrl && !isYoutubeVideoUrl(normalizedYoutubeUrl)){
        return res.status(400).json({
            error: "a valid YouTube video URL is required"
        });
    }

    try {
        const existingProblem = await db.problem.findUnique({ where: { id } });

        if(!existingProblem){
            return res.status(404).json({
                error: "problem not found"
            });
        }

        const existingTitle = await db.problem.findUnique({
            where: { titleKey },
            select: { id: true }
        });

        if(existingTitle && existingTitle.id !== id){
            return res.status(409).json({
                error: "a problem with this title already exists"
            });
        }

        if(!referenceSolutions || typeof referenceSolutions !== "object" || Object.keys(referenceSolutions).length === 0){
            return res.status(400).json({
                error: "reference solutions are required"
            });
        }

        if(!Array.isArray(testcases) || testcases.length === 0){
            return res.status(400).json({
                error: "atleast one testcase is required"
            });
        }

        for(const [language, solutionCode] of Object.entries(referenceSolutions)){
            const languageId = getJudge0LanguageId(language);

            if(!languageId){
                return res.status(400).json({
                    error: `language ${language} is not supported`
                });
            }

            const submissions = testcases.map(({ input, output }) => ({
                source_code: solutionCode,
                language_id: languageId,
                stdin: input,
                expected_output: output
            }));

            const submissionResults = await submitBatch(submissions);

            const tokens = submissionResults.map((res) => res.token);

            const results = await pollBatchResults(tokens);

            for(let i = 0; i < results.length; i++){
                const result = results[i];
                console.log("result --------", result);

                if(!result.status || result.status.id !== 3){
                    return res.status(400).json({
                        error: `testcase ${i+1} failed for language ${language}` 
                    });
                }
            }
        }

        const updatedProblem = await db.problem.update({
            where: { id },
            data: {
                title: cleanedTitle,
                titleKey,
                description,
                difficulty,
                tags,
                examples,
                constraints,
                hints,
                intuition,
                editorial,
                walkthrough,
                timeComplexity,
                spaceComplexity,
                youtubeUrl: normalizedYoutubeUrl || null,
                testcases,
                codeSnippet,
                referenceSolutions
            },
            select: publicProblemSelect,
        });

        return res.status(200).json({
            success: true,
            message: "problem updated successfully",
            problem: updatedProblem
        });

    } catch (error) {
        console.error(`error updating problem: ${error}`);

        if(error.code === "P2002" && error.meta?.target?.includes("titleKey")){
            return res.status(409).json({
                error: "a problem with this title already exists"
            });
        }

        return res.status(500).json({
            error: "error while updating problem"
        });
    }

};

export const deleteProblem = async(req, res) => {
    const { id } = req.params;

    // using middleware checkadmin in routes
    // if(req.user.role !== "ADMIN"){
    //     return res.status(403).json({
    //         error: "you are not allowed to create a problem",
    //     });
    // };

    try {
        const problem = await db.problem.findUnique({ where: { id } });
    
        if(!problem){
            return res.status(404).json({
                error: "problem not found"
            });
        }
    
        await db.problem.delete({ where: { id } });

        return res.status(200).json({
            success: true,
            message: "problem deleted successfully"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "error while deleting problem"
        });
    }
};

export const getAllProblemsSolvedByUser = async(req, res) => {
    try {
        const problems = await db.problem.findMany({
            where: {
                solvedBy: {
                    userId: req.user.id
                }
            },
            select: {
                ...publicProblemSelect,
                solvedBy: {
                    where: {
                        userId: req.user.id
                    },
                    select: {
                        userId: true,
                    },
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "problems fetched successfully",
            problems
        });

    } catch (error) {
        console.error("error fetching problems : ", error);
        
        return res.status(500).json({
            error: "failed to fetch problems"
        });
    }
};
