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

const SubmissionResults = ({ submission }) => {
  const testCases = Array.isArray(submission?.testCases) ? submission.testCases : [];
  const avgMemory = average(parseMetric(submission?.memory));
  const avgTime = average(parseMetric(submission?.time));
  const passedTests = testCases.filter((testCase) => testCase.passed).length;
  const isAccepted = submission?.status?.toLowerCase() === "accepted";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className={`flex items-center gap-2 text-sm font-semibold ${isAccepted ? "text-emerald-300" : "text-red-300"}`}>
          {isAccepted ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {submission?.status || "Finished"}
        </div>
        <Metric icon={CheckCircle2} value={`${passedTests}/${testCases.length}`} label="passed" />
        <Metric icon={Clock3} value={`${avgTime.toFixed(3)} s`} label="runtime" />
        <Metric icon={MemoryStick} value={`${avgMemory.toFixed(0)} KB`} label="memory" />
      </div>

      {!!testCases.length && (
        <div className="mt-4 space-y-2">
          {testCases.map((testCase, index) => (
            <div key={testCase.id || testCase.testCase || index} className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-3.5 py-3 sm:grid-cols-[auto_80px_1fr_auto_auto] sm:items-center">
              {testCase.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <XCircle className="h-4 w-4 text-red-300" />}
              <span className="text-xs font-medium text-white/55">Case {testCase.testCase || index + 1}</span>
              <code className="col-span-2 truncate text-xs text-white/45 sm:col-span-1">{testCase.stdout || "No output"}</code>
              <span className="text-[11px] text-white/28">{testCase.time || "—"}</span>
              <span className="text-[11px] text-white/28">{testCase.memory || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Metric = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 text-xs">
    <Icon className="h-3.5 w-3.5 text-white/25" />
    <span className="font-medium text-white/62">{value}</span>
    <span className="text-white/25">{label}</span>
  </div>
);

export default SubmissionResults;
