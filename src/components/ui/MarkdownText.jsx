"use client";

import { Fragment } from "react";

// ─── Inline style tokens ───────────────────────────────────────────────────
const INLINE_CODE = {
  fontFamily: "monospace",
  fontSize: "0.9em",
  backgroundColor: "#f3f0ff",
  color: "#7c3aed",
  padding: "1px 5px",
  borderRadius: "4px",
  border: "1px solid #ddd6fe",
};

const CODE_BLOCK = {
  fontFamily: "monospace",
  fontSize: "11.5px",
  lineHeight: "1.6",
  backgroundColor: "#111827",
  color: "#f8fafc",
  padding: "10px 12px",
  borderRadius: "8px",
  overflowX: "auto",
  margin: "6px 0",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const CODE_BLOCK_LABEL = {
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#7c3aed",
  marginBottom: "3px",
};

const LINK_STYLE = { color: "#7c3aed", textDecoration: "underline", cursor: "pointer" };

// ─── Inline renderer: inline code → bold → italic / strikethrough / links ──
function renderInline(text, key) {
  const out = [];
  text.split(/(`[^`\n]+`)/g).forEach((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      out.push(
        <code key={`${key}c${i}`} style={INLINE_CODE}>
          {part.slice(1, -1)}
        </code>
      );
    } else if (part) {
      out.push(...renderRich(part, `${key}${i}_`));
    }
  });
  return out;
}

function renderRich(text, key) {
  const out = [];
  text.split(/(\*\*[^*\n]+\*\*)/g).forEach((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      out.push(
        <strong key={`${key}b${i}`} style={{ fontWeight: 700, color: "#111827" }}>
          {renderLight(part.slice(2, -2), `${key}b${i}_`)}
        </strong>
      );
    } else if (part) {
      out.push(...renderLight(part, `${key}${i}_`));
    }
  });
  return out;
}

function renderLight(text, key) {
  const out = [];
  text.split(/(~~[^~\n]+~~|\*[^*\n]+\*|\[[^\]]+\]\([^)]*\))/g).forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      out.push(
        <s key={`${key}s${i}`} style={{ textDecoration: "line-through", opacity: 0.75 }}>
          {part.slice(2, -2)}
        </s>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      out.push(<em key={`${key}e${i}`}>{part.slice(1, -1)}</em>);
    } else {
      const m = part.match(/^\[([^\]]+)\]\(([^)]*)\)$/);
      if (m) {
        // Only allow safe link schemes (blocks javascript: etc. XSS vectors)
        const rawUrl = m[2];
        const safeUrl = /^(https?:|mailto:)/i.test(rawUrl) ? rawUrl : "#";
        out.push(
          <a key={`${key}a${i}`} href={safeUrl} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>
            {m[1]}
          </a>
        );
      } else {
        out.push(<Fragment key={`${key}t${i}`}>{part}</Fragment>);
      }
    }
  });
  return out;
}

// ─── Block renderer ────────────────────────────────────────────────────────
function renderBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^\s*(```|~~~)/.test(line)) {
      const fenceMatch = line.match(/^\s*(```|~~~)\s*([\w-]*)\s*$/);
      const lang = fenceMatch ? fenceMatch[2] : "";
      let j = i + 1;
      const codeLines = [];
      while (j < lines.length && !/^\s*(```|~~~)\s*$/.test(lines[j])) {
        codeLines.push(lines[j]);
        j++;
      }
      blocks.push(
        <div key={`b${blocks.length}`} style={{ margin: "6px 0" }}>
          {lang && <div style={CODE_BLOCK_LABEL}>{lang}</div>}
          <pre style={CODE_BLOCK}>
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
      i = j + 1;
      continue;
    }

    // Headers
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      blocks.push(
        <div
          key={`b${blocks.length}`}
          style={{
            fontWeight: 700,
            color: "#111827",
            fontSize: `${Math.max(13, 17 - level)}px`,
            margin: "8px 0 4px",
            lineHeight: 1.4,
          }}
        >
          {renderInline(h[2], `h${blocks.length}_`)}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(
        <hr key={`b${blocks.length}`} style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />
      );
      i++;
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <div
          key={`b${blocks.length}`}
          style={{ borderLeft: "3px solid #ddd6fe", padding: "2px 0 2px 10px", margin: "6px 0", color: "#4b5563" }}
        >
          {quoteLines.map((ql, qi) => (
            <div key={qi}>{renderInline(ql, `q${blocks.length}_${qi}_`)}</div>
          ))}
        </div>
      );
      continue;
    }

    // Blank line → spacing
    if (!line.trim()) {
      blocks.push(<div key={`b${blocks.length}`} style={{ height: "6px" }} />);
      i++;
      continue;
    }

    // Bullet list
    const bullet = line.match(/^\s*([-*•])\s+(.*)$/);
    if (bullet) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*•])\s+(.*)$/);
        if (!m) break;
        items.push(m[2]);
        i++;
      }
      blocks.push(
        <div key={`b${blocks.length}`} style={{ display: "flex", flexDirection: "column", gap: "3px", margin: "4px 0" }}>
          {items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", flexShrink: 0, marginTop: 1 }}>•</span>
              <span>{renderInline(item, `ul${blocks.length}_${ii}_`)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Numbered list
    const num = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (num) {
      const items = [];
      let counter = parseInt(num[1], 10);
      while (i < lines.length) {
        const m = lines[i].match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (!m) break;
        items.push({ num: parseInt(m[1], 10) || counter, text: m[2] });
        counter++;
        i++;
      }
      blocks.push(
        <div key={`b${blocks.length}`} style={{ display: "flex", flexDirection: "column", gap: "3px", margin: "4px 0" }}>
          {items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
              <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0, minWidth: "16px" }}>{item.num}.</span>
              <span>{renderInline(item.text, `ol${blocks.length}_${ii}_`)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Regular paragraph (group consecutive non-block lines)
    const isBlockStart = (l) =>
      /^\s*(```|~~~|>\s?|#{1,6}\s|[-*•]\s|\d+[.)]\s)/.test(l) || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l);
    let paraLines = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length === 0) {
      paraLines = [lines[i]];
      i++;
    }
    blocks.push(
      <div key={`b${blocks.length}`} style={{ margin: "2px 0" }}>
        {paraLines.map((pl, pi) => (
          <div key={pi} style={pi > 0 ? { marginTop: "4px" } : undefined}>
            {renderInline(pl, `p${blocks.length}_${pi}_`)}
          </div>
        ))}
      </div>
    );
  }

  return blocks;
}

// ─── Public component ──────────────────────────────────────────────────────
export default function MarkdownText({ text = "", style }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: "1.7", wordBreak: "break-word", ...style }}>
      {renderBlocks(String(text))}
    </div>
  );
}
