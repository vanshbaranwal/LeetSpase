import { Code2, LogOut, Plus, Search, User } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const { authUser } = useAuthStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isProblemsPage = location.pathname === "/problems";
  const problemSearch = searchParams.get("search") || "";

  const handleProblemSearch = (event) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const value = event.target.value;

    if (value) {
      nextSearchParams.set("search", value);
    } else {
      nextSearchParams.delete("search");
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070707] px-5 sm:px-8">
      <div className="mx-auto flex h-[96px] w-full max-w-7xl items-center justify-between">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="LeetSpase home">
            <Code2 className="h-8 w-8 text-white transition-transform duration-300 group-hover:-rotate-6" strokeWidth={2.3} />
            <span className={`text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl ${isProblemsPage ? "hidden sm:inline" : ""}`}>
              LeetSpase
            </span>
          </Link>

          <span className="hidden text-2xl font-light text-white/35 sm:block">/</span>

          {isProblemsPage ? (
            <div className="hidden items-center gap-8 font-mono text-sm font-semibold uppercase tracking-[0.06em] md:flex">
              <Link to="/problems" className="text-white">Problems</Link>
              <span className="cursor-default text-white/45" title="Discussion is coming soon">Discussion</span>
            </div>
          ) : (
            <div className="hidden items-center gap-8 font-mono text-sm font-semibold uppercase tracking-[0.06em] text-white/80 lg:flex">
              <a href="/#features" className="transition-colors hover:text-white">Features</a>
              <a href="/#how-it-works" className="transition-colors hover:text-white">How it works</a>
              <Link to="/problems" className="transition-colors hover:text-white">Problems</Link>
              <a href="/#about" className="transition-colors hover:text-white">About</a>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {isProblemsPage && (
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="search"
                value={problemSearch}
                onChange={handleProblemSearch}
                placeholder="Search problems..."
                aria-label="Search problems by name"
                className="h-12 w-36 rounded-md border border-white/10 bg-white/[0.06] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.08] sm:w-52 sm:pr-4 lg:w-72"
              />
            </label>
          )}

          {authUser ? (
            <>
              {!isProblemsPage && (
                <Link to="/problems" className="hidden rounded-md border border-white/10 bg-white/[0.06] px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10 sm:block">
                  Problems
                </Link>
              )}
              <div className="dropdown dropdown-end">
                <button type="button" tabIndex={0} className="grid h-12 w-12 place-items-center rounded-md bg-white text-black transition-colors hover:bg-[#e6e6e6]" aria-label="Open user menu">
                  <User className="h-6 w-6" />
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
