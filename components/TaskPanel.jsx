"use client";
import { useEffect, useState } from "react";
import { MODE_META, TOPICS } from "../lib/tasks";
import { DATASETS } from "../lib/datasets";
import { downloadReport } from "../lib/report";

const ACTIVE_TAB = {
  python: "bg-pymode text-white",
  sql: "bg-sqlmode text-white",
  excel: "bg-xlmode text-white"
};

export default function TaskPanel({ task, mode, onMode, progress }) {
  const [hintsShown, setHintsShown] = useState(0);
  useEffect(() => setHintsShown(0), [task.id]);

  const dataset = DATASETS[task.dataset];
  const available = Object.keys(task.modes);
  const capstoneDone = TOPICS.find((t) => t.id === "capstone").tasks.every((t) => progress.completed[t]);

  return (
    <aside className="w-80 shrink-0 border-l border-line bg-white/70 overflow-y-auto p-5 space-y-5">
      <div>
        <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-2">Solve it in</p>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-paper border border-line p-1.5">
          {["python", "sql", "excel"].map((m) => {
            const meta = MODE_META[m];
            const enabled = available.includes(m);
            const active = m === mode;
            return (
              <button
                key={m}
                disabled={!enabled}
                onClick={() => onMode(m)}
                title={enabled ? `Solve this task in ${meta.label}` : `This task isn't available in ${meta.label}`}
                className={`rounded-lg py-1.5 text-sm font-display font-extrabold transition-colors
                  ${active ? ACTIVE_TAB[m] : enabled ? "text-inkmute hover:bg-white" : "text-line cursor-not-allowed"}`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
        {available.length < 3 && (
          <p className="text-[11px] text-inkmute mt-1.5">
            {task.capstone
              ? "Capstone steps lock you into one tool — like real projects do."
              : "Joins and dedup don't translate to single formulas, so this one is Python & SQL only."}
          </p>
        )}
      </div>

      <section>
        <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-1.5">Your task</p>
        <p className="text-sm leading-relaxed">{task.brief}</p>
        {mode === "excel" && task.modes.excel?.prompt && (
          <p className="text-sm leading-relaxed mt-2 rounded-lg bg-xlmode-soft border border-xlmode/40 px-3 py-2">
            <span className="font-bold">Excel version:</span> {task.modes.excel.prompt}
          </p>
        )}
      </section>

      <section>
        <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-1.5">Dataset</p>
        <div className="rounded-xl border border-line bg-white px-3 py-2.5">
          <p className="text-sm font-bold">{dataset.name}</p>
          <p className="text-xs text-inkmute leading-relaxed mt-0.5">{dataset.blurb}</p>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-1.5">Expected result</p>
        <div className="rounded-xl border-2 border-dashed border-sprout/50 bg-sprout-soft/50 px-3 py-2.5 text-sm leading-relaxed">
          {task.expected}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-inkmute uppercase tracking-wide">Hints</p>
          <span className="text-[11px] text-inkmute">{hintsShown}/{task.hints.length} used</span>
        </div>
        <div className="space-y-2">
          {task.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="animate-pop rounded-xl bg-white border border-line px-3 py-2 text-[13px] leading-relaxed">
              <span className="font-bold text-gold mr-1">💡 {i + 1}.</span>
              <span className="whitespace-pre-wrap">{h}</span>
            </div>
          ))}
        </div>
        {hintsShown < task.hints.length && (
          <button
            onClick={() => setHintsShown((n) => n + 1)}
            className="btn-3d mt-2 w-full rounded-xl bg-white border border-line py-2 text-sm font-display font-bold text-inkmute"
          >
            {hintsShown === 0 ? "Show a hint" : hintsShown === task.hints.length - 1 ? "Show the answer" : "Show another hint"}
          </button>
        )}
      </section>

      {task.capstone && (
        <section className="rounded-xl border border-gold bg-gold/10 px-3 py-3">
          <p className="text-sm font-display font-extrabold">🏆 Capstone report</p>
          {capstoneDone ? (
            <>
              <p className="text-xs text-inkmute leading-relaxed mt-1">
                All three steps done. Download your report — built from your own answers — and use your browser's
                Print → Save as PDF for a portfolio version.
              </p>
              <button
                onClick={() => downloadReport(progress)}
                className="btn-3d mt-2 w-full rounded-xl bg-gold text-ink py-2 text-sm font-display font-extrabold"
              >
                ⬇ Download report
              </button>
            </>
          ) : (
            <p className="text-xs text-inkmute leading-relaxed mt-1">
              Finish all three capstone steps to unlock your downloadable mini-report.
            </p>
          )}
        </section>
      )}
    </aside>
  );
}
