import { useForm, useFieldArray, Controller } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod"
import {
  Plus,
  Trash2,
  Code2,
  FileText,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Download,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Tags,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useEffect, useState } from 'react';
import {axiosInstance} from "../lib/axios"
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom";

const isYoutubeVideoUrl = (value) => {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "youtu.be") return Boolean(url.pathname.slice(1).split("/")[0]);
    if (hostname !== "youtube.com" && !hostname.endsWith(".youtube.com")) return false;

    return (
      (url.pathname === "/watch" && Boolean(url.searchParams.get("v"))) ||
      /^\/(shorts|embed|live)\/[^/]+/.test(url.pathname)
    );
  } catch {
    return false;
  }
};

const problemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .min(1, "At least one tag is required"),
  constraints: z.string().min(1, "Constraints are required"),
  hints: z.string().optional(),
  intuition: z.string().optional(),
  editorial: z.string().optional(),
  walkthrough: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  youtubeUrl: z.string().trim().refine(
    (value) => !value || isYoutubeVideoUrl(value),
    "Enter a valid YouTube video URL"
  ).optional(),
  testcases: z
    .array(
      z.object({
        input: z.string().min(1, "Input is required"),
        output: z.string().min(1, "Output is required"),
      })
    )
    .min(1, "At least one test case is required"),
  examples: z.object({
    JAVASCRIPT: z.object({
      input: z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
      explanation: z.string().optional(),
    }),
    PYTHON: z.object({
      input: z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
      explanation: z.string().optional(),
    }),
    JAVA: z.object({
      input: z.string().min(1, "Input is required"),
      output: z.string().min(1, "Output is required"),
      explanation: z.string().optional(),
    }),
  }),
  codeSnippet: z.object({
    JAVASCRIPT: z.string().min(1, "JavaScript code snippet is required"),
    PYTHON: z.string().min(1, "Python code snippet is required"),
    JAVA: z.string().min(1, "Java solution is required"),
  }),
  referenceSolutions: z.object({
    JAVASCRIPT: z.string().min(1, "JavaScript solution is required"),
    PYTHON: z.string().min(1, "Python solution is required"),
    JAVA: z.string().min(1, "Java solution is required"),
  }),
});


