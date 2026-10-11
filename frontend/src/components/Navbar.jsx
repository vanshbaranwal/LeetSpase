import { useEffect } from "react";
import { Code2, LoaderCircle, LogOut, Plus, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useProblemStore } from "../store/useProblemStore";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const { authUser } = useAuthStore();
  const { dailyProblem, getProblemOfTheDay, isDailyProblemLoading } = useProblemStore();
  const location = useLocation();
  const isProblemsPage = location.pathname === "/problems";

  useEffect(() => {
    if (isProblemsPage) getProblemOfTheDay();
  }, [getProblemOfTheDay, isProblemsPage]);

  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-white/10 bg-[#070707] ${isProblemsPage ? "px-4 sm:px-5" : "px-5 sm:px-8"}`}>
      <div className={`mx-auto flex w-full items-center justify-between ${isProblemsPage ? "h-20 max-w-none" : "h-[96px] max-w-7xl"}`}>
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="LeetSpase home">
            <Code2 className="h-8 w-8 text-white transition-transform duration-300 group-hover:-rotate-6" strokeWidth={2.3} />
            <span className={`text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl ${isProblemsPage ? "hidden sm:inline" : ""}`}>
              LeetSpase
            </span>
          </Link>

          {!isProblemsPage && (
            <>
              <span className="hidden text-2xl font-light text-white/35 sm:block">/</span>
              <div className="hidden items-center gap-8 font-mono text-sm font-semibold uppercase tracking-[0.06em] text-white/80 lg:flex">
                <a href="/#features" className="transition-colors hover:text-white">Features</a>
                <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
                <Link to="/problems" className="transition-colors hover:text-white">Problems</Link>
                <a href="/#about" className="transition-colors hover:text-white">About</a>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {isProblemsPage && (
            <div className="mr-5 hidden items-center gap-8 font-mono text-sm font-semibold uppercase tracking-[0.06em] md:flex">
              <Link to="/problems" className="text-white">Problems</Link>
              <span className="cursor-default text-white/45" title="Discussion is coming soon">Discussion</span>
              <span className="cursor-default text-white/45" title="Contest is coming soon">Contest</span>
              {dailyProblem ? (
                <Link
                  to={`/problem/${dailyProblem.id}`}
                  aria-label="Open the problem of the day"
                  className="text-orange-400 transition-colors hover:text-orange-300"
                >
                  Problem of the Day
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title={isDailyProblemLoading ? "Loading today's challenge" : "Daily challenge is unavailable"}
                  className="inline-flex items-center gap-2 text-orange-400/40"
                >
                  {isDailyProblemLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Problem of the Day
                </button>
              )}
            </div>
          )}
          {authUser ? (
            <>
              {!isProblemsPage && (
                <Link to="/problems" className="hidden rounded-md border border-white/10 bg-white/[0.06] px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10 sm:block">
                  Problems
                </Link>
              )}
              <div className="dropdown dropdown-end">
                <button type="button" tabIndex={0} className="grid h-10 w-10 overflow-hidden place-items-center rounded-full bg-white text-black" aria-label="Open user menu">
                  {authUser.image ? (
                    <img
                      src={authUser.image}
                      alt={`${authUser.name || "User"} profile`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </button>
                <ul tabIndex={0} className="menu dropdown-content z-[1] mt-3 w-56 space-y-1 rounded-xl border border-white/10 bg-[#111111] p-3 text-white shadow-2xl">
                  <li className="mb-2 border-b border-white/10 pb-2">
                    <span className="block cursor-default hover:bg-transparent">
                      <span className="block truncate font-semibold">{authUser.name || "Coder"}</span>
                      <span className="block text-xs font-normal text-white/45">{authUser.email}</span>
                    </span>
                  </li>
                  <li><Link to="/profile" className="rounded-lg hover:bg-white/10 hover:text-white"><User className="h-4 w-4" /> My profile</Link></li>
                  {authUser.role === "ADMIN" && (
                    <li><Link to="/add-problem" className="rounded-lg hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /> Add problem</Link></li>
                  )}
                  <li><LogoutButton><LogOut className="h-4 w-4" /> Logout</LogoutButton></li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 font-mono text-xs font-semibold">
              <Link to="/login" className="rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-white transition-colors hover:bg-white/10 sm:px-6">
                Sign in
              </Link>
              {!isProblemsPage && (
                <Link to="/signup" className="hidden rounded-md bg-white px-6 py-3 text-black transition-colors hover:bg-[#e6e6e6] sm:block">
                  Get started
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
