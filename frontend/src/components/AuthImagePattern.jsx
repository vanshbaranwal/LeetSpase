import { Code, Terminal, FileCode, Braces } from "lucide-react"
import { useEffect, useState } from "react"



const CodeBackground = ({ title, subtitle }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  // Code snippets to display in the background
  const codeSnippets = [
    `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    `class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function reverseList(head) {
  let prev = null;
  let current = head;
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  return prev;
}`,
    `function isValid(s) {
  const stack = [];
  const map = {
    '(': ')',
    '{': '}',
    '[': ']'
  };
  
  for (let i = 0; i < s.length; i++) {
    if (s[i] in map) {
      stack.push(s[i]);
    } else {
      const last = stack.pop();
      if (map[last] !== s[i]) return false;
    }
  }
  
  return stack.length === 0;
}`,
  ]

  // Rotate through code snippets
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % codeSnippets.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [codeSnippets.length])

  return (
    <div className="relative hidden min-h-dvh flex-col items-center justify-center overflow-hidden border-l border-white/10 bg-[#090909] p-12 text-white lg:flex">
      {/* Animated code symbols in background */}
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute top-[10%] left-[15%] animate-pulse">
          <Braces size={40} />
        </div>
        <div className="absolute top-[30%] left-[80%] animate-pulse delay-300">
          <FileCode size={50} />
        </div>
        <div className="absolute top-[70%] left-[20%] animate-pulse delay-700">
          <Terminal size={45} />
        </div>
        <div className="absolute top-[60%] left-[75%] animate-pulse delay-500">
          <Code size={55} />
        </div>
        <div className="absolute top-[85%] left-[45%] animate-pulse delay-200">
          <Braces size={35} />
        </div>
        <div className="absolute top-[15%] left-[60%] animate-pulse delay-100">
          <Terminal size={30} />
        </div>
      </div>

      <div className="z-10 flex max-w-md flex-col items-center">
        {/* Code editor mockup */}
        <div className="mb-9 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/50">
          {/* Editor header */}
          <div className="flex items-center border-b border-white/[0.08] bg-[#151515] px-4 py-3">
            <div className="flex space-x-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="font-mono text-xs text-white/45">problem.js</div>
          </div>

          {/* Code content */}
          <div className="relative h-64 overflow-hidden p-5 font-mono text-xs sm:text-sm">
            <pre className="whitespace-pre-wrap leading-6 text-emerald-300/75 transition-opacity duration-1000">
              {codeSnippets[activeIndex]}
            </pre>

            {/* Blinking cursor */}
            <div className="absolute bottom-4 right-4 w-2 h-4 bg-white animate-blink"></div>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            <Code className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Text content */}
        <h2 className="mb-3 text-center text-2xl font-semibold tracking-[-0.035em]">{title}</h2>
        <p className="text-center text-sm leading-6 text-white/40">{subtitle}</p>
      </div>
    </div>
  )
}

export default CodeBackground
