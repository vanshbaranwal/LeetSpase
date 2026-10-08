import { useState, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Bookmark, LockKeyhole, LogIn, PencilIcon, Plus, TrashIcon, UserPlus, X } from "lucide-react";
import { useActions } from "../store/useAction";
import AddToPlaylistModal from "./AddToPlaylist";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { usePlaylistStore } from "../store/usePlaylistStore";


const ProblemsTable = ({ problems, searchQuery = "" }) => {
  const { authUser } = useAuthStore();
  const { onDeleteProblem } = useActions();
  const { createPlaylist } = usePlaylistStore();
  const [difficulty, setDifficulty] = useState("ALL");
  const [selectedTag, setSelectedTag] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  // Extract all unique tags from problems
  const allTags = useMemo(() => {
    if (!Array.isArray(problems)) return [];
    const tagsSet = new Set();
    problems.forEach((p) => p.tags?.forEach((t) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [problems]);

  // Define allowed difficulties
  const difficulties = ["EASY", "MEDIUM", "HARD"];

  // Filter problems based on search, difficulty, and tags
  const filteredProblems = useMemo(() => {
    return (problems || [])
      .filter((problem) =>
        problem.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
      .filter((problem) =>
        difficulty === "ALL" ? true : problem.difficulty === difficulty
      )
      .filter((problem) =>
        selectedTag === "ALL" ? true : problem.tags?.includes(selectedTag)
      );
  }, [problems, searchQuery, difficulty, selectedTag]);

  // Pagination logic
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / itemsPerPage));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedProblems = useMemo(() => {
    return filteredProblems.slice(
      (visiblePage - 1) * itemsPerPage,
      visiblePage * itemsPerPage
    );
  }, [filteredProblems, visiblePage]);

  const handleDelete = (id) => {
    onDeleteProblem(id);
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
    <div className="w-full max-w-6xl mx-auto mt-10">
      {/* Header with Create Playlist Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Problems</h2>
        <button
          className="btn btn-primary gap-2"
          onClick={handleCreatePlaylistClick}
        >
          <Plus className="w-4 h-4" />
          Create Playlist
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <select
          className="select select-bordered bg-base-200"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered bg-base-200"
          value={selectedTag}
          onChange={(e) => {
            setSelectedTag(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-md">
        <table className="table table-zebra table-lg bg-base-200 text-base-content">
          <thead className="bg-base-300 text-center">
            <tr>
              <th>Solved</th>
              <th>Title</th>
              <th>Tags</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProblems.length > 0 ? (
              paginatedProblems.map((problem) => {
                const isSolved = problem.solvedBy?.some(
                  (user) => user.userId === authUser?.id
                ) ?? false;
                return (
                  <tr key={problem.id}>
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
                        <Link to={`/problem/${problem.id}`} className="font-semibold hover:underline">
                          {problem.title}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAuthPromptOpen(true)}
                          className="inline-flex items-center justify-center gap-2 font-semibold text-white transition-colors hover:text-white/70 hover:underline"
                        >
                          <LockKeyhole className="h-4 w-4 text-white/40" aria-hidden="true" />
                          {problem.title}
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
                              onClick={() => handleDelete(problem.id)}
                              className="btn btn-sm btn-error"
                            >
                              <TrashIcon className="h-4 w-4 text-black" />
                            </button>
                            <button disabled className="btn btn-sm btn-warning">
                              <PencilIcon className="h-4 w-4 text-black" />
                            </button>
                          </div>
                        )}
                        <button
                          className="btn btn-sm btn-outline flex gap-2 items-center"
                          onClick={() => handleAddToPlaylist(problem.id)}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span className="hidden sm:inline">Save to Playlist</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No problems found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          className="btn btn-sm"
          disabled={visiblePage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        <span className="btn btn-ghost btn-sm">
          {visiblePage} / {totalPages}
        </span>
        <button
          className="btn btn-sm"
          disabled={visiblePage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {/* Modals */}
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
