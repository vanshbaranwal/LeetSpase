
import { useId, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";

const difficulties = ["ALL", "EASY", "MEDIUM", "HARD"];
const difficultyColors = {
  EASY: "text-emerald-300",
  MEDIUM: "text-amber-300",
  HARD: "text-red-300",
};
const displayDifficulty = (level) => level[0] + level.slice(1).toLowerCase();

export default function SpaseProblemPicker({ problems, loading, currentId, disabled, onPick, notice }) {
  const dialog = useRef(null);
  const search = useRef(null);
  const results = useRef(null);
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = problems.find((problem) => problem.id === currentId);
  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return problems.filter((problem) => {
      const searchable = [problem.title, ...(problem.tags || [])].join(" ").toLowerCase();
      return (difficulty === "ALL" || problem.difficulty === difficulty) &&
        terms.every((term) => searchable.includes(term));
    }).sort((first, second) => first.title.localeCompare(second.title));
  }, [problems, query, difficulty]);

  const open = () => {
    setQuery("");
    setDifficulty("ALL");
    setFailed(false);
    dialog.current?.showModal();
    search.current?.focus();
  };

  const pick = async (id) => {
    if (!id || disabled || saving) return;
    if (id === currentId) {
      dialog.current?.close();
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      if (await onPick(id)) dialog.current?.close();
      else setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={open}
        aria-haspopup="dialog"
        aria-label={current ? `Choose a problem, current problem: ${current.title}` : undefined}
        className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-[#13161d] px-3 text-sm font-medium text-white hover:border-[#3b82f6]/50 disabled:opacity-50"
      >
        Choose a problem
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-white/15 bg-[#13161d] text-white shadow-2xl backdrop:bg-[#0a0c11]/75"
      >
        <div className="space-y-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id={titleId} className="text-lg font-semibold">Choose a problem</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close problem picker" className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <form onSubmit={(event) => {
            event.preventDefault();
            void pick(filtered[0]?.id);
          }}>
            <label className="flex min-h-11 items-center gap-2.5 rounded-lg border border-white/15 bg-[#0a0c11] px-3 focus-within:border-[#3b82f6]">
              <Search className="size-4 shrink-0 text-[#3b82f6]" aria-hidden />
              <input
                type="search"
                ref={search}
                aria-label="Search problems"
                placeholder="Search by title or topic"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && filtered.length) {
                    event.preventDefault();
                    results.current?.querySelector("button:not(:disabled)")?.focus();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none focus-visible:outline-none! placeholder:text-white/55"
              />
            </label>
          </form>
          <div role="group" aria-label="Difficulty" className="flex flex-wrap gap-1.5">
            {difficulties.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={difficulty === level}
                onClick={() => setDifficulty(level)}
                className={`min-h-8 rounded-md border px-2.5 text-xs font-medium ${difficulty === level
                  ? "border-[#3b82f6]/55 bg-[#3b82f6]/15 text-[#93c5fd]"
                  : "border-white/12 text-white/70 hover:bg-white/8"}`}
              >
                {displayDifficulty(level)}
              </button>
            ))}
          </div>
          {failed && <p role="alert" className="text-sm text-red-200">{notice || "Could not switch problems. Try again."}</p>}
        </div>
        {loading && !problems.length ? (
          <p role="status" className="p-5 text-sm text-white/70">Loading problems…</p>
        ) : filtered.length ? (
          <ul ref={results} aria-label="Matching problems" className="max-h-[min(48dvh,24rem)] divide-y divide-white/8 overflow-y-auto">
            {filtered.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  aria-current={problem.id === currentId ? "true" : undefined}
                  disabled={disabled || saving}
                  onClick={() => void pick(problem.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const row = event.currentTarget.parentElement;
                    const adjacent = event.key === "ArrowDown" ? row.nextElementSibling : row.previousElementSibling;
                    adjacent?.querySelector("button")?.focus();
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.06] focus-visible:bg-white/[0.08] disabled:opacity-55 sm:px-5"
                >
                  <span className="min-w-0 py-0.5">
                    <span className="block text-sm font-medium [overflow-wrap:anywhere]">{problem.title}</span>
                    {Boolean(problem.tags?.length) && <span className="mt-0.5 block text-xs text-white/55">{problem.tags.slice(0, 3).join(" · ")}</span>}
                  </span>
                  {problem.id === currentId && <Check className="ml-auto size-4 shrink-0 text-[#3b82f6]" aria-label="Current problem" />}
                  {problem.difficulty && <span className={`shrink-0 text-xs font-medium ${difficultyColors[problem.difficulty] || "text-white/70"}`}>{displayDifficulty(problem.difficulty)}</span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="p-5 text-sm text-white/70">{problems.length ? "No problems match your search." : "No problems available."}</p>
        )}
      </dialog>
    </>
  );
}
