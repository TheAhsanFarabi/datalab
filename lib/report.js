// Builds a self-contained HTML report from the learner's own capstone answers
// and triggers a download. Print-to-PDF friendly.

import { BADGES } from "./progress";

function fmtResult(res) {
  if (!res) return "<em>—</em>";
  if (res.kind === "scalar") return `<strong>${Array.isArray(res.value) ? res.value.join(" × ") : res.value}</strong>`;
  const head = res.cols.map((c) => `<th>${c}</th>`).join("");
  const body = res.rows
    .map((r) => `<tr>${r.map((v) => `<td>${v ?? "—"}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function downloadReport(progress) {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const badgeList = progress.badges
    .map((id) => BADGES.find((b) => b.id === id))
    .filter(Boolean)
    .map((b) => `<span class="badge">${b.icon} ${b.name}</span>`)
    .join(" ");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>DataLab Capstone Report</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:48px auto;padding:0 24px;color:#21303F;line-height:1.6}
  h1{font-family:Verdana,sans-serif;font-size:26px;border-bottom:3px solid #2FAE60;padding-bottom:8px}
  h2{font-family:Verdana,sans-serif;font-size:16px;margin-top:28px}
  .meta{color:#5C6B7A;font-size:14px}
  table{border-collapse:collapse;margin:8px 0;font-size:14px;font-family:Verdana,sans-serif}
  th,td{border:1px solid #D8D7CC;padding:6px 12px;text-align:left}
  th{background:#F3F6EE}
  .badge{display:inline-block;background:#E4F6EB;border:1px solid #2FAE60;border-radius:999px;padding:3px 12px;font-family:Verdana,sans-serif;font-size:13px;margin:2px}
  .pill{background:#FDF1DC;border:1px solid #E8930C;border-radius:8px;padding:12px 16px;font-size:14px}
</style></head><body>
<h1>February Orders — Mini Case Study</h1>
<p class="meta">Prepared in DataLab · ${date} · Solved with SQL, Python (pandas) and spreadsheet formulas, all in the browser</p>

<h2>1 · Clean delivered revenue (SQL)</h2>
<p>After removing a duplicate order and ignoring missing amounts, total revenue from delivered orders:</p>
${fmtResult(progress.capstoneResults["cap-sql"])}

<h2>2 · Top customers (Python / pandas)</h2>
<p>The three customers responsible for the most delivered revenue:</p>
${fmtResult(progress.capstoneResults["cap-python"])}

<h2>3 · Return rate (Excel)</h2>
<p>Share of order rows marked as returned:</p>
${fmtResult(progress.capstoneResults["cap-excel"])}

<h2>Method note</h2>
<p class="pill">The raw orders table contained one exact duplicate row and two missing amounts.
Aggregates were computed after deduplication; missing values were excluded rather than imputed.</p>

<h2>Learner progress</h2>
<p>Total XP: <strong>${progress.xp}</strong> · Current streak: <strong>${progress.streak} day${progress.streak === 1 ? "" : "s"}</strong></p>
<p>${badgeList || "—"}</p>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "datalab-capstone-report.html";
  a.click();
  URL.revokeObjectURL(a.href);
}
