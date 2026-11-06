import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Code2, Heart, Play, Terminal,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import LanguageBrandIcon from "../components/LanguageBrandIcon";
import LandingShowcase from "../components/LandingShowcase";
import HeroBackdrop from "../components/HeroBackdrop";

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
      <section className="ls-hero-motion relative mx-auto grid min-h-[calc(100dvh-96px)] max-w-7xl items-center gap-12 px-6 py-14 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8 lg:py-16">
        <HeroBackdrop />
        <div className="landing-enter max-w-2xl">
          <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]">
            <span className="block">Your place to code.</span>
            <span className="ls-hero-highlight mt-3 block text-[#c4ceff]">Practice. Improve. Prove.</span>
          </h1>
          <div className="mt-9">
            {authUser ? (
              <Link to="/problems" className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#a9b8ff] py-2 pl-6 pr-2 text-sm font-semibold text-[#14213d] transition-colors duration-200 hover:bg-[#c4ceff]">
                Continue solving
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.08] transition-colors duration-200 group-hover:bg-black/[0.12]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <Link to="/problems" className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#a9b8ff] py-2 pl-6 pr-2 text-sm font-semibold text-[#14213d] transition-colors duration-200 hover:bg-[#c4ceff]">
                Start solving
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/[0.08] transition-colors duration-200 group-hover:bg-black/[0.12]">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="ls-hero-editor relative mx-auto w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111e36] shadow-2xl shadow-black/50">
            <div className="flex border-b border-white/10 p-1.5 sm:p-2">
              {Object.entries(languageExamples).map(([key, language]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedLanguage(key)}
                  aria-label={language.label}
                  aria-pressed={selectedLanguage === key}
                  className={`ls-hero-language flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-medium transition-colors sm:text-sm ${selectedLanguage === key ? languageTabActiveStyles[key] : "text-white/40 hover:bg-white/[0.035] hover:text-white/75"}`}
                >
                  <LanguageBrandIcon language={language.logo} />
                  <span className="hidden sm:inline">{language.label}</span>
                </button>
              ))}
            </div>

            <div className="relative m-2 grid min-h-80 grid-cols-[42px_1fr] overflow-hidden rounded-xl border border-white/10 bg-[#1d304f] font-mono text-xs sm:m-3 sm:text-sm">
              <div className="select-none border-r border-white/5 bg-black/75 py-6 text-center leading-7 text-white/20">{activeExample.code.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}</div>
              <pre key={selectedLanguage} className="landing-code-float overflow-auto bg-[#e8e0d3] p-6 leading-7 text-[#1d304f]"><code>{activeExample.code.split("\n").map((line, index) => <span key={index} className="ls-hero-code-line block min-h-7" style={{ "--line": index }}>{highlightCodeLine(line, selectedLanguage)}</span>)}</code></pre>
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

      <LandingShowcase authUser={authUser} />

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Code2 className="h-4 w-4" /> © {new Date().getFullYear()} LeetSpase</div><p className="flex items-center gap-1.5 sm:justify-end">Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" aria-label="love" /> by vanshbaranwal</p></div>
      </footer>
    </main>
  );
};

export default HomePage;
