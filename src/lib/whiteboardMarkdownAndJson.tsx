import React from "react";
import { Check, Copy, Code, CheckSquare, Square, FileText, Braces } from "lucide-react";
import katex from "katex";

/**
 * Normalizes mathematical expressions and restores unescaped LaTeX keywords so that
 * mathematical formulas are never rendered as run-together "combined words"
 * (e.g. "equiv", "pmod", "implies", "mathbb{Z}") but as true mathematical symbols.
 */
function escapeSetBraces(str: string): string {
  let result = "";
  let i = 0;
  while (i < str.length) {
    if (str[i] === "{" && (i === 0 || str[i - 1] !== "\\")) {
      // Check if this { is preceded by a LaTeX command like \mathbb or \mathbf
      let k = i - 1;
      while (k >= 0 && /\s/.test(str[k])) k--;
      const endWord = k;
      while (k >= 0 && /[a-zA-Z\\]/.test(str[k])) k--;
      let prevWord = "";
      if (endWord >= 0) {
        prevWord = str.substring(k + 1, endWord + 1);
      }
      const isMacroArg = prevWord.startsWith("\\") || prevWord === "^" || prevWord === "_";

      if (!isMacroArg) {
        // Find matching closing brace
        let depth = 1;
        let j = i + 1;
        while (j < str.length && depth > 0) {
          if (str[j] === "{" && str[j - 1] !== "\\") depth++;
          else if (str[j] === "}" && str[j - 1] !== "\\") depth--;
          j++;
        }
        if (depth === 0) {
          const inner = str.substring(i + 1, j - 1);
          // If inner has colon (set builder) or commas (set elements) or dots
          if (inner.includes(":") || inner.includes(",") || inner.includes("\\dots") || inner.includes("dots")) {
            result += "\\{" + escapeSetBraces(inner) + "\\}";
            i = j;
            continue;
          }
        }
      }
    }
    result += str[i];
    i++;
  }
  return result;
}

export function preprocessLaTeX(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();

  // 1. Recover control characters that got swallowed (e.g. \t -> tab, \b -> backspace, etc.)
  s = s
    .replace(/\t\s*ext\b/g, "\\text")
    .replace(/\t\s*imes\b/g, "\\times")
    .replace(/\t\s*herefore\b/g, "\\therefore")
    .replace(/[\b]\s*mod\b/g, "\\bmod")
    .replace(/[\r\n]\s*eq\b/g, "\\neq");

  // 2. Multi-char LaTeX keywords that are definitely macros if unescaped
  const macros = [
    "equiv", "pmod", "bmod", "implies", "iff", "mathbb", "mathbf", "mathrm",
    "mathit", "cdot", "times", "dots", "ldots", "cdots", "therefore",
    "quad", "qquad", "forall", "exists", "subset", "subseteq", "emptyset",
    "notin", "leftarrow", "rightarrow", "Leftarrow", "Rightarrow",
    "div", "sqrt", "frac", "cap", "cup", "mid", "text"
  ];
  for (const m of macros) {
    const reg = new RegExp("(?<![\\\\a-zA-Z])" + m + "(?![a-zA-Z])", "g");
    s = s.replace(reg, "\\" + m);
  }

  // 3. Short relational tokens (in, le, ge, ne, neq, pm)
  const rels = ["in", "le", "ge", "ne", "neq", "pm"];
  for (const r of rels) {
    const reg = new RegExp("(?<![\\\\a-zA-Z])" + r + "(?![a-zA-Z])", "g");
    s = s.replace(reg, "\\" + r);
  }

  // 4. Modulo syntax
  s = s.replace(/\(\s*\\?bmod\s+([a-zA-Z0-9]+)\s*\)/g, "\\pmod{$1}");
  s = s.replace(/\(\s*mod\s+([a-zA-Z0-9]+)\s*\)/g, "\\pmod{$1}");
  s = s.replace(/(?<![\\a-zA-Z])mod(?![a-zA-Z])/g, "\\bmod");

  // 5. Bare set braces
  s = escapeSetBraces(s);

  return s;
}

