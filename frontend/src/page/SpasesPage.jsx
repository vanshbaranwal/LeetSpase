
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Radio, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios";

const inputClass = "min-h-11 w-full rounded-lg border border-white/15 bg-[#0a0c11] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-[#3b82f6]";
const buttonClass = "mt-auto inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#3b82f6] px-5 text-sm font-semibold text-[#0a0c11] transition-colors hover:bg-[#93c5fd] disabled:opacity-55";

const guestAccessOptions = [
  { value: "EDITOR", label: "Editor", description: "Edit, run, and submit code" },
  { value: "VIEWER", label: "View only", description: "Watch live edits and results" },
];

export default function SpasesPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("EDITOR");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  const enter = async (event, action) => {
    event.preventDefault();
    setPending(action);
    setError("");
    try {
      const create = action === "create";
      const { data } = await axiosInstance.post(create ? "/spases" : "/spases/join", create ? { guestMode: mode } : { code });
      navigate(`/spases/${data.id}`);
    } catch (failure) {
      setError(failure.response?.data?.message || "Couldn't open the spase. Try again.");
    } finally {
      setPending("");
    }
  };

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-5xl grid-rows-[minmax(0,1fr)_auto_minmax(0,2fr)] px-5 py-5 sm:px-10 sm:py-8">
      <div className="row-start-2 w-full">
        <Link
          to="/problems"
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-[#93c5fd] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3b82f6]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to problems
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Spases</h1>
        <p className="mt-3 max-w-lg text-white/65">Solve a problem together in a shared workspace for up to five people.</p>
        {error && <p role="alert" className="mt-6 rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="mt-9 grid gap-8 border-y border-white/12 py-8 md:grid-cols-2 md:gap-0">
          <form onSubmit={(event) => enter(event, "create")} className="flex flex-col gap-4 md:border-r md:border-white/12 md:pr-10">
            <h2 className="flex items-center gap-2 font-semibold text-white"><Radio className="size-4 text-[#3b82f6]" aria-hidden /> Host a spase</h2>
<fieldset disabled={Boolean(pending)}>
              <legend className="text-sm text-white/75">Guest access</legend>
              <div className="mt-2 grid divide-y divide-white/12 overflow-hidden rounded-lg border border-white/15 bg-[#0a0c11] min-[360px]:grid-cols-2 min-[360px]:divide-x min-[360px]:divide-y-0">
                {guestAccessOptions.map(({ value, label, description }) => (
                  <label key={value} className="flex cursor-pointer has-[:disabled]:cursor-default">
                    <input
                      type="radio"
                      name="guestAccess"
                      value={value}
                      checked={mode === value}
                      onChange={() => setMode(value)}
                      className="peer sr-only"
                    />
                    <span className="flex w-full items-start gap-2.5 p-3 transition-colors hover:bg-white/[0.04] peer-checked:bg-[#3b82f6]/12 peer-focus-visible:ring-2 peer-focus-visible:ring-[#3b82f6] peer-focus-visible:ring-inset motion-reduce:transition-none">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${mode === value ? "border-[#3b82f6] bg-[#3b82f6] text-[#0a0c11]" : "border-white/35"}`}
                      >
                        {mode === value && <Check className="size-3" strokeWidth={2.5} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">{label}</span>
                        <span className="mt-1 block text-xs leading-4 text-white/65">{description}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" disabled={Boolean(pending)} className={buttonClass}>{pending === "create" ? "Creating…" : "Create spase"} <ArrowRight className="size-4" aria-hidden /></button>
          </form>
          <form onSubmit={(event) => enter(event, "join")} className="flex flex-col gap-4 md:pl-10">
            <h2 className="flex items-center gap-2 font-semibold text-white"><Users className="size-4 text-[#3b82f6]" aria-hidden /> Join a spase</h2>
            <label className="grid gap-2 text-sm text-white/75">
              Invite code
              <input
                className={inputClass + " font-mono uppercase tracking-widest"}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                maxLength={5}
                placeholder="ABCDE"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </label>
            <button type="submit" disabled={Boolean(pending) || code.length !== 5} className={buttonClass}>{pending === "join" ? "Joining…" : "Join spase"} <ArrowRight className="size-4" aria-hidden /></button>
          </form>
        </div>
      </div>
    </main>
  );
}
