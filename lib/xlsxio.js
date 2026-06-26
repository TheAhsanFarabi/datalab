// File import/export. XLSX parsing and writing via SheetJS (pure JS, CPU-only).
// Every uploaded file becomes { name, csv } — one entry per sheet for multi-
// sheet workbooks — which then feeds both the pandas and SQL engines.

import * as XLSX from "xlsx";
import { tableName, uniqueName } from "./notebook";

export async function parseUpload(file, takenNames = []) {
  const isCsv = /\.csv$/i.test(file.name);
  const out = [];
  const taken = [...takenNames];

  if (isCsv) {
    const text = await file.text();
    const name = uniqueName(tableName(file.name), taken);
    out.push({ name, csv: text });
    return out;
  }

  // xlsx / xls
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const base = tableName(file.name);
  for (const sheetName of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
    if (!csv.trim()) continue;
    const wanted = wb.SheetNames.length === 1 ? base : `${base}_${tableName(sheetName)}`;
    const name = uniqueName(wanted, taken);
    taken.push(name);
    out.push({ name, csv });
  }
  if (!out.length) throw new Error("No data found in that file.");
  return out;
}

function resultToAoa(result) {
  if (result.kind === "scalar") return [["value"], [result.value]];
  return [result.cols, ...result.rows];
}

function blobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadResultCSV(result, filename = "output.csv") {
  const aoa = resultToAoa(result);
  const csv = aoa
    .map((row) =>
      row
        .map((v) => {
          const s = v == null ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
  blobDownload(new Blob([csv], { type: "text/csv" }), filename);
}

export function downloadResultXLSX(result, filename = "output.xlsx") {
  const ws = XLSX.utils.aoa_to_sheet(resultToAoa(result));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "output");
  XLSX.writeFile(wb, filename);
}

export function downloadNotebookJSON(notebook) {
  const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: "application/json" });
  blobDownload(blob, `${tableName(notebook.name) || "notebook"}.json`);
}
