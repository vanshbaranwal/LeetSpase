import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Bookmark, Braces, CheckCircle2, Code2, Heart, History,
  Layers3, ListChecks, Play, ShieldCheck, Terminal,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const features = [
  [Terminal, "Run real code", "Write and execute JavaScript, Python, and Java directly in a focused browser editor."],
  [ListChecks, "Test every solution", "Run your code against multiple test cases and see clear, structured results instantly."],
  [History, "Track submissions", "Review past attempts, execution status, runtime, and test-case performance in one place."],
  [Bookmark, "Build playlists", "Organize problems into personal practice lists for interviews, topics, or revision sessions."],
  [Layers3, "Filter with focus", "Find the right challenge by title, difficulty, and topic without losing momentum."],
  [ShieldCheck, "Validated problems", "Reference solutions are checked against test cases before a problem enters the library."],
];

const languageExamples = {
  PYTHON: {
    label: "Python",
    logo: "python",
    code: `def two_sum(nums, target):
    seen = {}

    for index, number in enumerate(nums):
        needed = target - number
        if needed in seen:
            return [seen[needed], index]
        seen[number] = index`,
  },
  JAVA: {
    label: "Java",
    logo: "java",
    code: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
      int need = target - nums[i];
      if (seen.containsKey(need)) return new int[]{seen.get(need), i};
      seen.put(nums[i], i);
    }
    return new int[]{};
  }
}`,
  },
  JAVASCRIPT: {
    label: "JavaScript",
    logo: "javascript",
    code: `function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
}`,
  },
};

const syntaxColors = {
  comment: "#008000",
  string: "#A31515",
  number: "#098658",
  keyword: "#AF00DB",
  declaration: "#0000FF",
  type: "#267F99",
  function: "#795E26",
  literal: "#0000FF",
};

const commonSyntaxRules = [
  ["string", /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/y],
  ["number", /\b\d+(?:\.\d+)?\b/y],
];

const syntaxRules = {
  PYTHON: [
    ["comment", /#.*/y],
    ...commonSyntaxRules,
    ["declaration", /\b(?:def|class|import|from|as)\b/y],
    ["keyword", /\b(?:for|while|in|if|elif|else|return|and|or|not|is|break|continue|pass)\b/y],
    ["literal", /\b(?:True|False|None)\b/y],
    ["function", /\b[A-Za-z_]\w*(?=\s*\()/y],
  ],
  JAVA: [
    ["comment", /\/\/.*|\/\*.*?\*\//y],
    ...commonSyntaxRules,
    ["declaration", /\b(?:class|public|private|protected|static|final|new|extends|implements)\b/y],
    ["keyword", /\b(?:for|while|if|else|return|break|continue|throw|throws|try|catch)\b/y],
    ["type", /\b(?:void|int|long|double|float|boolean|char|String|Integer|Map|HashMap|List|ArrayList)\b/y],
    ["literal", /\b(?:true|false|null)\b/y],
    ["function", /\b[A-Za-z_]\w*(?=\s*\()/y],
  ],
  JAVASCRIPT: [
    ["comment", /\/\/.*|\/\*.*?\*\//y],
    ...commonSyntaxRules,
    ["declaration", /\b(?:function|const|let|var|class|new|async|await|import|export|from)\b/y],
    ["keyword", /\b(?:for|while|if|else|return|break|continue|of|in|try|catch|throw)\b/y],
    ["type", /\b(?:Map|Set|Promise|Array|Object)\b/y],
    ["literal", /\b(?:true|false|null|undefined)\b/y],
    ["function", /\b[A-Za-z_$][\w$]*(?=\s*\()/y],
  ],
};

const highlightCodeLine = (line, language) => {
  const highlightedParts = [];
  const rules = syntaxRules[language];
  let cursor = 0;
  let plainTextStart = 0;

  while (cursor < line.length) {
    let matchedToken = null;

    for (const [tokenType, pattern] of rules) {
      pattern.lastIndex = cursor;
      const match = pattern.exec(line);

      if (match) {
        matchedToken = { tokenType, value: match[0] };
        break;
      }
    }

    if (!matchedToken) {
      cursor += 1;
      continue;
    }

    if (plainTextStart < cursor) {
      highlightedParts.push(line.slice(plainTextStart, cursor));
    }

    highlightedParts.push(
      <span key={`${cursor}-${matchedToken.tokenType}`} style={{ color: syntaxColors[matchedToken.tokenType] }}>
        {matchedToken.value}
      </span>
    );

    cursor += matchedToken.value.length;
    plainTextStart = cursor;
  }

  if (plainTextStart < line.length) {
    highlightedParts.push(line.slice(plainTextStart));
  }

  return highlightedParts.length > 0 ? highlightedParts : " ";
};

const LanguageLogo = ({ language }) => {
  if (language === "javascript") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="2" fill="currentColor" />
        <text x="12" y="17.25" fill="#080808" fontFamily="Arial, sans-serif" fontSize="9.5" fontWeight="700" textAnchor="middle">JS</text>
      </svg>
    );
  }

  if (language === "python") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M12 2.5H8.2A3.2 3.2 0 0 0 5 5.7v3.1h7v1.7H6.2A4.2 4.2 0 0 0 2 14.7v1.1A4.2 4.2 0 0 0 6.2 20H8v-3.2a3.3 3.3 0 0 1 3.3-3.3h4.5A3.2 3.2 0 0 0 19 10.3V5.7a3.2 3.2 0 0 0-3.2-3.2H12Z" fill="currentColor" />
        <path d="M12 21.5h3.8a3.2 3.2 0 0 0 3.2-3.2v-3.1h-7v-1.7h5.8a4.2 4.2 0 0 0 4.2-4.2V8.2A4.2 4.2 0 0 0 17.8 4H16v3.2a3.3 3.3 0 0 1-3.3 3.3H8.2A3.2 3.2 0 0 0 5 13.7v4.6a3.2 3.2 0 0 0 3.2 3.2H12Z" fill="currentColor" opacity="0.58" />
        <circle cx="8.5" cy="5.8" r="1" fill="#080808" />
        <circle cx="15.5" cy="18.2" r="1" fill="#080808" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.4 16.5h7.7a2 2 0 0 0 2-2v-3h-11v3a2 2 0 0 0 1.3 2Z" strokeWidth="1.5" />
      <path d="M18.1 12h1a1.8 1.8 0 0 1 0 3.6h-1.6M7.6 19c2.8 1 7.2 1 10 0M9 22c2 .6 5.8.6 7.8 0" strokeWidth="1.35" />
      <path d="M10.2 9c-2.5-2.7 3.8-3.2 1-6M14 9c3-2.4-2.1-3.1 1.2-6.5" strokeWidth="1.45" />
    </svg>
  );
};

const HomePage = () => {
  const { authUser } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState("PYTHON");
  const activeExample = languageExamples[selectedLanguage];

  return (
    <main className="w-full overflow-hidden text-white">
      <section className="relative mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Your workspace to code,<span className="block text-white/40">practice, and prove.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            LeetSpase is a clutter-free coding workspace for solving curated problems, running test cases, tracking submissions, and building personal playlists.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {authUser ? (
              <Link to="/problems" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">Explore problems <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <Link to="/problems" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">Start solving free <ArrowRight className="h-4 w-4" /></Link>
            )}
            <a href="#features" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-white/75 transition-colors hover:border-white/30 hover:text-white">See what’s inside</a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/40">
            {["Multi-language execution", "Real test cases", "Progress tracking"].map((item) => (
              <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-white/70" /> {item}</span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 rounded-full bg-white/[0.035] blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/50">
            <div className="flex border-b border-white/10 p-1.5 sm:p-2">
              {Object.entries(languageExamples).map(([key, language]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedLanguage(key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-medium transition-colors sm:text-sm ${selectedLanguage === key ? "bg-[#1c1c1c] text-white" : "text-white/40 hover:text-white/75"}`}
                >
                  <span className={selectedLanguage === key ? "text-white" : "text-white/40"}>
                    <LanguageLogo language={language.logo} />
                  </span>
                  <span className="hidden sm:inline">{language.label}</span>
                </button>
              ))}
            </div>

            <div className="relative m-2 grid min-h-80 grid-cols-[42px_1fr] overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] font-mono text-xs sm:m-3 sm:text-sm">
              <div className="select-none border-r border-white/5 bg-black/75 py-6 text-center leading-7 text-white/20">{activeExample.code.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}</div>
              <pre key={selectedLanguage} className="landing-code-float overflow-auto bg-[#e6e6e6] p-6 leading-7 text-[#1c1c1c]"><code>{activeExample.code.split("\n").map((line, index) => <span key={index} className="block min-h-7">{highlightCodeLine(line, selectedLanguage)}</span>)}</code></pre>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-black/75 px-5 py-4">
              <span className="flex items-center gap-2 text-xs text-white/40"><Terminal className="h-4 w-4" /> {activeExample.label}</span>
              <button
                type="button"
                disabled
                title="Sign in and open a problem to run code"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black opacity-40"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Run code
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 border-y border-white/10 bg-black/25 px-6 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Everything in one workspace</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Practice with purpose.</h2><p className="mt-4 text-white/50">Every feature is built to reduce friction between choosing a problem and understanding your solution.</p></div>
          <div className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {features.map(([Icon, title, description], index) => (
              <article key={title} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.045]">
                <div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05]"><Icon className="h-5 w-5 text-white/80" /></div><span className="font-mono text-xs text-white/20">0{index + 1}</span></div>
                <h3 className="mt-7 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 sm:py-24 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">A simple loop</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Learn by doing.</h2><p className="mt-5 max-w-md leading-7 text-white/50">No complicated setup. Choose a challenge, write your approach, and learn from every run.</p></div>
          <div className="space-y-3">
            {[["01", "Choose", "Search by topic or difficulty and pick the challenge that fits today’s goal."], ["02", "Code", "Work inside the integrated editor with starter code for your chosen language."], ["03", "Run", "Execute against real inputs and inspect output, errors, runtime, and test results."], ["04", "Improve", "Review submissions, revisit playlists, and turn weak topics into strengths."]].map(([step, title, description]) => (
              <div key={step} className="grid gap-4 rounded-2xl border border-white/10 p-5 sm:grid-cols-[52px_120px_1fr] sm:items-center"><span className="font-mono text-sm text-white/30">{step}</span><span className="font-semibold">{title}</span><span className="text-sm leading-6 text-white/45">{description}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section id="problems" className="scroll-mt-28 border-y border-white/10 bg-black/20 px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">Problem library</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Your next challenge is here.</h2><p className="mt-4 text-white/50">Filter, solve, save, and return stronger.</p></div>
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#111111]/90 p-8 text-center sm:p-12"><Braces className="mx-auto h-10 w-10 text-white/60" /><h3 className="mt-5 text-2xl font-semibold">Enter your coding space</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">{authUser ? "Continue to the problem library and choose your next challenge." : "Create an account to unlock the curated problem library, code execution, submissions, and personal playlists."}</p><Link to={authUser ? "/problems" : "/signup"} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">{authUser ? "Open problems" : "Create your account"} <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 sm:py-24 lg:py-28">
        <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/90 lg:grid-cols-2">
          <div className="p-8 sm:p-12"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/40">About LeetSpase</p><h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">A quieter place to become a stronger developer.</h2></div>
          <div className="border-t border-white/10 p-8 text-sm leading-7 text-white/50 sm:p-12 lg:border-l lg:border-t-0">LeetSpase brings problem discovery, code execution, automated testing, submission tracking, and custom playlists into one deliberate workflow. It is designed for students and developers preparing for interviews or strengthening their fundamentals—one solved problem at a time.</div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Code2 className="h-4 w-4" /> © {new Date().getFullYear()} LeetSpase</div><p className="flex items-center gap-1.5 sm:justify-end">Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-label="love" /> by vanshbaranwal</p></div>
      </footer>
    </main>
  );
};

export default HomePage;
