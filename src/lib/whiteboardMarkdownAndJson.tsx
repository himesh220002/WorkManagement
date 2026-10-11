import React from "react";
import { Check, Copy, Code, CheckSquare, Square, FileText, Braces } from "lucide-react";

export type NoteFormat = "text" | "json" | "markdown" | "checklist";

export const DEFAULT_TEXT_NOTE = `Project Architecture Notes
==========================
1. Database Isolation
   - Multi-tenant architecture
   - Dedicated indexes per org

2. Real-time Events
   - S3 signed presigned URLs
   - Instant optimistic updates`;

export const DEFAULT_JSON_NOTE = JSON.stringify(
  {
    service: "Whiteboard Studio",
    version: "2.4.0",
    status: "active",
    environment: "production",
    config: {
      autoSave: true,
      maxUsers: 100,
      theme: "dark",
      minimapEnabled: true,
    },
    tags: ["collaboration", "canvas", "diagrams"],
  },
  null,
  2
);

export const DEFAULT_MARKDOWN_NOTE = `# Project Roadmap & Specs
Welcome to the **Whiteboard Studio**!

### Core Deliverables
- [x] Infinite canvas with pan & zoom
- [x] Dynamic arrows with rotatable tips
- [x] Interactive todo checklists
- [ ] Rendered Markdown specification (.md)
- [ ] Formatted JSON data structures

> *Tip*: Write \`# Headers\`, \`**bold**\`, or code blocks here!`;

/**
 * Validates and formats JSON strings
 */
export function validateJson(raw: string): {
  isValid: boolean;
  error?: string;
  formatted?: string;
  keyCount?: number;
  parsed?: any;
} {
  try {
    const trimmed = (raw || "").trim();
    if (!trimmed) {
      return { isValid: false, error: "Empty JSON content" };
    }
    const parsed = JSON.parse(trimmed);
    const formatted = JSON.stringify(parsed, null, 2);
    const keyCount =
      typeof parsed === "object" && parsed !== null
        ? Array.isArray(parsed)
          ? parsed.length
          : Object.keys(parsed).length
        : 1;
    return { isValid: true, formatted, keyCount, parsed };
  } catch (err: any) {
    return { isValid: false, error: err.message || "Invalid JSON syntax" };
  }
}

/**
 * Syntax-highlights JSON string into React elements
 */
export function renderJsonSyntaxHighlighted(jsonString: string): React.ReactNode {
  const { isValid, formatted, error } = validateJson(jsonString);

  if (!isValid) {
    return (
      <div className="font-mono text-[11px] leading-relaxed p-2 text-rose-300 bg-rose-950/20 rounded border border-rose-500/30">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
          <span>Invalid JSON Syntax:</span>
        </div>
        <p className="text-[10px] text-rose-300/90 mb-2">{error}</p>
        <pre className="whitespace-pre-wrap break-all text-gray-300 font-mono text-[10px] bg-black/40 p-2 rounded">
          {jsonString}
        </pre>
      </div>
    );
  }

  const lines = (formatted || jsonString).split("\n");

  return (
    <pre className="font-mono text-[11px] leading-relaxed select-text whitespace-pre overflow-x-auto p-1">
      {lines.map((line, lineIdx) => {
        // Match key-value line:  "key": value
        const kvMatch = line.match(/^(\s*)("([^"]+)")(\s*:\s*)(.*)$/);
        if (kvMatch) {
          const indent = kvMatch[1];
          const keyName = kvMatch[3];
          const colon = kvMatch[4];
          const rawVal = kvMatch[5];

          // Parse value token
          let valElement: React.ReactNode = rawVal;
          const trimmedVal = rawVal.replace(/,$/, "").trim();

          if (trimmedVal.startsWith('"') && trimmedVal.endsWith('"')) {
            const hasComma = rawVal.endsWith(",");
            valElement = (
              <span>
                <span className="text-emerald-400 font-mono">{trimmedVal}</span>
                {hasComma && <span className="text-gray-400">,</span>}
              </span>
            );
          } else if (/^-?\d+(\.\d+)?$/.test(trimmedVal)) {
            const hasComma = rawVal.endsWith(",");
            valElement = (
              <span>
                <span className="text-amber-400 font-mono font-semibold">{trimmedVal}</span>
                {hasComma && <span className="text-gray-400">,</span>}
              </span>
            );
          } else if (trimmedVal === "true" || trimmedVal === "false") {
            const hasComma = rawVal.endsWith(",");
            valElement = (
              <span>
                <span className="text-purple-400 font-mono font-bold">{trimmedVal}</span>
                {hasComma && <span className="text-gray-400">,</span>}
              </span>
            );
          } else if (trimmedVal === "null") {
            const hasComma = rawVal.endsWith(",");
            valElement = (
              <span>
                <span className="text-gray-500 font-mono italic">null</span>
                {hasComma && <span className="text-gray-400">,</span>}
              </span>
            );
          }

          return (
            <div key={`json-l-${lineIdx}`} className="hover:bg-white/5 rounded px-0.5">
              <span>{indent}</span>
              <span className="text-cyan-400 font-semibold font-mono">"{keyName}"</span>
              <span className="text-gray-400">{colon}</span>
              {valElement}
            </div>
          );
        }

        // Structural brackets or primitive array items
        return (
          <div key={`json-l-${lineIdx}`} className="text-gray-300 hover:bg-white/5 rounded px-0.5">
            {line}
          </div>
        );
      })}
    </pre>
  );
}

