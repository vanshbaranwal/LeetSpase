import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import "./AdminSpases.css";

const nameOf = (user) => user?.name || user?.username || "Deleted account";
const date = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "medium",
}).format(new Date(value)) : "Unavailable";
const duration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
};
const labels = {
  HOST_ENDED: "Host ended", EMPTY_TIMEOUT: "Empty for five minutes",
  LEFT: "Left", REMOVED: "Removed by host", TAB_REPLACED: "Opened in another tab",
  CONNECTION_LOST: "Connection lost", HOST_ACCOUNT_DELETED: "Host account deleted", ACCOUNT_DELETED: "Account deleted",
  PROBLEM_SELECTED: "Problem selected", LANGUAGE_CHANGED: "Language changed",
};
const label = (value) => labels[value] || value?.replaceAll("_", " ").toLowerCase() || "Unavailable";
const Status = ({ value }) => <span className="admin-spase-status" data-status={value}>{label(value)}</span>;
const Field = ({ title, children }) => <div className="admin-spase-field"><dt>{title}</dt><dd>{children}</dd></div>;
const Pagination = ({ data, onChange, title }) => data && (
  <nav className="admin-spase-pagination" aria-label={title}>
    <span>{data.total} {title.toLowerCase()} · Page {data.page} of {data.pages}</span>
    <div>
      <button disabled={data.page <= 1} onClick={() => onChange(data.page - 1)}>Previous</button>
      <button disabled={data.page >= data.pages} onClick={() => onChange(data.page + 1)}>Next</button>
    </div>
  </nav>
);
const Totals = ({ totals, onSelect }) => (
  <div className="admin-spase-totals">
    {[["Total Spases", "total", ""], ["Active", "active", "ACTIVE"], ["Ended", "ended", "ENDED"], ["Inactive", "inactive", "INACTIVE"]].map(([title, key, status]) =>
      onSelect ? <button key={key} onClick={() => onSelect(status)}><span>{title}</span><strong>{totals?.[key] ?? "—"}</strong></button>
        : <div key={key}><span>{title}</span><strong>{totals?.[key] ?? "—"}</strong></div>
    )}
  </div>
);