const sampledpData = {
  title: "Climbing Stairs",
  category: "dp", // Dynamic Programming
  description:
    "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
  difficulty: "EASY",
  tags: ["Dynamic Programming", "Math", "Memoization"],
  constraints: "1 <= n <= 45",
  hints:
    "To reach the nth step, you can either come from the (n-1)th step or the (n-2)th step.",
  intuition:
    "Every way to reach step n must come from either step n - 1 or step n - 2. That means the answer can be built from the answers to those two smaller states.",
  editorial:
    "This is a classic dynamic programming problem. The number of ways to reach the nth step is the sum of the number of ways to reach the (n-1)th step and the (n-2)th step, forming a Fibonacci-like sequence.",
  walkthrough:
    "For n = 4, start with one way to stand at step 0 and one way to reach step 1. The next totals become 2, 3, and finally 5 ways to reach step 4.",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  testcases: [
    {
      input: "2",
      output: "2",
    },
    {
      input: "3",
      output: "3",
    },
    {
      input: "4",
      output: "5",
    },
  ],
  examples: {
    JAVASCRIPT: {
      input: "n = 2",
      output: "2",
      explanation:
        "There are two ways to climb to the top:\n1. 1 step + 1 step\n2. 2 steps",
    },
    PYTHON: {
      input: "n = 3",
      output: "3",
      explanation:
        "There are three ways to climb to the top:\n1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step",
    },
    JAVA: {
      input: "n = 4",
      output: "5",
      explanation:
        "There are five ways to climb to the top:\n1. 1 step + 1 step + 1 step + 1 step\n2. 1 step + 1 step + 2 steps\n3. 1 step + 2 steps + 1 step\n4. 2 steps + 1 step + 1 step\n5. 2 steps + 2 steps",
    },
  },
  codeSnippet: {
    JAVASCRIPT: `/**
* @param {number} n
* @return {number}
*/
function climbStairs(n) {
// Write your code here
}

// Parse input and execute
const readline = require('readline');
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
terminal: false
});

rl.on('line', (line) => {
const n = parseInt(line.trim());
const result = climbStairs(n);

console.log(result);
rl.close();
});`,
    PYTHON: `class Solution:
  def climbStairs(self, n: int) -> int:
      # Write your code here
      pass

# Input parsing
if __name__ == "__main__":
  import sys
  
  # Parse input
  n = int(sys.stdin.readline().strip())
  
  # Solve
  sol = Solution()
  result = sol.climbStairs(n)
  
  # Print result
  print(result)`,
    JAVA: `import java.util.Scanner;

class Main {
  public int climbStairs(int n) {
      // Write your code here
      return 0;
  }
  
  public static void main(String[] args) {
      Scanner scanner = new Scanner(System.in);
      int n = Integer.parseInt(scanner.nextLine().trim());
      
      // Use Main class instead of Solution
      Main main = new Main();
      int result = main.climbStairs(n);
      
      System.out.println(result);
      scanner.close();
  }
}`,
  },
  referenceSolutions: {
    JAVASCRIPT: `/**
* @param {number} n
* @return {number}
*/
function climbStairs(n) {
// Base cases
if (n <= 2) {
  return n;
}

// Dynamic programming approach
let dp = new Array(n + 1);
dp[1] = 1;
dp[2] = 2;

for (let i = 3; i <= n; i++) {
  dp[i] = dp[i - 1] + dp[i - 2];
}

return dp[n];

/* Alternative approach with O(1) space
let a = 1; // ways to climb 1 step
let b = 2; // ways to climb 2 steps

for (let i = 3; i <= n; i++) {
  let temp = a + b;
  a = b;
  b = temp;
}

return n === 1 ? a : b;
*/
}

// Parse input and execute
const readline = require('readline');
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
terminal: false
});

rl.on('line', (line) => {
const n = parseInt(line.trim());
const result = climbStairs(n);

console.log(result);
rl.close();
});`,
    PYTHON: `class Solution:
  def climbStairs(self, n: int) -> int:
      # Base cases
      if n <= 2:
          return n
      
      # Dynamic programming approach
      dp = [0] * (n + 1)
      dp[1] = 1
      dp[2] = 2
      
      for i in range(3, n + 1):
          dp[i] = dp[i - 1] + dp[i - 2]
      
      return dp[n]
      
      # Alternative approach with O(1) space
      # a, b = 1, 2
      # 
      # for i in range(3, n + 1):
      #     a, b = b, a + b
      # 
      # return a if n == 1 else b

# Input parsing
if __name__ == "__main__":
  import sys
  
  # Parse input
  n = int(sys.stdin.readline().strip())
  
  # Solve
  sol = Solution()
  result = sol.climbStairs(n)
  
  # Print result
  print(result)`,
    JAVA: `import java.util.Scanner;

class Main {
  public int climbStairs(int n) {
      // Base cases
      if (n <= 2) {
          return n;
      }
      
      // Dynamic programming approach
      int[] dp = new int[n + 1];
      dp[1] = 1;
      dp[2] = 2;
      
      for (int i = 3; i <= n; i++) {
          dp[i] = dp[i - 1] + dp[i - 2];
      }
      
      return dp[n];
      
      /* Alternative approach with O(1) space
      int a = 1; // ways to climb 1 step
      int b = 2; // ways to climb 2 steps
      
      for (int i = 3; i <= n; i++) {
          int temp = a + b;
          a = b;
          b = temp;
      }
      
      return n == 1 ? a : b;
      */
  }
  
  public static void main(String[] args) {
      Scanner scanner = new Scanner(System.in);
      int n = Integer.parseInt(scanner.nextLine().trim());
      
      // Use Main class instead of Solution
      Main main = new Main();
      int result = main.climbStairs(n);
      
      System.out.println(result);
      scanner.close();
  }
}`,
  },
};

