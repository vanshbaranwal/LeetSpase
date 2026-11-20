import { useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

const parseMetric = (value) => {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(parseMetric);
  if (typeof value === "number") return Number.isFinite(value) ? [value] : [];

  const stringValue = String(value).trim();
  if (!stringValue) return [];

  try {
    const parsed = JSON.parse(stringValue);
    if (parsed !== stringValue) return parseMetric(parsed);
  } catch {
    // Plain values such as "0.110 s" are parsed below.
  }

  const matches = stringValue.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number).filter(Number.isFinite) : [];
};

const average = (values) => {
  const numbers = parseMetric(values);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
};

const formatStatus = (status) => status.trim().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const diagnosticFields = [
  ["compileOutput", "Compiler output"],
  ["stderr", "Error output"],
];

const collectDiagnostics = (testCases) => {
  const diagnostics = new Map();

  for (const testCase of testCases) {
    for (const [field, label] of diagnosticFields) {
      const output = testCase[field]?.trimEnd();
      if (!output) continue;

      if (!diagnostics.has(output)) diagnostics.set(output, { label, output, cases: new Set() });
      const diagnostic = diagnostics.get(output);
      if (field === "compileOutput") diagnostic.label = label;
      diagnostic.cases.add(testCase.number);
    }
  }

  return [...diagnostics.values()];
};

const SubmissionResults = ({ submission }) => {
  const [showComplexity, setShowComplexity] = useState(false);
  const testCases = (Array.isArray(submission?.testCases) ? submission.testCases : []).map((testCase, index) => ({
    ...testCase,
    number: testCase.testCase ?? index + 1,
    label: formatStatus(
      !testCase.passed && testCase.status?.toLowerCase() === "accepted"
        ? "wrong answer"
        : testCase.status || (testCase.passed ? "accepted" : "failed")
    ),
  }));
  const failedCases = testCases.filter((testCase) => !testCase.passed);
  const passedCases = testCases.filter((testCase) => testCase.passed);
  const orderedCases = [...failedCases, ...passedCases];
  const diagnostics = collectDiagnostics(orderedCases);
  const avgTime = average(submission?.time);
  const avgMemory = average(submission?.memory);
  const isAccepted = submission?.status?.toLowerCase() === "accepted";
  const VerdictIcon = isAccepted ? CheckCircle2 : XCircle;
  const verdict = failedCases[0]?.label ?? formatStatus(submission?.status || "Finished");

  return (
    <div className="@container min-w-0 text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className={`flex min-w-0 items-start gap-2 font-semibold ${isAccepted ? "text-[#10b981]" : "text-red-300"}`}>
            <VerdictIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="[overflow-wrap:anywhere]">{verdict}</span>
          </h2>
          {testCases.length > 0 && (
            <p className="text-xs tabular-nums text-white/65">{passedCases.length}/{testCases.length} passed</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowComplexity(!showComplexity)}
          className="rounded-md px-2 py-1 text-xs font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          {showComplexity ? "Back to results" : "Complexity"}
        </button>
      </div>

      {showComplexity ? (
        <div className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 p-4 text-center text-sm text-white/65">
          <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
          Time and space complexity analysis is coming soon.
        </div>
      ) : (
        <>
          {diagnostics.length > 0 && (
            <div className="mb-4 space-y-2">
              {diagnostics.map(({ label, output, cases }) => (
                <div key={output} className="rounded-lg border border-red-300/20 bg-red-300/[0.045]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-red-300/15 px-3 py-2 text-xs">
                    <h3 className="font-semibold text-red-200">{label}</h3>
                    <p className="min-w-0 text-white/60">{cases.size === 1 ? "Case" : "Cases"} {[...cases].join(", ")}</p>
                  </div>
                  <pre className="whitespace-pre-wrap px-3 py-2.5 font-mono text-xs leading-relaxed text-red-100 [overflow-wrap:anywhere] [tab-size:4]"><code>{output}</code></pre>
                </div>
              ))}
            </div>
          )}

          {testCases.length > 0 && (
            <section aria-label="Test case results">
              <h3 className="mb-1 text-xs font-semibold text-white/70">Test cases</h3>
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {orderedCases.map((testCase) => (
                  <li key={testCase.id ?? testCase.number} className="py-3">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                        <h4 className="font-semibold text-white/90">Case {testCase.number}</h4>
                        <span className={`min-w-0 [overflow-wrap:anywhere] ${testCase.passed ? "text-[#10b981]" : "text-red-300"}`}>
                          {testCase.passed ? "Passed" : testCase.label}
                        </span>
                      </div>
                      {[testCase.time, testCase.memory].some(Boolean) && (
                        <span className="text-white/60">{[testCase.time, testCase.memory].filter(Boolean).join(" · ")}</span>
                      )}
                    </div>
                    <dl className="grid gap-2 @sm:grid-cols-2">
                      <CaseOutput label="Expected output" value={testCase.expected} />
                      <CaseOutput label="Your output" value={testCase.stdout} emptyLabel="No output" />
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(avgTime !== null || avgMemory !== null) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/65">
              {avgTime !== null && <p>Average time <span className="ml-1 tabular-nums text-white/85">{avgTime.toFixed(3)} s</span></p>}
              {avgMemory !== null && <p>Average memory <span className="ml-1 tabular-nums text-white/85">{avgMemory.toFixed(0)} KB</span></p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CaseOutput = ({ label, value, emptyLabel = "—" }) => (
  <div className="min-w-0 rounded-md bg-black/20 px-2.5 py-2">
    <dt className="mb-1 text-xs text-white/60">{label}</dt>
    <dd>
      {value ? (
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/90 [overflow-wrap:anywhere] [tab-size:4]"><code>{value}</code></pre>
      ) : (
        <span className="text-xs text-white/55">{emptyLabel}</span>
      )}
    </dd>
  </div>
);

export default SubmissionResults;
