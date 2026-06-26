"use client";

function BarChart({ res }) {
  const rows = res.rows.filter((r) => typeof r[1] === "number");
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <div className="mt-3 rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-bold text-inkmute uppercase tracking-wide mb-3">
        {res.cols[1]} by {res.cols[0]}
      </p>
      <div className="flex items-end gap-4 h-40">
        {rows.map((r, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-xs font-bold mb-1">{r[1]}</span>
            <div
              className="w-full max-w-[64px] rounded-t-lg bg-sprout animate-barup origin-bottom"
              style={{ height: `${(r[1] / max) * 100}%`, animationDelay: `${i * 90}ms` }}
            />
            <span className="text-xs text-inkmute mt-1 truncate max-w-[80px]">{r[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultView({ result, chart }) {
  if (!result) return null;

  if (result.kind === "scalar") {
    const v = Array.isArray(result.value) ? result.value.join(" × ") : String(result.value);
    return (
      <div className="inline-block rounded-xl bg-ink text-paper font-mono text-lg px-4 py-2 mt-1">
        {v}
      </div>
    );
  }

  const MAX = 30;
  const rows = result.rows.slice(0, MAX);
  return (
    <div className="mt-1">
      <div className="overflow-auto max-h-72 rounded-xl border border-line">
        <table className="text-[13px] font-mono w-full">
          <thead className="sticky top-0">
            <tr className="bg-ink text-paper">
              {result.cols.map((c, i) => (
                <th key={i} className="text-left font-semibold px-3 py-1.5 whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-paper" : "bg-white"}>
                {r.map((v, j) => (
                  <td key={j} className="px-3 py-1 whitespace-nowrap">
                    {v === null || v === undefined ? <span className="text-inkmute/60">NaN</span> : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-inkmute mt-1">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
        {result.rows.length > MAX ? ` (showing first ${MAX})` : ""} × {result.cols.length} column{result.cols.length === 1 ? "" : "s"}
      </p>
      {chart && result.cols.length === 2 && <BarChart res={result} />}
    </div>
  );
}
