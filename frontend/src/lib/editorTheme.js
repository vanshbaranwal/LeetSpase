// Syntax colors are shared by Monaco and the illustrated editor on the landing page.
export const codeColors = {
  text: "#E7EAF0",
  keyword: "#C792EA",
  type: "#7CC7E8",
  function: "#E6D28A",
  string: "#ECA58E",
  number: "#A6D7B4",
  comment: "#72A96C",
  punctuation: "#CDD4DF",
};

const foreground = (color) => color.slice(1);

export function registerCodeTheme(monaco) {
  monaco.editor.defineTheme("leetspase-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: foreground(codeColors.text) },
      { token: "identifier", foreground: foreground(codeColors.text) },
      { token: "keyword", foreground: foreground(codeColors.keyword) },
      { token: "type", foreground: foreground(codeColors.type) },
      { token: "type.identifier", foreground: foreground(codeColors.type) },
      { token: "function", foreground: foreground(codeColors.function) },
      { token: "string", foreground: foreground(codeColors.string) },
      { token: "string.escape", foreground: foreground(codeColors.string) },
      { token: "number", foreground: foreground(codeColors.number) },
      { token: "comment", foreground: foreground(codeColors.comment) },
      { token: "delimiter", foreground: foreground(codeColors.punctuation) },
      { token: "operator", foreground: foreground(codeColors.punctuation) },
    ],
    colors: {
      "editor.background": "#0A0C11",
      "editor.foreground": codeColors.text,
      "editorGutter.background": "#0A0C11",
      "editorLineNumber.foreground": "#667085",
      "editorLineNumber.activeForeground": "#F3F5F9",
      "editor.lineHighlightBackground": "#13161D",
      "editor.selectionBackground": "#3B82F655",
      "editorBracketMatch.background": "#3B82F622",
      "editorBracketMatch.border": "#93C5FD88",
      "editorCursor.foreground": "#93C5FD",
    },
  });
}
