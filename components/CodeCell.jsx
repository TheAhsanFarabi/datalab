"use client";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { runPython, runSQL } from "../lib/engines";
import { compareResults } from "../lib/grading";
import { explainError } from "../lib/errors";
import ResultView from "./ResultView";

const RUN_LABEL = { python: "Run Python", sql: "Run query" };
const RUN_CLASS = { python: "bg-pymode", sql: "bg-sqlmode" };

const CodeCell = forwardRef(function CodeCell({ task, mode, dataset, onStatus, onPassed, onBusy }, ref) {
  const spec = task.modes[mode];
  const [code, setCode] = useState(spec.starter);
  const [output, setOutput] = useState(null); // { result } | { error, explain }
  const [check, setCheck] = useState(null); // { pass, reason }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCode(spec.starter);
    setOutput(null);
    setCheck(null);
  }, [task.id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (src) => (mode === "python" ? runPython(src, dataset, onStatus) : runSQL(src, dataset, onStatus));

  async function run() {
    setBusy(true); onBusy?.(true);
    setCheck(null);
    try {
      const result = await exec(code);
      setOutput({ result });
    } catch (err) {
      const raw = err?.message === "__no_result__" ? "__no_result__" : String(err?.message || err);
      setOutput({
        error: raw === "__no_result__" ? null : raw,
        explain: explainError(mode, raw)
      });
    } finally {
      setBusy(false); onBusy?.(false); onStatus?.(null);
    }
  }

  async function checkAnswer() {
    setBusy(true); onBusy?.(true);
    try {
      const result = await exec(code);
      setOutput({ result });
      const expected = await exec(spec.solution);
      const verdict = compareResults(result, expected, task.orderMatters);
      setCheck(verdict);
      if (verdict.pass) onPassed?.(result);
    } catch (err) {
      const raw = err?.message === "__no_result__" ? "__no_result__" : String(err?.message || err);
      setOutput({ error: raw === "__no_result__" ? null : raw, explain: explainError(mode, raw) });
      setCheck({ pass: false, reason: "Fix the error above, then check again." });
    } finally {
      setBusy(false); onBusy?.(false); onStatus?.(null);
    }
  }

  function reset() {
    setCode(spec.starter);
    setOutput(null);
    setCheck(null);
  }

  useImperativeHandle(ref, () => ({ run, check: checkAnswer, reset }), [code, task.id, mode]);

  return (
    <section className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-line bg-paper/60">
        <span className={`w-2.5 h-2.5 rounded-full ${RUN_CLASS[mode]}`} />
        <span className="text-xs font-bold text-inkmute uppercase tracking-wide">
          {mode === "python" ? "Python · pandas" : "SQL · in-browser database"}
        </span>
        <span className="ml-auto text-[11px] text-inkmute font-mono">
          {mode === "python" ? "assign your answer to result" : `tables: ${Object.keys(dataset.tables).join(", ")}`}
        </span>
      </div>

      <CodeMirror
        value={code}
        onChange={setCode}
        extensions={[mode === "python" ? python() : sql()]}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      />

      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-line bg-paper/60">
        <button
          onClick={run}
          disabled={busy}
          className={`btn-3d rounded-xl ${RUN_CLASS[mode]} text-white font-display font-extrabold text-sm px-4 py-1.5 disabled:opacity-50`}
        >
          ▶ {RUN_LABEL[mode]}
        </button>
        <button
          onClick={checkAnswer}
          disabled={busy}
          className="btn-3d rounded-xl bg-sprout text-white font-display font-extrabold text-sm px-4 py-1.5 disabled:opacity-50"
        >
          ✓ Check
        </button>
        {busy && <span className="text-xs text-inkmute animate-pulse">Running…</span>}
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
          {output?.result && (
            <>
              <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-1">Output</p>
              <ResultView result={output.result} chart={task.chart && check?.pass} />
            </>
          )}
          {output && !output.result && (
            <div className="rounded-xl bg-flame/5 border border-flame/30 px-3 py-2.5">
              {output.error && (
                <p className="font-mono text-[12.5px] text-flame whitespace-pre-wrap break-words">{output.error}</p>
              )}
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

export default CodeCell;
