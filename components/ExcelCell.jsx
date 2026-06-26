"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { parseCSV, isNA, inferNumericColumns } from "../lib/csv";
import { evaluateFormula } from "../lib/formula";
import { compareResults } from "../lib/grading";
import { explainError } from "../lib/errors";

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

// Build a 1-indexed-by-convention grid: grid[0] = headers (row 1), data from row 2.
function buildGrid(dataset) {
  const parsed = parseCSV(dataset.tables[dataset.primary]);
  const numeric = inferNumericColumns(parsed);
  const rows = parsed.rows.map((r) =>
    r.map((cell, c) => {
      if (isNA(cell)) return null;
      return numeric[c] ? Number(cell) : cell;
    })
  );
  return [parsed.headers, ...rows];
}

function fmt(v) {
  if (v == null) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 10000) / 10000);
  return String(v);
}

const ExcelCell = forwardRef(function ExcelCell({ task, dataset, onPassed, onBusy }, ref) {
  const spec = task.modes.excel;
  const grid = useMemo(() => buildGrid(dataset), [dataset]);
  const [formula, setFormula] = useState(spec.starter);
  const [output, setOutput] = useState(null); // { value } | { error, explain }
  const [check, setCheck] = useState(null);

  useEffect(() => {
    setFormula(spec.starter);
    setOutput(null);
    setCheck(null);
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function evalSafe(src) {
    return evaluateFormula(src, grid);
  }

  function run() {
    setCheck(null);
    try {
      const value = evalSafe(formula);
      setOutput({ value });
    } catch (err) {
      const raw = String(err?.message || err);
      setOutput({ error: raw, explain: explainError("excel", raw) });
    }
  }

  function checkAnswer() {
    try {
      const value = evalSafe(formula);
      setOutput({ value });
      const expected = evalSafe(spec.solution);
      const verdict = compareResults(
        { kind: "scalar", value },
        { kind: "scalar", value: expected },
        false
      );
      setCheck(verdict);
      if (verdict.pass) onPassed?.({ kind: "scalar", value });
    } catch (err) {
      const raw = String(err?.message || err);
      setOutput({ error: raw, explain: explainError("excel", raw) });
      setCheck({ pass: false, reason: "Fix the formula error above, then check again." });
    }
  }

  function reset() {
    setFormula(spec.starter);
    setOutput(null);
    setCheck(null);
  }

  useImperativeHandle(ref, () => ({ run, check: checkAnswer, reset }));

  const headers = grid[0];
  const dataRows = grid.slice(1);

  return (
    <section className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-xlmode/10 border-b border-line">
        <p className="text-xs font-bold uppercase tracking-wide text-xlmode">Excel · formula bar</p>
        <button
          onClick={run}
          className="btn-3d bg-xlmode text-white text-xs font-extrabold rounded-lg px-3 py-1.5"
        >
          Evaluate
        </button>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-paper">
        <span className="font-mono text-xs font-bold text-inkmute italic shrink-0">fx</span>
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          spellCheck={false}
          className="w-full font-mono text-sm bg-white border border-line rounded-lg px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-xlmode/40"
          placeholder='Type a formula, e.g. =SUM(F2:F25)'
          aria-label="Formula input"
        />
      </div>

      {/* Read-only grid */}
      <div className="overflow-auto max-h-72">
        <table className="text-[12.5px] font-mono border-collapse w-full">
          <thead className="sticky top-0">
            <tr>
              <th className="bg-paper border border-line px-2 py-1 text-inkmute font-bold w-10"></th>
              {headers.map((_, c) => (
                <th key={c} className="bg-paper border border-line px-2 py-1 text-inkmute font-bold text-center min-w-[80px]">
                  {colLetter(c)}
                </th>
              ))}
            </tr>
            <tr>
              <th className="bg-paper border border-line px-2 py-1 text-inkmute font-bold text-center">1</th>
              {headers.map((h, c) => (
                <th key={c} className="bg-xlmode/10 border border-line px-2 py-1 text-ink font-bold text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, r) => (
              <tr key={r}>
                <td className="bg-paper border border-line px-2 py-1 text-inkmute font-bold text-center">{r + 2}</td>
                {row.map((cell, c) => (
                  <td key={c} className={`border border-line px-2 py-1 ${cell == null ? "text-flame" : ""}`}>
                    {cell == null ? "∅" : fmt(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(output || check) && (
        <div className="px-4 py-3 border-t border-line">
          {check && (
            <div
              className={`animate-pop mb-2 rounded-xl px-3 py-2 text-sm font-bold flex items-start gap-2
                ${check.pass ? "bg-sprout-soft text-sprout-dark" : "bg-flame/10 text-flame"}`}
              role="status"
            >
              <span>{check.pass ? "✅" : "✗"}</span>
              <span>
                {check.pass ? "Correct! Nicely done." : check.reason}
                {!check.pass && <span className="block font-normal text-xs mt-0.5">Stuck? Try a hint in the panel on the right.</span>}
              </span>
            </div>
          )}
          {output && "value" in output && (
            <div>
              <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-1">Result</p>
              <span className="inline-block animate-pop rounded-xl bg-xlmode/10 text-xlmode font-mono font-bold text-lg px-4 py-1.5">
                {fmt(output.value)}
              </span>
            </div>
          )}
          {output?.error && (
            <div className="rounded-xl bg-flame/5 border border-flame/30 px-3 py-2.5">
              <p className="font-mono text-[12.5px] text-flame">{output.error}</p>
              {output.explain && (
                <p className="text-[13px] leading-relaxed mt-1.5">
                  <span className="font-bold">In plain English:</span> {output.explain}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
});

export default ExcelCell;
