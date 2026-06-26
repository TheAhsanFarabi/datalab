"use client";
import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { csvToGrid } from "../../lib/csv";
import { renderMarkdown } from "../../lib/markdown";
import { downloadResultCSV, downloadResultXLSX } from "../../lib/xlsxio";
import ResultView from "../ResultView";

const TYPE_META = {
  python: { label: "Python", cls: "text-pymode", bar: "bg-pymode" },
  sql: { label: "SQL", cls: "text-sqlmode", bar: "bg-sqlmode" },
  excel: { label: "Grid", cls: "text-xlmode", bar: "bg-xlmode" },
  markdown: { label: "Markdown", cls: "text-inkmute", bar: "bg-inkmute" }
};

function colLetter(i) {
  let s = "";
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function fmtCell(v) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000);
  return String(v);
}

function OutputActions({ result, name }) {
  if (!result || result.kind !== "table") return null;
  return (
    <div className="flex gap-2 mt-1.5">
      <button onClick={() => downloadResultCSV(result, `${name}.csv`)}
        className="text-[11px] font-bold text-inkmute hover:text-ink border border-line rounded-lg px-2 py-0.5 bg-white">
        ⬇ CSV
      </button>
      <button onClick={() => downloadResultXLSX(result, `${name}.xlsx`)}
        className="text-[11px] font-bold text-inkmute hover:text-ink border border-line rounded-lg px-2 py-0.5 bg-white">
        ⬇ XLSX
      </button>
    </div>
  );
}

