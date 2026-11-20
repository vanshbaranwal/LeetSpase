import { Check, Code2, Copy, TerminalSquare, Users } from "lucide-react";
import "./SpaseFeaturePreview.css";

const codeLines = [
  <><span className="ls-sfp-keyword">def</span> <span className="ls-sfp-function">two_sum</span>(nums, target):</>,
  <>{"    "}seen = {"{}"}</>,
  <>{"    "}<span className="ls-sfp-keyword">for</span> i, value <span className="ls-sfp-keyword">in</span> <span className="ls-sfp-function">enumerate</span>(nums):</>,
  <>{"        "}need = target - value<span className="ls-sfp-caret ls-sfp-caret-amber"><span>Ayan</span></span></>,
  <>{"        "}<span className="ls-sfp-keyword">if</span> need <span className="ls-sfp-keyword">in</span> seen:</>,
  <>{"            "}<span className="ls-sfp-keyword">return</span> [seen[need], i]<span className="ls-sfp-caret ls-sfp-caret-blue"><span>Yogii</span></span></>,
  <>{"        "}seen[value] = i</>,
];

export default function SpaseFeaturePreview() {
  return (
    <div className="ls-sfp" aria-hidden="true">
      <div className="ls-sfp-window">
        <div className="ls-sfp-topbar">
          <div className="ls-sfp-identity"><Code2 size={16} /><strong>Spase</strong><span className="ls-sfp-invite">Q7M4P <Copy size={11} /></span></div>
          <span className="ls-sfp-count"><Users size={13} /> 4/5</span>
        </div>

        <div className="ls-sfp-session">
          <div className="ls-sfp-problem"><small>PROBLEM</small><strong>Two Sum</strong></div>
          <div className="ls-sfp-people">
            <span className="ls-sfp-person ls-sfp-host"><i>G</i><b>Gautam</b><em>H</em></span>
            <span className="ls-sfp-person ls-sfp-mint"><i>R</i><b>Rudraksha</b></span>
            <span className="ls-sfp-person ls-sfp-amber"><i>A</i><b>Ayan</b></span>
            <span className="ls-sfp-person ls-sfp-blue"><i>Y</i><b>Yogii</b></span>
          </div>
        </div>

        <div className="ls-sfp-editor">
          <div className="ls-sfp-editor-head"><span><TerminalSquare size={13} /> Code <i>·</i> PYTHON</span><span>Shared editor</span></div>
          <div className="ls-sfp-code">
            {codeLines.map((line, index) => (
              <div className={`ls-sfp-line${index === 3 ? " ls-sfp-line-active" : ""}`} key={index}>
                <span className="ls-sfp-number">{index + 1}</span><code>{line}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="ls-sfp-result">
          <span className="ls-sfp-result-icon"><Check size={15} strokeWidth={2.5} /></span>
          <span><strong>3/3 sample cases passed</strong><small>Run by Rudraksha · visible to everyone</small></span>
          <span className="ls-sfp-result-sync">SYNCED</span>
        </div>
      </div>
    </div>
  );
}
