import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Circle, Code2, Cpu, Database, Pause, Play, RotateCcw, Server, TerminalSquare } from "lucide-react";

const phases = [
  { label: "Write a solution", duration: 2800, detail: "The editor holds your code before it’s sent for execution." },
  { label: "Run sample cases", duration: 900, detail: "The API validates the request and loads the problem’s sample cases." },
  { label: "Run sample cases", duration: 720, detail: "CodeBox runs the first sample and returns its result." },
  { label: "Run sample cases", duration: 720, detail: "The second sample passes." },
  { label: "Samples passed", duration: 1350, detail: "Run previews the results without saving a submission." },
  { label: "Submit solution", duration: 1250, detail: "The API loads the full test suite, including hidden cases." },
  { label: "Judge the full suite", duration: 1750, detail: "CodeBox evaluates the batch while the API polls for results." },
  { label: "Save the verdict", duration: 1250, detail: "The API saves the submission and test results in PostgreSQL." },
  { label: "Accepted", detail: "The solution passed the full suite and the problem is marked solved." },
];

const samples = [
  { input: "3 7", output: "10" },
  { input: "-4 9", output: "5" },
  { input: "0 0", output: "0" },
];

const services = [
  { title: "LeetSpase API", description: "Validate & load cases", icon: Server },
  { title: "CodeBox", description: "Execute & judge", icon: Cpu },
  { title: "PostgreSQL", description: "Save submission", icon: Database },
];

export default function WorkspaceDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visible, setVisible] = useState(false);
  const demoRef = useRef(null);
  const phase = phases[step];
  const accepted = step === phases.length - 1;
  const submitting = step >= 5;
  const samplesPassed = Math.max(0, Math.min(3, step - 1));
  const sample = samples[Math.max(0, samplesPassed - 1)];
  const activeService = step === 1 || step === 5 ? 0 : (step >= 2 && step <= 4) || step === 6 ? 1 : step === 7 ? 2 : -1;
  const motionRunning = playing && visible && !accepted;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(demoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!motionRunning) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), phase.duration);
    return () => window.clearTimeout(timer);
  }, [motionRunning, phase]);

  function restart() {
    setStep(0);
    setPlaying(true);
  }

  return (
    <div ref={demoRef} className="ls-stage ls-demo" data-playing={motionRunning} data-step={step}>
      <div className="ls-demo-aurora" aria-hidden="true" />
      <div className="ls-window ls-demo-window" aria-hidden="true">
        <div className="ls-work-bar">
          <div className="ls-work-brand"><Code2 size={17} /><strong>LeetSpase</strong><span className="ls-work-divider" /><span className="ls-work-crumb">Problems <span>/</span> Add Two Numbers</span></div>
          <div className="ls-work-actions">
            <span className="ls-work-language"><span /> Python</span>
            <span className={`ls-work-run ${step >= 1 && step < 5 ? "ls-action-lit" : ""}`}>Run</span>
            <span className={`ls-work-submit ${submitting && !accepted ? "ls-action-lit" : ""}`}>Submit</span>
          </div>
        </div>
        <div className="ls-work-layout">
          <div className="ls-work-problem">
            <div className="ls-work-tabs"><span className={accepted ? "" : "active"}>Description</span><span>Editorial</span><span className={accepted ? "active" : ""}>Submissions</span></div>
            <div className="ls-work-description">
              <div className="ls-work-badges"><span>Easy</span><span>Basics</span><span>Math</span></div>
              <h3>Add Two Numbers<span>.</span></h3>
              <p>Given two integers, return their sum.</p>
              <div className="ls-work-example"><span>EXAMPLE</span><div><small>Input</small><code>3 7</code></div><div><small>Output</small><code>10</code></div></div>
              {accepted && <div className="ls-demo-accepted"><Check size={15} /> Accepted · Added to your solved problems</div>}
            </div>
          </div>
          <div className="ls-work-editor">
            <div className="ls-code-header"><span><TerminalSquare size={15} /> Code <i>·</i> <small>PYTHON</small></span><span>solution.py</span></div>
            <div className="ls-code-body">
              <div className="ls-code-lines">{[1, 2, 3, 4, 5, 6, 7].map((line) => <span key={line}>{line}</span>)}</div>
              <div className="ls-code-content">
                <div><em>import</em> sys</div><div>&nbsp;</div>
                <div><em>def</em> <b>solve</b>(data):</div>
                <div className="ls-demo-type ls-demo-type-first">{"    "}a, b = <b>map</b>(<b>int</b>, data.<b>split</b>())</div>
                <div className="ls-demo-type ls-demo-type-second">{"    "}<em>return</em> a + b<span className="ls-demo-caret" /></div>
                <div>&nbsp;</div><div><b>print</b>(solve(sys.stdin.read()))</div>
              </div>
            </div>
            <div className="ls-test-panel">
              <div className="ls-test-heading"><span><Check size={14} /> {submitting ? "Submission result" : "Test cases"}</span><small>{submitting ? "FULL SUITE" : "SAMPLE CASES"}</small></div>
              {submitting ? <div className="ls-demo-verdict" data-accepted={accepted}><span>{accepted ? <Check size={18} /> : <Circle size={18} />}</span>{accepted ? "Accepted" : phase.label}</div> : <>
                <div className="ls-test-tabs">{samples.map((item, index) => <span key={item.input} className={index < samplesPassed ? "ls-demo-passed" : ""}>{index < samplesPassed && <Check size={11} />} Case {index + 1}</span>)}</div>
                <div className="ls-test-values"><div><small>INPUT</small><code>{sample.input}</code></div><div><small>EXPECTED OUTPUT</small><code>{sample.output}</code></div></div>
              </>}
            </div>
          </div>
        </div>
      </div>
      <div className="ls-demo-pipeline" aria-label="Backend steps">
        {services.map(({ title, description, icon: Icon }, index) => (
          <div key={title} className="ls-demo-hop" data-active={activeService === index} data-done={accepted || activeService > index}>
            <span className="ls-demo-hop-icon"><Icon size={18} /></span>
            <div><strong>{title}</strong><small>{description}</small></div>
            {index < services.length - 1 && <ArrowRight className="ls-demo-hop-arrow" size={15} aria-hidden="true" />}
          </div>
        ))}
      </div>
      <div className="ls-demo-player">
        <div className="ls-demo-status" aria-live="polite" aria-atomic="true"><strong>{phase.label}</strong><span>{phase.detail}</span></div>
        <div className="ls-demo-controls">
          <button type="button" className="ls-demo-play" onClick={accepted ? restart : () => setPlaying(!playing)} aria-label={accepted ? "Replay walkthrough" : playing ? "Pause walkthrough" : "Play walkthrough"}>
            {accepted ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
            <span>{accepted ? "Replay" : playing ? "Pause" : "Play"}</span>
          </button>
          {!accepted && step > 0 && <button type="button" onClick={restart} aria-label="Restart walkthrough"><RotateCcw size={16} /></button>}
        </div>
        <div className="ls-demo-progress" aria-hidden="true"><i style={{ width: `${((step + 1) / phases.length) * 100}%` }} /></div>
      </div>
    </div>
  );
}
