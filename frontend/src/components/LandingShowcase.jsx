import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspaceDemo from "./WorkspaceDemo";
import LandingFeatures from "./LandingFeatures";
import "./LandingShowcase.css";
import "./LandingMotion.css";

export default function LandingShowcase({ authUser }) {
  return (
    <>
      <section id="how-it-works" className="ls-showcase">
        <div className="ls-container">
          <div className="ls-section-intro ls-demo-intro">
            <h2>An illustrative preview of <em>LeetSpase</em></h2>
          </div>
          <WorkspaceDemo />
        </div>
      </section>

      <LandingFeatures authUser={authUser} />

      <section id="about" className="ls-final">
        <div className="ls-container ls-final-inner">
          <h2>Your next problem <em>awaits.</em></h2>
          <Link to={authUser ? "/problems" : "/signup"} className="ls-final-link">
            {authUser ? "Open problems" : "Start practicing"}
            <span><ArrowRight size={18} /></span>
          </Link>
        </div>
      </section>
    </>
  );
}
