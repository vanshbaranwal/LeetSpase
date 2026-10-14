import { useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  MemoryStick,
  XCircle,
} from "lucide-react";

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

const getSubmittedCode = (sourceCode, language) => {
  if (typeof sourceCode === "string") return sourceCode;

  if (sourceCode && typeof sourceCode === "object") {
    const languageCode = sourceCode[language] || sourceCode[String(language || "").toUpperCase()];
    if (typeof languageCode === "string") return languageCode;

    const firstCodeValue = Object.values(sourceCode).find((value) => typeof value === "string");
    if (firstCodeValue) return firstCodeValue;

    return JSON.stringify(sourceCode, null, 2);
  }

  return "";
};

const SubmissionsList = ({ submissions, isLoading }) => {
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [copiedSubmissionId, setCopiedSubmissionId] = useState(null);

  const handleCopyCode = async (submissionId, code) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedSubmissionId(submissionId);
      window.setTimeout(() => {
        setCopiedSubmissionId((currentId) => currentId === submissionId ? null : currentId);
      }, 1600);
    } catch {
      setCopiedSubmissionId(null);
    }
  };

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
          <p className="mt-2 text-xs text-white/35">Submit your first solution to start building history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {submissions.map((submission) => {
        const normalizedStatus = String(submission.status || "").trim().toLowerCase();
        const isAccepted = normalizedStatus === "accepted";
        const statusLabel = normalizedStatus
          ? normalizedStatus.replace(/\b\w/g, (letter) => letter.toUpperCase())
          : "Unknown";
        const isExpanded = expandedSubmissionId === submission.id;
        const submittedCode = getSubmittedCode(submission.sourceCode, submission.language);
        const codePanelId = `submission-code-${submission.id}`;

        return (
          <article key={submission.id} className={`overflow-hidden rounded-2xl border bg-[#0d0d0d] transition-colors ${isExpanded ? "border-white/[0.16]" : "border-white/[0.08] hover:border-white/[0.14]"}`}>
            <button
              type="button"
              onClick={() => setExpandedSubmissionId(isExpanded ? null : submission.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white/30"
              aria-expanded={isExpanded}
              aria-controls={codePanelId}
            >
              <span className="flex items-center gap-3">
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${isAccepted ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                  {isAccepted ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </span>
                <span>
                  <span className={`block text-sm font-semibold ${isAccepted ? "text-emerald-300" : "text-red-300"}`}>{statusLabel}</span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-white/28">{submission.language}</span>
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-3 text-[11px] text-white/38">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{average(submission.time).toFixed(3)} s</span>
                <span className="flex items-center gap-1.5"><MemoryStick className="h-3.5 w-3.5" />{average(submission.memory).toFixed(0)} KB</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(submission.createdAt).toLocaleDateString()}</span>
                <span className="ml-1 flex items-center gap-1.5 text-white/48">
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View code</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </span>
              </span>
            </button>

            {isExpanded && (
              <div id={codePanelId} className="border-t border-white/[0.07] bg-black/20">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">Submitted solution</p>
                    <p className="mt-1 text-xs text-white/45">{submission.language}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(submission.id, submittedCode)}
                    disabled={!submittedCode}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-xs text-white/45 transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Copy submitted code"
                  >
                    {copiedSubmissionId === submission.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSubmissionId === submission.id ? "Copied" : "Copy"}
                  </button>
                </div>
                {submittedCode ? (
                  <pre className="max-h-[28rem] overflow-auto border-t border-white/[0.06] p-5 font-mono text-[13px] leading-6 text-white/68"><code>{submittedCode}</code></pre>
                ) : (
                  <p className="border-t border-white/[0.06] px-5 py-8 text-center text-sm text-white/30">The source code for this older submission is unavailable.</p>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
