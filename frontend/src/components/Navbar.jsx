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
    <nav aria-label="Main navigation" className={`sticky top-0 z-50 w-full ${isProblemsPage ? "border-b border-white/10 bg-[#101d34] px-4 sm:px-5" : "px-4 pt-4 sm:px-6"}`}>
      <div className={`relative mx-auto flex w-full items-center justify-between ${isProblemsPage ? "h-20 max-w-none" : "h-[68px] max-w-[1440px] rounded-2xl border border-[#a9b8ff]/15 bg-[#101d34]/95 px-4 shadow-[0_12px_40px_rgba(4,12,30,0.24)] backdrop-blur-xl sm:h-[76px] sm:px-6"}`}>
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="LeetSpase home">
            <Code2 className={`${isProblemsPage ? "h-8 w-8" : "h-7 w-7"} text-[#a9b8ff] transition-transform duration-300 group-hover:-rotate-6 motion-reduce:transition-none`} strokeWidth={2.3} />
            <span className={`${isProblemsPage ? "hidden text-2xl sm:inline sm:text-3xl" : "text-xl sm:text-2xl"} font-semibold tracking-[-0.035em] text-white`}>
              LeetSpase
            </span>
          </Link>

        </div>

        {!isProblemsPage && (
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            <a href="/#features" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">Features</a>
            <a href="/#how-it-works" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">How it works</a>
            <Link to="/problems" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">Problems</Link>
            <a href="/#about" className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">About</a>
          </div>
        )}

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
            <div tabIndex={0} className="dropdown-content z-[60] mt-3 w-64 rounded-2xl border border-white/10 bg-[#192b49] p-2 text-sm text-white shadow-2xl shadow-black/60">
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
                <Link to="/problems" className="hidden rounded-xl bg-[#a9b8ff] px-5 py-3 text-sm font-semibold text-[#14213d] transition-colors hover:bg-[#c4ceff] sm:block">
                  Start solving
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
                <div tabIndex={0} className="dropdown-content z-[1] mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#192b49] p-2 text-white shadow-2xl shadow-black/60">
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
            <div className={`flex items-center gap-2.5 text-sm font-semibold ${isProblemsPage ? "font-mono text-xs" : ""}`}>
              <Link to="/login" className={isProblemsPage ? "rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-white transition-colors hover:bg-white/10 sm:px-6" : "rounded-xl px-3 py-3 text-white/80 transition-colors hover:text-white sm:px-4"}>
                Sign in
              </Link>
              {!isProblemsPage && (
                <Link to="/signup" className="hidden rounded-xl bg-[#a9b8ff] px-5 py-3 text-[#14213d] shadow-[0_6px_24px_rgba(169,184,255,0.16)] transition-colors hover:bg-[#c4ceff] sm:block">
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
