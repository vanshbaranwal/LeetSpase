import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Database,
  Code2,
  FileCode2,
  Gauge,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Server,
  TerminalSquare,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useAdminStore } from "../store/useAdminStore";
import CreateProblemForm from "../components/CreateProblemForm";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "submissions", label: "Submissions", icon: FileCode2 },
  { id: "system", label: "System status", icon: Activity },
  { id: "add-problem", label: "Add problem", icon: Plus },
];

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const formatUptime = (seconds = 0) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const StatusDot = ({ status }) => {
  const isHealthy = status === "operational" || status === "ACTIVE";

  return (
    <span className={`inline-block h-2 w-2 rounded-full ${isHealthy ? "bg-emerald-400" : "bg-red-400"}`} />
  );
};

const AdminDashboard = () => {
  const { authUser } = useAuthStore();
  const {
    overview,
    users,
    submissions,
    system,
    isLoading,
    isUpdatingUser,
    fetchDashboard,
    refreshSystemStatus,
    updateUserRole,
    updateUserStatus,
  } = useAdminStore();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [userQuery, setUserQuery] = useState("");
  const [submissionQuery, setSubmissionQuery] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => [user.name, user.username, user.email, user.role]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [userQuery, users]);

  const filteredSubmissions = useMemo(() => {
    const query = submissionQuery.trim().toLowerCase();
    if (!query) return submissions;

    return submissions.filter((submission) => [
      submission.user?.name,
      submission.user?.username,
      submission.problem?.title,
      submission.language,
      submission.status,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [submissionQuery, submissions]);

  const overviewCards = [
    { label: "Registered users", value: overview?.users ?? 0, icon: Users },
    { label: "Active users", value: overview?.activeUsers ?? 0, icon: UserCheck },
    { label: "Problems", value: overview?.problems ?? 0, icon: Code2 },
    { label: "Submissions", value: overview?.submissions ?? 0, icon: TerminalSquare },
  ];

  if (isLoading && !overview) {
    return (
      <div className="grid min-h-screen w-full place-items-center bg-[#080808] text-white">
        <div className="flex items-center gap-3 text-sm text-white/55">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading admin dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#080808] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <Code2 className="h-7 w-7" />
            <span className="text-xl font-semibold tracking-[-0.03em]">LeetSpase</span>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/45 sm:inline">Admin</span>
          </Link>
          <Link to="/problems" className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to problems
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {activeSection === "overview" && (
            <section>
              <div className="mb-8">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">Control center</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Admin overview</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">A live view of LeetSpase users, problems, submissions, and core services.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {overviewCards.map(({ label, value, icon: Icon }) => (
                  <article key={label} className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-white/40">{label}</p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
                      </div>
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <Icon className="h-4 w-4 text-white/70" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <article className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Platform activity</p>
                      <p className="mt-1 text-xs text-white/35">Acceptance and participation at a glance</p>
                    </div>
                    <Gauge className="h-5 w-5 text-white/35" />
                  </div>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Accepted submissions</p>
                      <p className="mt-3 text-2xl font-semibold">{overview?.acceptedSubmissions ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Acceptance rate</p>
                      <p className="mt-3 text-2xl font-semibold">
                        {overview?.submissions ? `${Math.round((overview.acceptedSubmissions / overview.submissions) * 100)}%` : "0%"}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                  <p className="text-sm font-semibold">Service health</p>
                  <div className="mt-6 space-y-4">
                    {[
                      ["Server", system?.server?.status],
                      ["Database", system?.database?.status],
                      ["CodeBox", system?.codebox?.status],
                    ].map(([label, status]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                        <span className="text-sm text-white/60">{label}</span>
                        <span className={`text-xs font-medium capitalize ${status === "operational" ? "text-emerald-400" : "text-red-400"}`}>
                          {status === "operational" ? "Operational" : status || "Unavailable"}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeSection === "users" && (
            <section>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">Accounts</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Users</h1>
                </div>
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search users"
                  className="h-11 w-full rounded-full border border-white/10 bg-[#111111] px-5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 sm:w-72"
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-black/20 text-xs uppercase tracking-[0.12em] text-white/35">
                      <tr>
                        <th className="px-5 py-4">Name</th>
                        <th className="px-5 py-4">Username</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Solved</th>
                        <th className="px-5 py-4">Verified</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-white/[0.025]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-semibold text-black">
                                {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : (user.name?.[0] || "U").toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{user.name || "Unnamed user"}</p>
                                <p className="mt-0.5 text-xs text-white/35">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-white/60">@{user.username}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.role === "ADMIN" ? "bg-violet-400/10 text-violet-300" : "bg-white/[0.06] text-white/55"}`}>{user.role}</span>
                          </td>
                          <td className="px-5 py-4 text-white/65">{user.solvedProblems}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-2 text-xs ${user.isVerified ? "text-emerald-300" : "text-white/35"}`}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> {user.isVerified ? "Verified" : "Not verified"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 text-xs text-white/60">
                              <StatusDot status={user.status} /> {user.status === "ACTIVE" ? (user.isOnline ? "Online" : "Active") : "Suspended"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-white/45">{formatDate(user.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={isUpdatingUser || user.id === authUser.id}
                                onClick={() => updateUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {user.role === "ADMIN" ? "Make user" : "Make admin"}
                              </button>
                              <button
                                type="button"
                                disabled={isUpdatingUser || user.id === authUser.id}
                                onClick={() => updateUserStatus(user.id, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                                className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${user.status === "ACTIVE" ? "border-red-400/20 text-red-300 hover:bg-red-400/10" : "border-emerald-400/20 text-emerald-300 hover:bg-emerald-400/10"}`}
                              >
                                {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filteredUsers.length && <p className="p-10 text-center text-sm text-white/35">No users match your search.</p>}
              </div>
            </section>
          )}

          {activeSection === "submissions" && (
            <section>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">Execution history</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Submissions</h1>
                </div>
                <input
                  value={submissionQuery}
                  onChange={(event) => setSubmissionQuery(event.target.value)}
                  placeholder="Search submissions"
                  className="h-11 w-full rounded-full border border-white/10 bg-[#111111] px-5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 sm:w-72"
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-black/20 text-xs uppercase tracking-[0.12em] text-white/35">
                      <tr>
                        <th className="px-5 py-4">User</th>
                        <th className="px-5 py-4">Problem</th>
                        <th className="px-5 py-4">Language</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Runtime</th>
                        <th className="px-5 py-4">Memory</th>
                        <th className="px-5 py-4">Timestamp</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {filteredSubmissions.map((submission) => {
                        const accepted = submission.status?.toLowerCase() === "accepted";

                        return (
                          <tr key={submission.id} className="transition-colors hover:bg-white/[0.025]">
                            <td className="px-5 py-4">
                              <p className="font-medium">{submission.user?.name || submission.user?.username}</p>
                              <p className="mt-0.5 text-xs text-white/35">{submission.user?.email}</p>
                            </td>
                            <td className="px-5 py-4 text-white/65">{submission.problem?.title}</td>
                            <td className="px-5 py-4 font-mono text-xs uppercase text-white/55">{submission.language}</td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs ${accepted ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{submission.status}</span>
                            </td>
                            <td className="px-5 py-4 text-white/55">{submission.time ? `${submission.time}s` : "—"}</td>
                            <td className="px-5 py-4 text-white/55">{submission.memory || "—"}</td>
                            <td className="px-5 py-4 text-xs text-white/40">{formatDate(submission.createdAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <button type="button" onClick={() => setSelectedSubmission(submission)} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/60 transition-colors hover:border-white/25 hover:text-white">View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!filteredSubmissions.length && <p className="p-10 text-center text-sm text-white/35">No submissions match your search.</p>}
              </div>
              <p className="mt-3 text-right text-xs text-white/25">Showing the latest 250 submissions</p>
            </section>
          )}

          {activeSection === "system" && (
            <section>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/35">Infrastructure</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">System status</h1>
                </div>
                <button type="button" onClick={refreshSystemStatus} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition-colors hover:border-white/25 hover:text-white">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Server status", value: system?.server?.status, detail: `${formatUptime(system?.server?.uptime)} uptime`, icon: Server },
                  { label: "Database", value: system?.database?.status, detail: `${system?.database?.responseTime ?? "—"} ms response`, icon: Database },
                  { label: "CodeBox system", value: system?.codebox?.status, detail: `${system?.codebox?.responseTime ?? "—"} ms response`, icon: TerminalSquare },
                  { label: "API response time", value: `${system?.server?.responseTime ?? "—"} ms`, detail: "Latest dashboard health check", icon: Gauge },
                  { label: "Active users", value: system?.activeUsers ?? 0, detail: `Active in the last ${system?.activeWindowMinutes ?? 15} minutes`, icon: Users },
                  { label: "Server memory", value: `${system?.server?.memoryUsedMb ?? "—"} MB`, detail: `${system?.server?.memoryTotalMb ?? "—"} MB allocated heap`, icon: Activity },
                ].map(({ label, value, detail, icon: Icon }, index) => (
                  <article key={label} className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm text-white/40">{label}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <p className={`text-xl font-semibold capitalize ${index < 3 ? (value === "operational" ? "text-emerald-400" : "text-red-400") : "text-white"}`}>
                            {index < 3 ? (value === "operational" ? "Operational" : value || "Unavailable") : value || "unknown"}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-white/30">{detail}</p>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                        <Icon className="h-4 w-4 text-white/60" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5 text-xs text-white/35">
                Last checked {system?.checkedAt ? formatDate(system.checkedAt) : "—"} · Node {system?.server?.nodeVersion || "—"}
              </div>
            </section>
          )}

          {activeSection === "add-problem" && (
            <section>
              <CreateProblemForm
                embedded
                onBack={() => setActiveSection("overview")}
                onCreated={() => {
                  fetchDashboard();
                  setActiveSection("overview");
                }}
              />
            </section>
          )}
        </main>

        <aside className="order-first border-b border-white/10 bg-[#0d0d0d] p-5 lg:order-none lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:border-b-0 lg:border-l lg:p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white font-semibold text-black">
              {authUser.image ? <img src={authUser.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : (authUser.name?.[0] || "A").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{authUser.name || "Administrator"}</p>
              <p className="mt-0.5 truncate text-xs text-white/35">{authUser.email}</p>
            </div>
          </div>

          <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1" aria-label="Admin dashboard sections">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${activeSection === id ? "bg-white text-black" : "text-white/45 hover:bg-white/[0.05] hover:text-white"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>

        </aside>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Submission details">
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Submission details</p>
                <h2 className="mt-2 text-xl font-semibold">{selectedSubmission.problem?.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedSubmission(null)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/50 hover:text-white" aria-label="Close submission details"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["User", selectedSubmission.user?.name || selectedSubmission.user?.username],
                ["Language", selectedSubmission.language],
                ["Status", selectedSubmission.status],
                ["Runtime", selectedSubmission.time ? `${selectedSubmission.time}s` : "—"],
                ["Memory", selectedSubmission.memory || "—"],
                ["Submitted", formatDate(selectedSubmission.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs text-white/30">{label}</p>
                  <p className="mt-2 text-sm text-white/75">{value}</p>
                </div>
              ))}
            </div>
            {(selectedSubmission.stderr || selectedSubmission.compileOutput) && (
              <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.04] p-4">
                <p className="text-xs text-red-300">Execution output</p>
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-white/60">{selectedSubmission.stderr || selectedSubmission.compileOutput}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
