import { EditorTab } from "@/lib/types/editor.types";

export const mockTabs: EditorTab[] = [
  {
    id: "tab-1",
    filePath: "src/index.ts",
    fileName: "index.ts",
    language: "typescript",
    content: `import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello, CodeForge IDE!");
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
    isDirty: false,
    isActive: true,
  },
  {
    id: "tab-2",
    filePath: "src/utils.ts",
    fileName: "utils.ts",
    language: "typescript",
    content: `export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}`,
    isDirty: false,
    isActive: false,
  },
  {
    id: "tab-3",
    filePath: "README.md",
    fileName: "README.md",
    language: "markdown",
    content: `# CodeForge IDE

A modern, browser-based IDE powered by Monaco Editor.

## Features
- Syntax Highlighting for 10+ languages
- IntelliSense for TypeScript/JavaScript
- Theme Switching (Light/Dark)
- Resizable Panels
- Keyboard Shortcuts

## Getting Started
1. Create a new file
2. Start coding
3. Enjoy!`,
    isDirty: false,
    isActive: false,
  },
];

export function loadMockTabs(addTab: (tab: EditorTab) => void) {
  mockTabs.forEach((tab) => addTab(tab));
}