function SpaseDetails({ id, onBack }) {
  const [pages, setPages] = useState({ participants: 1, visits: 1, activities: 1, jobs: 1 });
  const [tab, setTab] = useState("visits");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    axiosInstance.get(`/admin/spases/${id}`, {
      signal: controller.signal, params: Object.fromEntries(Object.entries(pages).map(([key, page]) => [key + "Page", page])),
    }).then(({ data: response }) => { setData(response); setError(""); })
      .catch((failure) => { if (failure.code !== "ERR_CANCELED") setError(failure.response?.data?.error || "Could not load this Spase."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, pages, refresh]);
  const changePage = (key, page) => { setLoading(true); setPages((current) => ({ ...current, [key]: page })); };
  const spase = data?.spase;
  return (
    <section className="admin-spases">
      <button className="admin-spase-back" onClick={onBack}><ArrowLeft size={16} /> All Spases</button>
      <div className="admin-spase-heading">
        <div><h1 ref={heading} tabIndex={-1}>Spase details</h1><p className="admin-spase-id">{id}</p></div>
        <button className="admin-spase-refresh" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}><RefreshCw size={15} /> Refresh</button>
      </div>
      {error && <p role="alert" className="admin-spase-error">{error}</p>}
      {loading && <p role="status" className="admin-spase-loading">Loading history…</p>}
      {spase && !error && <div aria-busy={loading}>
        <dl className="admin-spase-facts">
          <Field title="Status"><Status value={spase.status} /></Field>
          <Field title="Original creator">{spase.creatorKnown ? nameOf(spase.creator) : "Unavailable"}</Field>
          <Field title="Host">{nameOf(spase.host)}</Field>
          <Field title="Guest access">{spase.guestMode === "EDITOR" ? "Editor" : "View only"}</Field>
          <Field title="Started">{date(spase.createdAt)}</Field>
          <Field title="Ended">{spase.closedAt ? date(spase.closedAt) : "Still open"}</Field>
          <Field title="Duration">{duration(spase.durationSeconds)}{!spase.closedAt && " · elapsed"}</Field>
          <Field title="Ended by">{spase.closedAt ? (spase.closeReason === "EMPTY_TIMEOUT" ? "Automatic expiry" : nameOf(spase.endedBy)) : "—"}</Field>
          <Field title="End reason">{spase.closedAt ? label(spase.closeReason) : "—"}</Field>
          <Field title="Unique participants">{spase.uniqueParticipants}</Field>
        </dl>
        <p className="admin-spase-note">Times use your local timezone. Detailed tracking began {date(spase.historyStartedAt)}. Earlier visit times are unavailable.</p>
        <h2>Participants</h2>
        <ul className="admin-spase-people">
          {data.participants.items.map((person) => <li key={person.id}>
            <span>{nameOf(person.user)}</span><small>{person.visitCount} {person.visitCount === 1 ? "visit" : "visits"}{person.legacy && " · Earlier attendance times unavailable"}</small>
          </li>)}
        </ul>
        {!data.participants.total && <p className="admin-spase-empty">No participant has entered this Spase.</p>}
        <Pagination title="Participants" data={data.participants} onChange={(page) => changePage("participants", page)} />
        <div className="admin-spase-tabs" role="tablist" aria-label="Spase history">
          {[["visits", "Visits"], ["activities", "Problems"], ["jobs", "Executions"]].map(([key, title]) =>
            <button role="tab" id={`spase-tab-${key}`} aria-controls={`spase-panel-${key}`} aria-selected={tab === key} key={key} onClick={() => setTab(key)}>{title} <span>{data[key].total}</span></button>
          )}
        </div>
        <div role="tabpanel" id={`spase-panel-${tab}`} aria-labelledby={`spase-tab-${tab}`} tabIndex={0}>
          <div className="admin-spase-records">
            {tab === "visits" && data.visits.items.map((visit) => <article key={visit.id}>
              <div className="admin-spase-record-title"><strong>{nameOf(visit.participant.user)}</strong><Status value={visit.status} /></div>
              <dl className="admin-spase-record-fields">
                <Field title="Role">{visit.initialRole === visit.role ? label(visit.role) : `${label(visit.initialRole)} → ${label(visit.role)}`}</Field>
                <Field title="Joined">{date(visit.joinedAt)}</Field>
                <Field title="Last seen">{date(visit.lastSeenAt)}</Field>
                <Field title="Left">{visit.leftAt ? date(visit.leftAt) : "—"}</Field>
                <Field title="Departure">{visit.leftAt ? label(visit.leaveReason) : visit.disconnectedAt ? "Disconnected · reconnect window" : "—"}</Field>
              </dl>
            </article>)}
            {tab === "activities" && data.activities.items.map((activity) => <article key={activity.id}>
              <div className="admin-spase-record-title"><strong>{activity.problemTitle}</strong><span>{label(activity.type)}</span></div>
              <dl className="admin-spase-record-fields">
                <Field title="Selected by">{nameOf(activity.actor)}</Field>
                <Field title="Language">{activity.language}</Field>
                <Field title="Time">{date(activity.createdAt)}</Field>
              </dl>
            </article>)}
            {tab === "jobs" && data.jobs.items.map((job) => <article key={job.id}>
              <div className="admin-spase-record-title"><strong>{job.problemTitle || "Problem unavailable"}</strong><Status value={job.state} /></div>
              <dl className="admin-spase-record-fields">
                <Field title="Requested by">{nameOf(job.actor)}</Field>
                <Field title="Action">{job.mode === "run" ? "Run" : "Submit"}</Field>
                <Field title="Language">{job.language}</Field>
                <Field title="Requested">{date(job.createdAt)}</Field>
                <Field title="Started">{date(job.startedAt)}</Field>
                <Field title="Completed">{date(job.completedAt)}</Field>
                <Field title="Result">{job.result?.verdict || "—"}{job.result?.total && ` · ${job.result.passed}/${job.result.total} passed`}</Field>
              </dl>
              {job.error && <p className="admin-spase-error">{job.error}</p>}
            </article>)}
          </div>
          {!data[tab].total && <p className="admin-spase-empty">No {tab === "activities" ? "problem activity" : tab === "jobs" ? "executions" : "visits"} recorded.</p>}
          <Pagination title={tab === "activities" ? "Activities" : tab === "jobs" ? "Executions" : "Visits"} data={data[tab]} onChange={(page) => changePage(tab, page)} />
        </div>
      </div>}
    </section>
  );
}

