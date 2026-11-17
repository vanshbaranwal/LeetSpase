import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const getJudge0LanguageId = (language) => {
    const languageMap = {
        "PYTHON": 71,
        "JAVA": 62,
        "JAVASCRIPT": 63,
    };

    return languageMap[language.toUpperCase()];
};

const requestTimeoutMs = 10_000;
const resultTimeoutMs = 40_000;
const pollIntervalMs = 1_000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const judge0Headers = {
    "Content-Type": "application/json",
    "X-Auth-Token": process.env.JUDGE0_API_KEY,
};

const codeBoxError = (status, message) => Object.assign(new Error(message), { status });

const requestCodeBox = async ({ method, data, params }, timeoutMs = requestTimeoutMs) => {
    try {
        const response = await axios.request({
            method,
            url: `${process.env.JUDGE0_API_URL}/submissions/batch`,
            data,
            params: { base64_encoded: false, ...params },
            headers: judge0Headers,
            timeout: timeoutMs,
            signal: AbortSignal.timeout(timeoutMs),
        });
        return response.data;
    } catch (error) {
        if (["ECONNABORTED", "ETIMEDOUT", "ERR_CANCELED"].includes(error.code)) {
            throw codeBoxError(504, "CodeBox did not respond in time. Please try again.");
        }
        throw codeBoxError(502, "CodeBox could not process the request. Please try again.");
    }
};

export const pollBatchResults = async (tokens) => {
    const deadline = performance.now() + resultTimeoutMs;

    while (performance.now() < deadline) {
        const remaining = Math.max(1, Math.ceil(deadline - performance.now()));
        const { submissions } = await requestCodeBox(
            { method: "get", params: { tokens: tokens.join(",") } },
            Math.min(requestTimeoutMs, remaining),
        ) ?? {};

        if (!Array.isArray(submissions) || submissions.length !== tokens.length ||
            submissions.some((result) => !Number.isInteger(result?.status?.id))) {
            throw codeBoxError(502, "CodeBox returned incomplete test results. Please try again.");
        }

        if (submissions.every(({ status }) => status.id !== 1 && status.id !== 2)) {
            return submissions;
        }

        const delay = Math.min(pollIntervalMs, deadline - performance.now());
        if (delay > 0) await sleep(delay);
    }

    throw codeBoxError(504, "CodeBox did not finish the tests in time. Please try again.");
};

export const submitBatch = async (submissions) => {
    const results = await requestCodeBox({ method: "post", data: { submissions } });
    if (!Array.isArray(results) || results.length !== submissions.length ||
        results.some((result) => typeof result?.token !== "string" || !result.token)) {
        throw codeBoxError(502, "CodeBox did not queue all the tests. Please try again.");
    }
    return results;
};

export function getLanguageName(LangaugeId){
    const LANGUAGE_NAMES = {
        74: "Typescript",
        63: "Javascript",
        71: "Python",
        62: "Java"
    }

    return LANGUAGE_NAMES[LangaugeId] || "unknown";
};
