"use client";
import { useMemo, useState } from "react";
import { parseCSV } from "../lib/csv";

export default function DataPreview({ dataset }) {
  const [openTable, setOpenTable] = useState(dataset.primary);
  const names = Object.keys(dataset.tables);
  const parsed = useMemo(() => parseCSV(dataset.tables[openTable] || dataset.tables[dataset.primary]), [dataset, openTable]);
  const current = dataset.tables[openTable] ? openTable : dataset.primary;
  const PREVIEW = 6;

  return (
    <section className="rounded-2xl border border-line bg-white shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line bg-paper/60">
        <span className="text-xs font-bold text-inkmute uppercase tracking-wide">Data preview</span>
        <div className="flex gap-1 ml-2">
          {names.map((n) => (
            <button
              key={n}
              onClick={() => setOpenTable(n)}
              className={`text-xs font-mono rounded-md px-2 py-0.5 border ${n === current ? "bg-ink text-paper border-ink" : "border-line text-inkmute hover:bg-white"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-inkmute">first {PREVIEW} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[12.5px] font-mono w-full">
          <thead>
            <tr className="bg-paper">
              <th className="px-2 py-1 text-inkmute font-normal border-b border-line">#</th>
              {parsed.headers.map((h, i) => (
                <th key={i} className="text-left px-3 py-1 font-semibold border-b border-line whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.slice(0, PREVIEW).map((r, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0">
                <td className="px-2 py-1 text-inkmute">{i + 2}</td>
                {r.map((v, j) => (
                  <td key={j} className="px-3 py-1 whitespace-nowrap">
                    {v === "" || v === "N/A" ? <span className="text-flame/70 italic">{v === "" ? "∅" : v}</span> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
