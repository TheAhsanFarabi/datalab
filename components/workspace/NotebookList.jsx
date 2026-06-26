"use client";
import { useEffect, useRef, useState } from "react";
import { listNotebooks, putNotebook, deleteNotebook, getNotebook } from "../../lib/idb";
import { newNotebook, fmtDate } from "../../lib/notebook";

export default function NotebookList({ onOpen }) {
  const [books, setBooks] = useState(null);
  const [renaming, setRenaming] = useState(null); // { id, name }
  const importRef = useRef(null);

  const refresh = () => listNotebooks().then(setBooks).catch(() => setBooks([]));
  useEffect(() => { refresh(); }, []);

  async function create() {
    const nb = newNotebook("Untitled notebook");
    await putNotebook(nb);
    onOpen(nb.id);
  }

  async function remove(id, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    await deleteNotebook(id);
    refresh();
  }

  async function saveRename() {
    if (!renaming) return;
    const nb = await getNotebook(renaming.id);
    if (nb && renaming.name.trim()) {
      nb.name = renaming.name.trim();
      nb.updatedAt = Date.now();
      await putNotebook(nb);
    }
    setRenaming(null);
    refresh();
  }

  async function importJSON(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const nb = JSON.parse(await file.text());
      if (!Array.isArray(nb.cells)) throw new Error("bad format");
      nb.id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + "";
      nb.name = (nb.name || "Imported notebook") + " (imported)";
      nb.updatedAt = Date.now();
      nb.createdAt = nb.createdAt || Date.now();
      nb.files = nb.files || [];
      await putNotebook(nb);
      refresh();
    } catch {
      alert("That file doesn't look like a DataLab notebook export.");
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-2xl">Workspace</h1>
            <p className="text-inkmute text-sm mt-0.5">
              Free-form notebooks for your own data. Python, SQL, formulas and notes, side by side.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold hover:bg-paper"
            >
              Import JSON
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
            <button
              onClick={create}
              className="btn-3d rounded-xl bg-sprout text-white px-4 py-2 text-sm font-extrabold"
            >
              + New notebook
            </button>
          </div>
        </div>

        {books === null && <p className="text-inkmute text-sm">Loading notebooks…</p>}

        {books?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <div className="text-4xl mb-2">📓</div>
            <p className="font-bold">No notebooks yet</p>
            <p className="text-sm text-inkmute mt-1">
              Create one and drop in a CSV or XLSX file to start analyzing.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {books?.map((b) => (
            <li
              key={b.id}
              className="group rounded-2xl border border-line bg-white shadow-card px-5 py-3.5 flex items-center gap-4 hover:border-ink/30 transition-colors"
            >
              <span className="text-2xl">📓</span>
              <div className="flex-1 min-w-0">
                {renaming?.id === b.id ? (
                  <input
                    autoFocus
                    value={renaming.name}
                    onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setRenaming(null); }}
                    onBlur={saveRename}
                    className="font-bold w-full bg-paper border border-line rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sprout/40"
                  />
                ) : (
                  <button onClick={() => onOpen(b.id)} className="font-bold truncate block text-left hover:underline">
                    {b.name}
                  </button>
                )}
                <p className="text-xs text-inkmute mt-0.5">
                  Edited {fmtDate(b.updatedAt)} · {b.cellCount} cell{b.cellCount === 1 ? "" : "s"}
                  {b.fileCount ? ` · ${b.fileCount} file${b.fileCount === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setRenaming({ id: b.id, name: b.name })}
                  className="text-xs font-bold text-inkmute hover:text-ink px-2 py-1 rounded-lg hover:bg-paper"
                >
                  Rename
                </button>
                <button
                  onClick={() => remove(b.id, b.name)}
                  className="text-xs font-bold text-flame px-2 py-1 rounded-lg hover:bg-flame/10"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={() => onOpen(b.id)}
                className="rounded-lg bg-ink text-paper text-xs font-extrabold px-3 py-1.5"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