// Sample problem data for another type of question
const sampleStringProblem = {
  title: "Valid Palindrome",
  description:
    "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string s, return true if it is a palindrome, or false otherwise.",
  difficulty: "EASY",
  tags: ["String", "Two Pointers"],
  constraints:
    "1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.",
  hints:
    "Consider using two pointers, one from the start and one from the end, moving towards the center.",
  intuition:
    "A palindrome mirrors around its center, so compare matching alphanumeric characters from both ends while ignoring casing and punctuation.",
  editorial:
    "We can use two pointers approach to check if the string is a palindrome. One pointer starts from the beginning and the other from the end, moving towards each other.",
  walkthrough:
    "For 'A man, a plan, a canal: Panama', the pointers compare a with a, m with m, and continue inward while skipping spaces and punctuation. No mismatch is found.",
  timeComplexity: "O(n)",
  spaceComplexity: "O(1)",
  testcases: [
    {
      input: "A man, a plan, a canal: Panama",
      output: "true",
    },
    {
      input: "race a car",
      output: "false",
    },
    {
      input: " ",
      output: "true",
    },
  ],
  examples: {
    JAVASCRIPT: {
      input: 's = "A man, a plan, a canal: Panama"',
      output: "true",
      explanation: '"amanaplanacanalpanama" is a palindrome.',
    },
    PYTHON: {
      input: 's = "A man, a plan, a canal: Panama"',
      output: "true",
      explanation: '"amanaplanacanalpanama" is a palindrome.',
    },
    JAVA: {
      input: 's = "A man, a plan, a canal: Panama"',
      output: "true",
      explanation: '"amanaplanacanalpanama" is a palindrome.',
    },
  },
  codeSnippet: {
    JAVASCRIPT: `/**
   * @param {string} s
   * @return {boolean}
   */
  function isPalindrome(s) {
    // Write your code here
  }
  
  // Add readline for dynamic input handling
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  
  // Process input line
  rl.on('line', (line) => {
    // Call solution with the input string
    const result = isPalindrome(line);
    
    // Output the result
    console.log(result ? "true" : "false");
    rl.close();
  });`,
    PYTHON: `class Solution:
      def isPalindrome(self, s: str) -> bool:
          # Write your code here
          pass
  
  # Input parsing
  if __name__ == "__main__":
      import sys
      # Read the input string
      s = sys.stdin.readline().strip()
      
      # Call solution
      sol = Solution()
      result = sol.isPalindrome(s)
      
      # Output result
      print(str(result).lower())  # Convert True/False to lowercase true/false`,
    JAVA: `import java.util.Scanner;

public class Main {
    public static String preprocess(String s) {
        return s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    public static boolean isPalindrome(String s) {
       
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();

        boolean result = isPalindrome(input);
        System.out.println(result ? "true" : "false");
    }
}
`,
  },
  referenceSolutions: {
    JAVASCRIPT: `/**
   * @param {string} s
   * @return {boolean}
   */
  function isPalindrome(s) {
    // Convert to lowercase and remove non-alphanumeric characters
    s = s.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if it's a palindrome
    let left = 0;
    let right = s.length - 1;
    
    while (left < right) {
      if (s[left] !== s[right]) {
        return false;
      }
      left++;
      right--;
    }
    
    return true;
  }
  
  // Add readline for dynamic input handling
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  
  // Process input line
  rl.on('line', (line) => {
    // Call solution with the input string
    const result = isPalindrome(line);
    
    // Output the result
    console.log(result ? "true" : "false");
    rl.close();
  });`,
    PYTHON: `class Solution:
      def isPalindrome(self, s: str) -> bool:
          # Convert to lowercase and keep only alphanumeric characters
          filtered_chars = [c.lower() for c in s if c.isalnum()]
          
          # Check if it's a palindrome
          return filtered_chars == filtered_chars[::-1]
  
  # Input parsing
  if __name__ == "__main__":
      import sys
      # Read the input string
      s = sys.stdin.readline().strip()
      
      # Call solution
      sol = Solution()
      result = sol.isPalindrome(s)
      
      # Output result
      print(str(result).lower())  # Convert True/False to lowercase true/false`,
    JAVA: `import java.util.Scanner;

public class Main {
    public static String preprocess(String s) {
        return s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    public static boolean isPalindrome(String s) {
        s = preprocess(s);
        int left = 0, right = s.length() - 1;

        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) return false;
            left++;
            right--;
        }

        return true;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();

        boolean result = isPalindrome(input);
        System.out.println(result ? "true" : "false");
    }
}
`,
  },
};