export default function AdminSpases() {
  const [filters, setFilters] = useState({ q: "", status: "", from: "", to: "", page: 1 });
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      axiosInstance.get("/admin/spases", { params: filters, signal: controller.signal })
        .then(({ data: response }) => { setData(response); setError(""); })
        .catch((failure) => { if (failure.code !== "ERR_CANCELED") setError(failure.response?.data?.error || "Could not load Spase history."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, refresh]);
  const update = (key, value) => { setLoading(true); setFilters((current) => ({ ...current, [key]: value, ...(key === "page" ? {} : { page: 1 }) })); };
  if (selected) return <SpaseDetails key={selected} id={selected} onBack={() => { setSelected(null); setLoading(true); setRefresh((value) => value + 1); }} />;
  return (
    <section className="admin-spases" aria-busy={loading}>
      <div className="admin-spase-heading"><div><h1>Spases</h1><p>Sessions and participation history.</p></div>
        <button className="admin-spase-refresh" disabled={loading} onClick={() => { setLoading(true); setRefresh((value) => value + 1); }}><RefreshCw size={15} /> Refresh</button>
      </div>
      <Totals totals={data?.totals} onSelect={(status) => update("status", status)} />
      <form className="admin-spase-filters" onSubmit={(event) => event.preventDefault()}>
        <label className="admin-spase-search">Search<input maxLength={100} type="search" value={filters.q} onChange={(event) => update("q", event.target.value)} placeholder="Host, participant, or Spase ID" /></label>
        <label>Status<select value={filters.status} onChange={(event) => update("status", event.target.value)}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ENDED">Ended</option></select></label>
        <label>From (UTC)<input type="date" value={filters.from} onChange={(event) => update("from", event.target.value)} /></label>
        <label>To (UTC)<input type="date" value={filters.to} onChange={(event) => update("to", event.target.value)} /></label>
      </form>
      <p className="admin-spase-note">Active means connected participants. Inactive Spases are still open; empty sessions end after five minutes.</p>
      {error && <p role="alert" className="admin-spase-error">{error}</p>}
      {loading && <p role="status" className="admin-spase-loading">Loading Spases…</p>}
      {!error && <div className="admin-spase-list">
        {data?.items.map((spase) => <button className="admin-spase-list-row" key={spase.id} onClick={() => setSelected(spase.id)} aria-label={`View Spase hosted by ${nameOf(spase.host)}, started ${date(spase.createdAt)}`}>
          <div className="admin-spase-list-title"><strong>{nameOf(spase.host)}</strong><span className="admin-spase-id">{spase.id.slice(0, 8)}</span><Status value={spase.status} /></div>
          <dl className="admin-spase-list-fields">
            <Field title="Participants">{spase.uniqueParticipants}</Field><Field title="Started">{date(spase.createdAt)}</Field>
            <Field title="Ended">{spase.closedAt ? date(spase.closedAt) : "Still open"}</Field><Field title="Duration">{duration(spase.durationSeconds)}</Field>
          </dl>
          <span className="admin-spase-view">View history →</span>
        </button>)}
        {data && !data.total && !loading && <p className="admin-spase-empty">No Spases match these filters.</p>}
        <Pagination title="Spases" data={data} onChange={(page) => update("page", page)} />
      </div>}
    </section>
  );
}
