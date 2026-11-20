import { ArrowUpRight, Code2, GitBranch, Mail, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import "./LandingFooter.css";

export default function LandingFooter({ authUser }) {
  return (
    <footer id="footer" className="ls-footer">
      <div className="ls-footer-inner">
        <div className="ls-footer-main">
          <div className="ls-footer-brand">
            <Link to="/" className="ls-footer-logo" aria-label="LeetSpase home">
              <Code2 aria-hidden="true" />
              <span>LeetSpase</span>
            </Link>
            <p>Practice code. Solve together.</p>
          </div>

          <nav className="ls-footer-column" aria-label="Platform">
            <h2>Platform</h2>
            <Link to="/problems">Problems</Link>
            <Link to="/spases">Spases</Link>
            <a href="/#features">Features</a>
          </nav>

          <nav className="ls-footer-column" aria-label="Explore">
            <h2>Explore</h2>
            <a href="/#how-it-works">How it works</a>
            {authUser ? (
              <Link to="/profile">Your profile</Link>
            ) : (
              <>
                <Link to="/signup">Create an account</Link>
                <Link to="/login">Sign in</Link>
              </>
            )}
          </nav>

          <div className="ls-footer-column ls-footer-connect">
            <h2>Connect</h2>
            <a href="https://github.com/vanshbaranwal/ProblemX" target="_blank" rel="noopener noreferrer">
              <GitBranch aria-hidden="true" />
              <span>GitHub</span>
              <ArrowUpRight aria-hidden="true" className="ls-footer-external" />
            </a>
            <a href="https://github.com/vanshbaranwal/ProblemX/issues" target="_blank" rel="noopener noreferrer">
              <MessageSquareText aria-hidden="true" />
              <span>Report an issue</span>
              <ArrowUpRight aria-hidden="true" className="ls-footer-external" />
            </a>
          </div>
        </div>

        <div className="ls-footer-bottom">
          <p>© {new Date().getFullYear()} LeetSpase. All rights reserved.</p>
          <div className="ls-footer-socials" aria-label="Social links">
            <a href="mailto:vanshveerbaranwal@gmail.com" aria-label="Email Vansh at vanshveerbaranwal@gmail.com" title="Email Vansh">
              <Mail aria-hidden="true" />
            </a>
            <a href="https://x.com/VanshhBaranwal" target="_blank" rel="noopener noreferrer" aria-label="Vansh on X" title="Vansh on X">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.7 3h3.1l-6.8 7.8L21 21h-6.3l-4.9-6.4L4.3 21H1.2l7.3-8.4L1 3h6.5l4.4 5.8L16.7 3Zm-1.1 16.2h1.7L6.6 4.7H4.8l10.8 14.5Z" fill="currentColor" /></svg>
            </a>
            <a href="https://www.linkedin.com/in/vanshbaranwal/" target="_blank" rel="noopener noreferrer" aria-label="Vansh on LinkedIn" title="Vansh on LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.2 3.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3.4 9h3.6v11.6H3.4V9Zm5.9 0h3.5v1.6c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.4 4.5 5.5v6.4h-3.6v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8H9.3V9Z" fill="currentColor" /></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="ls-footer-watermark" aria-hidden="true">LeetSpase</div>
    </footer>
  );
}
