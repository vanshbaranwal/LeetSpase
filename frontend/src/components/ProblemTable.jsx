import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Check, ChevronDown, LockKeyhole, LogIn, PencilIcon, Search, TrashIcon, UserPlus, X } from "lucide-react";
import { useActions } from "../store/useAction";
import AddToPlaylistModal from "./AddToPlaylist";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { usePlaylistStore } from "../store/usePlaylistStore";


const ProblemsTable = ({
  problems,
  numberingProblems = problems,
  searchQuery = "",
  onSearchChange,
  selectedTag = "ALL",
  title = "Problems",
  emptyMessage = "No problems found.",
}) => {
  const { authUser } = useAuthStore();
  const { onDeleteProblem, isDeletingProblem } = useActions();
  const { createPlaylist } = usePlaylistStore();
  const [difficulty, setDifficulty] = useState("ALL");
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problemPendingDeletion, setProblemPendingDeletion] = useState(null);
  const difficultyMenuRef = useRef(null);

  // Define allowed difficulties
  const difficulties = ["EASY", "MEDIUM", "HARD"];
  const difficultyOptions = ["ALL", ...difficulties];

  useEffect(() => {
    const closeDifficultyMenu = (event) => {
      if (!difficultyMenuRef.current?.contains(event.target)) {
        setIsDifficultyOpen(false);
      }
    };

    const closeDifficultyMenuOnEscape = (event) => {
      if (event.key === "Escape") setIsDifficultyOpen(false);
    };

    document.addEventListener("mousedown", closeDifficultyMenu);
    document.addEventListener("keydown", closeDifficultyMenuOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDifficultyMenu);
      document.removeEventListener("keydown", closeDifficultyMenuOnEscape);
    };
  }, []);

  const sortedProblems = useMemo(() => {
    return [...(problems || [])].sort((firstProblem, secondProblem) =>
      firstProblem.title.localeCompare(secondProblem.title, undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );
  }, [problems]);

  const problemNumberById = useMemo(() => {
    const sortedNumberingProblems = [...(numberingProblems || [])].sort(
      (firstProblem, secondProblem) =>
        firstProblem.title.localeCompare(secondProblem.title, undefined, {
          sensitivity: "base",
          numeric: true,
        })
    );

    return new Map(
      sortedNumberingProblems.map((problem, index) => [problem.id, index + 1])
    );
  }, [numberingProblems]);

  // Filter problems based on search, difficulty, and tags
  const filteredProblems = useMemo(() => {
    return sortedProblems
      .filter((problem) =>
        problem.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
      .filter((problem) =>
        difficulty === "ALL" ? true : problem.difficulty === difficulty
      )
      .filter((problem) =>
        selectedTag === "ALL"
          ? true
          : problem.tags?.some(
              (tag) => tag.toLowerCase() === selectedTag.toLowerCase()
            )
      );
  }, [sortedProblems, searchQuery, difficulty, selectedTag]);

  const handleDelete = (problem) => {
    setProblemPendingDeletion(problem);
  };

  const confirmDelete = async () => {
    const wasDeleted = await onDeleteProblem(problemPendingDeletion.id);

    if (wasDeleted) setProblemPendingDeletion(null);
  };

  const handleCreatePlaylist = async (data) => {
    await createPlaylist(data);
  };

  const handleAddToPlaylist = (problemId) => {
    if (!authUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    setSelectedProblemId(problemId);
    setIsAddToPlaylistModalOpen(true);
  };

  const handleCreatePlaylistClick = () => {
    if (!authUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    setIsCreateModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-xs text-white/35">{filteredProblems.length} problems</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div ref={difficultyMenuRef} className="relative w-44 shrink-0">
            <button
              type="button"
              onClick={() => setIsDifficultyOpen((isOpen) => !isOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDifficultyOpen}
              className="flex h-10 w-full items-center gap-2 rounded-full border border-white/10 bg-base-200 px-4 text-sm font-medium text-white/75 outline-none transition-colors hover:border-white/20 hover:text-white focus:border-white/10 focus:outline-none"
            >
              <span className="flex-1 text-left">Difficulty</span>
              <ChevronDown className={`h-4 w-4 text-white/45 transition-transform ${isDifficultyOpen ? "rotate-180" : ""}`} />
            </button>

            {isDifficultyOpen && (
              <div
                role="listbox"
                aria-label="Filter problems by difficulty"
                className="absolute left-0 top-[calc(100%+0.55rem)] z-40 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#151515] p-2 shadow-2xl shadow-black/60"
              >
                {difficultyOptions.map((option) => {
                  const isSelected = difficulty === option;
                  const label = option === "ALL"
                    ? "All"
                    : option.charAt(0) + option.slice(1).toLowerCase();
                  const optionColor = option === "EASY"
                    ? "text-emerald-400"
                    : option === "MEDIUM"
                      ? "text-orange-400"
                      : option === "HARD"
                        ? "text-red-400"
                        : "text-white/55";

                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setDifficulty(option);
                        setIsDifficultyOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${optionColor} ${
                        isSelected
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className={`grid h-5 w-5 place-items-center rounded border ${
                        isSelected
                          ? "border-white/70 bg-white text-black"
                          : "border-white/20 bg-transparent"
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="flex h-10 w-48 min-w-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] px-3.5 focus-within:border-white/20 focus-within:bg-white/[0.09] sm:w-56">
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input
              type="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search problems"
              aria-label="Search problems by name"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </label>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full border border-white bg-white px-5 text-sm font-semibold text-black shadow-sm shadow-black/30 transition-all hover:-translate-y-0.5 hover:border-[#e6e6e6] hover:bg-[#e6e6e6] active:translate-y-0"
          onClick={handleCreatePlaylistClick}
        >
          Create Playlist
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-md">
        <table className="table table-zebra table-lg bg-base-200 text-base-content">
          <thead className="bg-base-300 text-center">
            <tr>
              <th>#</th>
              <th>Solved</th>
              <th>Title</th>
              <th>Tags</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => {
                const isSolved = problem.solvedBy?.some(
                  (user) => user.userId === authUser?.id
                ) ?? false;
                return (
                  <tr key={problem.id}>
                    <td className="text-center font-mono text-sm text-white/45">
                      {problemNumberById.get(problem.id) ?? "—"}
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={isSolved}
                        readOnly
                        className="checkbox checkbox-sm"
                      />
                    </td>
                    <td className="text-center">
                      {authUser ? (
                        <Link to={`/problem/${problem.id}`} className="group inline-flex items-center justify-center gap-2.5 font-semibold no-underline transition-colors hover:text-white/65 hover:no-underline">
                          <span className="no-underline">{problem.title}</span>
                          {problem.isDemo && (
                            <span className="inline-flex h-5 items-center rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-sky-300 no-underline transition-colors group-hover:border-sky-400/30 group-hover:bg-sky-400/10">
                              Demo
                            </span>
                          )}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAuthPromptOpen(true)}
                          className="group inline-flex items-center justify-center gap-2.5 font-semibold text-white no-underline transition-colors hover:text-white/65 hover:no-underline"
                        >
                          <LockKeyhole className="h-4 w-4 text-white/40" aria-hidden="true" />
                          <span>{problem.title}</span>
                          {problem.isDemo && (
                            <span className="inline-flex h-5 items-center rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-sky-300 no-underline transition-colors group-hover:border-sky-400/30 group-hover:bg-sky-400/10">
                              Demo
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {(problem.tags || []).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold text-white/55"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center">
                      <span
                        className={`text-xs font-semibold ${
                          problem.difficulty === "EASY"
                            ? "text-emerald-400"
                            : problem.difficulty === "MEDIUM"
                            ? "text-orange-400"
                            : "text-red-400"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
                        {authUser?.role === "ADMIN" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(problem)}
                              title="Delete problem"
                              aria-label={`Delete ${problem.title}`}
                              className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/25 bg-red-500/15 text-red-400 shadow-sm shadow-red-950/20 transition-all duration-200 hover:border-red-400/45 hover:bg-red-500/25 hover:text-red-300"
                            >
                              <TrashIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              disabled
                              title="Problem editing is not available yet"
                              aria-label="Edit problem unavailable"
                              className="grid h-10 w-10 cursor-not-allowed place-items-center rounded-lg border border-amber-400/25 bg-amber-400/15 text-amber-300 opacity-65 shadow-sm shadow-amber-950/20"
                            >
                              <PencilIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-sm rounded-full border border-white/10 bg-[#000000] text-[#FFFFFF] hover:border-white/20 hover:bg-[#101010] hover:text-[#FFFFFF]"
                          onClick={() => handleAddToPlaylist(problem.id)}
                        >
                          <span>Save to Playlist</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {problemPendingDeletion && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !isDeletingProblem && setProblemPendingDeletion(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-problem-title"
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-7 text-left shadow-2xl shadow-black sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setProblemPendingDeletion(null)}
              disabled={isDeletingProblem}
              aria-label="Close delete confirmation"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400/70">
              Delete problem
            </p>
            <h3 id="delete-problem-title" className="mt-4 pr-10 text-2xl font-semibold tracking-[-0.03em] text-white">
              Are you sure you want to delete the problem?
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/50">
              <span className="font-semibold text-white/75">{problemPendingDeletion.title}</span> and its related data will be permanently removed. This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProblemPendingDeletion(null)}
                disabled={isDeletingProblem}
                className="h-10 rounded-full border border-white/10 px-5 text-sm font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeletingProblem}
                className="h-10 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeletingProblem ? "Deleting..." : "Delete problem"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthPromptOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsAuthPromptOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-required-title"
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-7 shadow-2xl shadow-black sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsAuthPromptOpen(false)}
              aria-label="Close login prompt"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-red-500/35 bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/35">Authentication required</p>
            <h3 id="auth-required-title" className="mt-4 pr-10 text-2xl font-semibold tracking-[-0.03em] text-white">
              Ready to solve this problem?
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Log in to continue with your account, or sign up to start solving and track your progress.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6]">
                <LogIn className="h-4 w-4" /> Log in
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.05]">
                <UserPlus className="h-4 w-4" /> Sign up
              </Link>
            </div>
          </div>
        </div>
      )}

      {authUser && (
        <>
          <CreatePlaylistModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreatePlaylist}
          />
          <AddToPlaylistModal
            isOpen={isAddToPlaylistModalOpen}
            onClose={() => setIsAddToPlaylistModalOpen(false)}
            problemId={selectedProblemId}
          />
        </>
      )}
    </div>
  );
};

export default ProblemsTable;
