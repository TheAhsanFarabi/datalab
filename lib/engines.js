// In-browser execution engines. Both load from CDNs at runtime — nothing runs
// on a server, and everything is CPU-only WASM.

import { parseCSV, inferNumericColumns, isNA } from "./csv";

/* ------------------------------ Python (Pyodide) ------------------------------ */

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
let pyodidePromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Couldn't load ${src}. Check your connection and retry.`));
    document.head.appendChild(s);
  });
}

export function ensurePyodide(onStatus) {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      onStatus?.("Loading Python runtime…");
      await loadScript(PYODIDE_URL + "pyodide.js");
      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_URL });
      onStatus?.("Loading pandas (first time only)…");
      await pyodide.loadPackage(["pandas"]);
      pyodide.runPython(`
import json, io
import pandas as pd
import numpy as np

def __dl_scalar(x):
    if isinstance(x, (np.integer,)): return int(x)
    if isinstance(x, (np.floating,)):
        f = float(x)
        return None if np.isnan(f) else f
    if isinstance(x, (np.bool_,)): return bool(x)
    if isinstance(x, float) and np.isnan(x): return None
    return x

def __dl_normalize(r):
    if isinstance(r, pd.DataFrame):
        d = r.copy()
        d.columns = [str(c) for c in d.columns]
        d = d.astype(object).where(pd.notna(d), None)
        rows = [[__dl_scalar(v) for v in row] for row in d.values.tolist()]
        return {"kind": "table", "cols": list(d.columns), "rows": rows}
    if isinstance(r, pd.Series):
        return __dl_normalize(r.reset_index())
    if isinstance(r, (tuple, list)):
        return {"kind": "scalar", "value": [__dl_scalar(x) for x in r]}
    return {"kind": "scalar", "value": __dl_scalar(r)}

def __dl_run(code, tables_json, primary):
    tables = json.loads(tables_json)
    ns = {"pd": pd, "np": np}
    for name, csv_text in tables.items():
        ns[name] = pd.read_csv(io.StringIO(csv_text))
    ns["df"] = ns[primary].copy()
    exec(code, ns)
    if "result" not in ns or ns["result"] is None:
        raise RuntimeError("__no_result__")
    return json.dumps(__dl_normalize(ns["result"]), default=str)
`);
      return pyodide;
    })();
    pyodidePromise.catch(() => { pyodidePromise = null; });
  }
  return pyodidePromise;
}

export async function runPython(code, dataset, onStatus) {
  const pyodide = await ensurePyodide(onStatus);
  const runner = pyodide.globals.get("__dl_run");
  try {
    const json = runner(code, JSON.stringify(dataset.tables), dataset.primary);
    return JSON.parse(json);
  } catch (err) {
    const msg = String(err?.message || err);
    // Surface only the final Python error line, not the JS traceback wrapper.
    const lines = msg.split("\n").filter((l) => l.trim());
    const last = lines.reverse().find((l) => /Error|Exception|__no_result__/.test(l)) || msg;
    throw new Error(last.includes("__no_result__") ? "__no_result__" : last.trim());
  } finally {
    runner.destroy?.();
  }
}

/* -------------------------------- SQL (sql.js) -------------------------------- */

const SQLJS_BASE = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/";
let sqlPromise = null;

export function ensureSql(onStatus) {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      onStatus?.("Loading SQL engine…");
      await loadScript(SQLJS_BASE + "sql-wasm.js");
      return window.initSqlJs({ locateFile: (f) => SQLJS_BASE + f });
    })();
    sqlPromise.catch(() => { sqlPromise = null; });
  }
  return sqlPromise;
}

export async function runSQL(query, dataset, onStatus) {
  const SQL = await ensureSql(onStatus);
  const db = new SQL.Database();
  try {
    for (const [name, csv] of Object.entries(dataset.tables)) {
      const parsed = parseCSV(csv);
      const numeric = inferNumericColumns(parsed);
      const colDefs = parsed.headers.map((h, i) => `"${h}" ${numeric[i] ? "REAL" : "TEXT"}`).join(", ");
      db.run(`CREATE TABLE "${name}" (${colDefs});`);
      const placeholders = parsed.headers.map(() => "?").join(", ");
      const stmt = db.prepare(`INSERT INTO "${name}" VALUES (${placeholders});`);
      for (const row of parsed.rows) {
        stmt.run(row.map((v, i) => (isNA(v) ? null : numeric[i] ? Number(v) : v)));
      }
      stmt.free();
    }
    const results = db.exec(query);
    if (!results.length) throw new Error("__no_result__");
    const r = results[results.length - 1];
    return { kind: "table", cols: r.columns, rows: r.values };
  } finally {
    db.close();
  }
}