/**
 * Parses inline markdown tokens (bold, italic, inline code, strike, link)
 */
export function renderInlineMarkdown(text: string, keyPrefix: string = "m"): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-black/50 text-amber-300 font-mono text-[11px] border border-white/10 mx-0.5 select-all"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length > 4)
    ) {
      return (
        <strong key={key} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      return (
        <em key={key} className="italic text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      return (
        <del key={key} className="line-through text-gray-400">
          {part.slice(2, -2)}
        </del>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

/**
 * Renders full markdown string into rich, beautiful React JSX
 */
export function renderMarkdownToJsx(
  markdownText: string,
  options?: {
    onToggleCheckbox?: (rawLineIdx: number) => void;
    textColor?: string;
  }
): React.ReactNode {
  if (!markdownText || !markdownText.trim()) {
    return <p className="text-gray-400 italic text-xs">Empty markdown document.</p>;
  }

  const rawLines = markdownText.split("\n");
  const nodes: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = "";

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block: ```lang ... ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Closing code block
        const codeContent = codeBlockLines.join("\n");
        nodes.push(
          <div
            key={`cb-${i}`}
            className="my-2 rounded-lg overflow-hidden border border-white/10 bg-[#090A0F] shadow-inner text-[11px]"
          >
            {codeBlockLang && (
              <div className="px-2.5 py-1 bg-white/5 border-b border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-2.5 font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
              {codeContent}
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = "";
      } else {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 2. Horizontal Divider: --- or ***
    if (/^(\-\-\-|\*\*\*|___)$/.test(trimmed)) {
      nodes.push(<hr key={`hr-${i}`} className="my-2 border-white/15" />);
      continue;
    }

    // 3. Headers: #, ##, ###, ####
    if (/^#\s+/.test(trimmed)) {
      nodes.push(
        <h1
          key={`h1-${i}`}
          className="text-sm font-extrabold text-white border-b border-white/15 pb-1 mb-1.5 mt-2 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.replace(/^#\s+/, ""), `h1-${i}`)}
        </h1>
      );
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      nodes.push(
        <h2
          key={`h2-${i}`}
          className="text-xs font-bold text-cyan-300 mb-1 mt-1.5 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.replace(/^##\s+/, ""), `h2-${i}`)}
        </h2>
      );
      continue;
    }
    if (/^###\s+/.test(trimmed)) {
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="text-xs font-bold text-amber-300 mb-1 mt-1 flex items-center gap-1.5"
        >
          {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""), `h3-${i}`)}
        </h3>
      );
      continue;
    }
    if (/^####\s+/.test(trimmed)) {
      nodes.push(
        <h4
          key={`h4-${i}`}
          className="text-[11px] font-semibold text-pink-300 mb-0.5 mt-1"
        >
          {renderInlineMarkdown(trimmed.replace(/^####\s+/, ""), `h4-${i}`)}
        </h4>
      );
      continue;
    }

    // 4. Blockquotes: > quote
    if (/^>\s*/.test(trimmed)) {
      nodes.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-2 border-cyan-400 bg-white/5 pl-2.5 py-1 my-1 rounded-r text-gray-300 italic text-xs leading-relaxed"
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s*/, ""), `bq-${i}`)}
        </blockquote>
      );
      continue;
    }

    // 5. Interactive Markdown Checkbox: - [ ] or - [x]
    const cbMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (cbMatch) {
      const isChecked = cbMatch[1].toLowerCase() === "x";
      const taskText = cbMatch[2];
      const lineIdxToToggle = i;

      nodes.push(
        <div
          key={`cb-item-${i}`}
          className="flex items-start gap-2 my-1 text-xs group/cb cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation();
            if (options?.onToggleCheckbox) {
              options.onToggleCheckbox(lineIdxToToggle);
            }
          }}
        >
          <button
            type="button"
            className={`w-3.5 h-3.5 rounded mt-0.5 shrink-0 flex items-center justify-center transition-all border ${
              isChecked
                ? "bg-emerald-500 border-emerald-400 text-white shadow-sm"
                : "bg-black/20 hover:bg-black/40 border-white/40 hover:border-white/80 text-transparent"
            }`}
          >
            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </button>
          <span
            className={`flex-1 transition-all break-words ${
              isChecked ? "line-through text-gray-400 italic" : "text-gray-200"
            }`}
          >
            {renderInlineMarkdown(taskText, `cbt-${i}`)}
          </span>
        </div>
      );
      continue;
    }

    // 6. Bullet lists: - item or * item
    if (/^[-*]\s+/.test(trimmed)) {
      nodes.push(
        <div key={`li-${i}`} className="flex items-start gap-1.5 my-0.5 text-xs text-gray-200 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
          <span className="flex-1 break-words">
            {renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""), `li-${i}`)}
          </span>
        </div>
      );
      continue;
    }

    // 7. Numbered lists: 1. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      nodes.push(
        <div key={`num-${i}`} className="flex items-start gap-1.5 my-0.5 text-xs text-gray-200 pl-1">
          <span className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <span className="flex-1 break-words">
            {renderInlineMarkdown(numMatch[2], `num-${i}`)}
          </span>
        </div>
      );
      continue;
    }

    // 8. Empty line: spacer
    if (!trimmed) {
      nodes.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    // 9. Standard Paragraph
    nodes.push(
      <p key={`p-${i}`} className="text-xs leading-relaxed my-0.5 text-gray-200 break-words">
        {renderInlineMarkdown(line, `p-${i}`)}
      </p>
    );
  }

  // Handle unclosed code block if any
  if (inCodeBlock && codeBlockLines.length > 0) {
    nodes.push(
      <pre
        key="cb-unclosed"
        className="p-2.5 my-2 rounded-lg bg-[#090A0F] font-mono text-emerald-300 text-[11px] overflow-x-auto whitespace-pre"
      >
        {codeBlockLines.join("\n")}
      </pre>
    );
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

/**
 * Toggles a checkbox inside raw markdown text string
 */
export function toggleMarkdownCheckbox(rawMarkdown: string, lineIndex: number): string {
  const lines = rawMarkdown.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return rawMarkdown;

  const targetLine = lines[lineIndex];
  const cbMatch = targetLine.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*.*)$/);
  if (!cbMatch) return rawMarkdown;

  const currentStatus = cbMatch[2].toLowerCase();
  const newStatus = currentStatus === "x" ? " " : "x";
  lines[lineIndex] = `${cbMatch[1]}${newStatus}${cbMatch[3]}`;
  return lines.join("\n");
}
