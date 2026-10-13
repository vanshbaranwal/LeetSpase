import { useState } from "react";
import { Check, FileText, LoaderCircle, X } from "lucide-react";
import { usePlaylistStore } from "../store/usePlaylistStore";

const AddToPlaylistModal = ({ isOpen, onClose, problemId }) => {
  const { playlists, addProblemToPlaylist, isLoading } = usePlaylistStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setSelectedPlaylist("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPlaylist) return;

    setIsSubmitting(true);
    const saved = await addProblemToPlaylist(selectedPlaylist, [problemId]);
    setIsSubmitting(false);

    if (saved) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={handleClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-playlist-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111111] text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-6 border-b border-white/[0.08] px-6 py-5 sm:px-7">
          <div>
            <h2 id="add-to-playlist-title" className="text-xl font-semibold tracking-[-0.025em]">Add to playlist</h2>
            <p className="mt-1.5 text-sm text-white/35">Choose a collection for this problem.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close add to playlist dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-7">
          <p className="text-xs font-medium text-white/65">Your playlists</p>

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {isLoading && !playlists.length ? (
              <div className="grid min-h-32 place-items-center rounded-xl border border-white/[0.08] bg-[#090909]">
                <LoaderCircle className="h-5 w-5 animate-spin text-white/35" />
              </div>
            ) : playlists.length ? (
              playlists.map((playlist) => {
                const selected = selectedPlaylist === playlist.id;
                const problemCount = playlist.problems?.length || 0;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => setSelectedPlaylist(playlist.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-white/25 bg-white/[0.075]" : "border-white/[0.08] bg-[#090909] hover:border-white/15 hover:bg-white/[0.035]"}`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${selected ? "bg-white text-black" : "bg-white/[0.055] text-white/35"}`}>
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-medium ${selected ? "text-white" : "text-white/65"}`}>{playlist.name}</span>
                      <span className="mt-1 block text-xs text-white/25">{problemCount} {problemCount === 1 ? "problem" : "problems"}</span>
                    </span>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-white bg-white text-black" : "border-white/15 text-transparent"}`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-[#090909] px-5 py-10 text-center">
                <FileText className="mx-auto h-6 w-6 text-white/20" />
                <p className="mt-3 text-sm text-white/40">No playlists available.</p>
                <p className="mt-1 text-xs text-white/25">Create a playlist before saving this problem.</p>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="h-11 rounded-full border border-white/10 px-5 text-sm font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={!selectedPlaylist || isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6] disabled:cursor-not-allowed disabled:opacity-35">
              {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Adding..." : "Add to playlist"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AddToPlaylistModal;
