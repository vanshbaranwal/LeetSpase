import { ArrowUpRight, Check, Eye, PencilLine, Search, UsersRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import SpaseFeaturePreview from "./SpaseFeaturePreview";
import "./LandingFeatures.css";

const featuredProblems = [
  { title: "Add Two Numbers", topics: "Basics · Math · Input/Output", difficulty: "Easy" },
  { title: "Array Minimum and Maximum", topics: "Basics · Arrays · Traversal", difficulty: "Easy" },
  { title: "Best Contiguous Segment Sum", topics: "Arrays · Dynamic Programming · Kadane Algorithm", difficulty: "Medium" },
  { title: "Burst Balloons for Maximum Score", topics: "Dynamic Programming · Intervals · Optimization", difficulty: "Hard" },
  { title: "Character Frequency", topics: "Basics · Strings · Counting", difficulty: "Easy" },
];

export default function LandingFeatures({ authUser }) {
  return (
    <section id="features" className="ls-bento" aria-labelledby="ls-bento-title">
      <div className="ls-container">
        <div className="ls-bento-heading">
          <h2 id="ls-bento-title">Better when you solve <span>together.</span></h2>
        </div>

        <div className="ls-bento-grid">
          <article className="ls-bento-card ls-bento-spase">
            <div className="ls-bento-spase-copy">
              <span className="ls-bento-kicker"><UsersRound aria-hidden="true" /> Spases</span>
              <h3>Same code. Same moment.</h3>
              <p>Up to five people can work on one problem with live code and cursors.</p>
              <Link to={authUser ? "/spases" : "/signup"} className="ls-bento-link">
                {authUser ? "Open Spases" : "Create an account"} <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <div className="ls-bento-spase-visual"><SpaseFeaturePreview /></div>
          </article>

          <article className="ls-bento-card ls-bento-access">
            <div className="ls-bento-card-copy">
              <span className="ls-bento-kicker">Host controls</span>
              <h3>You decide who edits.</h3>
              <p>Let guests write with you, or have them follow in view-only mode.</p>
            </div>
            <div className="ls-bento-access-demo" aria-hidden="true">
              <div className="ls-bento-access-label">Guest access</div>
              <div className="ls-bento-access-options">
                <span className="is-selected"><PencilLine /> Editor</span>
                <span><Eye /> View only</span>
              </div>
              <div className="ls-bento-access-foot"><span className="ls-bento-access-dot" />Set before your guests join</div>
            </div>
          </article>

          <article className="ls-bento-card ls-bento-results">
            <div className="ls-bento-card-copy">
              <span className="ls-bento-kicker">Shared results</span>
              <h3>One run. Everyone sees it.</h3>
              <p>Run and Submit show the same status and result to the whole Spase.</p>
            </div>
            <div className="ls-bento-result-demo" aria-hidden="true">
              <div className="ls-bento-result-top"><span className="ls-bento-result-pulse" /> A member ran the code <span>just now</span></div>
              <div className="ls-bento-result-progress"><i /></div>
              <div className="ls-bento-result-verdict"><span><Check /></span><strong>All test cases passed</strong><small>3 / 3</small></div>
            </div>
          </article>

          <article className="ls-bento-card ls-bento-library">
            <div className="ls-bento-library-copy">
              <span className="ls-bento-kicker">Problem library</span>
              <h3>Choose your next challenge.</h3>
              <p>Search by topic and difficulty, then bring a problem into your Spase.</p>
              <Link to="/problems" className="ls-bento-link">Browse problems <ArrowUpRight aria-hidden="true" /></Link>
            </div>
            <div className="ls-bento-library-demo" aria-hidden="true">
              <div className="ls-bento-picker-title"><strong>Choose a problem</strong><X /></div>
              <div className="ls-bento-picker-controls">
                <div className="ls-bento-search"><Search /><span>Search by title or topic</span></div>
                <div className="ls-bento-filters"><span className="is-selected">All</span><span>Easy</span><span>Medium</span><span>Hard</span></div>
              </div>
              <div className="ls-bento-problem-list">
                {featuredProblems.map((problem, index) => (
                  <div className="ls-bento-problem" key={problem.title} style={{ "--problem-order": index }}>
                    <span className="ls-bento-problem-copy"><strong>{problem.title}</strong><small>{problem.topics}</small></span>
                    <span className={`ls-bento-difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
