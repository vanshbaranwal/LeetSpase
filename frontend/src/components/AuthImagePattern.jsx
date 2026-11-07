import { Check, Terminal } from "lucide-react";
import HeroBackdrop from "./HeroBackdrop";

export default function AuthImagePattern() {
  return (
    <aside className="ls-auth-visual">
      <HeroBackdrop />
      <div className="ls-auth-visual-inner">
        <p className="ls-auth-visual-label">THE PRACTICE SPACE</p>
        <h2>One problem.<br /><em>One step forward.</em></h2>
        <p>Write a solution, run your tests, and see your progress add up.</p>

        <div className="ls-auth-editor" aria-hidden="true">
          <div className="ls-auth-editor-header"><Terminal size={17} /> solution.py <span>PYTHON</span></div>
          <div className="ls-auth-editor-code">
            <span><i>1</i><code><em>def</em> add(a, b):</code></span>
            <span><i>2</i><code>{"    "}<em>return</em> a + b</code></span>
            <span><i>3</i><code>{" "}</code></span>
            <span><i>4</i><code><b>assert</b> add(<strong>3</strong>, <strong>7</strong>) == <strong>10</strong></code></span>
          </div>
          <div className="ls-auth-editor-result"><span><Check size={16} /> Accepted</span><small>Sample test passed</small></div>
        </div>
      </div>
    </aside>
  );
}
