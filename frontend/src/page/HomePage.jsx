import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Code2, Heart, Play, Terminal,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import LanguageBrandIcon from "../components/LanguageBrandIcon";

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

const languageTabActiveStyles = {
  PYTHON: "bg-[#3776ab]/15 text-white",
  JAVA: "bg-[#e76f00]/15 text-white",
  JAVASCRIPT: "bg-[#f7df1e]/10 text-white",
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

const HomePage = () => {
  const { authUser } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState("PYTHON");
  const activeExample = languageExamples[selectedLanguage];

  return (
    <main className="w-full overflow-hidden text-white">
      <section className="relative mx-auto grid min-h-[calc(100dvh-96px)] max-w-7xl items-center gap-12 px-6 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]">
            <span className="block">Your place to code.</span>
            <span className="mt-3 block text-white/45">Practice. Improve. Prove.</span>
          </h1>
          <div className="mt-9">
            {authUser ? (
              <Link to="/problems" className="group inline-flex h-12 items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.07)] transition-[background-color,box-shadow] duration-200 hover:bg-white/90 hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]">
                Continue solving
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.08] transition-colors duration-200 group-hover:bg-black/[0.12]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <Link to="/problems" className="group inline-flex h-12 items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.07)] transition-[background-color,box-shadow] duration-200 hover:bg-white/90 hover:shadow-[0_12px_32px_rgba(255,255,255,0.1)]">
                Start solving
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.08] transition-colors duration-200 group-hover:bg-black/[0.12]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}
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
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-medium transition-colors sm:text-sm ${selectedLanguage === key ? languageTabActiveStyles[key] : "text-white/40 hover:bg-white/[0.035] hover:text-white/75"}`}
                >
                  <LanguageBrandIcon language={language.logo} />
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

      <section id="features" className="scroll-mt-28 border-y border-white/10 bg-black/20 px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">The essentials</p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Everything you need. Nothing you don’t.</h2>
          </div>

          <div className="border-t border-white/10">
            {[
              ["Problem library", "Curated challenges, language tracks, and playlists."],
              ["Code execution", "Python, Java, and JavaScript with real test cases."],
              ["Progress", "Submissions, streaks, and solved problems in one place."],
            ].map(([title, description]) => (
              <div key={title} className="grid gap-2 border-b border-white/10 py-6 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-8 sm:py-7">
                <h3 className="font-semibold text-white/90">{title}</h3>
                <p className="text-sm leading-6 text-white/40">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20 text-center sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">The loop</p>
        <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
          Choose. <span className="text-white/35">Code.</span> Improve.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-white/40">One focused workflow from problem to progress.</p>
      </section>

      <section id="about" className="scroll-mt-28 border-t border-white/10 px-6 py-20 sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">LeetSpase</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">A quieter way to practice coding.</h2>
          </div>
          <Link
            to={authUser ? "/problems" : "/signup"}
            className="inline-flex w-fit items-center gap-2 border-b border-white/40 pb-1 text-sm font-semibold text-white transition-colors hover:border-white"
          >
            {authUser ? "Open problems" : "Start practicing"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Code2 className="h-4 w-4" /> © {new Date().getFullYear()} LeetSpase</div><p className="flex items-center gap-1.5 sm:justify-end">Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-label="love" /> by vanshbaranwal</p></div>
      </footer>
    </main>
  );
};

export default HomePage;
