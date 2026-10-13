import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Edit3,
  FileText,
  Flame,
  FolderOpen,
  KeyRound,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Save,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import LanguageBrandIcon from "../components/LanguageBrandIcon";
import { useProfileStore } from "../store/useProfileStore";

const sections = [
  { id: "overview", label: "Overview", icon: CircleUserRound },
  { id: "playlists", label: "Playlists", icon: FolderOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

const difficultyStyles = {
  EASY: { text: "text-emerald-400", bar: "bg-emerald-400" },
  MEDIUM: { text: "text-orange-400", bar: "bg-orange-400" },
  HARD: { text: "text-red-400", bar: "bg-red-400" },
};

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const formatTimestamp = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

const activityClass = (count) => {
  if (!count) return "bg-white/[0.045]";
  if (count === 1) return "bg-emerald-400/25";
  if (count <= 3) return "bg-emerald-400/45";
  if (count <= 6) return "bg-emerald-400/70";
  return "bg-emerald-400";
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    profile,
    stats,
    progress,
    recentSubmissions,
    activity,
    playlists,
    isLoading,
    isSaving,
    fetchProfile,
    updateProfile,
    changePassword,
    updatePlaylist,
    deletePlaylist,
    deleteAccount,
  } = useProfileStore();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "" });
  const [playlistPendingDeletion, setPlaylistPendingDeletion] = useState(null);
  const [deleteForm, setDeleteForm] = useState({ confirmation: "", password: "" });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const profileValues = profileForm || {
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    preferredLanguage: profile?.preferredLanguage || "",
    image: profile?.image || "",
  };

  const activityByDate = useMemo(() => new Map(activity.map((item) => [item.date, item.count])), [activity]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const days = [];

    for (let offset = 363; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() - offset);
      const key = dayKey(date);
      days.push({ date: key, count: activityByDate.get(key) || 0 });
    }

    return days;
  }, [activityByDate]);

  const totalActivity = activity.reduce((total, item) => total + item.count, 0);
  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) || playlists[0] || null;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const saved = await updateProfile(profileValues);
    if (saved) setProfileForm(null);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) return;
    const changed = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (changed) setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const beginPlaylistEdit = (playlist) => {
    setEditingPlaylist(playlist.id);
    setPlaylistForm({ name: playlist.name, description: playlist.description || "" });
  };

  const savePlaylist = async (playlistId) => {
    const saved = await updatePlaylist(playlistId, playlistForm);
    if (saved) setEditingPlaylist(null);
  };

  const confirmPlaylistDeletion = async () => {
    if (!playlistPendingDeletion) return;
    const deleted = await deletePlaylist(playlistPendingDeletion.id);
    if (deleted) setPlaylistPendingDeletion(null);
  };

  const handleAccountDeletion = async (event) => {
    event.preventDefault();
    const deleted = await deleteAccount(deleteForm);
    if (deleted) navigate("/", { replace: true });
  };

  if (isLoading && !profile) {
    return (
      <div className="grid min-h-screen w-full place-items-center bg-[#080808] text-white">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <LoaderCircle className="h-5 w-5 animate-spin" /> Loading your profile
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const statCards = [
    { label: "Problems solved", value: stats.totalSolved, icon: CheckCircle2 },
    { label: "Acceptance rate", value: `${stats.acceptanceRate}%`, icon: Target },
    { label: "Current streak", value: `${stats.currentStreak}d`, icon: Flame },
    { label: "Longest streak", value: `${stats.longestStreak}d`, icon: Trophy },
  ];

  return (
    <div className="min-h-screen w-full bg-[#080808] text-white">
      <Navbar variant="problems" />

      <main className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl font-semibold text-black sm:h-28 sm:w-28">
                {profile.image ? (
                  <img src={profile.image} alt={`${profile.name || "User"} profile`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (profile.name?.[0] || "U").toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{profile.name || "Coder"}</h1>
                  {profile.role === "ADMIN" && <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">Admin</span>}
                </div>
                <p className="mt-1.5 font-mono text-sm text-white/35">@{profile.username}</p>
                {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{profile.bio}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
                  {profile.preferredLanguage && (
                    <span className="inline-flex items-center gap-2">
                      <LanguageBrandIcon language={profile.preferredLanguage.toLowerCase()} className="h-4 w-4" />
                      <span className="font-medium text-white/55">{profile.preferredLanguage}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> Joined {formatDate(profile.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {profile.role === "ADMIN" && (
                <Link to="/admin" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin dashboard
                </Link>
              )}
              <button type="button" onClick={() => setActiveSection("settings")} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black transition-colors hover:bg-[#e6e6e6]">
                <Edit3 className="h-3.5 w-3.5" /> Edit profile
              </button>
            </div>
          </div>
        </section>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-2" aria-label="Profile sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${activeSection === id ? "bg-white text-black" : "text-white/45 hover:bg-white/[0.05] hover:text-white"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        {activeSection === "overview" && (
          <div className="mt-6 space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, icon: Icon }) => (
                <article key={label} className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/40">{label}</p>
                      <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-white/60" />
                    </span>
                  </div>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Problem-solving progress</h2>
                    <p className="mt-1 text-sm text-white/35">Your completed problems across every difficulty.</p>
                  </div>
                  <ListChecks className="h-5 w-5 text-white/30" />
                </div>

                <div className="mt-7 space-y-6">
                  {["EASY", "MEDIUM", "HARD"].map((difficulty) => {
                    const solved = progress.solved[difficulty] || 0;
                    const total = progress.total[difficulty] || 0;
                    const percentage = total ? Math.min(100, Math.round((solved / total) * 100)) : 0;
                    const style = difficultyStyles[difficulty];

                    return (
                      <div key={difficulty}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className={`font-semibold capitalize ${style.text}`}>{difficulty.toLowerCase()}</span>
                          <span className="text-white/45">{solved} / {total}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Coding activity</h2>
                    <p className="mt-1 text-sm text-white/35">{totalActivity} submissions during the past year.</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/30">
                    Less
                    {[0, 1, 3, 7].map((count) => <span key={count} className={`h-3 w-3 rounded-[3px] ${activityClass(count)}`} />)}
                    More
                  </div>
                </div>

                <div className="mt-7 overflow-x-auto pb-2">
                  <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
                    {calendarDays.map((day) => (
                      <span
                        key={day.date}
                        title={`${day.count} submission${day.count === 1 ? "" : "s"} on ${formatDate(day.date)}`}
                        className={`h-3 w-3 rounded-[3px] ${activityClass(day.count)}`}
                      />
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <SubmissionList submissions={recentSubmissions.slice(0, 6)} />
          </div>
        )}

        {activeSection === "playlists" && (
          <section className="mt-6">
            {playlists.length ? (
              <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#111111] lg:grid-cols-[310px_minmax(0,1fr)]">
                <aside className="border-b border-white/[0.08] bg-[#0d0d0d] lg:border-b-0 lg:border-r" aria-label="Your playlists">
                  <div className="border-b border-white/[0.08] px-5 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold">Your playlists</h2>
                      </div>
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/40">{playlists.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto p-3 lg:max-h-[650px] lg:flex-col lg:overflow-y-auto">
                    {playlists.map((playlist) => {
                      const percentage = playlist.problemCount ? Math.round((playlist.solvedCount / playlist.problemCount) * 100) : 0;
                      const selected = selectedPlaylist?.id === playlist.id;

                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlaylistId(playlist.id);
                            setEditingPlaylist(null);
                          }}
                          aria-pressed={selected}
                          className={`min-w-[245px] rounded-xl border p-4 text-left transition-colors lg:min-w-0 ${selected ? "border-white/15 bg-white/[0.075]" : "border-transparent hover:bg-white/[0.035]"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-white text-black" : "bg-white/[0.055] text-white/35"}`}>
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-sm font-medium ${selected ? "text-white" : "text-white/65"}`}>{playlist.name}</p>
                              <p className="mt-1 text-[11px] text-white/30">{playlist.solvedCount} of {playlist.problemCount} solved</p>
                            </div>
                            <span className={`text-xs font-medium ${percentage === 100 ? "text-emerald-400" : "text-white/35"}`}>{percentage}%</span>
                          </div>
                          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                            <div className={`h-full rounded-full ${percentage === 100 ? "bg-emerald-400" : "bg-white/70"}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {selectedPlaylist && (
                  <div className="min-w-0 p-5 sm:p-7">
                    {editingPlaylist === selectedPlaylist.id ? (
                      <div className="max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-5">
                        <h2 className="text-lg font-semibold">Edit playlist</h2>
                        <div className="mt-5 space-y-3">
                          <input value={playlistForm.name} onChange={(event) => setPlaylistForm((value) => ({ ...value, name: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm outline-none focus:border-white/25" />
                          <textarea value={playlistForm.description} onChange={(event) => setPlaylistForm((value) => ({ ...value, description: event.target.value }))} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-white/25" />
                          <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setEditingPlaylist(null)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 hover:text-white">Cancel</button>
                            <button type="button" disabled={isSaving} onClick={() => savePlaylist(selectedPlaylist.id)} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">Save changes</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Playlist</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{selectedPlaylist.name}</h2>
                            {selectedPlaylist.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">{selectedPlaylist.description}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Link to={`/problems?playlist=${selectedPlaylist.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-black">Practice <ChevronRight className="h-3.5 w-3.5" /></Link>
                            <button type="button" onClick={() => beginPlaylistEdit(selectedPlaylist)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/45 hover:border-white/20 hover:text-white" aria-label={`Edit ${selectedPlaylist.name}`}><Edit3 className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => setPlaylistPendingDeletion(selectedPlaylist)} className="grid h-9 w-9 place-items-center rounded-full border border-red-400/15 text-red-300/60 hover:bg-red-400/10 hover:text-red-300" aria-label={`Delete ${selectedPlaylist.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>

                        <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/20 p-4">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs text-white/35">Completion</p>
                              <p className="mt-1 text-sm font-medium"><span className="text-white">{selectedPlaylist.solvedCount}</span><span className="text-white/30"> / {selectedPlaylist.problemCount} problems</span></p>
                            </div>
                            <p className="text-xl font-semibold tracking-[-0.03em]">{selectedPlaylist.problemCount ? Math.round((selectedPlaylist.solvedCount / selectedPlaylist.problemCount) * 100) : 0}%</p>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-white" style={{ width: `${selectedPlaylist.problemCount ? Math.round((selectedPlaylist.solvedCount / selectedPlaylist.problemCount) * 100) : 0}%` }} />
                          </div>
                        </div>

                        <div className="mt-7 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Problems</h3>
                            <p className="mt-1 text-xs text-white/30">Continue from where you left off.</p>
                          </div>
                          <span className="text-xs text-white/35">{selectedPlaylist.problemCount} total</span>
                        </div>

                        {selectedPlaylist.problems?.length ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
                            {selectedPlaylist.problems.map((problem, index) => (
                              <Link key={problem.id} to={`/problem/${problem.id}`} className="flex items-center gap-4 border-b border-white/[0.065] px-4 py-4 transition-colors last:border-b-0 hover:bg-white/[0.035] sm:px-5">
                                <span className="w-7 shrink-0 text-center font-mono text-xs text-white/25">{String(index + 1).padStart(2, "0")}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white/75">{problem.title}</p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                                    <span className={`font-semibold ${difficultyStyles[problem.difficulty]?.text}`}>{problem.difficulty}</span>
                                    {problem.tags?.slice(0, 2).map((tag) => <span key={tag} className="text-white/25">{tag}</span>)}
                                  </div>
                                </div>
                                <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-medium sm:inline-flex ${problem.isSolved ? "bg-emerald-400/10 text-emerald-400" : "bg-white/[0.05] text-white/30"}`}>
                                  {problem.isSolved ? "Solved" : "Unsolved"}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
                            <ListChecks className="mx-auto h-7 w-7 text-white/20" />
                            <p className="mt-3 text-sm text-white/40">This playlist does not contain any problems yet.</p>
                            <Link to="/problems" className="mt-4 inline-flex text-xs font-semibold text-white/65 hover:text-white">Add problems</Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#111111] p-12 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-white/20" />
                <p className="mt-4 text-sm text-white/45">You have not created any playlists yet.</p>
                <Link to="/problems" className="mt-5 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black">Explore problems</Link>
              </div>
            )}
          </section>
        )}

        {activeSection === "settings" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-white/10 bg-[#111111] p-6 sm:p-8">
              <div>
                <h2 className="text-xl font-semibold">Profile information</h2>
                <p className="mt-2 text-sm text-white/35">Control how your LeetSpase profile appears.</p>
              </div>

              <form onSubmit={handleProfileSave} className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Display name">
                    <input value={profileValues.name} onChange={(event) => setProfileForm({ ...profileValues, name: event.target.value })} className="profile-input" required />
                  </Field>
                  <Field label="Username">
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/25">@</span><input value={profileValues.username} onChange={(event) => setProfileForm({ ...profileValues, username: event.target.value })} className="profile-input pl-8" required /></div>
                  </Field>
                </div>
                <Field label="Bio" hint={`${profileValues.bio.length}/160`}>
                  <textarea value={profileValues.bio} maxLength={160} onChange={(event) => setProfileForm({ ...profileValues, bio: event.target.value })} className="profile-input profile-bio-input" placeholder="What are you learning or building?" />
                </Field>
                <Field label="Profile image URL">
                  <input type="url" value={profileValues.image} onChange={(event) => setProfileForm({ ...profileValues, image: event.target.value })} className="profile-input" placeholder="https://example.com/profile.jpg" />
                </Field>
                <Field label="Preferred language">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {["PYTHON", "JAVA", "JAVASCRIPT"].map((language) => (
                      <button key={language} type="button" onClick={() => setProfileForm({ ...profileValues, preferredLanguage: profileValues.preferredLanguage === language ? "" : language })} className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors ${profileValues.preferredLanguage === language ? "border-white/30 bg-white/[0.09] text-white" : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"}`}>
                        <LanguageBrandIcon language={language.toLowerCase()} className="h-4 w-4" /> {language}
                      </button>
                    ))}
                  </div>
                </Field>
                <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6] disabled:opacity-50">
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
                </button>
              </form>
            </section>

            <div className="space-y-6">
              <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                <h2 className="text-lg font-semibold">Account</h2>
                <div className="mt-5 space-y-3">
                  <AccountRow label="Email" value={profile.email} />
                  <AccountRow label="Sign-in method" value={profile.provider === "GOOGLE" ? "Google" : "Email and password"} />
                  <AccountRow label="Verification" value={profile.isVerified ? "Verified" : "Not verified"} valueClass={profile.isVerified ? "text-emerald-400" : "text-white/45"} />
                  <AccountRow label="Account status" value={profile.status === "ACTIVE" ? "Active" : profile.status} valueClass={profile.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"} />
                </div>
              </section>

              {profile.canChangePassword && (
                <section className="rounded-2xl border border-white/10 bg-[#111111] p-6">
                  <div className="flex items-center gap-3">
                    <KeyRound className="h-5 w-5 text-white/40" />
                    <h2 className="text-lg font-semibold">Change password</h2>
                  </div>
                  <form onSubmit={handlePasswordChange} className="mt-5 space-y-3">
                    <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, currentPassword: event.target.value }))} className="profile-input" placeholder="Current password" required />
                    <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, newPassword: event.target.value }))} className="profile-input" placeholder="New password" minLength={6} required />
                    <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, confirmPassword: event.target.value }))} className="profile-input" placeholder="Confirm new password" minLength={6} required />
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && <p className="text-xs text-red-400">Passwords do not match.</p>}
                    <button type="submit" disabled={isSaving || passwordForm.newPassword !== passwordForm.confirmPassword} className="h-10 rounded-full border border-white/15 px-5 text-xs font-semibold text-white/65 hover:border-white/25 hover:text-white disabled:opacity-40">Update password</button>
                  </form>
                </section>
              )}

              <section className="rounded-2xl border border-red-400/15 bg-red-400/[0.035] p-6">
                <div className="flex items-center gap-3 text-red-300">
                  <LockKeyhole className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Delete account</h2>
                </div>
                {profile.role === "ADMIN" ? (
                  <p className="mt-3 text-sm leading-6 text-white/40">Admin accounts cannot be deleted from profile settings because their problems may belong to the platform. Transfer problem ownership before removing an admin account.</p>
                ) : (
                  <>
                    <p className="mt-3 text-sm leading-6 text-white/40">This permanently removes your submissions, solved history, playlists, and account. Type DELETE to continue.</p>
                    <form onSubmit={handleAccountDeletion} className="mt-5 space-y-3">
                      <input value={deleteForm.confirmation} onChange={(event) => setDeleteForm((value) => ({ ...value, confirmation: event.target.value }))} className="profile-input border-red-400/15" placeholder="Type DELETE" required />
                      {profile.canChangePassword && <input type="password" value={deleteForm.password} onChange={(event) => setDeleteForm((value) => ({ ...value, password: event.target.value }))} className="profile-input border-red-400/15" placeholder="Confirm your password" required />}
                      <button type="submit" disabled={isSaving || deleteForm.confirmation !== "DELETE"} className="inline-flex h-10 items-center gap-2 rounded-full border border-red-400/25 px-5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-35">
                        <Trash2 className="h-3.5 w-3.5" /> Permanently delete account
                      </button>
                    </form>
                  </>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {playlistPendingDeletion && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Delete playlist">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-7 shadow-2xl">
            <button type="button" onClick={() => setPlaylistPendingDeletion(null)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/40 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/70">Delete playlist</p>
            <h2 className="mt-4 pr-10 text-xl font-semibold">Delete “{playlistPendingDeletion.name}”?</h2>
            <p className="mt-3 text-sm leading-6 text-white/40">The playlist will be removed, but its problems and your submissions will remain untouched.</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setPlaylistPendingDeletion(null)} className="h-10 rounded-full border border-white/10 px-5 text-sm text-white/55">Cancel</button>
              <button type="button" disabled={isSaving} onClick={confirmPlaylistDeletion} className="h-10 rounded-full bg-red-500 px-5 text-sm font-semibold text-white disabled:opacity-50">Delete playlist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-2 flex items-center justify-between text-sm font-medium text-white/65">
      {label}{hint && <span className="text-xs font-normal text-white/25">{hint}</span>}
    </span>
    {children}
  </label>
);

const AccountRow = ({ label, value, valueClass = "text-white/60" }) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm">
    <span className="text-white/35">{label}</span>
    <span className={`truncate text-right ${valueClass}`}>{value}</span>
  </div>
);

const SubmissionList = ({ submissions }) => (
  <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
    <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
      <div>
        <h2 className="text-lg font-semibold">Recent submissions</h2>
        <p className="mt-1 text-sm text-white/35">Your latest CodeBox execution results.</p>
      </div>
    </div>
    {submissions.length ? (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/[0.07] text-xs uppercase tracking-[0.12em] text-white/30">
            <tr><th className="px-6 py-4">Problem</th><th className="px-5 py-4">Language</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Runtime</th><th className="px-5 py-4">Memory</th><th className="px-6 py-4 text-right">Submitted</th></tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {submissions.map((submission) => {
              const accepted = submission.status?.toLowerCase() === "accepted";
              return (
                <tr key={submission.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4"><Link to={`/problem/${submission.problem.id}`} className="font-medium text-white/75 hover:text-white">{submission.problem.title}</Link><p className={`mt-1 text-xs ${difficultyStyles[submission.problem.difficulty]?.text}`}>{submission.problem.difficulty}</p></td>
                  <td className="px-5 py-4 font-mono text-xs text-white/50">{submission.language}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs ${accepted ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{submission.status}</span></td>
                  <td className="px-5 py-4 text-white/45">{submission.time ? `${submission.time}s` : "—"}</td>
                  <td className="px-5 py-4 text-white/45">{submission.memory || "—"}</td>
                  <td className="px-6 py-4 text-right text-xs text-white/30">{formatTimestamp(submission.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : <p className="p-10 text-center text-sm text-white/35">Your submissions will appear here after you solve a problem.</p>}
  </section>
);

export default ProfilePage;
