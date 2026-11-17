import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronDown,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  ListChecks,
  LoaderCircle,
  MessageSquare,
  PanelBottom,
  PanelBottomClose,
  PanelLeft,
  PanelLeftClose,
  Play,
  RotateCcw,
  Share2,
  TerminalSquare,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useProblemStore } from "../store/useProblemStore";
import { useAuthStore } from "../store/useAuthStore";
import { getLanguageId } from "../lib/lang";
import { useExecutionStore } from "../store/useExecutionStore";
import { useSubmissionStore } from "../store/useSubmissionStore";
import Submission from "../components/Submission";
import SubmissionsList from "../components/SubmissionList";
import WorkspaceDivider from "../components/WorkspaceDivider";
import SpaseEditor from "../spases/SpaseEditor";
import SpaseResults from "../spases/SpaseResults";

const difficultyStyles = {
  EASY: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  MEDIUM: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  HARD: "border-red-400/20 bg-red-400/10 text-red-300",
};

const tabs = [
  { id: "description", label: "Description", icon: FileText },
  { id: "editorial", label: "Editorial", icon: BookOpenText },
  { id: "submissions", label: "Submissions", icon: ListChecks },
  { id: "discussion", label: "Discuss", icon: MessageSquare },
];

const solutionLanguageOrder = ["PYTHON", "JAVA", "JAVASCRIPT"];

const workspaceLayoutKey = "leetspase:problem-workspace-layout";
const problemSplit = { min: 24, max: 72, defaultValue: 41 };
const editorSplit = { min: 24, max: 84, defaultValue: 66 };
const dividerSize = "10px";

const readWorkspaceLayout = () => {
  const defaults = {
    problemWidth: problemSplit.defaultValue,
    editorHeight: editorSplit.defaultValue,
    showProblem: true,
    showConsole: true,
  };

  try {
    const saved = JSON.parse(window.localStorage.getItem(workspaceLayoutKey));
    if (!saved) return defaults;

    const readSize = (size, { min, max, defaultValue }) =>
      Number.isFinite(size) ? Math.min(max, Math.max(min, Math.round(size))) : defaultValue;

    return {
      problemWidth: readSize(saved.problemWidth, problemSplit),
      editorHeight: readSize(saved.editorHeight, editorSplit),
      showProblem: saved.showProblem !== false,
      showConsole: saved.showConsole !== false,
    };
  } catch {
    return defaults;
  }
};

const splitTracks = (size) => `minmax(0, ${size}fr) ${dividerSize} minmax(0, ${100 - size}fr)`;

const formatLanguage = (language) => {
  if (language === "JAVASCRIPT") return "JavaScript";
  return language.charAt(0) + language.slice(1).toLowerCase();
};

const getDraftKey = (userId, problemId, language, isDemo = false) =>
  isDemo
    ? `leetspase:code-draft:${userId || "user"}:${problemId}:demo-solution-v1:${language}`
    : `leetspase:code-draft:${userId || "user"}:${problemId}:${language}`;

const getEditorDefaultCode = (problem, language) => {
  if (problem?.isDemo && problem.referenceSolutions?.[language]) {
    return problem.referenceSolutions[language];
  }

  return problem?.codeSnippet?.[language] || "";
};

const readDraft = (draftKey) => {
  try {
    return window.localStorage.getItem(draftKey);
  } catch {
    return null;
  }
};

const saveDraft = (draftKey, value) => {
  try {
    window.localStorage.setItem(draftKey, value);
  } catch {
    // The editor remains usable when browser storage is unavailable.
  }
};

const removeDraft = (draftKey) => {
  try {
    window.localStorage.removeItem(draftKey);
  } catch {
    // Reset still restores the starter code when storage is unavailable.
  }
};

