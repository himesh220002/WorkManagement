"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  Download,
  FileText,
  FileCheck,
  Check,
  Copy,
  Printer,
  Trash2,
  RefreshCw,
  FolderKanban,
  Users,
  Building2,
  TrendingUp,
  BadgeDollarSign,
  FormInput,
  BarChart3,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X,
  Sliders,
  Send,
  Zap,
} from "lucide-react";
import { AIReportType } from "@/models/aiReport";
import { SUPPORTED_GEMINI_MODELS } from "@/lib/aiConfig";

interface AIReportHubProps {
  orgCode?: string;
}

/** Remove machine-readable ```json blocks (metrics / form schemas) from displayed markdown. Raw content is still kept for copy/download. */
function stripMachineJsonBlocks(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/```json\s*[\s\S]*?```/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  // First split out inline HTML (spans, breaks, bold/italic/code tags) so
  // AI-emitted <span style="color:red">CRITICAL RISK</span> renders styled.
  const htmlParts = text.split(/(<span[^>]*>.*?<\/span>|<\/?span[^>]*>|<br\s*\/?>|<\/?(?:b|strong|i|em|code)>)/gi);
  const out: React.ReactNode[] = [];
  htmlParts.forEach((chunk, ci) => {
    if (!chunk) return;
    const base = `${keyPrefix}-h${ci}`;
    // Line break
    if (/^<br\s*\/?>$/i.test(chunk)) {
      out.push(<br key={base} />);
      return;
    }
    // Paired span with styles
    const spanMatch = chunk.match(/^<span([^>]*)>([\s\S]*?)<\/span>$/i);
    if (spanMatch) {
      const attrs = spanMatch[1] || "";
      const inner = spanMatch[2] || "";
      const styleMatch = attrs.match(/color\s*:\s*([^;"']+)/i);
      const colorRaw = (styleMatch?.[1] || "").toLowerCase();
      let cls = "font-semibold";
      let inlineStyle: React.CSSProperties = { color: "var(--color-text)" };
      if (/red|#f00|#ff0000|#d13438|#dc2626|crimson/i.test(colorRaw) || /critical|risk|overdue|blocked/i.test(inner)) {
        cls = "font-bold text-red-600";
      } else if (/green|emerald|#107c10|#16a34a/i.test(colorRaw)) {
        cls = "font-bold text-emerald-600";
      } else if (/amber|orange|yellow|#ca8a04|#f59e0b/i.test(colorRaw)) {
        cls = "font-bold text-amber-600";
      } else if (/blue|#0078d4|#2563eb/i.test(colorRaw)) {
        cls = "font-bold";
        inlineStyle = { color: "var(--color-primary)" };
      } else if (/font-weight\s*:\s*bold/i.test(attrs)) {
        cls = "font-bold";
        inlineStyle = { color: "var(--color-text)" };
      }
      out.push(
        <span key={base} className={cls} style={inlineStyle}>
          {renderInlineMarkdown(inner, `${base}-in`)}
        </span>
      );
      return;
    }
    if (/^<\/?span[^>]*>$/i.test(chunk)) return; // stray span tag
    const tagPair = chunk.match(/^<((?:b|strong|i|em|code))>([\s\S]*)<\/\1>$/i);
    if (tagPair) {
      const tag = tagPair[1].toLowerCase();
      const inner = tagPair[2];
      if (tag === "b" || tag === "strong") {
        out.push(
          <strong key={base} className="font-bold" style={{ color: "var(--color-text)" }}>
            {renderInlineMarkdown(inner, `${base}-in`)}
          </strong>
        );
        return;
      }
      if (tag === "i" || tag === "em") {
        out.push(
          <em key={base} className="italic">
            {renderInlineMarkdown(inner, `${base}-in`)}
          </em>
        );
        return;
      }
      out.push(
        <code
          key={base}
          className="px-1 py-px rounded text-[0.92em] font-mono"
          style={{
            backgroundColor: "var(--color-code-bg)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
          }}
        >
          {inner}
        </code>
      );
      return;
    }
    if (/^<\/?(?:b|strong|i|em|code)>$/i.test(chunk)) return; // stray tag
    // Markdown inline tokens within this chunk
    const parts = chunk.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g);
    parts.forEach((part, idx) => {
      const key = `${base}-${idx}`;
      if (!part) return;
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        out.push(
          <code
            key={key}
            className="px-1 py-px rounded text-[0.92em] font-mono"
            style={{
              backgroundColor: "var(--color-code-bg)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
        return;
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        out.push(
          <strong key={key} className="font-bold" style={{ color: "var(--color-text)" }}>
            {renderInlineMarkdown(part.slice(2, -2), `${key}-in`)}
          </strong>
        );
        return;
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        out.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: "var(--color-primary)" }}
          >
            {linkMatch[1]}
          </a>
        );
        return;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
        out.push(
          <em key={key} className="italic">
            {part.slice(1, -1)}
          </em>
        );
        return;
      }
      out.push(<React.Fragment key={key}>{part}</React.Fragment>);
    });
  });
  return out;
}

/** Executive memo header lines, e.g. To: / From: / Date: / Subject: */
function isMemoFieldLine(line: string): boolean {
  return /^(To|From|Date|Subject|Scope|Model|Organization|Organisation|Status|Generated|Evaluation Engine|Report Category)\s*:/i.test(
    line.trim()
  );
}

function splitInlineMemoFields(text: string): string[] | null {
  const matches = text.match(/(?:To|From|Date|Subject|Scope|Model|Status)\s*:/gi);
  if (!matches || matches.length < 2) return null;
  const parts = text.split(/(?=(?:To|From|Date|Subject|Scope|Model|Status)\s*:)/gi).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  if (!parts.every((p) => /^(To|From|Date|Subject|Scope|Model|Status)\s*:/i.test(p))) return null;
  return parts;
}

function MemoFieldBlock({ fields }: { fields: string[] }) {
  return (
    <div className="my-2 space-y-1.5">
      {fields.map((f, idx) => {
        const m = f.match(/^([^:]+):\s*([\s\S]*)$/);
        const label = m ? m[1].trim() : "";
        const value = m ? m[2].trim() : f;
        return (
          <div key={idx} className="text-[14px] leading-[1.7]" style={{ color: "var(--color-text)" }}>
            <span className="font-bold" style={{ color: "var(--color-text)" }}>{label}: </span>
            <span>{renderInlineMarkdown(value, `memo-${idx}`)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Detect ASCII health bars like [██████░░░░] 68% - AT RISK */
function parseHealthBarLine(line: string): { percent: number; label: string } | null {
  const t = line.trim().replace(/^[`>\s|[\]()]+/, "").replace(/[`\]]+$/, "").trim();
  const hasBlocks = /[█▓▒░■▪▬#=]{5,}/.test(t) || (/\[.+?\]/.test(t) && /%/.test(t));
  const pctMatch = t.match(/(\d{1,3})\s*(?:\/\s*100\s*)?%/);
  if (!pctMatch) return null;
  const percent = Math.max(0, Math.min(100, parseInt(pctMatch[1], 10)));
  const labelMatch =
    t.match(/%\s*(?:\(|\[|\-|\–|\—|:|\|)?\s*([A-Za-z][A-Za-z /&()-]{1,40})/) ||
    t.match(/\(([^)]*(?:Risk|Track|Critical|Healthy|Intervention)[^)]*)\)/i);
  let label = (labelMatch?.[1] || "").trim().replace(/[)\].,;:\-]+$/, "").trim();
  if (!hasBlocks && !/risk|track|critical|healthy|intervention|status|health/i.test(t)) return null;
  if (!label) {
    label = percent >= 75 ? "ON TRACK" : percent >= 50 ? "AT RISK" : "CRITICAL";
  }
  return { percent, label: label.toUpperCase() };
}

function DocumentHealthBar({ percent, label, raw }: { percent: number; label: string; raw?: string }) {
  const fill = percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-[#1f2937]" : "bg-red-500";
  return (
    <div
      className="my-4 rounded-lg px-4 py-3.5"
      style={{ backgroundColor: "var(--color-code-bg)", border: "1px solid var(--color-border)" }}
    >
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#e5e7eb" }}>
        <div className={`h-full rounded-full ${fill} transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 font-mono text-[12px] tracking-wide" style={{ color: "var(--color-text)" }}>
        {percent}% - {label}
      </div>
      {raw ? <div className="sr-only">{raw}</div> : null}
    </div>
  );
}

function MarkdownBody({ content }: { content: string }) {
  const cleaned = React.useMemo(() => stripMachineJsonBlocks(content || ""), [content]);
  if (!cleaned) {
    return <p className="text-gray-400 text-xs">No report content available.</p>;
  }

  const lines = cleaned.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  const nextKey = () => `md-${keyCounter++}`;

  const isTableSeparator = (line: string) =>
    /^\s*\|?[\s:|-]+\|?[\s:|-]*\s*$/.test(line) && line.includes("-");

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (they just separate paragraphs)
    if (!trimmed) {
      i++;
      continue;
    }

    // Health bar as its own fenced block or plain ASCII line -> document progress bar
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      // Skip closing fence
      i++;
      const codeText = codeLines.join("\n").trim();
      const barFromCode = codeLines.length <= 4 ? parseHealthBarLine(codeText) : null;
      if (barFromCode) {
        blocks.push(
          <DocumentHealthBar key={nextKey()} percent={barFromCode.percent} label={barFromCode.label} raw={codeText} />
        );
        continue;
      }
      // Fenced code block (non-json, since json stripped above) - clean doc style
      blocks.push(
        <pre
          key={nextKey()}
          className="my-4 overflow-x-auto rounded-lg p-4 text-[12.5px] leading-relaxed font-mono whitespace-pre"
          style={{
            backgroundColor: "var(--color-code-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Standalone ASCII health bar line
    const standaloneBar = parseHealthBarLine(trimmed);
    if (standaloneBar && trimmed.length < 220) {
      blocks.push(
        <DocumentHealthBar key={nextKey()} percent={standaloneBar.percent} label={standaloneBar.label} raw={trimmed} />
      );
      i++;
      continue;
    }

    // Headings - executive document scale (Image 1: bold + hairline rule for H1)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) {
        blocks.push(
          <h1
            key={nextKey()}
            className="mt-1 mb-3 pb-4 text-[24px] sm:text-[28px] font-extrabold tracking-tight leading-[1.25]"
            style={{ color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" }}
          >
            {renderInlineMarkdown(text.replace(/^Executive Summary:\s*/i, ""), `h1-${keyCounter}`)}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2
            key={nextKey()}
            className="mt-8 mb-3 text-[18px] sm:text-[20px] font-bold leading-snug"
            style={{ color: "var(--color-text)" }}
          >
            {renderInlineMarkdown(text, `h2-${keyCounter}`)}
          </h2>
        );
      } else {
        blocks.push(
          <h3
            key={nextKey()}
            className="mt-6 mb-2 text-[15px] sm:text-[16px] font-bold leading-snug"
            style={{ color: "var(--color-text)" }}
          >
            {renderInlineMarkdown(text, `h3-${keyCounter}`)}
          </h3>
        );
      }
      i++;
      continue;
    }

    // Horizontal rule - memo divider
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={nextKey()} className="my-6" style={{ borderColor: "var(--color-border)" }} />);
      i++;
      continue;
    }

    // Consecutive memo header lines (To: / From: / Date: / Subject:) stay stacked
    if (isMemoFieldLine(trimmed)) {
      const memoLines: string[] = [];
      while (i < lines.length && lines[i].trim() && isMemoFieldLine(lines[i])) {
        memoLines.push(lines[i].trim());
        i++;
      }
      blocks.push(<MemoFieldBlock key={nextKey()} fields={memoLines} />);
      continue;
    }

    // Blockquote (group consecutive > lines)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      // Blockquote meta that is really memo fields -> render as memo block
      const unmarked = quoteLines.flatMap((q) => q.split(/  +|\s*<br\s*\/?>\s*/i).map((s) => s.trim()).filter(Boolean));
      if (unmarked.length > 0 && unmarked.every((q) => isMemoFieldLine(q))) {
        blocks.push(<MemoFieldBlock key={nextKey()} fields={unmarked} />);
      } else {
        blocks.push(
          <div
            key={nextKey()}
            className="my-3 rounded-r-lg px-4 py-2.5 text-[14px] leading-[1.7]"
            style={{
              borderLeft: "4px solid var(--color-quote-border)",
              backgroundColor: "var(--color-bg)",
              borderTop: "1px solid var(--color-border)",
              borderRight: "1px solid var(--color-border)",
              borderBottom: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {quoteLines.map((q, qi) => (
              <p key={qi} className="leading-[1.7]">
                {renderInlineMarkdown(q || " ", `q-${keyCounter}-${qi}`)}
              </p>
            ))}
          </div>
        );
      }
      continue;
    }

    // Table: header row + separator row + body rows
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const header = parseRow(trimmed);
      i += 2; // skip header + separator
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        bodyRows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(
        <div
          key={nextKey()}
          className="my-4 overflow-x-auto rounded-lg"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)" }}
        >
          <table className="w-full text-[13.5px] leading-[1.65] border-collapse">
            <thead>
              <tr style={{ backgroundColor: "var(--color-code-bg)" }}>
                {header.map((h, hi) => (
                  <th
                    key={hi}
                    className="text-left font-bold px-4 py-3 align-top"
                    style={{ color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" }}
                  >
                    {renderInlineMarkdown(h, `th-${keyCounter}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} style={ri % 2 === 1 ? { backgroundColor: "var(--color-code-bg)" } : undefined}>
                  {row.map((cell, ci) => {
                    const isFirstCol = ci === 0;
                    const isAlert = /critical|at risk|needs intervention/i.test(cell) && !/no critical|zero/i.test(cell);
                    return (
                      <td
                        key={ci}
                        className={`px-4 py-3 align-top ${isFirstCol ? "font-bold" : isAlert ? "font-bold text-red-600" : ""}`}
                        style={{
                          color: isAlert && !isFirstCol ? undefined : "var(--color-text)",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        {renderInlineMarkdown(cell, `td-${keyCounter}-${ri}-${ci}`)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Unordered list - document discs with hanging indent
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={nextKey()} className="my-3 space-y-2 pl-6 list-disc" style={{ color: "var(--color-text)" }}>
          {items.map((item, ii) => (
            <li key={ii} className="pl-1 text-[14px] leading-[1.75]" style={{ color: "var(--color-text)" }}>
              {renderInlineMarkdown(item, `ul-${keyCounter}-${ii}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list - native decimal to match executive document
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={nextKey()} className="my-3 space-y-2 pl-6 list-decimal" style={{ color: "var(--color-text)" }}>
          {items.map((item, ii) => (
            <li key={ii} className="pl-1 text-[14px] leading-[1.75]" style={{ color: "var(--color-text)" }}>
              {renderInlineMarkdown(item, `ol-${keyCounter}-${ii}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph: group consecutive plain lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("```") &&
      !isMemoFieldLine(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !(lines[i].includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length === 0) {
      // Safety: avoid infinite loop on unhandled line shapes
      paraLines.push(lines[i]?.trim() || "");
      i++;
    }
    // One-line memo header that Gemini emits inline (To: ... From: ... Date: ...)
    const inlineMemo =
      paraLines.length === 1 ? splitInlineMemoFields(paraLines[0]) : null;
    if (inlineMemo) {
      blocks.push(<MemoFieldBlock key={nextKey()} fields={inlineMemo} />);
      continue;
    }
    // Multi-line memo group collapsed by single newlines
    if (paraLines.length > 1 && paraLines.every((l) => isMemoFieldLine(l))) {
      blocks.push(<MemoFieldBlock key={nextKey()} fields={paraLines} />);
      continue;
    }
    const paraText = paraLines.join(" ");
    if (paraText) {
      const barInPara = paraLines.length === 1 ? parseHealthBarLine(paraText) : null;
      if (barInPara && paraText.length < 220) {
        blocks.push(
          <DocumentHealthBar key={nextKey()} percent={barInPara.percent} label={barInPara.label} raw={paraText} />
        );
      } else {
        blocks.push(
          <p
            key={nextKey()}
            className="my-2.5 text-[14px] leading-[1.75]"
            style={{ color: "var(--color-text)", lineHeight: 1.6 }}
          >
            {renderInlineMarkdown(paraText, `p-${keyCounter}`)}
          </p>
        );
      }
    }
  }

  return (
    <div
      className="markdown-body text-[14px]"
      style={{
        ["--color-bg" as string]: "#ffffff",
        ["--color-text" as string]: "#1f2937",
        ["--color-primary" as string]: "#2563eb",
        ["--color-border" as string]: "#e5e7eb",
        ["--color-code-bg" as string]: "#f3f4f6",
        ["--color-quote-border" as string]: "#d1d5db",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.6,
      }}
    >
      {blocks}
    </div>
  );
}

function ChartVisual({ structuredData }: { structuredData: any }) {
  const chartData: Array<{ label: string; value: number; color?: string }> = React.useMemo(() => {
    if (!structuredData) return [];
    if (Array.isArray(structuredData.chartData)) return structuredData.chartData;
    const labels: string[] = structuredData.labels || [];
    const dataset = structuredData.datasets?.[0];
    if (labels.length && dataset && Array.isArray(dataset.data)) {
      const colors: string[] = Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor
        : ["#38BDF8", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
      return labels.map((label, idx) => ({
        label,
        value: Number(dataset.data[idx] || 0),
        color: colors[idx % colors.length],
      }));
    }
    return [];
  }, [structuredData]);

  if (chartData.length === 0) return null;
  const max = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="p-5 border-b border-gray-200 dark:border-[#282A33] bg-gray-50/60 dark:bg-white/[0.02] space-y-3">
      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
        {structuredData.chartTitle || structuredData.title || "Visual Distribution"}
      </h4>
      <div className="space-y-2.5">
        {chartData.map((d, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{d.label}</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{d.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(4, Math.round((d.value / max) * 100))}%`, backgroundColor: d.color || "#3B82F6" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIReportHub({ orgCode }: AIReportHubProps) {
  // State: BYOK & Model
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyVerified, setKeyVerified] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestMessage, setKeyTestMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.7-flash");
  const [customModel, setCustomModel] = useState("");

  // State: Generation Config
  const [activeType, setActiveType] = useState<AIReportType>("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [tone, setTone] = useState<"executive" | "technical" | "action-oriented" | "balanced">("executive");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // State: Active Generated Report
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [importingForm, setImportingForm] = useState(false);
  const [formImportSuccess, setFormImportSuccess] = useState<string | null>(null);

  // State: History / Saved Reports
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // Load API key from localStorage and fetch projects/history on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("taskpms_gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setKeyVerified(true);
    }
    const savedModelPref = localStorage.getItem("taskpms_gemini_model");
    if (savedModelPref) {
      setSelectedModel(savedModelPref);
    }

    fetchProjects();
    fetchHistory();
  }, []);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Projects API returned ${res.status}`);
      }
      const data = await res.json();
      const list = data.projects || data.data || [];
      if (Array.isArray(list)) {
        const cleaned = list
          .map((p: any) => ({
            id: String(p._id || p.id || ""),
            name: String(p.name || "Untitled Project"),
          }))
          .filter((p) => Boolean(p.id));
        setProjects(cleaned);
      } else {
        setProjects([]);
      }
    } catch (err: any) {
      console.warn("Failed to fetch projects for AI scope:", err?.message);
      setProjectsError("Could not load projects. Showing organization-wide scope only.");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/ai/reports?type=${historyFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSavedReports(data.reports || []);
      }
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  // Test Gemini Key
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setKeyTestMessage("Please enter an API key.");
      return;
    }
    setKeyTesting(true);
    setKeyTestMessage("");
    try {
      const res = await fetch("/api/ai/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyVerified(true);
        setKeyTestMessage("✓ API Key successfully verified with Google Gemini!");
        localStorage.setItem("taskpms_gemini_api_key", apiKey);
        localStorage.setItem("taskpms_gemini_model", selectedModel);
      } else {
        setKeyVerified(false);
        setKeyTestMessage(`❌ Verification failed: ${data.message}`);
      }
    } catch (e: any) {
      setKeyVerified(false);
      setKeyTestMessage(`❌ Error: ${e.message}`);
    } finally {
      setKeyTesting(false);
    }
  };

  const handleSaveKeySettings = () => {
    if (apiKey) {
      localStorage.setItem("taskpms_gemini_api_key", apiKey);
    }
    const finalModel = customModel.trim() || selectedModel;
    localStorage.setItem("taskpms_gemini_model", finalModel);
    setShowKeyModal(false);
  };

  // Generate Report
  const handleGenerate = async () => {
    setIsGenerating(true);
    setFormImportSuccess(null);
    const finalModel = customModel.trim() || selectedModel;

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeType,
          scope: selectedProjectId ? `Project: ${projects.find((p) => p.id === selectedProjectId)?.name || "Specific"}` : "All Projects",
          projectId: selectedProjectId || undefined,
          customPrompt,
          tone,
          model: finalModel,
          apiKey: apiKey || undefined,
          saveKey: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setCurrentReport(data.report);
        fetchHistory(); // refresh library
      } else {
        alert(data.error || "Failed to generate AI report.");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Plain Text
  const handleDownloadText = () => {
    if (!currentReport) return;
    const blob = new Blob([currentReport.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentReport.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Markdown
  const handleDownloadMarkdown = () => {
    if (!currentReport) return;
    const blob = new Blob([currentReport.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentReport.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!currentReport) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/ai/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentReport.title,
          category: currentReport.type,
          model: currentReport.model,
          createdAt: currentReport.createdAt,
          metrics: currentReport.metrics,
          content: currentReport.content,
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed on server");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentReport.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Could not download PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Copy Content
  const handleCopy = () => {
    if (!currentReport) return;
    navigator.clipboard.writeText(currentReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Import AI Form into Forms & Surveys
  const handleImportForm = async () => {
    if (!currentReport?.structuredData?.questions) return;
    setImportingForm(true);
    try {
      const res = await fetch("/api/ai/import-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formTitle: currentReport.structuredData.formTitle || currentReport.title,
          formDescription: currentReport.structuredData.formDescription || currentReport.summary,
          questions: currentReport.structuredData.questions,
          targetProjectId: selectedProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormImportSuccess("Form successfully imported! Available in Forms & Surveys.");
      } else {
        alert(data.error || "Failed to import form");
      }
    } catch (e: any) {
      alert("Import error: " + e.message);
    } finally {
      setImportingForm(false);
    }
  };

  // Delete previous report
  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await fetch(`/api/ai/reports/${id}`, { method: "DELETE" });
      setSavedReports((prev) => prev.filter((r) => r.id !== id));
      if (currentReport?.id === id) setCurrentReport(null);
    } catch {}
  };

  // View historical report
  const handleLoadSavedReport = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/reports/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentReport(data.report);
        window.scrollTo({ top: 380, behavior: "smooth" });
      }
    } catch {}
  };

  const TYPE_CARDS = [
    {
      id: "project",
      title: "Project Health & Deadlines",
      desc: "Overall project health, milestone slips, team effort, problems & mitigation solutions",
      icon: FolderKanban,
      color: "from-blue-600 to-cyan-600",
      badge: "Health · Deadlines · Solutions",
    },
    {
      id: "team",
      title: "Team Workload & Capacity",
      desc: "Effort distribution, burnout risk index, velocity metrics, and squad allocation",
      icon: Users,
      color: "from-purple-600 to-indigo-600",
      badge: "Workload · Velocity · Burnout",
    },
    {
      id: "company",
      title: "Company & Executive",
      desc: "Strategic organizational health, OKRs/goals alignment, cross-department scaling",
      icon: Building2,
      color: "from-emerald-600 to-teal-600",
      badge: "Executive · OKRs · Scaling",
    },
    {
      id: "sales",
      title: "Sales Pipeline Velocity",
      desc: "Deal conversion rates, bottleneck stages, win/loss ratio, revenue acceleration",
      icon: BadgeDollarSign,
      color: "from-amber-600 to-orange-600",
      badge: "Pipeline · Win Rate · Deals",
    },
    {
      id: "revenue",
      title: "Revenue & Financial Health",
      desc: "MRR/ARR growth, seat billing forecast, cash flow burn, subscription health",
      icon: TrendingUp,
      color: "from-rose-600 to-pink-600",
      badge: "MRR · ARR · Billings",
    },
    {
      id: "form",
      title: "AI Form & Survey Generator",
      desc: "Generate complete custom form schemas ready for 1-click import into Form Builder",
      icon: FormInput,
      color: "from-sky-600 to-blue-700",
      badge: "Form Schemas · 1-Click Import",
    },
    {
      id: "chart",
      title: "AI Visual Analytics",
      desc: "Extract datasets and visual charts (Bar, Line, Pie) with quantitative interpretation",
      icon: BarChart3,
      color: "from-violet-600 to-purple-800",
      badge: "Visual Charts · Datasets",
    },
    {
      id: "estimation",
      title: "AI Project Estimator",
      desc: "Estimate timelines, story points, hours required, budget USD, and complexity score",
      icon: Calculator,
      color: "from-amber-500 to-yellow-600",
      badge: "Timeline · Budget · Story Points",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 text-[#242424] dark:text-[#E1DFDD]">
      {/* 1. TOP HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-cyan-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AI Intelligence & Reports Hub
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Generate real-time project health audits, team workloads, executive forecasts, custom forms, and timeline estimates powered by Google Gemini (BYOK).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Model Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs flex items-center gap-1.5 font-medium text-gray-200">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{customModel || selectedModel}</span>
            </div>

            {/* BYOK Status Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                apiKey
                  ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? "BYOK Key Active" : "Configure Gemini BYOK"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHOOSE WHAT AI WILL BE USED FOR (Category Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Choose What AI Will Be Used For
          </h2>
          <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">
            {TYPE_CARDS.find((c) => c.id === activeType)?.title}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TYPE_CARDS.map((card) => {
            const Icon = card.icon;
            const isSelected = activeType === card.id;

            return (
              <button
                key={card.id}
                onClick={() => setActiveType(card.id as AIReportType)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#1E293B] text-white border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/40"
                    : "bg-white dark:bg-[#1A1C22] border-gray-200 dark:border-[#2A2C35] hover:border-gray-400 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${card.color} text-white shadow-md`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm mb-1">{card.title}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">
                    {card.badge}
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GENERATION CONFIGURATION & PROMPT BAR */}
      <div className="bg-white dark:bg-[#16171D] border border-gray-200 dark:border-[#282A33] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Target Scope */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
              Project Scope {projects.length > 0 && <span className="normal-case font-semibold">({projects.length} available)</span>}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={projectsLoading}
              className="w-full text-xs rounded-xl bg-gray-50 dark:bg-[#111216] border border-gray-200 dark:border-[#2C2E38] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 disabled:opacity-60"
            >
              <option value="">
                {projectsLoading ? "Loading projects..." : "All Projects (Whole Organization)"}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {projectsError ? (
              <p className="mt-1 flex items-center gap-1">
                <span className="text-[11px] text-amber-600 dark:text-amber-400">{projectsError}</span>
                <button
                  type="button"
                  onClick={fetchProjects}
                  className="underline hover:text-blue-500 text-[11px] font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </p>
            ) : !projectsLoading && projects.length === 0 ? (
              <p className="mt-1 text-[11px] text-gray-400">
                No projects found — reports will cover the whole organization.
              </p>
            ) : null}
          </div>

          {/* Gemini Model Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
              Gemini Model (BYOK)
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setCustomModel("");
              }}
              className="w-full text-xs rounded-xl bg-gray-50 dark:bg-[#111216] border border-gray-200 dark:border-[#2C2E38] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            >
              {SUPPORTED_GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="custom">Custom Model ID...</option>
            </select>
          </div>

          {/* Tone / Output Format */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
              Report Tone & Focus
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full text-xs rounded-xl bg-gray-50 dark:bg-[#111216] border border-gray-200 dark:border-[#2C2E38] px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="executive">Executive Summary (High-Level KPIs & Strategy)</option>
              <option value="action-oriented">Action-Oriented (Problems, Blockers & Mitigations)</option>
              <option value="technical">Technical Deep-Dive (Sprint Velocity & Engineering)</option>
              <option value="balanced">Balanced Comprehensive</option>
            </select>
          </div>
        </div>

        {selectedModel === "custom" && (
          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 block">
              Custom Gemini Model Identifier:
            </label>
            <input
              type="text"
              placeholder="e.g. gemini-3.7-flash-preview or gemini-exp"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              className="w-full text-xs rounded-xl bg-gray-50 dark:bg-[#111216] border border-gray-200 dark:border-[#2C2E38] px-3 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {/* Custom Goals / Questions Prompt */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 block">
            Custom Goals & Specific Questions (Optional)
          </label>
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Focus on next month's launch schedule, explain why tasks in design squad are delayed, and propose 3 concrete recovery steps..."
            className="w-full text-xs rounded-xl bg-gray-50 dark:bg-[#111216] border border-gray-200 dark:border-[#2C2E38] p-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Aggregates live projects, tasks, goals & forms context automatically</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Workspace with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {TYPE_CARDS.find((c) => c.id === activeType)?.title}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. ACTIVE REPORT RESULTS VIEW */}
      {currentReport && (
        <div className="bg-white dark:bg-[#16171D] border border-gray-200 dark:border-[#282A33] rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50">
          {/* Executive Header & Export Toolbar */}
          <div className="p-5 border-b border-gray-200 dark:border-[#282A33] bg-gray-50/50 dark:bg-[#1A1C24] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  {currentReport.type} report
                </span>
                <span className="text-xs text-gray-400">· Model: {currentReport.model}</span>
                {currentReport.isByok && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    BYOK
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentReport.title}
              </h3>
            </div>

            {/* Download Buttons: PDF, Text, Markdown, Copy */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                title="Download formatted executive PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>

              <button
                onClick={handleDownloadText}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#252833] hover:bg-gray-200 dark:hover:bg-[#2E313D] text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Plain Text (.txt)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Text (.txt)</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#252833] hover:bg-gray-200 dark:hover:bg-[#2E313D] text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download Markdown (.md)"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Markdown (.md)</span>
              </button>

              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-gray-100 dark:bg-[#252833] hover:bg-gray-200 dark:hover:bg-[#2E313D] text-gray-500 hover:text-white transition-colors cursor-pointer"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quantitative Metrics Cards */}
          {currentReport.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[#0F1117] text-white border-b border-[#282A33]">
              {/* Health Score */}
              <div className="p-3.5 rounded-xl bg-[#161822] border border-[#262838]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Project Health
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-black ${
                      (currentReport.metrics.healthScore ?? 80) >= 75
                        ? "text-emerald-400"
                        : (currentReport.metrics.healthScore ?? 80) >= 50
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {currentReport.metrics.healthScore ?? 80}%
                  </span>
                  <span className="text-xs font-semibold text-gray-300">
                    {currentReport.metrics.healthStatus || "On Track"}
                  </span>
                </div>
              </div>

              {/* Deadlines Overdue */}
              <div className="p-3.5 rounded-xl bg-[#161822] border border-[#262838]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Overdue Deadlines
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-black ${
                      (currentReport.metrics.deadlinesOverdue ?? 0) > 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {currentReport.metrics.deadlinesOverdue ?? 0}
                  </span>
                  <span className="text-xs text-gray-400">
                    / {currentReport.metrics.deadlinesTotal ?? 0} tracked
                  </span>
                </div>
              </div>

              {/* Problems & Solutions */}
              <div className="p-3.5 rounded-xl bg-[#161822] border border-[#262838]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Problems & Solutions
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-cyan-400">
                    {currentReport.metrics.problemsIdentified ?? 0}
                  </span>
                  <span className="text-xs text-gray-400">
                    probs · {currentReport.metrics.solutionsProposed ?? 0} solutions
                  </span>
                </div>
              </div>

              {/* Team Effort / Velocity */}
              <div className="p-3.5 rounded-xl bg-[#161822] border border-[#262838]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Team Effort Score
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-400">
                    {currentReport.metrics.teamEffortScore ?? 75}%
                  </span>
                  <span className="text-xs text-gray-400">Capacity active</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Generator Specific Preview & 1-Click Import */}
          {currentReport.type === "form" && currentReport.structuredData?.questions && (
            <div className="p-5 bg-blue-50/40 dark:bg-[#141B2D] border-b border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">
                    AI Form Schema Preview ({currentReport.structuredData.questions.length} Questions)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ready to be imported directly into TaskPMS Forms & Surveys Builder
                  </p>
                </div>

                <button
                  onClick={handleImportForm}
                  disabled={importingForm}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <FormInput className="w-4 h-4" />
                  <span>{importingForm ? "Importing Form..." : "Import into Form Builder"}</span>
                </button>
              </div>

              {formImportSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formImportSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {currentReport.structuredData.questions.map((q: any, idx: number) => (
                  <div
                    key={q.id || idx}
                    className="p-3 rounded-lg bg-white dark:bg-[#1A1F30] border border-gray-200 dark:border-gray-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {idx + 1}. {q.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono text-gray-500">
                        {q.type}
                      </span>
                    </div>
                    {q.options && (
                      <div className="text-[10px] text-gray-400">
                        Options: {q.options.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart Visual Analytics Preview */}
          {currentReport.type === "chart" && currentReport.structuredData && (
            <ChartVisual structuredData={currentReport.structuredData} />
          )}

          {/* Formatted Markdown Content Body - clean executive document (Image 1) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#1f2937",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                maxWidth: "860px",
                margin: "0 auto",
                padding: "2rem 1.5rem",
                backgroundColor: "#ffffff",
                color: "#1f2937",
              }}
            >
              <MarkdownBody content={currentReport.content || ""} />
            </div>
          </div>
        </div>
      )}

      {/* 5. SAVED REPORTS LIBRARY */}
      <div className="bg-white dark:bg-[#16171D] border border-gray-200 dark:border-[#282A33] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Saved Reports & Intelligence Archive</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Review and re-download previously generated reports in PDF or Text format
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={historyFilter}
              onChange={(e) => {
                setHistoryFilter(e.target.value);
                setTimeout(fetchHistory, 50);
              }}
              className="text-xs rounded-lg bg-gray-50 dark:bg-[#1A1C24] border border-gray-200 dark:border-[#282A33] px-2.5 py-1.5"
            >
              <option value="all">All Report Types</option>
              <option value="project">Project Health</option>
              <option value="team">Team Workload</option>
              <option value="company">Company Executive</option>
              <option value="sales">Sales Pipeline</option>
              <option value="revenue">Revenue Audit</option>
              <option value="form">AI Forms</option>
              <option value="estimation">Estimations</option>
            </select>

            <button
              onClick={fetchHistory}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-white transition-colors cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {savedReports.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 dark:border-[#282A33] rounded-xl text-gray-400 text-xs">
            No previous reports generated yet. Select a category above and generate your first report!
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {savedReports.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                      {item.type}
                    </span>
                    <h4
                      onClick={() => handleLoadSavedReport(item.id)}
                      className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 hover:text-blue-500 cursor-pointer truncate"
                    >
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-xl">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>Model: {item.model}</span>
                    <span>·</span>
                    <span>Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.metrics?.healthScore !== undefined && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          Health: {item.metrics.healthScore}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleLoadSavedReport(item.id)}
                    className="px-2.5 py-1 rounded bg-gray-100 dark:bg-[#252833] hover:bg-gray-200 dark:hover:bg-[#2E313D] text-[11px] font-semibold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    View
                  </button>

                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/ai/reports/${item.id}`);
                      if (res.ok) {
                        const data = await res.json();
                        const blob = new Blob([data.report.content], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Download Text"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteReport(item.id)}
                    className="p-1.5 rounded hover:bg-rose-950/40 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. BYOK GOOGLE GEMINI CONFIGURATION MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-[#16171E] border border-blue-500/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Google Gemini BYOK Setup</h3>
                  <p className="text-[11px] text-gray-400">Bring Your Own Key for Next-Gen Models</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyVerified(false);
                    setKeyTestMessage("");
                  }}
                  className="w-full text-xs font-mono rounded-xl bg-[#0F1015] border border-[#2D303C] px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Stored securely per company & browser session</span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Get Free Gemini Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">
                  Default Gemini Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[#0F1015] border border-[#2D303C] px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {SUPPORTED_GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {keyTestMessage && (
                <div
                  className={`p-2.5 rounded-lg text-[11px] font-semibold border ${
                    keyVerified
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/15 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {keyTestMessage}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-800">
              <button
                onClick={handleTestKey}
                disabled={keyTesting}
                className="px-3.5 py-2 rounded-xl bg-[#232530] hover:bg-[#2C2E3C] text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {keyTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
                <span>Test Connection</span>
              </button>

              <button
                onClick={handleSaveKeySettings}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Save & Set Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
