// Notebook data model. A notebook is:
// { id, name, createdAt, updatedAt,
//   cells: [{ id, type: "python"|"sql"|"excel"|"markdown", source, meta, output }],
//   files: [{ name, csv }] }   // every file is both a pandas df and a SQL table

function uid() {
  return (crypto.randomUUID?.() || Math.random().toString(36).slice(2)) + "";
}

const STARTERS = {
  python: "# Uploaded files are loaded as DataFrames named after their table.\n# The last expression in a cell is displayed, like Jupyter.\n",
  sql: "-- Every uploaded file is a table. JOIN across them freely.\nSELECT ",
  excel: "=",
  markdown: "## Notes\n\nDouble-click to edit, click outside to render."
};

export function newCell(type, source) {
  return {
    id: uid(),
    type,
    source: source ?? STARTERS[type] ?? "",
    meta: {},      // excel cells keep { table } here
    output: null   // last run output, persisted for restore-on-reopen
  };
}

export function newNotebook(name) {
  const now = Date.now();
  return {
    id: uid(),
    name: name || "Untitled notebook",
    createdAt: now,
    updatedAt: now,
    cells: [newCell("markdown", "## " + (name || "Untitled notebook") + "\n\nUpload a CSV or XLSX to get started, then add cells below."), newCell("python")],
    files: []
  };
}

// Turn an arbitrary filename into a safe python/SQL identifier.
export function tableName(filename) {
  let base = filename.replace(/\.(csv|xlsx|xls)$/i, "");
  base = base.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (!base) base = "table";
  if (/^[0-9]/.test(base)) base = "t_" + base;
  return base.toLowerCase();
}

export function uniqueName(base, taken) {
  let name = base, i = 2;
  while (taken.includes(name)) name = `${base}_${i++}`;
  return name;
}

export function tablesOf(notebook) {
  return Object.fromEntries((notebook.files || []).map((f) => [f.name, f.csv]));
}

export function fmtDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return "Today, " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
