"use client";
import { useMemo, useState } from "react";
import { parseCSV, inferNumericColumns } from "../../lib/csv";
import { getPythonVars } from "../../lib/engines";

function TableEntry({ file, onRemove }) {
  const [open, setOpen] = useState(false);
  const info = useMemo(() => {
    const parsed = parseCSV(file.csv);
    const numeric = inferNumericColumns(parsed);
    return {
      rows: parsed.rows.length,
      cols: parsed.headers.map((h, i) => ({ name: h, type: numeric[i] ? "number" : "text" }))
    };
  }, [file.csv]);

  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="flex-1 text-left min-w-0">
          <p className="font-mono font-bold text-[12.5px] truncate">{file.name}</p>
          <p className="text-[11px] text-inkmute">{info.rows} rows × {info.cols.length} cols</p>
        </button>
        <button onClick={() => setOpen(!open)} className="text-inkmute text-xs">{open ? "▾" : "▸"}</button>
        <button onClick={onRemove} title="Remove file" className="text-flame text-xs px-1 hover:bg-flame/10 rounded">✕</button>
      </div>
      {open && (
        <ul className="mt-1.5 space-y-0.5 border-t border-line pt-1.5">
          {info.cols.map((c) => (
            <li key={c.name} className="flex justify-between text-[11.5px] font-mono">
              <span className="truncate">{c.name}</span>
              <span className="text-inkmute shrink-0 ml-2">{c.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Inspector({ files, sessionId, onRemoveFile, onClose }) {
  const [vars, setVars] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refreshVars() {
    setLoading(true);
    try { setVars(await getPythonVars(sessionId)); }
    catch { setVars([]); }
    finally { setLoading(false); }
  }

  return (
    <aside className="w-72 shrink-0 border-l border-line bg-paper/50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <p className="text-xs font-extrabold uppercase tracking-wide text-inkmute">Inspector</p>
        <button onClick={onClose} className="text-inkmute hover:text-ink text-sm">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-inkmute mb-1.5 px-1">
            Tables · {files.length}
          </p>
          {files.length === 0 ? (
            <p className="text-[12px] text-inkmute px-1">No files yet. Drop a CSV or XLSX anywhere on the notebook.</p>
          ) : (
            <div className="space-y-1.5">
              {files.map((f) => (
                <TableEntry key={f.name} file={f} onRemove={() => onRemoveFile(f.name)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-inkmute">Python variables</p>
            <button onClick={refreshVars} className="text-[11px] font-bold text-pymode hover:underline">
              {loading ? "…" : "Refresh"}
            </button>
          </div>
          {vars === null ? (
            <p className="text-[12px] text-inkmute px-1">Run a Python cell, then hit refresh.</p>
          ) : vars.length === 0 ? (
            <p className="text-[12px] text-inkmute px-1">Nothing in the session yet.</p>
          ) : (
            <div className="space-y-1.5">
              {vars.map((v) => (
                <div key={v.name} className="rounded-xl border border-line bg-white px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono font-bold text-[12.5px] truncate">{v.name}</span>
                    <span className="text-[11px] text-pymode font-bold shrink-0">{v.type}</span>
                  </div>
                  <p className="text-[11px] text-inkmute truncate">{v.info}</p>
                  {v.cols?.length > 0 && (
                    <ul className="mt-1 border-t border-line pt-1 space-y-0.5">
                      {v.cols.map((c, i) => (
                        <li key={i} className="text-[11px] font-mono text-inkmute truncate">{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
