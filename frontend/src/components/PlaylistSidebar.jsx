import { ChevronRight, FileText, Library, LockKeyhole } from "lucide-react";
import LanguageBrandIcon from "./LanguageBrandIcon";

const languageTracks = [
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "javascript", name: "JavaScript" },
];

const selectionKey = (selection) => `${selection?.type}:${selection?.id}`;

const PlaylistButton = ({ active, icon, name, caption, count, onClick, centerText = true }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${centerText ? "text-center" : "text-left"} ${
      active
        ? "border-white/20 bg-white/[0.09] text-white"
        : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.045] hover:text-white"
    }`}
  >
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${active ? "border-white/15 bg-white/[0.08]" : "border-white/10 bg-white/[0.035]"}`}>
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold">{name}</span>
      <span className="mt-0.5 block truncate text-[11px] text-white/35">{caption}</span>
    </span>
    <span className="shrink-0 rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10px] text-white/40">{count}</span>
  </button>
);

const PlaylistSidebar = ({
  playlists,
  selectedCollection,
  onSelectCollection,
  allProblemCount,
  problemCount,
  isAuthenticated,
  isLoading,
  tags,
  selectedTag,
  onSelectTag,
}) => {
  const activeKey = selectionKey(selectedCollection);
  const allTagsSelected = !selectedTag || selectedTag === "ALL";

  return (
    <aside className="order-first min-w-0 max-w-full self-start lg:order-last lg:sticky lg:top-28">
      <div className="max-h-[calc(100vh-8rem)] w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 bg-[#101010]/90 p-3 text-center shadow-2xl shadow-black/25">
        <div className="px-2 pb-2 pt-1">
          <p className="text-sm font-semibold text-white">Playlists</p>
        </div>

        <PlaylistButton
          active={activeKey === "all:all"}
          icon={<Library className="h-5 w-5 text-sky-400" />}
          name="All Problems"
          caption="General problem library"
          count={allProblemCount}
          centerText={false}
          onClick={() => onSelectCollection({ type: "all", id: "all" })}
        />

        <div className="my-3 border-t border-white/[0.07]" />

        <div className="px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Language tracks</p>
          <p className="mt-2 text-[11px] leading-5 text-white/40">
            Exclusive problem sets, distinct from &apos;All Problems&apos;.
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {languageTracks.map((track) => {
            const active = activeKey === `track:${track.id}`;
            const iconStyle = track.id === "python"
              ? "border-[#3776ab]/35 bg-[#3776ab]/10"
              : track.id === "java"
                ? "border-[#e76f00]/35 bg-[#e76f00]/10"
                : "border-[#f7df1e]/35 bg-[#f7df1e]/10";
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onSelectCollection({ type: "track", id: track.id })}
                aria-pressed={active}
                className={`group flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${active ? "border-white/20 bg-white/[0.09] text-white" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/15 hover:bg-white/[0.055] hover:text-white"}`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${iconStyle} ${active ? "brightness-125" : ""}`}>
                  <LanguageBrandIcon language={track.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{track.name}</span>
                  <span className="mt-1 block truncate text-[10px] text-white/40">30 exclusive questions · Learning path</span>
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-white/35 transition-colors group-hover:text-white/70">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="my-3 border-t border-white/[0.07]" />

        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Your playlists</p>
        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="px-2 py-3 text-xs text-white/35">Loading playlists...</p>
          ) : !isAuthenticated ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center text-xs leading-5 text-white/40">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Sign in to view your personal playlists.
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((playlist) => {
              const active = activeKey === `playlist:${playlist.id}`;
              const count = playlist.problems?.length ?? 0;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => onSelectCollection({ type: "playlist", id: playlist.id })}
                  aria-pressed={active}
                  className={`group flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${active ? "border-white/20 bg-white/[0.09] text-white" : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/15 hover:bg-white/[0.055] hover:text-white"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${active ? "border-white/20 bg-white/[0.09] text-white" : "border-white/10 bg-white/[0.035] text-white/45"}`}>
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{playlist.name}</span>
                    <span className="mt-1 block truncate text-[10px] text-white/40">{count} {count === 1 ? "problem" : "problems"} · Personal playlist</span>
                  </span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-white/35 transition-colors group-hover:text-white/70">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-2 py-3 text-xs leading-5 text-white/35">Your created playlists will appear here.</p>
          )}
        </div>

        <div className="my-3 border-t border-white/[0.07]" />

        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Tags</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-3.5 gap-y-3 px-2">
          <button
            type="button"
            onClick={() => onSelectTag("ALL")}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${allTagsSelected ? "text-white" : "text-white/70 hover:text-white"}`}
            aria-pressed={allTagsSelected}
          >
            All
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${allTagsSelected ? "border-white/20 bg-white/[0.16] text-white/80" : "border-white/10 bg-white/[0.1] text-white/65"}`}>
              {problemCount}
            </span>
          </button>

          {tags.map(({ name, count }) => {
            const active = selectedTag?.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => onSelectTag(active ? "ALL" : name)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                {name}
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${active ? "border-white/20 bg-white/[0.16] text-white/80" : "border-white/10 bg-white/[0.1] text-white/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {tags.length === 0 && <p className="text-xs text-white/35">No tags in this collection.</p>}
        </div>
      </div>
    </aside>
  );
};

export default PlaylistSidebar;
