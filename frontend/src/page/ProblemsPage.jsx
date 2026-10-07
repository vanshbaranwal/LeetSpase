import { useEffect } from "react";
import { Code2, Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ProblemTable from "../components/ProblemTable";
import { useProblemStore } from "../store/useProblemStore";

const ProblemsPage = () => {
  const { getAllProblems, problems, isProblemsLoading } = useProblemStore();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    getAllProblems();
  }, [getAllProblems]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-24 pt-14 text-white sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
          <Code2 className="h-5 w-5 text-white/80" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
          Problem library
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Choose your next challenge.
        </h1>
        <p className="mt-4 text-white/50">
          Search, filter, solve, and save problems to your personal playlists.
        </p>
      </div>

      {isProblemsLoading ? (
        <div className="grid min-h-80 place-items-center">
          <Loader className="h-8 w-8 animate-spin text-white/60" />
        </div>
      ) : problems.length > 0 ? (
        <ProblemTable problems={problems} searchQuery={searchQuery} />
      ) : (
        <div className="mt-14 rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/45">
          No problems found yet.
        </div>
      )}
    </main>
  );
};

export default ProblemsPage;