function MiniGrid({ csv }) {
  const grid = useMemo(() => csvToGrid(csv), [csv]);
  const headers = grid[0];
  const rows = grid.slice(1);
  return (
    <div className="overflow-auto max-h-56 border-t border-line">
      <table className="text-[12px] font-mono border-collapse w-full">
        <thead className="sticky top-0">
          <tr>
            <th className="bg-paper border border-line px-2 py-0.5 w-9"></th>
            {headers.map((_, c) => (
              <th key={c} className="bg-paper border border-line px-2 py-0.5 text-inkmute font-bold text-center min-w-[72px]">{colLetter(c)}</th>
            ))}
          </tr>
          <tr>
            <th className="bg-paper border border-line px-2 py-0.5 text-inkmute font-bold text-center">1</th>
            {headers.map((h, c) => (
              <th key={c} className="bg-xlmode/10 border border-line px-2 py-0.5 text-ink font-bold text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className="bg-paper border border-line px-2 py-0.5 text-inkmute font-bold text-center">{r + 2}</td>
              {row.map((v, c) => (
                <td key={c} className={`border border-line px-2 py-0.5 ${v == null ? "text-flame" : ""}`}>
                  {v == null ? "∅" : fmtCell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Cell({ cell, tables, busy, onChange, onRun, onDelete, onMove, isFirst, isLast }) {
  const meta = TYPE_META[cell.type];
  const tableNames = Object.keys(tables);
  const [editingMd, setEditingMd] = useState(cell.type === "markdown" && !cell.source.trim());

  const set = (patch) => onChange({ ...cell, ...patch });

  const gridTable = cell.type === "excel"
    ? (cell.meta?.table && tables[cell.meta.table] != null ? cell.meta.table : tableNames[0])
    : null;

  return (
    <section className="group relative rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar} opacity-60`} />

      {/* Cell toolbar */}
      <div className="flex items-center gap-2 pl-4 pr-3 py-1.5 border-b border-line bg-paper/60">
        <span className={`text-[11px] font-extrabold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
        {cell.type === "excel" && tableNames.length > 0 && (
          <select
            value={gridTable || ""}
            onChange={(e) => set({ meta: { ...cell.meta, table: e.target.value }, output: null })}
            className="text-[11px] font-bold border border-line rounded-lg px-1.5 py-0.5 bg-white"
          >
            {tableNames.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button title="Move up" disabled={isFirst} onClick={() => onMove(-1)}
            className="px-1.5 py-0.5 rounded-lg text-inkmute hover:bg-line/60 disabled:opacity-30 text-sm">↑</button>
          <button title="Move down" disabled={isLast} onClick={() => onMove(1)}
            className="px-1.5 py-0.5 rounded-lg text-inkmute hover:bg-line/60 disabled:opacity-30 text-sm">↓</button>
          <button title="Delete cell" onClick={onDelete}
            className="px-1.5 py-0.5 rounded-lg text-flame hover:bg-flame/10 text-sm">✕</button>
        </div>
        {cell.type !== "markdown" && (
          <button
            onClick={onRun}
            disabled={busy}
            className={`btn-3d ${meta.bar} text-white text-[11px] font-extrabold rounded-lg px-2.5 py-1 disabled:opacity-50`}
          >
            {busy ? "Running…" : "▶ Run"}
          </button>
        )}
      </div>

      {/* Body */}
      {(cell.type === "python" || cell.type === "sql") && (
        <CodeMirror
          value={cell.source}
          onChange={(v) => set({ source: v })}
          extensions={[cell.type === "python" ? python() : sql()]}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
        />
      )}

      {cell.type === "excel" && (
        tableNames.length === 0 ? (
          <p className="px-4 py-3 text-sm text-inkmute">Upload a CSV or XLSX file to use a grid cell.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-paper">
              <span className="font-mono text-xs font-bold text-inkmute italic shrink-0">fx</span>
              <input
                value={cell.source}
                onChange={(e) => set({ source: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") onRun(); }}
                spellCheck={false}
                placeholder='e.g. =AVERAGEIF(C2:C100, ">0")'
                className="w-full font-mono text-sm bg-white border border-line rounded-lg px-3 py-1.5
                           focus:outline-none focus:ring-2 focus:ring-xlmode/40"
              />
            </div>
            <MiniGrid csv={tables[gridTable]} />
          </>
        )
      )}

      {cell.type === "markdown" && (
        editingMd ? (
          <textarea
            autoFocus
            value={cell.source}
            onChange={(e) => set({ source: e.target.value })}
            onBlur={() => setEditingMd(false)}
            rows={Math.max(3, cell.source.split("\n").length + 1)}
            className="w-full font-mono text-[13px] px-4 py-3 bg-white focus:outline-none resize-y"
            placeholder="Write markdown notes…"
          />
        ) : (
          <div
            onDoubleClick={() => setEditingMd(true)}
            title="Double-click to edit"
            className="md-body px-5 py-3.5 cursor-text min-h-[44px]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(cell.source) || '<p class="md-p" style="opacity:.5">Double-click to write notes…</p>' }}
          />
        )
      )}

      {/* Output */}
      {cell.type !== "markdown" && cell.output && (
        <div className="px-4 py-3 border-t border-line">
          {cell.output.stdout ? (
            <pre className="font-mono text-[12.5px] whitespace-pre-wrap bg-paper rounded-xl px-3 py-2 mb-2 max-h-48 overflow-auto">{cell.output.stdout}</pre>
          ) : null}
          {cell.output.error ? (
            <div className="rounded-xl bg-flame/5 border border-flame/30 px-3 py-2.5">
              <p className="font-mono text-[12.5px] text-flame whitespace-pre-wrap break-words">{cell.output.error}</p>
              {cell.output.explain && (
                <p className="text-[13px] leading-relaxed mt-1.5">
                  <span className="font-bold">In plain English:</span> {cell.output.explain}
                </p>
              )}
            </div>
          ) : null}
          {cell.output.result ? (
            <>
              <ResultView result={cell.output.result} />
              {cell.output.truncated ? (
                <p className="text-[11px] text-inkmute mt-1">Output captured for the first 500 of {cell.output.truncated} rows. Downloads export the captured rows.</p>
              ) : null}
              <OutputActions result={cell.output.result} name={cell.type === "sql" ? "query_result" : "output"} />
            </>
          ) : null}
          {cell.output.value !== undefined ? (
            <span className="inline-block rounded-xl bg-xlmode/10 text-xlmode font-mono font-bold text-lg px-4 py-1.5">
              {fmtCell(cell.output.value)}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