/* --------------------- Workspace notebook sessions (Python) --------------------- */
// Unlike Learn-mode grading runs, notebook cells share one namespace per
// notebook so variables persist across cells, Jupyter-style.

let helpersReady = false;

function ensureNotebookHelpers(pyodide) {
  if (helpersReady) return;
  pyodide.runPython(`
import ast, contextlib

__dl_sessions = {}

def __dl_run_cell(session, code, tables_json):
    ns = __dl_sessions.get(session)
    if ns is None:
        ns = {"pd": pd, "np": np}
        __dl_sessions[session] = ns
    for name, csv_text in json.loads(tables_json).items():
        if name not in ns:
            ns[name] = pd.read_csv(io.StringIO(csv_text))
    tree = ast.parse(code)
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop(-1).value)
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        exec(compile(tree, "<cell>", "exec"), ns)
        val = eval(compile(last, "<cell>", "eval"), ns) if last is not None else None
    out = {"stdout": buf.getvalue()}
    if val is not None:
        total = None
        if isinstance(val, pd.DataFrame) and len(val) > 500:
            total = len(val)
            val = val.head(500)
        out["result"] = __dl_normalize(val)
        if total is not None:
            out["truncated"] = total
    return json.dumps(out, default=str)

def __dl_vars(session):
    ns = __dl_sessions.get(session) or {}
    rows = []
    for k, v in ns.items():
        if k.startswith("__") or k in ("pd", "np"):
            continue
        if isinstance(v, pd.DataFrame):
            rows.append({"name": k, "type": "DataFrame",
                         "info": f"{v.shape[0]} rows × {v.shape[1]} cols",
                         "cols": [f"{c} · {v.dtypes[c]}" for c in v.columns]})
        elif isinstance(v, pd.Series):
            rows.append({"name": k, "type": "Series", "info": f"{len(v)} values", "cols": []})
        elif isinstance(v, (int, float, str, bool)):
            rows.append({"name": k, "type": type(v).__name__, "info": str(v)[:60], "cols": []})
        elif isinstance(v, (list, dict, tuple, set)):
            rows.append({"name": k, "type": type(v).__name__, "info": f"{len(v)} items", "cols": []})
    return json.dumps(rows)

def __dl_reset_session(session):
    __dl_sessions.pop(session, None)
`);
  helpersReady = true;
}

function trimPyError(err) {
  const msg = String(err?.message || err);
  const lines = msg.split("\n").filter((l) => l.trim());
  return (lines.reverse().find((l) => /Error|Exception/.test(l)) || msg).trim();
}

export async function runPythonCell(sessionId, code, tables, onStatus) {
  const pyodide = await ensurePyodide(onStatus);
  ensureNotebookHelpers(pyodide);
  const runner = pyodide.globals.get("__dl_run_cell");
  try {
    return JSON.parse(runner(sessionId, code, JSON.stringify(tables)));
  } catch (err) {
    throw new Error(trimPyError(err));
  } finally {
    runner.destroy?.();
  }
}

export async function getPythonVars(sessionId) {
  if (!pyodidePromise) return [];
  const pyodide = await pyodidePromise;
  ensureNotebookHelpers(pyodide);
  const fn = pyodide.globals.get("__dl_vars");
  try { return JSON.parse(fn(sessionId)); } finally { fn.destroy?.(); }
}

export async function resetPythonSession(sessionId) {
  if (!pyodidePromise) return;
  const pyodide = await pyodidePromise;
  ensureNotebookHelpers(pyodide);
  const fn = pyodide.globals.get("__dl_reset_session");
  try { fn(sessionId); } finally { fn.destroy?.(); }
}
