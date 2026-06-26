// CSV parsing with proper quote handling, so user-uploaded files with commas
// inside quoted fields parse correctly. The bundled Learn datasets are simple
// and unaffected.
function splitCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function parseCSV(csv) {
  const all = splitCSV(String(csv).trim());
  const headers = (all[0] || []).map((h) => h.trim());
  const rows = all.slice(1)
    .filter((r) => r.length > 1 || (r[0] || "").trim() !== "")
    .map((r) => headers.map((_, c) => (r[c] ?? "").trim()));
  return { headers, rows };
}

const NA = new Set(["", "N/A", "NA", "n/a", "null", "NULL"]);

export function isNA(v) {
  return v == null || NA.has(String(v).trim());
}

// A column is numeric if every non-missing value parses as a number.
export function inferNumericColumns(parsed) {
  return parsed.headers.map((_, c) =>
    parsed.rows.every((r) => isNA(r[c]) || (r[c] !== "" && !Number.isNaN(Number(r[c]))))
  );
}

// Build an Excel-style grid: grid[0] = headers (row 1), data from row 2.
// Numeric columns become numbers, missing values become null.
export function csvToGrid(csv) {
  const parsed = parseCSV(csv);
  const numeric = inferNumericColumns(parsed);
  const rows = parsed.rows.map((r) =>
    r.map((cell, c) => (isNA(cell) ? null : numeric[c] ? Number(cell) : cell))
  );
  return [parsed.headers, ...rows];
}
