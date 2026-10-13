import { useForm } from "react-hook-form";
import { LoaderCircle, X } from "lucide-react";

const CreatePlaylistModal = ({ isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
    onClose();
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
        aria-labelledby="create-playlist-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111111] text-white shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-6 border-b border-white/[0.08] px-6 py-5 sm:px-7">
          <div>
            <h2 id="create-playlist-title" className="text-xl font-semibold tracking-[-0.025em]">Create playlist</h2>
            <p className="mt-1.5 text-sm text-white/35">Build a focused collection for your practice.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close create playlist dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-6 sm:px-7">
          <div>
            <label htmlFor="playlist-name" className="text-xs font-medium text-white/65">Playlist name</label>
            <input
              id="playlist-name"
              type="text"
              autoFocus
              className={`mt-2 h-12 w-full rounded-xl border bg-[#090909] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 ${errors.name ? "border-red-400/60 focus:border-red-400" : "border-white/10 focus:border-white/30"}`}
              placeholder="e.g. Dynamic Programming"
              {...register("name", {
                required: "Playlist name is required",
                validate: (value) => value.trim().length > 0 || "Playlist name is required",
              })}
            />
            {errors.name && <p className="mt-2 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="playlist-description" className="text-xs font-medium text-white/65">Description</label>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white/20">Optional</span>
            </div>
            <textarea
              id="playlist-description"
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/30"
              placeholder="What are you planning to practice?"
              {...register("description")}
            />
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleClose} className="h-11 rounded-full border border-white/10 px-5 text-sm font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create playlist"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreatePlaylistModal;
