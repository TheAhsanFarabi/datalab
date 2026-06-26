// Small markdown renderer for notebook notes. Covers headings, bold, italic,
// inline code, fenced code blocks, lists, links, and paragraphs. Input is
// escaped first, so raw HTML in a cell never executes.

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer" class="md-link">$1</a>');
}

export function renderMarkdown(src) {
  const lines = esc(String(src || "")).split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++; // closing fence
      out.push(`<pre class="md-pre"><code>${buf.join("\n")}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl} class="md-h${lvl}">${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul class="md-ul">${items.join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol class="md-ol">${items.join("")}</ol>`);
      continue;
    }

    if (line.trim() === "") { i++; continue; }

    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,4}\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      buf.push(lines[i++]);
    }
    out.push(`<p class="md-p">${inline(buf.join(" "))}</p>`);
  }

  return out.join("");
}