const formTabs = [
  { id: "basics", label: "Title & Description", caption: "Problem statement", icon: FileText },
  { id: "classification", label: "Difficulty & Tags", caption: "Discovery details", icon: Tags },
  { id: "testcases", label: "Test Cases", caption: "Validation inputs", icon: FlaskConical },
  { id: "python", label: "Python", caption: "Template and solution", icon: Code2 },
  { id: "java", label: "Java", caption: "Template and solution", icon: Code2 },
  { id: "javascript", label: "JavaScript", caption: "Template and solution", icon: Code2 },
  { id: "additional", label: "Additional Info", caption: "Constraints and guidance", icon: Lightbulb },
];

const languageByTab = {
  javascript: "JAVASCRIPT",
  python: "PYTHON",
  java: "JAVA",
};

const difficultyOptions = [
  {
    value: "EASY",
    label: "Easy",
    activeClass: "border-emerald-400/70 bg-emerald-400/15 text-emerald-300",
    inactiveClass: "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-400/60 hover:border-emerald-400/45 hover:bg-emerald-400/10 hover:text-emerald-300",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    activeClass: "border-orange-400/70 bg-orange-400/15 text-orange-300",
    inactiveClass: "border-orange-500/20 bg-orange-500/[0.04] text-orange-400/60 hover:border-orange-400/45 hover:bg-orange-400/10 hover:text-orange-300",
  },
  {
    value: "HARD",
    label: "Hard",
    activeClass: "border-red-400/70 bg-red-400/15 text-red-300",
    inactiveClass: "border-red-500/20 bg-red-500/[0.04] text-red-400/60 hover:border-red-400/45 hover:bg-red-400/10 hover:text-red-300",
  },
];

const CREATE_PROBLEM_DRAFT_KEY = "leetspase:create-problem-draft:v1";
const CREATE_PROBLEM_TAB_KEY = "leetspase:create-problem-tab:v1";

const createEmptyProblemFormValues = () => ({
  intuition: "",
  editorial: "",
  walkthrough: "",
  timeComplexity: "",
  spaceComplexity: "",
  youtubeUrl: "",
  testcases: [{ input: "", output: "" }],
  tags: ["", "", ""],
  examples: {
    JAVASCRIPT: { input: "", output: "", explanation: "" },
    PYTHON: { input: "", output: "", explanation: "" },
    JAVA: { input: "", output: "", explanation: "" },
  },
  codeSnippet: {
    JAVASCRIPT: "function solution() {\n  // Write your code here\n}",
    PYTHON: "def solution():\n    # Write your code here\n    pass",
    JAVA: "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}",
  },
  referenceSolutions: {
    JAVASCRIPT: "// Add your reference solution here",
    PYTHON: "# Add your reference solution here",
    JAVA: "// Add your reference solution here",
  },
});

const getInitialProblemFormValues = () => {
  const emptyValues = createEmptyProblemFormValues();

  try {
    const savedDraft = sessionStorage.getItem(CREATE_PROBLEM_DRAFT_KEY);
    if (!savedDraft) return emptyValues;

    const parsedDraft = JSON.parse(savedDraft);
    return parsedDraft && typeof parsedDraft === "object"
      ? { ...emptyValues, ...parsedDraft }
      : emptyValues;
  } catch {
    sessionStorage.removeItem(CREATE_PROBLEM_DRAFT_KEY);
    return emptyValues;
  }
};

const getInitialProblemFormTab = () => {
  const savedTab = sessionStorage.getItem(CREATE_PROBLEM_TAB_KEY);
  return formTabs.some((tab) => tab.id === savedTab) ? savedTab : "basics";
};

