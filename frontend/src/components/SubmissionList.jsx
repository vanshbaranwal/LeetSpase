import { CalendarDays, CheckCircle2, Clock3, MemoryStick, XCircle } from "lucide-react";

const parseMetric = (value) => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const average = (value) => {
  const numbers = parseMetric(value).map((item) => Number.parseFloat(item)).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, item) => sum + item, 0) / numbers.length : 0;
};

const SubmissionsList = ({ submissions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid min-h-56 place-items-center">
        <span className="loading loading-spinner loading-sm text-white/55" />
      </div>
    );
  }

  if (!submissions?.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.018] p-8 text-center">
        <div>
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-white/40"><Clock3 className="h-4 w-4" /></div>
          <p className="mt-4 text-sm font-medium text-white/70">No submissions yet</p>
          <p className="mt-2 text-xs text-white/35">Run your first solution to start building history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {submissions.map((submission) => {
        const isAccepted = submission.status === "Accepted";
        return (
          <article key={submission.id} className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] p-4 transition-colors hover:border-white/[0.14]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${isAccepted ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                  {isAccepted ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${isAccepted ? "text-emerald-300" : "text-red-300"}`}>{submission.status}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/28">{submission.language}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/38">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{average(submission.time).toFixed(3)} s</span>
                <span className="flex items-center gap-1.5"><MemoryStick className="h-3.5 w-3.5" />{average(submission.memory).toFixed(0)} KB</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(submission.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