const ProblemPage = ({ sharedSpase }) => {
  const { id: routeId } = useParams();
  const id = sharedSpase?.spase.problemId ?? routeId;
  const canEditSpase = sharedSpase?.isLive && sharedSpase.access.canEdit;
  const canLeadSpase = sharedSpase?.isLive && sharedSpase.access.isHost;
  const spaseJob = sharedSpase?.sharedJob;
  const spaseResultKey = spaseJob ? `${spaseJob.id}:${spaseJob.state}` : null;
  const [dismissedSpaseResult, setDismissedSpaseResult] = useState(null);
  const { authUser } = useAuthStore();
  const { getProblemById, problem, isProblemLoading } = useProblemStore();
  const {
    submission: submissions,
    isLoading: isSubmissionsLoading,
    getSubmissionForProblem,
  } = useSubmissionStore();
  const {
    runCode,
    submitCode,
    result: executionResult,
    lastAction,
    isRunning,
    isSubmitting,
    clearResult,
  } = useExecutionStore();

  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [ownLanguage, setSelectedLanguage] = useState("JAVASCRIPT");
  const selectedLanguage = sharedSpase?.spase.language ?? ownLanguage;
  const [selectedCase, setSelectedCase] = useState(0);
  const [editorialLanguage, setEditorialLanguage] = useState("PYTHON");
  const [copied, setCopied] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const consoleRef = useRef(null);
  const consoleContentRef = useRef(null);
  const [layout, setLayout] = useState(readWorkspaceLayout);
  const { problemWidth, editorHeight, showProblem } = layout;
  const showConsole = layout.showConsole || Boolean(spaseResultKey && spaseResultKey !== dismissedSpaseResult);
  const isSharedWorkspace = Boolean(sharedSpase);
  const EditorComponent = isSharedWorkspace ? SpaseEditor : Editor;
  const visibleResult = spaseResultKey || executionResult;
  const draftKey = useMemo(
    () => getDraftKey(authUser?.id, id, selectedLanguage, problem?.isDemo),
    [authUser?.id, id, selectedLanguage, problem?.isDemo]
  );

  const publicExamples = useMemo(() => {
    const examples = Array.isArray(problem?.examples)
      ? problem.examples
      : Object.values(problem?.examples || {});
    const seenCases = new Set();

    return examples.filter((example) => {
      if (!example || typeof example.input !== "string" || typeof example.output !== "string") {
        return false;
      }

      const caseKey = `${example.input}\u0000${example.output}`;
      if (seenCases.has(caseKey)) return false;

      seenCases.add(caseKey);
      return true;
    });
  }, [problem]);

  const testcases = useMemo(
    () => {
      const samples = Array.isArray(problem?.sampleTestCases) && problem.sampleTestCases.length
        ? problem.sampleTestCases
        : publicExamples;

      return samples
        .filter((testCase) =>
          testCase &&
          typeof testCase.input === "string" &&
          typeof testCase.output === "string"
        )
        .map(({ input, output }) => ({ input, output }));
    },
    [problem, publicExamples]
  );
  const activeCaseIndex = selectedCase < testcases.length ? selectedCase : 0;
  const activeTestCase = testcases[activeCaseIndex];
  const editorialLanguages = useMemo(() => {
    const solutions = problem?.referenceSolutions || {};
    const preferredLanguages = solutionLanguageOrder.filter((language) => solutions[language]);
    const additionalLanguages = Object.keys(solutions).filter(
      (language) => !solutionLanguageOrder.includes(language) && solutions[language]
    );
    return [...preferredLanguages, ...additionalLanguages];
  }, [problem]);
  const activeEditorialLanguage = editorialLanguages.includes(editorialLanguage)
    ? editorialLanguage
    : editorialLanguages[0];
  const activeEditorialSolution = activeEditorialLanguage
    ? problem?.referenceSolutions?.[activeEditorialLanguage]
    : "";
  useEffect(() => {
    getProblemById(id);
    clearResult();
  }, [id, getProblemById, clearResult]);

  useEffect(() => {
    if (problem && !isSharedWorkspace) {
      const savedDraft = readDraft(draftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(savedDraft ?? getEditorDefaultCode(problem, selectedLanguage));
    }
  }, [draftKey, problem, selectedLanguage, isSharedWorkspace]);

  useEffect(() => {
    if (activeTab === "submissions" && id) getSubmissionForProblem(id);
  }, [activeTab, id, getSubmissionForProblem]);

  useEffect(() => {
    try {
      window.localStorage.setItem(workspaceLayoutKey, JSON.stringify(layout));
    } catch {
      // Layout controls still work if browser storage is unavailable.
    }
  }, [layout]);

  useEffect(() => {
    if (visibleResult && consoleContentRef.current) {
      consoleContentRef.current.scrollTop = 0;
    }
  }, [visibleResult]);

  useEffect(() => {
    if (visibleResult && showConsole && !window.matchMedia("(min-width: 64rem)").matches) {
      consoleRef.current?.scrollIntoView({ block: "start" });
    }
  }, [visibleResult, showConsole]);

  const setPanelSize = (panel, size) => {
    setLayout((current) => current[panel] === size ? current : { ...current, [panel]: size });
  };

  const togglePanel = (panel) => {
    if (panel === "showConsole" && spaseResultKey) {
      setDismissedSpaseResult(showConsole ? spaseResultKey : null);
      setLayout((current) => ({ ...current, showConsole: !showConsole }));
      return;
    }
    setLayout((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const revealConsole = () => {
    setLayout((current) => current.showConsole ? current : { ...current, showConsole: true });
  };

  const handleLanguageChange = (language) => {
    if (sharedSpase) {
      if (canLeadSpase) void sharedSpase.action("spase:problem", { problemId: id, language });
      return;
    }
    const nextDraftKey = getDraftKey(authUser?.id, id, language, problem?.isDemo);
    const savedDraft = readDraft(nextDraftKey);
    setSelectedLanguage(language);
    setCode(savedDraft ?? getEditorDefaultCode(problem, language));
    clearResult();
  };

  const handleCodeChange = (value) => {
    const nextCode = value || "";
    setCode(nextCode);
    saveDraft(draftKey, nextCode);
  };

  const executeInSpase = (mode) => sharedSpase.action("spase:execute", {
    mode, requestId: crypto.randomUUID(), problemId: id,
    language: selectedLanguage, revision: sharedSpase.spase.revision,
  });

  const handleRunCode = async () => {
    if (sharedSpase) {
      if (canEditSpase) await executeInSpase("run");
      return;
    }
    const languageId = getLanguageId(selectedLanguage);
    if (await runCode(code, languageId, id)) revealConsole();
  };

  const handleSubmitCode = async () => {
    if (sharedSpase) {
      if (canEditSpase) await executeInSpase("submit");
      return;
    }
    const languageId = getLanguageId(selectedLanguage);
    const submitted = await submitCode(code, languageId, id);
    if (submitted) revealConsole();
    if (submitted && activeTab === "submissions") {
      await getSubmissionForProblem(id);
    }
  };

  const handleResetCode = () => {
    removeDraft(draftKey);
    setCode(getEditorDefaultCode(problem, selectedLanguage));
    clearResult();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleCopySolution = async () => {
    if (!activeEditorialSolution) return;

    try {
      await navigator.clipboard.writeText(activeEditorialSolution);
      setCopiedSolution(true);
      window.setTimeout(() => setCopiedSolution(false), 1600);
    } catch {
      setCopiedSolution(false);
    }
  };

  if (isProblemLoading || !problem || (sharedSpase && problem.id !== id)) {
    return (
      <div className={`grid w-full place-items-center bg-[#111e36] text-white ${sharedSpase ? "min-h-0 flex-1" : "min-h-screen"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#192b49]">
            <LoaderCircle className="h-5 w-5 animate-spin text-white/70" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/35">Loading workspace</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === "submissions") {
      return <SubmissionsList submissions={submissions} isLoading={isSubmissionsLoading} />;
    }

    if (activeTab === "editorial") {
      return (
        <div className="space-y-8 pb-8">
          <section>
            <SectionLabel>Intuition</SectionLabel>
            <div className={`mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 text-sm leading-7 ${problem.intuition ? "text-white/62" : "text-white/32"}`}>
              {problem.intuition || "Intuition is not available for this problem."}
            </div>
          </section>

          <section>
            <SectionLabel>Approach</SectionLabel>
            <div className={`mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 text-sm leading-7 ${problem.editorial ? "text-white/62" : "text-white/32"}`}>
              {problem.editorial || "An approach is not available for this problem."}
            </div>
          </section>

          <section>
            <SectionLabel>Example Walkthrough</SectionLabel>
            <div className={`mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 text-sm leading-7 ${problem.walkthrough ? "text-white/62" : "text-white/32"}`}>
              {problem.walkthrough || "An example walkthrough is not available for this problem."}
            </div>
          </section>

          <section>
            <SectionLabel>Complexity Analysis</SectionLabel>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-[#14213d] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/32">Time complexity</p>
                <p className={`mt-3 whitespace-pre-wrap font-mono text-sm leading-6 ${problem.timeComplexity ? "text-emerald-300/80" : "text-white/28"}`}>
                  {problem.timeComplexity || "Not available for this problem."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#14213d] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/32">Space complexity</p>
                <p className={`mt-3 whitespace-pre-wrap font-mono text-sm leading-6 ${problem.spaceComplexity ? "text-sky-300/80" : "text-white/28"}`}>
                  {problem.spaceComplexity || "Not available for this problem."}
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionLabel>Video Explanation</SectionLabel>
            {problem.youtubeUrl ? (
              <a
                href={problem.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 transition-colors hover:border-red-400/25 hover:bg-red-400/[0.035] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300/50"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-400 transition-colors group-hover:bg-red-500/15">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white/78">Watch the video walkthrough</span>
                    <span className="mt-1 block text-xs text-white/35">Opens directly on YouTube in a new tab</span>
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-white/28 transition-colors group-hover:text-red-300" />
              </a>
            ) : (
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 text-white/32">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.035]">
                  <Play className="h-5 w-5" />
                </span>
                <p className="text-sm">A video explanation is not available for this problem.</p>
              </div>
            )}
          </section>

          <section>
            <SectionLabel>Reference Solutions</SectionLabel>
            {editorialLanguages.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14213d]">
                <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                    {editorialLanguages.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => setEditorialLanguage(language)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeEditorialLanguage === language ? "bg-white text-black" : "text-white/42 hover:bg-white/[0.05] hover:text-white/72"}`}
                      >
                        {formatLanguage(language)}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={handleCopySolution} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/32 transition-colors hover:bg-white/[0.05] hover:text-white/70" aria-label="Copy reference solution">
                    {copiedSolution ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <pre className="max-h-[34rem] overflow-auto whitespace-pre p-5 font-mono text-[13px] leading-6 text-white/68"><code>{activeEditorialSolution}</code></pre>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#14213d] p-5 text-sm leading-7 text-white/32">
                Reference solutions are not available for this problem.
              </div>
            )}
          </section>
        </div>
      );
    }

    if (activeTab === "discussion") {
      return <EmptyPanel icon={MessageSquare} title="Discussion is coming soon" description="A focused place to compare approaches will be available here." />;
    }

    return (
      <div className="space-y-8 pb-8">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${difficultyStyles[problem.difficulty] || "border-white/10 bg-white/5 text-white/55"}`}>
              {problem.difficulty}
            </span>
            {(problem.tags || []).map((tag) => (
              <span key={tag} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[11px] text-white/45">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">{problem.title}</h1>
          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-white/62">{problem.description}</p>
        </section>

        {!!publicExamples.length && (
          <section className="space-y-6">
            {publicExamples.map((example, index) => (
              <div key={`${example.input}-${example.output}-${index}`}>
                <h3 className="text-sm font-semibold text-white/88">Example {index + 1}:</h3>
                <div className="mt-3 space-y-1 border-l-2 border-white/15 pl-4 font-mono text-[13px] leading-5 text-white/58">
                  <ExampleLine label="Input" value={example.input} />
                  <ExampleLine label="Output" value={example.output} />
                  {example.explanation && (
                    <ExampleLine label="Explanation" value={example.explanation} />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {problem.constraints && (
          <section>
            <SectionLabel>Constraints</SectionLabel>
            <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-[#14213d] p-4 font-mono text-[13px] leading-7 text-white/58">{problem.constraints}</pre>
          </section>
        )}

        <details key={id} className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14213d]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a9b8ff] [&::-webkit-details-marker]:hidden">
            Hints
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-white/50 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div className={`whitespace-pre-wrap [overflow-wrap:anywhere] border-t border-white/[0.08] p-4 text-sm leading-6 ${problem.hints ? "text-white/58" : "text-white/45"}`}>
            {problem.hints || "No hints are available for this problem."}
          </div>
        </details>
      </div>
    );
  };

  return (
    <div className={`flex w-full flex-col overflow-hidden bg-[#111e36] text-white ${sharedSpase ? "min-h-0 flex-1" : "h-dvh"}`}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#101d34] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/problems" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Back to problems">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/problems" className="hidden items-center gap-2 border-r border-white/10 pr-4 sm:flex">
            <Code2 className="h-5 w-5" />
            <span className="font-semibold tracking-[-0.03em]">LeetSpase</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <PanelToggle
            show={showProblem}
            label="problem panel"
            controls="problem-details"
            onClick={() => togglePanel("showProblem")}
            openIcon={PanelLeftClose}
            closedIcon={PanelLeft}
          />
          <PanelToggle
            show={showConsole}
            label="test cases and results"
            controls="problem-console-content"
            onClick={() => togglePanel("showConsole")}
            openIcon={PanelBottomClose}
            closedIcon={PanelBottom}
          />
          <div className="relative">
            <button type="button" onClick={handleShare} className="grid h-9 w-9 place-items-center rounded-xl text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label={copied ? "Problem link copied to clipboard" : "Copy problem link"}>
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />}
            </button>
            {copied && (
              <span role="status" aria-live="polite" className="absolute right-0 top-full z-30 mt-2 whitespace-nowrap rounded-lg border border-emerald-300/15 bg-[#192b49] px-3 py-2 text-[11px] font-medium text-emerald-300 shadow-xl shadow-black/40">
                Copied to clipboard
              </span>
            )}
          </div>
          {(!sharedSpase || canLeadSpase) && <LanguageSelector
            languages={Object.keys(problem.codeSnippet || {})}
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="ml-1 hidden sm:block"
          />}
          <button type="button" onClick={handleRunCode} disabled={sharedSpase ? !canEditSpase : isRunning || isSubmitting} className="ml-1 inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-black transition-colors hover:bg-[#e8e0d3] disabled:cursor-wait disabled:opacity-55">
            {isRunning && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            <span>Run</span>
          </button>
          <button type="button" onClick={handleSubmitCode} disabled={sharedSpase ? !canEditSpase : isRunning || isSubmitting} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-300/15 disabled:cursor-wait disabled:opacity-50">
            {isSubmitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            <span>Submit</span>
          </button>
        </div>
      </header>

      <main
        className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[var(--workspace-columns)] lg:overflow-hidden"
        style={{ "--workspace-columns": showProblem ? splitTracks(problemWidth) : "minmax(0, 1fr)" }}
      >
        <section id="problem-details" hidden={!showProblem} className={`${showProblem ? "flex" : "hidden"} min-w-0 shrink-0 flex-col border-b border-white/[0.08] bg-[#162540] lg:min-h-0 lg:border-b-0`}>
          <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.08] px-2">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button key={tabId} type="button" onClick={() => setActiveTab(tabId)} className={`relative flex h-full shrink-0 items-center gap-2 px-2 text-xs sm:px-3 font-medium transition-colors ${activeTab === tabId ? "text-white" : "text-white/38 hover:text-white/70"}`}>
                <Icon className="hidden h-3.5 w-3.5 sm:block" />
                {label}
                {activeTab === tabId && <span className="absolute inset-x-3 bottom-0 h-px bg-white" />}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-5 py-6 sm:px-7">{renderTabContent()}</div>
        </section>

        {showProblem && (
          <WorkspaceDivider
            label="Resize problem panel"
            controls="problem-details"
            orientation="vertical"
            value={problemWidth}
            onChange={(value) => setPanelSize("problemWidth", value)}
            className="hidden lg:grid"
            {...problemSplit}
          />
        )}

        <div
          className={`grid min-h-0 min-w-0 shrink-0 grid-rows-[var(--workspace-rows)] bg-[#111e36] lg:h-full ${showConsole ? "h-[max(620px,calc(100dvh-4rem))]" : "h-[calc(100dvh-4rem)]"}`}
          style={{ "--workspace-rows": showConsole ? splitTracks(editorHeight) : "minmax(0, 1fr) 2.75rem" }}
        >
          <section id="problem-editor" className="flex min-h-0 min-w-0 flex-col">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] px-4">
              <div className="flex items-center gap-2 text-xs font-medium text-white/55">
                <TerminalSquare className="h-3.5 w-3.5" />
                Code
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/25">{formatLanguage(selectedLanguage)}</span>
              </div>
              <div className="flex items-center gap-1">
                {(!sharedSpase || canLeadSpase) && <LanguageSelector
                  languages={Object.keys(problem.codeSnippet || {})}
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  compact
                  className="sm:hidden"
                />}
                {!sharedSpase && <button type="button" onClick={handleResetCode} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-white/32 transition-colors hover:bg-white/[0.05] hover:text-white/65">
                  <RotateCcw className="h-3 w-3" /> Reset code
                </button>}
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[#14213d]">
              <EditorComponent
                height="100%"
                language={selectedLanguage.toLowerCase()}
                theme="vs-dark"
                {...(sharedSpase ? { sharedSpase } : { value: code, onChange: handleCodeChange })}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme("leetspase-dark", {
                    base: "vs-dark",
                    inherit: true,
                    rules: [],
                    colors: {
                      "editor.background": "#14213d",
                      "editorGutter.background": "#14213d",
                      "editorLineNumber.foreground": "#3f3f46",
                      "editorLineNumber.activeForeground": "#a1a1aa",
                      "editor.lineHighlightBackground": "#203451",
                      "editor.selectionBackground": "#333333",
                    },
                  });
                }}
                onMount={(_, monaco) => monaco.editor.setTheme("leetspase-dark")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
                  fontLigatures: true,
                  lineHeight: 23,
                  lineNumbers: "on",
                  tabSize: 4,
                  insertSpaces: true,
                  detectIndentation: false,
                  padding: { top: 18, bottom: 18 },
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderLineHighlight: "line",
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                }}
              />
            </div>
          </section>

          {showConsole && (
            <WorkspaceDivider
              label="Resize code editor"
              controls="problem-editor"
              orientation="horizontal"
              value={editorHeight}
              onChange={(value) => setPanelSize("editorHeight", value)}
              {...editorSplit}
            />
          )}

          <section id="problem-console" ref={consoleRef} className={`flex min-h-0 min-w-0 flex-col bg-[#162540]${showConsole ? "" : " border-t border-white/[0.08]"}`}>
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
                <div className="flex items-center gap-2 text-xs font-medium text-white/55">
                  <ListChecks className="h-3.5 w-3.5" />
                  {spaseJob ? "Shared results" : executionResult ? `${lastAction === "submit" ? "Submission" : "Run"} result` : "Test cases"}
                </div>
                {showConsole && !visibleResult && <span className="text-[10px] uppercase tracking-[0.12em] text-white/25">Sample cases</span>}
              </div>
              <div id="problem-console-content" ref={consoleContentRef} hidden={!showConsole} className="min-h-0 flex-1 overflow-y-auto p-4">
                {spaseJob ? (
                  <SpaseResults job={spaseJob} queued={sharedSpase.pendingJobs} history={sharedSpase.jobs} spase={sharedSpase.spase} />
                ) : executionResult ? (
                  <Submission key={`${lastAction}-${executionResult.createdAt}`} submission={executionResult} />
                ) : testcases.length ? (
                  <div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {testcases.map((_, index) => (
                        <button key={index} type="button" onClick={() => setSelectedCase(index)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeCaseIndex === index ? "bg-white text-black" : "bg-white/[0.045] text-white/40 hover:text-white/70"}`}>
                          Case {index + 1}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ConsoleValue label="Input" value={activeTestCase?.input} onCopy={() => navigator.clipboard.writeText(String(activeTestCase?.input || ""))} />
                      <ConsoleValue label="Expected output" value={activeTestCase?.output} onCopy={() => navigator.clipboard.writeText(String(activeTestCase?.output || ""))} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/35">No sample test cases are available.</p>
                )}
              </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const PanelToggle = ({ show, label, controls, onClick, openIcon: OpenIcon, closedIcon: ClosedIcon }) => {
  const Icon = show ? OpenIcon : ClosedIcon;
  const action = `${show ? "Hide" : "Show"} ${label}`;

  return (
    <button
      type="button"
      aria-label={action}
      aria-expanded={show}
      aria-controls={controls}
      title={action}
      onClick={onClick}
      className={`grid h-9 w-8 place-items-center rounded-lg transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-[#a9b8ff] ${show ? "text-white/60" : "bg-[#a9b8ff]/10 text-[#a9b8ff]"}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
};

const SectionLabel = ({ children }) => (
  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{children}</h2>
);

const LanguageSelector = ({ languages, value, onChange, compact = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (language) => {
    onChange(language);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex items-center justify-between gap-3 bg-[#203451] font-medium text-white/72 transition-colors hover:bg-[#191919] hover:text-white ${compact ? "h-8 min-w-28 rounded-lg px-2.5 text-[11px]" : "h-9 min-w-36 rounded-xl px-3 text-xs"}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{formatLanguage(value)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/28 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[80] min-w-40 overflow-hidden rounded-xl border border-white/[0.09] bg-[#192b49] p-1.5 shadow-2xl shadow-black/70" role="listbox" aria-label="Programming language">
          {languages.map((language) => {
            const isSelected = language === value;
            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectLanguage(language)}
                className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-xs font-medium transition-colors ${isSelected ? "bg-white text-black" : "text-white/58 hover:bg-white/[0.06] hover:text-white"}`}
              >
                <span>{formatLanguage(language)}</span>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExampleLine = ({ label, value }) => (
  <p className="whitespace-pre-wrap break-words">
    <span className="font-semibold text-white/88">{label}:</span>{" "}
    <span>{value}</span>
  </p>
);

const ConsoleValue = ({ label, value, onCopy }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">{label}</p>
      <button type="button" onClick={onCopy} className="text-white/25 transition-colors hover:text-white/65" aria-label={`Copy ${label.toLowerCase()}`}><Copy className="h-3.5 w-3.5" /></button>
    </div>
    <pre className="min-h-11 whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-black/50 px-3 py-2.5 font-mono text-xs leading-5 text-white/65">{value}</pre>
  </div>
);

const EmptyPanel = ({ icon: Icon, title, description }) => (
  <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.018] p-8 text-center">
    <div>
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-white/40"><Icon className="h-4 w-4" /></div>
      <p className="mt-4 text-sm font-medium text-white/72">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/35">{description}</p>
    </div>
  </div>
);

export default ProblemPage;
