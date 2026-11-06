import { ArrowRight, CalendarDays, Check, CheckCircle2, Search, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspaceDemo from "./WorkspaceDemo";
import "./LandingShowcase.css";
import "./LandingMotion.css";

export default function LandingShowcase({ authUser }) {
  return (
    <>
      <section id="features" className="ls-showcase">
        <div className="ls-container">
          <div className="ls-section-intro ls-demo-intro"><h2>An illustrative preview of <em>LeetSpase</em></h2></div>
          <WorkspaceDemo />
        </div>
      </section>
      <section id="how-it-works" className="ls-flow"><div className="ls-container">
        <div className="ls-flow-heading"><h2>Find your flow<span>.</span></h2></div>
        <div className="ls-flow-grid">
          <article className="ls-flow-step"><div className="ls-flow-art ls-flow-discover" aria-hidden="true"><div className="ls-discover-window"><div className="ls-discover-search"><Search size={15} /><span>Search problems</span><i /></div><div className="ls-discover-row ls-discover-first"><span><i /> Arrays</span><small>Easy</small></div><div className="ls-discover-row"><span><i /> Strings</span><small>Easy</small></div><div className="ls-discover-row"><span><i /> Dynamic Programming</span><small>Medium</small></div></div><span className="ls-flow-orbit ls-orbit-one" /></div><div className="ls-flow-label"><span>01</span><h3>Discover</h3><ArrowRight size={17} /></div></article>
          <article className="ls-flow-step"><div className="ls-flow-art ls-flow-solve" aria-hidden="true"><div className="ls-solve-window"><div className="ls-solve-top"><span><i /><i /><i /></span><small>solution.py</small></div><div className="ls-solve-code"><div><b>def</b> solve(data):</div><div className="ls-solve-line">&nbsp;&nbsp;&nbsp;&nbsp;a, b = map(int, data.split())</div><div className="ls-solve-line ls-solve-last">&nbsp;&nbsp;&nbsp;&nbsp;<b>return</b> a + b<span className="ls-solve-cursor" /></div></div><div className="ls-solve-result"><CheckCircle2 size={15} /> Accepted <span>✓ &nbsp; ✓ &nbsp; ✓</span></div></div><span className="ls-flow-orbit ls-orbit-two" /></div><div className="ls-flow-label"><span>02</span><h3>Solve</h3><ArrowRight size={17} /></div></article>
          <article className="ls-flow-step"><div className="ls-flow-art ls-flow-track" aria-hidden="true"><div className="ls-track-profile"><div className="ls-track-profile-head"><span>CODING ACTIVITY</span><CalendarDays size={14} /></div><div className="ls-track-week">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div key={index}><span>{day}</span><i className={index < 5 ? "is-active" : ""} style={{"--day": index}}>{index < 5 && <Check size={12} />}</i></div>)}</div><div className="ls-track-summary"><span className="ls-track-summary-icon"><CheckCircle2 size={16} /></span><div><strong>Showing up</strong><small>One day at a time</small></div><TrendingUp className="ls-track-trend" size={16} /></div></div><span className="ls-flow-orbit ls-orbit-three" /></div><div className="ls-flow-label"><span>03</span><h3>Track progress</h3><ArrowRight size={17} /></div></article>
        </div>
      </div></section>
      <section id="about" className="ls-final"><div className="ls-container ls-final-inner"><h2>Your next problem <em>awaits.</em></h2><Link to={authUser ? "/problems" : "/signup"} className="ls-final-link">{authUser ? "Open problems" : "Start practicing"}<span><ArrowRight size={18} /></span></Link></div></section>
    </>
  );
}
