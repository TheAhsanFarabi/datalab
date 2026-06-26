"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotebook, putNotebook } from "../../lib/idb";
import { newCell, tablesOf, uniqueName } from "../../lib/notebook";
import { parseUpload, downloadNotebookJSON } from "../../lib/xlsxio";
import { runPythonCell, runSQL, resetPythonSession } from "../../lib/engines";
import { evaluateFormula } from "../../lib/formula";
import { csvToGrid } from "../../lib/csv";
import { explainError } from "../../lib/errors";
import Cell from "./Cell";
import Inspector from "./Inspector";

const ADD_TYPES = [
  { type: "python", label: "+ Python", cls: "text-pymode border-pymode/40 hover:bg-pymode/10" },
  { type: "sql", label: "+ SQL", cls: "text-sqlmode border-sqlmode/40 hover:bg-sqlmode/10" },
  { type: "excel", label: "+ Grid", cls: "text-xlmode border-xlmode/40 hover:bg-xlmode/10" },
  { type: "markdown", label: "+ Markdown", cls: "text-inkmute border-line hover:bg-line/40" }
];

function AddCellRow({ onAdd, always }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-1 transition-opacity ${always ? "" : "opacity-0 hover:opacity-100"}`}>
      {ADD_TYPES.map((t) => (
        <button
          key={t.type}
          onClick={() => onAdd(t.type)}
          className={`text-[11px] font-extrabold border rounded-full px-3 py-1 bg-white ${t.cls}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function NotebookEditor({ notebookId, onBack }) {
  const [nb, setNb] = useState(null);
  const [busyCell, setBusyCell] = useState(null); // cell id or "__all__"
  const [status, setStatus] = useState(null);
  const [showInspector, setShowInspector] = useState(true);
  const [dragging, setDragging] = useState(false);
  const saveTimer = useRef(null);
  const nbRef = useRef(null);
  const fileRef = useRef(null);
  nbRef.current = nb;

  useEffect(() => {
    getNotebook(notebookId).then((loaded) => {
      if (loaded) setNb(loaded);
      else onBack();
    });
  }, [notebookId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave on every change.
  const update = useCallback((mutate) => {
    setNb((prev) => {
      const next = typeof mutate === "function" ? mutate(prev) : mutate;
      const stamped = { ...next, updatedAt: Date.now() };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => putNotebook(stamped).catch(() => {}), 600);
      return stamped;
    });
  }, []);

  // Flush save on unmount.
  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    if (nbRef.current) putNotebook(nbRef.current).catch(() => {});
  }, []);

  const setCell = (cell) =>
    update((p) => ({ ...p, cells: p.cells.map((c) => (c.id === cell.id ? cell : c)) }));

  const addCell = (type, index) =>
    update((p) => {
      const cells = [...p.cells];
      cells.splice(index ?? cells.length, 0, newCell(type));
      return { ...p, cells };
    });

  const deleteCell = (id) =>
    update((p) => ({ ...p, cells: p.cells.filter((c) => c.id !== id) }));

  const moveCell = (id, dir) =>
    update((p) => {
      const cells = [...p.cells];
      const i = cells.findIndex((c) => c.id === id);
      const j = i + dir;
      if (j < 0 || j >= cells.length) return p;
      [cells[i], cells[j]] = [cells[j], cells[i]];
      return { ...p, cells };
    });

  async function execCell(cell, tables) {
    if (cell.type === "python") {
      try {
        const out = await runPythonCell(notebookId, cell.source, tables, setStatus);
        return out;
      } catch (err) {
        const raw = String(err?.message || err);
        return { error: raw, explain: explainError("python", raw) };
      } finally {
        setStatus(null);
      }
    }
    if (cell.type === "sql") {
      try {
        const result = await runSQL(cell.source, { tables }, setStatus);
        let truncated = null;
        if (result.rows.length > 500) {
          truncated = result.rows.length;
          result.rows = result.rows.slice(0, 500);
        }
        return truncated ? { result, truncated } : { result };
      } catch (err) {
        const raw = err?.message === "__no_result__" ? null : String(err?.message || err);
        return {
          error: raw || "The query ran but returned no result set.",
          explain: raw ? explainError("sql", raw) : "Make sure the cell ends with a SELECT statement."
        };
      } finally {
        setStatus(null);
      }
    }
    if (cell.type === "excel") {
      const names = Object.keys(tables);
      if (!names.length) return { error: "No data uploaded yet." };
      const table = cell.meta?.table && tables[cell.meta.table] != null ? cell.meta.table : names[0];
      try {
        const value = evaluateFormula(cell.source, csvToGrid(tables[table]));
        return { value };
      } catch (err) {
        const raw = String(err?.message || err);
        return { error: raw, explain: explainError("excel", raw) };
      }
    }
    return null;
  }

  async function runCell(id) {
    const current = nbRef.current;
    const cell = current.cells.find((c) => c.id === id);
    if (!cell || cell.type === "markdown" || busyCell) return;
    setBusyCell(id);
    const output = await execCell(cell, tablesOf(current));
    setCell({ ...current.cells.find((c) => c.id === id), output });
    setBusyCell(null);
  }

  async function runAll() {
    if (busyCell) return;
    setBusyCell("__all__");
    const tables = tablesOf(nbRef.current);
    for (const cell of nbRef.current.cells) {
      if (cell.type === "markdown") continue;
      const output = await execCell(cell, tables);
      setCell({ ...nbRef.current.cells.find((c) => c.id === cell.id), output });
    }
    setBusyCell(null);
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => /\.(csv|xlsx|xls)$/i.test(f.name));
    if (!files.length) {
      setStatus("Only CSV and XLSX files are supported.");
      setTimeout(() => setStatus(null), 2500);
      return;
    }
    try {
      let added = [];
      let taken = nbRef.current.files.map((f) => f.name);
      for (const f of files) {
        const parsed = await parseUpload(f, taken);
        taken = [...taken, ...parsed.map((p) => p.name)];
        added = [...added, ...parsed];
      }
      update((p) => ({ ...p, files: [...p.files, ...added] }));
      setStatus(`Loaded ${added.map((a) => a.name).join(", ")} — available in Python and SQL.`);
      setTimeout(() => setStatus(null), 3500);
    } catch (err) {
      setStatus(String(err?.message || err));
      setTimeout(() => setStatus(null), 3000);
    }
  }

  function removeFile(name) {
    if (!confirm(`Remove table "${name}" from this notebook?`)) return;
    update((p) => ({ ...p, files: p.files.filter((f) => f.name !== name) }));
  }

  async function resetSession() {
    await resetPythonSession(notebookId);
    setStatus("Python session cleared. Variables reset.");
    setTimeout(() => setStatus(null), 2500);
  }

  if (!nb) {
    return <div className="h-full grid place-items-center text-inkmute font-bold animate-pulse">Opening notebook…</div>;
  }

  const tables = tablesOf(nb);
  const busy = busyCell !== null;

  return (
    <div
      className="h-full flex flex-col relative"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.target === e.currentTarget) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-line bg-white">
        <button onClick={onBack} className="text-sm font-bold text-inkmute hover:text-ink px-2 py-1 rounded-lg hover:bg-paper">
          ← Notebooks
        </button>
        <input
          value={nb.name}
          onChange={(e) => update((p) => ({ ...p, name: e.target.value }))}
          className="font-extrabold bg-transparent border border-transparent hover:border-line focus:border-line rounded-lg px-2 py-1 text-sm focus:outline-none min-w-0 flex-1 max-w-xs"
          aria-label="Notebook name"
        />
        <div className="flex-1" />
        <button onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold hover:bg-paper">
          ⬆ Upload data
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" multiple className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        <button onClick={runAll} disabled={busy}
          className="btn-3d rounded-lg bg-sprout text-white px-3 py-1.5 text-xs font-extrabold disabled:opacity-50">
          {busyCell === "__all__" ? "Running…" : "▶▶ Run all"}
        </button>
        <button onClick={() => downloadNotebookJSON(nb)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold hover:bg-paper">
          Export JSON
        </button>
        <button onClick={resetSession} title="Clear all Python variables"
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold hover:bg-paper">
          ↺ Reset session
        </button>
        <button onClick={() => setShowInspector(!showInspector)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${showInspector ? "bg-ink text-paper border-ink" : "border-line bg-white hover:bg-paper"}`}>
          ☰ Inspector
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Cells */}
        <main className="flex-1 overflow-y-auto px-6 py-4 min-w-0">
          <div className="max-w-3xl mx-auto">
            {nb.cells.length === 0 && (
              <p className="text-center text-sm text-inkmute py-6">Empty notebook. Add a cell below.</p>
            )}
            {nb.cells.map((cell, i) => (
              <div key={cell.id}>
                {i === 0 && <AddCellRow onAdd={(t) => addCell(t, 0)} />}
                <Cell
                  cell={cell}
                  tables={tables}
                  busy={busyCell === cell.id || busyCell === "__all__"}
                  onChange={setCell}
                  onRun={() => runCell(cell.id)}
                  onDelete={() => deleteCell(cell.id)}
                  onMove={(dir) => moveCell(cell.id, dir)}
                  isFirst={i === 0}
                  isLast={i === nb.cells.length - 1}
                />
                <AddCellRow onAdd={(t) => addCell(t, i + 1)} always={i === nb.cells.length - 1} />
              </div>
            ))}
          </div>
        </main>

        {showInspector && (
          <Inspector
            files={nb.files}
            sessionId={notebookId}
            onRemoveFile={removeFile}
            onClose={() => setShowInspector(false)}
          />
        )}
      </div>

      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-50 bg-sprout/10 border-4 border-dashed border-sprout grid place-items-center pointer-events-none">
          <p className="font-extrabold text-sprout-dark bg-white rounded-2xl px-6 py-3 shadow-card">Drop CSV / XLSX to load it</p>
        </div>
      )}

      {/* Status toast */}
      {status && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-ink text-white text-xs font-bold px-4 py-2 shadow-card animate-pop max-w-lg truncate">
          {status}
        </div>
      )}
    </div>
  );
}
