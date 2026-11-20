
import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, Users, X } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useProblemStore } from "../store/useProblemStore";
import { participantColorClass, useCodingSpase } from "../spases/useCodingSpase";
import SpaseProblemPicker from "../spases/SpaseProblemPicker";
import ProblemPage from "./ProblemPage";

const controlClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:opacity-50";

const leaveButtonClass = "inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-[#623745] bg-[#2c1d2d] px-2.5 text-xs font-semibold text-[#ffc4ca] transition-colors hover:border-[#8c4b57] hover:bg-[#3d2435] active:bg-[#492a3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50 motion-reduce:transition-none";
const endButtonClass = "inline-flex min-h-10 items-center justify-center rounded-lg bg-red-300 px-4 text-xs font-semibold text-[#30151f] transition-colors hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:opacity-50 motion-reduce:transition-none";

export default function CodingSpasePage() {
  const { spaseId } = useParams();
  return <CodingSpase key={spaseId} spaseId={spaseId} />;
}

function CodingSpase({ spaseId }) {
  const liveSpase = useCodingSpase(spaseId);
  const { workspace, members, jobs, access, ended, action, connection, notice, reconnect } = liveSpase;
  const isLive = connection === "live";
  const spase = workspace?.spase;
  const { problems, getAllProblems, isProblemsLoading } = useProblemStore();
  const [copied, setCopied] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEndingSpase, setIsEndingSpase] = useState(false);
  const [exitFailed, setExitFailed] = useState(false);
  const exitDialog = useRef(null);
  const cancelExitButton = useRef(null);
  const navigate = useNavigate();

  const leaveSpase = async () => {
    if (!isLive || isExiting) return;
    setIsExiting(true);
    setIsEndingSpase(access.isHost);
    setExitFailed(false);
    try {
      const completed = await action(access.isHost ? "spase:end" : "spase:leave");
      if (!completed) {
        setIsEndingSpase(false);
        if (access.isHost) setExitFailed(true);
      } else {
        exitDialog.current?.close();
        navigate("/spases", { replace: true });
      }
    } finally {
      setIsExiting(false);
    }
  };

  const handleLeaveClick = () => {
    if (!access.isHost) {
      void leaveSpase();
      return;
    }
    setExitFailed(false);
    exitDialog.current?.showModal();
    cancelExitButton.current?.focus();
  };

  useEffect(() => {
    if (access?.isHost) void getAllProblems();
  }, [access?.isHost, getAllProblems]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(spase.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (ended) {
    if (isEndingSpase) return <Navigate to="/spases" replace />;
    return (
      <main className="grid min-h-dvh w-full place-items-center bg-[#13161d] p-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-semibold">{ended}</h1>
          <Link to="/spases" className="mt-5 inline-block font-medium text-[#3b82f6]">Back to Spases</Link>
        </div>
      </main>
    );
  }

  if (!spase || !access) {
    return (
      <main className="grid min-h-dvh w-full place-items-center bg-[#13161d] p-6 text-center text-white">
        <div className="space-y-4">
          <p role="status" className="flex items-center justify-center gap-2">
            {connection === "connecting" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {notice || "Connecting to the spase…"}
          </p>
          {connection === "unavailable" && <button type="button" className={controlClass} onClick={reconnect}>Reconnect</button>}
          <Link to="/spases" className="block text-sm text-[#3b82f6]">Back to Spases</Link>
        </div>
      </main>
    );
  }

  const pendingJobs = jobs.filter((job) => job.state === "QUEUED");
  const sharedJob = jobs.find((job) => job.state === "RUNNING") ?? pendingJobs.at(-1) ?? jobs[0];

  return (
    <div className="flex h-dvh min-w-0 w-full flex-col overflow-hidden bg-[#13161d] text-white">
      <header className="shrink-0 border-b border-white/10 bg-[#0a0c11] px-4 py-3 sm:px-6">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <div className="flex shrink-0 items-center gap-2">
              <h1 className="text-sm font-semibold sm:text-base">Spase</h1>
              <button type="button" onClick={copyInvite} aria-label={copied ? "Invite code copied" : "Copy invite code"} className={controlClass + " font-mono tracking-widest"}>
                {spase.code}
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              </button>
            </div>
            {access.isHost ? (
              <SpaseProblemPicker
                problems={problems}
                loading={isProblemsLoading}
                currentId={spase.problemId}
                disabled={!isLive}
                onPick={(problemId) => action("spase:problem", { problemId })}
                notice={notice}
              />
            ) : (
              <span className="rounded-md bg-[#3b82f6]/10 px-2 py-1 text-[#93c5fd]">{access.canEdit ? "Editor" : "View only"}</span>
            )}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-white/65"><Users className="size-3.5" aria-hidden /> {members.length}/5</span>
              <ul aria-label="Participants" className="flex min-w-0 flex-wrap gap-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    data-host={member.role === "HOST"}
                    data-away={!member.online}
                    className={`spase-participant flex min-h-10 max-w-52 min-w-0 items-center gap-2 py-1 pl-1.5 pr-2 ${participantColorClass(member.colorIndex)}`}
                  >
                    <SpaseParticipantAvatar name={member.name} image={member.image} online={member.online} />
                    <span className="spase-participant-name min-w-0 truncate text-xs leading-tight font-semibold" title={member.name}>{member.name}</span>
                    {member.role === "HOST" && (
                      <span role="img" aria-label="Host" title="Host" className="ml-0.5 grid h-6 w-5.5 shrink-0 place-items-center rounded-[3px] bg-[#f4ede0] text-[11px] leading-none font-bold text-[#0a0c11]">H</span>
                    )}
                    {access.isHost && member.role !== "HOST" && (
                      <button
                        type="button"
                        aria-label={`Remove ${member.name}`}
                        disabled={!isLive}
                        onClick={() => action("spase:remove", { userId: member.id })}
                        className="grid size-6 shrink-0 place-items-center rounded-md text-white/60 hover:bg-red-400/15 hover:text-red-200"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ml-auto flex max-w-1/2 shrink-0 flex-wrap items-center justify-end gap-2 sm:max-w-none">
            {!isLive && <p role="status" className="text-xs text-amber-200">{connection === "unavailable" ? "Disconnected" : "Reconnecting…"}</p>}
            {connection === "unavailable" && <button type="button" className={controlClass} onClick={reconnect}>Reconnect</button>}
            <button
              type="button"
              disabled={!isLive || isExiting}
              aria-haspopup={access.isHost ? "dialog" : undefined}
              aria-busy={isExiting && !access.isHost}
              onClick={handleLeaveClick}
              className={leaveButtonClass}
            >
              Leave
            </button>
          </div>
        </div>
        {notice && <p role="alert" className="mt-2 text-xs text-amber-200">{notice}</p>}
      </header>

      {access.isHost && (
        <dialog
          ref={exitDialog}
          aria-labelledby="spase-exit-title"
          aria-describedby="spase-exit-description"
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/15 bg-[#13161d] p-5 text-white shadow-2xl backdrop:bg-[#0a0c11]/75 sm:p-6"
        >
          <form onSubmit={(event) => {
            event.preventDefault();
            void leaveSpase();
          }}>
            <h2 id="spase-exit-title" className="text-lg font-semibold">End this spase?</h2>
            <p id="spase-exit-description" className="mt-2 text-sm leading-6 text-white/75">
              This will end the session for everyone.
            </p>
            {exitFailed && <p role="alert" className="mt-3 text-sm text-red-200">{notice}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" ref={cancelExitButton} disabled={isExiting} onClick={() => exitDialog.current?.close()} className={controlClass}>
                Cancel
              </button>
              <button type="submit" disabled={!isLive || isExiting} className={endButtonClass}>
                {isExiting ? "Ending…" : "End spase"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {spase.problemId && workspace.doc ? (
        <ProblemPage
          key={spase.problemId}
          sharedSpase={{ ...liveSpase, spase, doc: workspace.doc, sharedJob, pendingJobs: pendingJobs.length, isLive }}
        />
      ) : (
        <main className="grid flex-1 place-items-center px-5 text-center">
          <div>
            <h2 className="text-xl font-semibold">{access.isHost ? "Choose the first problem" : "Waiting for the host"}</h2>
            <p className="mt-2 text-sm text-white/65">{access.isHost ? "Share the invite code while you pick a problem." : "The workspace will open when the host picks a problem."}</p>
          </div>
        </main>
      )}
    </div>
  );
}

function SpaseParticipantAvatar({ name, image, online }) {
  const [failedImage, setFailedImage] = useState(null);
  const status = online ? "Connected" : "Away";
  const initial = Array.from(name.trim())[0]?.toUpperCase() || "?";

  return (
    <span
      role="img"
      aria-label={status}
      title={status}
      className={`spase-participant-avatar grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border text-[11px] leading-none font-semibold ${online ? "" : "opacity-50"}`}
    >
      {image && image !== failedImage ? (
        <img
          src={image}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