/**
 * Renders LaTeX math formulas into authentic mathematical typography via KaTeX.
 * Safe fallback in case of syntax error prevents canvas crashes.
 */
export function renderKaTeXToString(latex: string, displayMode: boolean = false): string {
  try {
    const preprocessed = preprocessLaTeX(latex);
    return katex.renderToString(preprocessed, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: false,
    });
  } catch {
    const escaped = latex
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<span class="katex-error text-amber-300 font-mono text-[11px]">${escaped}</span>`;
  }
}

/**
 * Detects if content inside $ ... $ is a mathematical expression rather than currency
 */
export function isLikelyMathExpression(content: string): boolean {
  const t = content.trim();
  if (!t) return false;
  // If it has LaTeX backslashes or macros (\pmod, \equiv, \mathbb, etc.)
  if (t.includes("\\")) return true;
  // If it has math relations or operators
  if (/[=<>+\-*\/^_|:≡≠≤≥∈∉∪∩⊂⊆∅]/.test(t)) return true;
  // If it has math words
  if (
    /\b(equiv|pmod|bmod|implies|iff|mathbb|mathbf|cdot|times|dots|therefore|quad|subset|subseteq|cap|cup|emptyset|notin|mod)\b/i.test(
      t
    )
  )
    return true;
  // If it contains non-math English sentence words, it is likely prose
  if (/\b(and|or|the|is|are|was|were|total|for|with|from|to|item|items|price|cost|dollars?|cents?)\b/i.test(t)) {
    return false;
  }
  // Math variables, numbers, exponents, subscripts, brackets, sets
  if (/^[a-zA-Z0-9_{}\[\]\(\)\s\.,\+-]+$/.test(t)) {
    return true;
  }
  return false;
}

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
export function renderJsonSyntaxHighlighted(
  jsonString: string,
  options?: { baseFontSize?: number }
): React.ReactNode {
  const { isValid, formatted, error } = validateJson(jsonString);
  const baseFontSize = options?.baseFontSize || 11;

  if (!isValid) {
    return (
      <div
        style={{ fontSize: `${baseFontSize}px` }}
        className="font-mono leading-relaxed p-2 text-rose-300 bg-rose-950/20 rounded border border-rose-500/30"
      >
        <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
          <span>Invalid JSON Syntax:</span>
        </div>
        <p className="text-[10px] text-rose-300/90 mb-2">{error}</p>
        <pre
          style={{ fontSize: `${baseFontSize}px` }}
          className="whitespace-pre-wrap break-all text-gray-300 font-mono bg-black/40 p-2 rounded"
        >
          {jsonString}
        </pre>
      </div>
    );
  }

  const lines = (formatted || jsonString).split("\n");

  return (
    <pre
      style={{ fontSize: `${baseFontSize}px` }}
      className="font-mono leading-relaxed select-text whitespace-pre p-1 w-full"
    >
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
 * Parses inline markdown tokens (math $...$, display math $$...$$, bold, italic, inline code, strike, link)
 */
export function renderInlineMarkdown(
  text: string,
  keyPrefix: string = "m",
  options?: { isLight?: boolean }
): React.ReactNode[] {
  const isLight = Boolean(options?.isLight);
  const regex = /(\$\$[^\$]+?\$\$|\$[^$\n]+?\$|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // 1. Display Math: $$ ... $$
    if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
      const latex = part.slice(2, -2);
      const html = renderKaTeXToString(latex, true);
      return (
        <span
          key={key}
          className="katex-display-inline my-1.5 block text-center overflow-x-auto select-text scrollbar-thin py-1.5 px-3 rounded-lg bg-slate-900/10 dark:bg-black/35 border border-current/15"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    // 2. Inline Math: $ ... $
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const latex = part.slice(1, -1);
      if (isLikelyMathExpression(latex)) {
        const html = renderKaTeXToString(latex, false);
        return (
          <span
            key={key}
            className="katex-inline px-0.5 mx-0.5 select-text inline-block align-baseline font-serif"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
    }

    // 3. Inline code
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className={`px-1.5 py-0.5 rounded font-mono text-[11px] mx-0.5 select-all ${
            isLight
              ? "bg-slate-100 text-slate-800 border border-slate-200"
              : "bg-black/50 text-amber-300 border border-white/10"
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // 4. Bold (recursively parses math inside bold)
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length > 4)
    ) {
      return (
        <strong
          key={key}
          className={`font-bold ${isLight ? "text-slate-900" : "text-current"}`}
        >
          {renderInlineMarkdown(part.slice(2, -2), `${key}-b`, options)}
        </strong>
      );
    }

    // 5. Italic (recursively parses math inside italic)
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length > 2)
    ) {
      return (
        <em
          key={key}
          className={`italic ${isLight ? "text-slate-700" : "text-current opacity-90"}`}
        >
          {renderInlineMarkdown(part.slice(1, -1), `${key}-i`, options)}
        </em>
      );
    }

    // 6. Strikethrough
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      return (
        <del key={key} className={`line-through ${isLight ? "text-slate-400" : "text-gray-400"}`}>
          {renderInlineMarkdown(part.slice(2, -2), `${key}-d`, options)}
        </del>
      );
    }

    // 7. Links
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline transition-colors ${
            isLight
              ? "text-blue-600 hover:text-blue-700"
              : "text-cyan-400 hover:text-cyan-300"
          }`}
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
 * Checks if a string contains pipe characters indicating a potential markdown table row
 */
export function isPotentialTableRow(str: string): boolean {
  const t = str.trim();
  return t.includes("|");
}

/**
 * Checks if a string is a markdown table delimiter row (e.g. | :--- | :---: | ---: |)
 */
export function isTableDelimiterRow(str: string): boolean {
  const t = str.trim();
  if (!t.includes("-")) return false;
  let clean = t;
  if (clean.startsWith("|")) clean = clean.slice(1);
  if (clean.endsWith("|")) clean = clean.slice(0, -1);
  const parts = clean.split("|");
  if (parts.length === 0) return false;
  return parts.every((part) => {
    const trimmedPart = part.trim();
    return /^:?-+:?$/.test(trimmedPart);
  });
}

/**
 * Splits a markdown table row into individual cell strings, respecting escaped pipes (\\|)
 */
export function parseTableCells(rowStr: string): string[] {
  let clean = rowStr.trim();
  if (clean.startsWith("|")) clean = clean.slice(1);
  if (clean.endsWith("|")) clean = clean.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  let inEscape = false;
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inEscape) {
      if (char === "|") {
        current += "|";
      } else {
        current += "\\" + char;
      }
      inEscape = false;
    } else if (char === "\\") {
      inEscape = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (inEscape) current += "\\";
  cells.push(current.trim());
  return cells;
}

/**
 * Parses column alignments from the delimiter row
 */
export function parseTableAlignments(delimStr: string): Array<"left" | "center" | "right"> {
  const cells = parseTableCells(delimStr);
  return cells.map((cell) => {
    const trimmed = cell.trim();
    const starts = trimmed.startsWith(":");
    const ends = trimmed.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
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
    baseFontSize?: number;
    textAlign?: "left" | "center" | "right";
  }
): React.ReactNode {
  const baseFontSize = options?.baseFontSize || 13;

  if (!markdownText || !markdownText.trim()) {
    return (
      <p
        style={{
          fontSize: `${baseFontSize}px`,
          color: options?.textColor || undefined,
          textAlign: options?.textAlign || undefined,
        }}
        className={`italic ${options?.textColor ? "" : "text-gray-400"}`}
      >
        Empty markdown document.
      </p>
    );
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

    // 1.5 Display Math Block: $$ ... $$ (single-line or multi-line)
    if (trimmed.startsWith("$$")) {
      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        const latex = trimmed.slice(2, -2).trim();
        const html = renderKaTeXToString(latex, true);
        nodes.push(
          <div
            key={`math-block-${i}`}
            className="my-2 py-2 px-3 rounded-lg bg-slate-900/10 dark:bg-black/35 border border-current/15 text-center overflow-x-auto select-text scrollbar-thin shadow-xs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        continue;
      } else {
        const mathLines: string[] = [trimmed.slice(2)];
        let j = i + 1;
        let closed = false;
        while (j < rawLines.length) {
          const candidate = rawLines[j];
          const trimmedCandidate = candidate.trim();
          if (trimmedCandidate.endsWith("$$")) {
            const lastPart = trimmedCandidate.slice(0, -2);
            if (lastPart) mathLines.push(lastPart);
            closed = true;
            break;
          } else {
            mathLines.push(candidate);
          }
          j++;
        }
        const fullLatex = mathLines.join("\n").trim();
        const html = renderKaTeXToString(fullLatex, true);
        nodes.push(
          <div
            key={`math-block-${i}`}
            className="my-2 py-2 px-3 rounded-lg bg-slate-900/10 dark:bg-black/35 border border-current/15 text-center overflow-x-auto select-text scrollbar-thin shadow-xs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        i = closed ? j : j - 1;
        continue;
      }
    }

    // 2. Horizontal Divider: --- or ***
    if (/^(\-\-\-|\*\*\*|___)$/.test(trimmed)) {
      nodes.push(<hr key={`hr-${i}`} className="my-2 border-white/15" />);
      continue;
    }

    // 2.5 Markdown Table: | Col 1 | Col 2 | ...
    if (
      isPotentialTableRow(trimmed) &&
      i + 1 < rawLines.length &&
      isTableDelimiterRow(rawLines[i + 1])
    ) {
      const headerCells = parseTableCells(trimmed);
      const colCount = headerCells.length;
      const alignments = parseTableAlignments(rawLines[i + 1]);

      const bodyRows: string[][] = [];
      let j = i + 2;
      while (j < rawLines.length) {
        const candidate = rawLines[j].trim();
        if (!candidate || !isPotentialTableRow(candidate) || isTableDelimiterRow(candidate)) {
          break;
        }
        const cells = parseTableCells(rawLines[j]);
        while (cells.length < colCount) {
          cells.push("");
        }
        bodyRows.push(cells.slice(0, colCount));
        j++;
      }

      nodes.push(
        <div
          key={`tbl-wrap-${i}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="my-2.5 w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm select-text scrollbar-thin"
        >
          <table
            style={{ fontSize: `${Math.max(11, baseFontSize - 1)}px` }}
            className="w-full text-left border-collapse font-sans"
          >
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200">
                {headerCells.map((headerText, colIdx) => {
                  const align = alignments[colIdx] || "left";
                  const alignClass =
                    align === "center"
                      ? "text-center"
                      : align === "right"
                      ? "text-right"
                      : "text-left";
                  return (
                    <th
                      key={`th-${i}-${colIdx}`}
                      className={`px-4 py-3.5 font-bold text-slate-900 tracking-wide border-r last:border-r-0 border-slate-200 leading-snug align-middle min-w-[70px] ${alignClass}`}
                    >
                      {renderInlineMarkdown(headerText, `th-${i}-${colIdx}`, { isLight: true })}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bodyRows.map((rowCells, rowIdx) => (
                <tr
                  key={`tr-${i}-${rowIdx}`}
                  className="bg-white hover:bg-slate-50/70 transition-colors"
                >
                  {rowCells.map((cellText, colIdx) => {
                    const align = alignments[colIdx] || "left";
                    const alignClass =
                      align === "center"
                        ? "text-center"
                        : align === "right"
                        ? "text-right"
                        : "text-left";
                    const isFirstCol = colIdx === 0;
                    return (
                      <td
                        key={`td-${i}-${rowIdx}-${colIdx}`}
                        className={`px-4 py-3.5 text-slate-700 border-r last:border-r-0 border-slate-200 leading-normal align-middle ${
                          isFirstCol ? "font-bold text-slate-900" : ""
                        } ${alignClass}`}
                      >
                        {renderInlineMarkdown(cellText, `td-${i}-${rowIdx}-${colIdx}`, { isLight: true })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      i = j - 1;
      continue;
    }

    // 3. Headers: #, ##, ###, ####
    if (/^#\s+/.test(trimmed)) {
      nodes.push(
        <h1
          key={`h1-${i}`}
          style={{
            fontSize: `${Math.round(baseFontSize * 1.35)}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`font-extrabold border-b border-white/15 pb-1 mb-1.5 mt-2 flex items-center gap-1.5 leading-snug ${
            options?.textColor ? "" : "text-white"
          }`}
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
          style={{
            fontSize: `${Math.round(baseFontSize * 1.2)}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`font-bold mb-1 mt-1.5 flex items-center gap-1.5 leading-snug ${
            options?.textColor ? "" : "text-cyan-300"
          }`}
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
          style={{
            fontSize: `${Math.round(baseFontSize * 1.1)}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`font-bold mb-1 mt-1 flex items-center gap-1.5 leading-snug ${
            options?.textColor ? "" : "text-amber-300"
          }`}
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
          style={{
            fontSize: `${Math.round(baseFontSize * 1.05)}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`font-semibold mb-0.5 mt-1 leading-snug ${
            options?.textColor ? "" : "text-pink-300"
          }`}
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
          style={{
            fontSize: `${baseFontSize}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`border-l-2 border-cyan-400 bg-white/5 pl-2.5 py-1 my-1 rounded-r italic leading-relaxed ${
            options?.textColor ? "" : "text-gray-300"
          }`}
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
          style={{ fontSize: `${baseFontSize}px` }}
          className="flex items-start gap-2 my-1 group/cb cursor-pointer select-none leading-relaxed"
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
            style={{
              color: isChecked ? undefined : options?.textColor || undefined,
              textAlign: options?.textAlign || undefined,
            }}
            className={`flex-1 transition-all break-words ${
              isChecked
                ? "line-through text-gray-400 italic"
                : options?.textColor
                ? ""
                : "text-gray-200"
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
        <div
          key={`li-${i}`}
          style={{
            fontSize: `${baseFontSize}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`flex items-start gap-1.5 my-0.5 pl-1 leading-relaxed ${
            options?.textColor ? "" : "text-gray-200"
          }`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
            style={{ backgroundColor: options?.textColor || "#22d3ee" }}
          />
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
        <div
          key={`num-${i}`}
          style={{
            fontSize: `${baseFontSize}px`,
            color: options?.textColor || undefined,
            textAlign: options?.textAlign || undefined,
          }}
          className={`flex items-start gap-1.5 my-0.5 pl-1 leading-relaxed ${
            options?.textColor ? "" : "text-gray-200"
          }`}
        >
          <span
            style={{
              fontSize: `${Math.max(10, baseFontSize - 2)}px`,
              color: options?.textColor || "#22d3ee",
            }}
            className="font-mono font-semibold mt-0.5 shrink-0"
          >
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
      <p
        key={`p-${i}`}
        style={{
          fontSize: `${baseFontSize}px`,
          color: options?.textColor || undefined,
          textAlign: options?.textAlign || undefined,
        }}
        className={`leading-relaxed my-0.5 break-words ${
          options?.textColor ? "" : "text-gray-200"
        }`}
      >
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

  return (
    <div
      className="space-y-0.5"
      style={{
        color: options?.textColor || undefined,
        textAlign: options?.textAlign || undefined,
      }}
    >
      {nodes}
    </div>
  );
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
