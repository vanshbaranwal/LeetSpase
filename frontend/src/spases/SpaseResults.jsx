
import { CheckCircle2, Clock3, LoaderCircle, XCircle } from "lucide-react";
import Submission from "../components/Submission";

export default function SpaseResults({ job, queued, history, spase }) {
  const isWorking = job.state === "RUNNING" || job.state === "QUEUED";
  const lastResult = isWorking ? history.find((item) => item.state === "FINISHED" || item.state === "FAILED") : job;
  const isAccepted = lastResult?.result?.status === "accepted";
  const useDetailedResults = Array.isArray(lastResult?.result?.testCases) && lastResult.state === "FINISHED";
  const resultWorkspace = lastResult ?? job;
  const fromEarlierWorkspace = resultWorkspace.problemId !== spase.problemId || resultWorkspace.language !== spase.language;
  const Icon = job.state === "RUNNING" ? LoaderCircle :
    job.state === "QUEUED" ? Clock3 : isAccepted ? CheckCircle2 : XCircle;
  const action = job.mode === "run" ? "run" : "submit";
  const verb = job.mode === "run" ? "running" : "submitting";
  const label = job.state === "RUNNING" ? `${job.actorName} is ${verb} the code…` :
    job.state === "QUEUED" ? `${job.actorName} queued a ${action}` :
      `${job.mode === "run" ? "Run" : "Submission"} by ${job.actorName}`;

  return (
    <div className="min-w-0 space-y-3 text-xs">
      <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 text-white/85">
        <span className="inline-flex min-w-0 items-center gap-2 [overflow-wrap:anywhere]">
          <Icon className={`size-4 shrink-0 ${job.state === "RUNNING" ? "motion-safe:animate-spin" : ""}`} aria-hidden />
          {label}
        </span>
        {queued > 0 && <span className="text-white/65">{queued} queued</span>}
      </div>
      {fromEarlierWorkspace && <p className="text-white/65">Earlier workspace · {resultWorkspace.language}</p>}
      {isWorking && lastResult && <h3 className="font-medium text-white/70">Last result · {lastResult.actorName}</h3>}
      {useDetailedResults && <Submission key={lastResult.id} submission={lastResult.result} />}
      {lastResult?.state === "FAILED" && <p className="whitespace-pre-wrap text-red-200 [overflow-wrap:anywhere]">{lastResult.error}</p>}
      {!useDetailedResults && lastResult?.result && (
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className={`text-sm font-semibold ${isAccepted ? "text-emerald-300" : "text-red-200"}`}>
            {isAccepted ? "Accepted" : "Wrong answer"}
          </h3>
          <p className="text-white/65">{lastResult.result.passed}/{lastResult.result.total} tests passed</p>
        </div>
      )}
      {history.some(({ id }) => id !== job.id) && (
        <ul aria-label="Recent spase executions" className="space-y-1 border-t border-white/10 pt-2 text-white/65">
          {history.filter(({ id }) => id !== job.id).map((other) => (
            <li key={other.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1">
              <span>{other.actorName} · {other.mode === "run" ? "Run" : "Submit"}</span>
              <span className="capitalize">{other.result?.status || other.state.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
