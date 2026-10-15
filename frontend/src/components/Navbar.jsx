import { useEffect } from "react";
import { Code2, LayoutDashboard, LoaderCircle, LogOut, Menu, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useProblemStore } from "../store/useProblemStore";
import LogoutButton from "./LogoutButton";

const Navbar = ({ variant = "default" }) => {
  const { authUser } = useAuthStore();
  const { dailyProblem, getProblemOfTheDay, isDailyProblemLoading } = useProblemStore();
  const location = useLocation();
  const isProblemsPage = location.pathname === "/problems" || variant === "problems";

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
          <div className={`dropdown dropdown-end ${isProblemsPage ? "md:hidden" : "lg:hidden"}`}>
            <button
              type="button"
              tabIndex={0}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div tabIndex={0} className="dropdown-content z-[60] mt-3 w-64 rounded-2xl border border-white/10 bg-[#111111] p-2 text-sm text-white shadow-2xl shadow-black/60">
              {isProblemsPage ? (
                <>
                  <Link to="/problems" className="flex h-11 items-center rounded-xl px-3 font-medium text-white transition-colors hover:bg-white/[0.06]">Problems</Link>
                  <div className="flex h-11 cursor-not-allowed items-center justify-between rounded-xl px-3 text-white/40" aria-disabled="true">
                    <span>Discussion</span><span className="text-[10px] uppercase tracking-[0.12em] text-white/25">Soon</span>
                  </div>
                  <div className="flex h-11 cursor-not-allowed items-center justify-between rounded-xl px-3 text-white/40" aria-disabled="true">
                    <span>Contest</span><span className="text-[10px] uppercase tracking-[0.12em] text-white/25">Soon</span>
                  </div>
                  {dailyProblem ? (
                    <Link to={`/problem/${dailyProblem.id}`} className="flex h-11 items-center rounded-xl px-3 font-medium text-orange-400 transition-colors hover:bg-orange-400/[0.08] hover:text-orange-300">Problem of the Day</Link>
                  ) : (
                    <span className="flex h-11 items-center gap-2 rounded-xl px-3 text-orange-400/40">
                      {isDailyProblemLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      Problem of the Day
                    </span>
                  )}
                </>
              ) : (
                <>
                  <a href="/#features" className="flex h-11 items-center rounded-xl px-3 font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">Features</a>
                  <a href="/#how-it-works" className="flex h-11 items-center rounded-xl px-3 font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">How it works</a>
                  <Link to="/problems" className="flex h-11 items-center rounded-xl px-3 font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">Problems</Link>
                  <a href="/#about" className="flex h-11 items-center rounded-xl px-3 font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">About</a>
                </>
              )}
            </div>
          </div>

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
                <div tabIndex={0} className="dropdown-content z-[1] mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#111111] p-2 text-white shadow-2xl shadow-black/60">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-semibold text-black">
                      {authUser.image ? (
                        <img
                          src={authUser.image}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (authUser.name?.[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{authUser.name || "Coder"}</p>
                        {authUser.role === "ADMIN" && (
                          <span className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="my-1 h-px bg-white/[0.08]" />

                  <div className="space-y-1 py-1">
                    <Link to="/profile" className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">
                      <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035]">
                        <User className="h-4 w-4" />
                      </span>
                      My profile
                    </Link>
                    {authUser.role === "ADMIN" && (
                      <Link to="/admin" className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">
                        <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035]">
                          <LayoutDashboard className="h-4 w-4" />
                        </span>
                        Admin dashboard
                      </Link>
                    )}
                  </div>

                  <div className="my-1 h-px bg-white/[0.08]" />

                  <LogoutButton className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-red-400/15 bg-red-400/[0.06]">
                      <LogOut className="h-4 w-4" />
                    </span>
                    Logout
                  </LogoutButton>
                </div>
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