const CreateProblemForm = ({ embedded = false, onBack, onCreated }) => {
    const sampleType = "DP";
    const [activeTab, setActiveTab] = useState(getInitialProblemFormTab);
    const navigation = useNavigate();
    const {register , control , handleSubmit , reset , subscribe, formState:{errors}} = useForm(
        {
            resolver:zodResolver(problemSchema),
            defaultValues: getInitialProblemFormValues(),
        }
    )

  const {
    fields: testCaseFields,
    append: appendTestCase,
    remove: removeTestCase,
    replace: replacetestcases,
  } = useFieldArray({
    control,
    name: "testcases",
  });

  const [isLoading , setIsLoading] = useState(false);

  useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        sessionStorage.setItem(
          CREATE_PROBLEM_DRAFT_KEY,
          JSON.stringify(values)
        );
      },
    });
  }, [subscribe]);

  useEffect(() => {
    sessionStorage.setItem(CREATE_PROBLEM_TAB_KEY, activeTab);
  }, [activeTab]);

  const onSubmit = async (value)=>{
   try {
    setIsLoading(true)
    const res = await axiosInstance.post("/problems/create-problem" , value)
    console.log(res.data);
    sessionStorage.removeItem(CREATE_PROBLEM_DRAFT_KEY);
    sessionStorage.removeItem(CREATE_PROBLEM_TAB_KEY);
    toast.success(res.data.message || "Problem Created successfully⚡");
    if (onCreated) {
      onCreated(res.data.problem);
    } else {
      navigation("/problems");
    }

   } catch (error) {
    console.log(error);
    toast.error("Error creating problem")
   }
   finally{
      setIsLoading(false);
   }
  }

  const loadSampleData=()=>{
    const sampleData = sampleType === "DP" ? sampledpData : sampleStringProblem
  
    replacetestcases(sampleData.testcases.map((tc) => tc));

   // Reset the form with sample data
    reset(sampleData);
}

  const activeTabIndex = formTabs.findIndex((tab) => tab.id === activeTab);
  const activeTabDetails = formTabs[activeTabIndex];
  const activeLanguage = languageByTab[activeTab];

  const tabHasError = (tabId) => {
    if (tabId === "basics") return Boolean(errors.title || errors.description);
    if (tabId === "classification") return Boolean(errors.difficulty || errors.tags);
    if (tabId === "testcases") return Boolean(errors.testcases);
    if (tabId === "additional") return Boolean(
      errors.constraints ||
      errors.hints ||
      errors.intuition ||
      errors.editorial ||
      errors.walkthrough ||
      errors.timeComplexity ||
      errors.spaceComplexity ||
      errors.youtubeUrl
    );

    const language = languageByTab[tabId];
    return Boolean(
      language &&
      (errors.codeSnippet?.[language] ||
        errors.referenceSolutions?.[language] ||
        errors.examples?.[language])
    );
  };

  const handleInvalidForm = (validationErrors) => {
    if (validationErrors.title || validationErrors.description) setActiveTab("basics");
    else if (validationErrors.difficulty || validationErrors.tags) setActiveTab("classification");
    else if (validationErrors.testcases) setActiveTab("testcases");
    else if (
      validationErrors.codeSnippet?.PYTHON ||
      validationErrors.referenceSolutions?.PYTHON ||
      validationErrors.examples?.PYTHON
    ) setActiveTab("python");
    else if (
      validationErrors.codeSnippet?.JAVA ||
      validationErrors.referenceSolutions?.JAVA ||
      validationErrors.examples?.JAVA
    ) setActiveTab("java");
    else if (
      validationErrors.codeSnippet?.JAVASCRIPT ||
      validationErrors.referenceSolutions?.JAVASCRIPT ||
      validationErrors.examples?.JAVASCRIPT
    ) setActiveTab("javascript");
    else setActiveTab("additional");

    toast.error("Complete the highlighted fields before creating the problem");
  };

  return (
    <div className={`${embedded ? "h-[calc(100vh-10rem)] min-h-[680px] rounded-2xl border border-white/10" : "h-screen"} w-full overflow-hidden bg-[#080808] text-white`}>
      <div className="flex h-full w-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col items-start justify-between gap-5 border-b border-white/10 bg-[#0d0d0d] px-5 py-6 md:flex-row md:items-center md:px-8 lg:px-10">
            <h2 className="card-title text-2xl md:text-3xl flex items-center gap-3">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              Create Problem
            </h2>

            <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
              <button
                type="button"
                className="btn btn-secondary gap-2"
                onClick={loadSampleData}
              >
                <Download className="w-4 h-4" />
                Load Sample Problem
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, handleInvalidForm)} className="create-problem-form grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
            <aside className="overflow-y-auto border-b border-white/10 bg-black/35 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <button
                type="button"
                onClick={() => onBack ? onBack() : navigation("/problems")}
                className="mb-5 inline-flex items-center gap-2 px-2 text-sm text-white/45 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> {embedded ? "Back to overview" : "Back to problems"}
              </button>

              <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Problem form sections">
                {formTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const hasError = tabHasError(tab.id);

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`group flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "border-white/20 bg-white/[0.08] text-white"
                          : "border-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.035] hover:text-white/80"
                      }`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${isActive ? "border-white/15 bg-white text-black" : "border-white/10 bg-white/[0.04]"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span className="truncate">{tab.label}</span>
                          {hasError && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-label="Section has an error" />}
                        </span>
                        <span className="mt-0.5 hidden truncate text-xs font-normal text-white/30 lg:block">{tab.caption}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{activeTabDetails.label}</h1>
                    <p className="mt-2 text-sm text-white/40">{activeTabDetails.caption}</p>
                  </div>
                </div>

            {/* Basic Information */}
            <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${activeTab !== "basics" && activeTab !== "classification" ? "hidden" : ""}`}>
              <div className={`form-control md:col-span-2 ${activeTab !== "basics" ? "hidden" : ""}`}>
                <label className="label">
                  <span className="label-text text-base md:text-lg font-semibold">
                    Title
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full text-base md:text-lg"
                  {...register("title")}
                  placeholder="Enter problem title"
                />
                {errors.title && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.title.message}
                    </span>
                  </label>
                )}
              </div>

              <div className={`form-control md:col-span-2 ${activeTab !== "basics" ? "hidden" : ""}`}>
                <label className="label">
                  <span className="label-text text-base md:text-lg font-semibold">
                    Description
                  </span>
                </label>
                <textarea
                  className="problem-description-textarea textarea textarea-bordered w-full p-4 text-base md:text-lg"
                  {...register("description")}
                  placeholder="Enter problem description"
                />
                {errors.description && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.description.message}
                    </span>
                  </label>
                )}
              </div>

              <div className={`form-control md:col-span-2 ${activeTab !== "classification" ? "hidden" : ""}`}>
                <label className="label">
                  <span className="label-text text-base md:text-lg font-semibold">
                    Difficulty
                  </span>
                </label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <div
                      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                      role="radiogroup"
                      aria-label="Problem difficulty"
                    >
                      {difficultyOptions.map((option) => {
                        const isSelected = field.value === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => field.onChange(option.value)}
                            onBlur={field.onBlur}
                            className={`rounded-xl border px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition-colors focus:outline-none ${
                              isSelected ? option.activeClass : option.inactiveClass
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.difficulty && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.difficulty.message}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className={`card mt-6 bg-base-200 p-4 shadow-md md:p-6 ${activeTab !== "classification" ? "hidden" : ""}`}>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => {
                  const tags = Array.isArray(field.value) && field.value.length > 0
                    ? field.value
                    : [""];

                  const updateTag = (index, value) => {
                    const nextTags = [...tags];
                    nextTags[index] = value;
                    field.onChange(nextTags);
                  };

                  const removeTag = (index) => {
                    if (tags.length === 1) return;
                    field.onChange(tags.filter((_, tagIndex) => tagIndex !== index));
                  };

                  return (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold md:text-xl">
                          <BookOpen className="h-5 w-5" />
                          Tags
                        </h3>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => field.onChange([...tags, ""])}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add Tag
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tags.map((tag, index) => (
                          <div key={`tag-${index}`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                name={`${field.name}.${index}`}
                                value={tag}
                                onChange={(event) => updateTag(index, event.target.value)}
                                onBlur={field.onBlur}
                                className="input input-bordered min-w-0 flex-1"
                                placeholder="Enter tag"
                              />
                              <button
                                type="button"
                                className="tag-remove-button btn btn-ghost btn-square btn-sm"
                                onClick={() => removeTag(index)}
                                disabled={tags.length === 1}
                                aria-label={`Remove tag ${index + 1}`}
                                title="Remove tag"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {errors.tags?.[index]?.message && (
                              <p className="mt-1 text-sm text-error">
                                {errors.tags[index].message}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                }}
              />
              {errors.tags && (
                <div className="mt-2">
                  <span className="text-error text-sm">
                    {errors.tags.message}
                  </span>
                </div>
              )}
            </div>

            {/* Test Cases */}
            <div className={`card bg-base-200 p-4 shadow-md md:p-6 ${activeTab !== "testcases" ? "hidden" : ""}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Test Cases
                </h3>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => appendTestCase({ input: "", output: "" })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Test Case
                </button>
              </div>
              <div className="space-y-6">
                {testCaseFields.map((field, index) => (
                  <div key={field.id} className="card bg-base-100 shadow-md">
                    <div className="card-body p-4 md:p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-base md:text-lg font-semibold">
                          Test Case #{index + 1}
                        </h4>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => removeTestCase(index)}
                          disabled={testCaseFields.length === 1}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">
                              Input
                            </span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered min-h-24 w-full p-3 resize-y"
                            {...register(`testcases.${index}.input`)}
                            placeholder="Enter test case input"
                          />
                          {errors.testcases?.[index]?.input && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {errors.testcases[index].input.message}
                              </span>
                            </label>
                          )}
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">
                              Expected Output
                            </span>
                          </label>
                          <textarea
                            className="textarea textarea-bordered min-h-24 w-full p-3 resize-y"
                            {...register(`testcases.${index}.output`)}
                            placeholder="Enter expected output"
                          />
                          {errors.testcases?.[index]?.output && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {errors.testcases[index].output.message}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.testcases && !Array.isArray(errors.testcases) && (
                <div className="mt-2">
                  <span className="text-error text-sm">
                    {errors.testcases.message}
                  </span>
                </div>
              )}
            </div>

            {/* Code Editor Sections */}
            <div className={`space-y-8 ${!activeLanguage ? "hidden" : ""}`}>
              {[activeLanguage].filter(Boolean).map((language) => (
                <div
                  key={language}
                  className="card bg-base-200 p-4 md:p-6 shadow-md"
                >
                  <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    {language}
                  </h3>

                  <div className="space-y-6">
                    {/* Starter Code */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body p-4 md:p-6">
                        <h4 className="font-semibold text-base md:text-lg mb-4">
                          Starter Code Template
                        </h4>
                        <div className="border rounded-md overflow-hidden">
                          <Controller
                            name={`codeSnippet.${language}`}
                            control={control}
                            render={({ field }) => (
                              <Editor
                                height="300px"
                                language={language.toLowerCase()}
                                theme="vs-dark"
                                value={field.value}
                                onChange={field.onChange}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: "on",
                                  roundedSelection: false,
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                }}
                              />
                            )}
                          />
                        </div>
                        {errors.codeSnippet?.[language] && (
                          <div className="mt-2">
                            <span className="text-error text-sm">
                              {errors.codeSnippet[language].message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reference Solution */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body p-4 md:p-6">
                        <h4 className="font-semibold text-base md:text-lg mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          Reference Solution
                        </h4>
                        <div className="border rounded-md overflow-hidden">
                          <Controller
                            name={`referenceSolutions.${language}`}
                            control={control}
                            render={({ field }) => (
                              <Editor
                                height="300px"
                                language={language.toLowerCase()}
                                theme="vs-dark"
                                value={field.value}
                                onChange={field.onChange}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: "on",
                                  roundedSelection: false,
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                }}
                              />
                            )}
                          />
                        </div>
                        {errors.referenceSolutions?.[language] && (
                          <div className="mt-2">
                            <span className="text-error text-sm">
                              {errors.referenceSolutions[language].message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Examples */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body p-4 md:p-6">
                        <h4 className="font-semibold text-base md:text-lg mb-4">
                          Example
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">
                                Input
                              </span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered min-h-20 w-full p-3 resize-y"
                              {...register(`examples.${language}.input`)}
                              placeholder="Example input"
                            />
                            {errors.examples?.[language]?.input && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {errors.examples[language].input.message}
                                </span>
                              </label>
                            )}
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text font-medium">
                                Output
                              </span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered min-h-20 w-full p-3 resize-y"
                              {...register(`examples.${language}.output`)}
                              placeholder="Example output"
                            />
                            {errors.examples?.[language]?.output && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {errors.examples[language].output.message}
                                </span>
                              </label>
                            )}
                          </div>
                          <div className="form-control md:col-span-2">
                            <label className="label">
                              <span className="label-text font-medium">
                                Explanation
                              </span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered min-h-24 w-full p-3 resize-y"
                              {...register(`examples.${language}.explanation`)}
                              placeholder="Explain the example"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Information */}
            <div className={`card bg-base-200 p-4 shadow-md md:p-6 ${activeTab !== "additional" ? "hidden" : ""}`}>
              <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Additional Information
              </h3>
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Constraints</span>
                  </label>
                  <textarea
                    className="additional-info-textarea constraints-textarea textarea textarea-bordered w-full p-4 text-base leading-7"
                    {...register("constraints")}
                    placeholder="Enter problem constraints"
                  />
                  {errors.constraints && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.constraints.message}
                      </span>
                    </label>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Hints (Optional)
                    </span>
                  </label>
                  <textarea
                    className="additional-info-textarea hints-textarea textarea textarea-bordered w-full p-4 text-base leading-7"
                    {...register("hints")}
                    placeholder="Enter hints for solving the problem"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Intuition (Optional)
                    </span>
                  </label>
                  <textarea
                    className="additional-info-textarea editorial-section-textarea textarea textarea-bordered w-full p-4 text-base leading-7"
                    {...register("intuition")}
                    placeholder="Explain the key observation that helps unlock the problem"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Approach (Optional)
                    </span>
                  </label>
                  <textarea
                    className="additional-info-textarea editorial-section-textarea textarea textarea-bordered w-full p-4 text-base leading-7"
                    {...register("editorial")}
                    placeholder="Describe the algorithm step by step"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Example Walkthrough (Optional)
                    </span>
                  </label>
                  <textarea
                    className="additional-info-textarea editorial-section-textarea textarea textarea-bordered w-full p-4 text-base leading-7"
                    {...register("walkthrough")}
                    placeholder="Walk through the algorithm using one representative example"
                  />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Time Complexity (Optional)
                      </span>
                    </label>
                    <textarea
                      className="additional-info-textarea complexity-textarea textarea textarea-bordered w-full p-4 font-mono text-base leading-7"
                      {...register("timeComplexity")}
                      placeholder="Example: O(n) — each element is visited once"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Space Complexity (Optional)
                      </span>
                    </label>
                    <textarea
                      className="additional-info-textarea complexity-textarea textarea textarea-bordered w-full p-4 font-mono text-base leading-7"
                      {...register("spaceComplexity")}
                      placeholder="Example: O(1) — only constant extra space is used"
                    />
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      YouTube Video URL (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered h-12 w-full bg-[#181818] px-4 text-base"
                    {...register("youtubeUrl")}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Add a YouTube walkthrough or explanation. It will open on YouTube in a new tab.
                  </p>
                  {errors.youtubeUrl && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.youtubeUrl.message}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

              </div>

              <div className="shrink-0 border-t border-white/10 bg-[#0d0d0d]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={activeTabIndex === 0}
                    onClick={() => setActiveTab(formTabs[activeTabIndex - 1].id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {activeTabIndex < formTabs.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(formTabs[activeTabIndex + 1].id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6]"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#e6e6e6] disabled:cursor-not-allowed disabled:opacity-50">
                      {isLoading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Create Problem
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateProblemForm
