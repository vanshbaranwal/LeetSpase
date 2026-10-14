import { useState } from "react";
import { CheckCircle2, Clock3, MemoryStick, XCircle } from "lucide-react";

const parseMetric = (value) => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const average = (values) => {
  const numbers = values.map((value) => Number.parseFloat(value)).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;
};

const formatStatus = (status) => String(status || "Unknown")
  .trim()
  .toLowerCase()
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const SubmissionResults = ({ submission }) => {
  const [activeTab, setActiveTab] = useState("results");
  const testCases = Array.isArray(submission?.testCases) ? submission.testCases : [];
  const avgMemory = average(parseMetric(submission?.memory));
  const avgTime = average(parseMetric(submission?.time));
  const passedTests = testCases.filter((testCase) => testCase.passed).length;
  const isAccepted = submission?.status?.toLowerCase() === "accepted";
  const successRate = testCases.length ? Math.round((passedTests / testCases.length) * 100) : 0;

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-white/[0.07] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "results" ? "bg-white text-black" : "text-white/38 hover:bg-white/[0.04] hover:text-white/68"}`}
        >
          Submission result
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("complexity")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "complexity" ? "bg-white text-black" : "text-white/38 hover:bg-white/[0.04] hover:text-white/68"}`}
        >
          Complexity
        </button>
      </div>

      {activeTab === "results" ? (
        <div>
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <SummaryMetric
              label="Status"
              value={formatStatus(submission?.status || "Finished")}
              icon={isAccepted ? CheckCircle2 : XCircle}
              valueClass={isAccepted ? "text-emerald-300" : "text-red-300"}
              iconClass={isAccepted ? "text-emerald-300" : "text-red-300"}
            />
            <SummaryMetric label="Success rate" value={`${successRate}%`} detail={`${passedTests}/${testCases.length} passed`} icon={CheckCircle2} />
            <SummaryMetric label="Average time" value={`${avgTime.toFixed(3)} s`} icon={Clock3} />
            <SummaryMetric label="Average memory" value={`${avgMemory.toFixed(0)} KB`} icon={MemoryStick} />
          </div>

          {!!testCases.length && (
            <div className="mt-5">
              <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">Testcase results</p>
              <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-black/25">
                <table className="w-full min-w-[840px] table-fixed text-left">
                  <thead className="border-b border-white/[0.07] bg-white/[0.018] font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">
                    <tr>
                      <th className="w-[72px] px-3 py-2.5 font-medium">Case</th>
                      <th className="w-[90px] px-3 py-2.5 font-medium">Result</th>
                      <th className="w-[112px] px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Expected output</th>
                      <th className="px-3 py-2.5 font-medium">Your output</th>
                      <th className="w-[82px] px-3 py-2.5 font-medium">Time</th>
                      <th className="w-[92px] px-3 py-2.5 font-medium">Memory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs">
                    {testCases.map((testCase, index) => {
                      const userOutput = testCase.stdout ?? testCase.compileOutput ?? testCase.stderr ?? "No output";
                      return (
                        <tr key={testCase.id || testCase.testCase || index} className="transition-colors hover:bg-white/[0.018]">
                          <td className="px-3 py-3 font-medium text-white/52">Case {testCase.testCase || index + 1}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${testCase.passed ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                              {testCase.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {testCase.passed ? "Passed" : "Failed"}
                            </span>
                          </td>
                          <td className="truncate px-3 py-3 text-white/38" title={formatStatus(testCase.status)}>{formatStatus(testCase.status)}</td>
                          <td className="px-3 py-3"><code className="block truncate text-white/52" title={String(testCase.expected ?? "")}>{String(testCase.expected ?? "—")}</code></td>
                          <td className="px-3 py-3"><code className={`block truncate ${testCase.passed ? "text-white/52" : "text-red-300/70"}`} title={String(userOutput)}>{String(userOutput)}</code></td>
                          <td className="px-3 py-3 text-white/30">{testCase.time || "—"}</td>
                          <td className="px-3 py-3 text-white/30">{testCase.memory || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-5 py-7 text-center">
          <div>
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-white/35">
              <Clock3 className="h-3.5 w-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Coming soon</span>
            </div>
            <p className="mt-3 text-sm font-medium text-white/62">Time and space complexity analysis</p>
            <p className="mt-1.5 text-xs leading-5 text-white/30">This analysis will be available in a future update.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryMetric = ({ icon: Icon, label, value, detail, valueClass = "text-white/68", iconClass = "text-white/28" }) => (
  <div className="min-w-0 rounded-xl border border-white/[0.07] bg-black/25 p-3">
    <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/28">
      <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
      <span>{label}</span>
    </div>
    <p className={`mt-2 truncate text-sm font-semibold ${valueClass}`}>{value}</p>
    {detail && <p className="mt-0.5 text-[10px] text-white/28">{detail}</p>}
  </div>
);

export default SubmissionResults;
