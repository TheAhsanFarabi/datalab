// The DataLab curriculum. Every task is graded by running the reference
// solution in the same engine as the learner's attempt and comparing outputs,
// so the grader never goes stale if a dataset changes.

export const TOPICS = [
  { id: "excel-basics", title: "Excel Basics", icon: "▦", tasks: ["count-rows", "total-revenue"] },
  { id: "sql-fundamentals", title: "SQL Fundamentals", icon: "⌁", tasks: ["filter-west", "top-sales", "revenue-by-region"] },
  { id: "pandas-cleaning", title: "Pandas Cleaning", icon: "🧹", tasks: ["inspect-shape", "filter-sales-dept", "missing-salaries"] },
  { id: "groupby-agg", title: "GroupBy & Aggregation", icon: "Σ", tasks: ["avg-salary-dept", "survey-pivot", "dedupe-status"] },
  { id: "joins", title: "Joins & Merges", icon: "⋈", tasks: ["join-orders", "city-revenue"] },
  { id: "visualization", title: "Visualization", icon: "📊", tasks: ["channel-chart"] },
  { id: "capstone", title: "Capstone Case Study", icon: "🏆", tasks: ["cap-sql", "cap-python", "cap-excel"] }
];

export const TASKS = {
  /* ---------------- Excel Basics ---------------- */
  "count-rows": {
    id: "count-rows", topic: "excel-basics", title: "How many sales?", dataset: "sales", xp: 10,
    brief: "Before analyzing anything, find out how big your data is. Count how many sales records are in the table — including any duplicates for now.",
    expected: "A single number: the count of data rows.",
    hints: [
      "You need one number back, not a table of rows.",
      "Python: len(df) · SQL: COUNT(*) · Excel: COUNTA counts non-empty cells in a range.",
      "Python: result = len(df) · SQL: SELECT COUNT(*) FROM sales · Excel: =COUNTA(B2:B25)"
    ],
    modes: {
      python: {
        starter: "# df holds the sales table\n# Assign your answer to a variable called `result`\nresult = ",
        solution: "result = len(df)"
      },
      sql: {
        starter: "-- The table is called `sales`\nSELECT ",
        solution: "SELECT COUNT(*) AS records FROM sales"
      },
      excel: {
        prompt: "Count the sales records. Product names are in column B, rows 2 to 25.",
        starter: "=COUNTA(",
        solution: "=COUNTA(B2:B25)"
      }
    }
  },

  "total-revenue": {
    id: "total-revenue", topic: "excel-basics", title: "Total revenue", dataset: "sales", xp: 10,
    brief: "Add up the revenue column to get total sales for the month. Revenue lives in the `revenue` column (column F in Excel mode).",
    expected: "A single number: the sum of all revenue.",
    hints: [
      "You are summing one column, not the whole table.",
      "Python: select the column with df['revenue'] first. SQL/Excel: SUM.",
      "Python: result = df['revenue'].sum() · SQL: SELECT SUM(revenue) FROM sales · Excel: =SUM(F2:F25)"
    ],
    modes: {
      python: {
        starter: "# Sum the revenue column\nresult = ",
        solution: "result = df['revenue'].sum()"
      },
      sql: {
        starter: "SELECT ",
        solution: "SELECT SUM(revenue) AS total FROM sales"
      },
      excel: {
        prompt: "Sum the revenue column (F2:F25).",
        starter: "=SUM(",
        solution: "=SUM(F2:F25)"
      }
    }
  },

  /* ---------------- SQL Fundamentals ---------------- */
  "filter-west": {
    id: "filter-west", topic: "sql-fundamentals", title: "Filter: West region", dataset: "sales", xp: 15,
    brief: "Keep only the sales made in the West region. Heads up: one row says `west` in lowercase — exact matching will skip it. That's intentional. Notice it, we'll clean things like this later.",
    expected: "Only the rows where region is exactly 'West' (the lowercase 'west' row is excluded).",
    hints: [
      "Filtering means keeping rows that pass a condition.",
      "Python: df[df['region'] == 'West'] · SQL: WHERE region = 'West'.",
      "Python: result = df[df['region'] == 'West'] · SQL: SELECT * FROM sales WHERE region = 'West' · Excel: =COUNTIF(D2:D25,\"West\")"
    ],
    modes: {
      python: {
        starter: "# Keep rows where region is 'West'\nresult = df[ ]",
        solution: "result = df[df['region'] == 'West']"
      },
      sql: {
        starter: "SELECT * FROM sales\nWHERE ",
        solution: "SELECT * FROM sales WHERE region = 'West'"
      },
      excel: {
        prompt: "Excel can't easily show filtered rows with one formula, so count the 'West' rows instead. Regions are in D2:D25.",
        starter: "=COUNTIF(",
        solution: "=COUNTIF(D2:D25,\"West\")"
      }
    }
  },

  "top-sales": {
    id: "top-sales", topic: "sql-fundamentals", title: "Top 5 by revenue", dataset: "sales", xp: 15,
    orderMatters: true,
    brief: "Find the 5 biggest sales. Sort the table by revenue from highest to lowest, then keep only the first 5 rows. Order matters here!",
    expected: "5 rows, sorted by revenue descending.",
    hints: [
      "Two steps: sort descending, then take the first 5.",
      "Python: sort_values('revenue', ascending=False) then .head(5). SQL: ORDER BY ... DESC LIMIT 5.",
      "Python: result = df.sort_values('revenue', ascending=False).head(5) · SQL: SELECT * FROM sales ORDER BY revenue DESC LIMIT 5 · Excel: =MAX(F2:F25)"
    ],
    modes: {
      python: {
        starter: "# Sort by revenue (highest first), keep 5 rows\nresult = df",
        solution: "result = df.sort_values('revenue', ascending=False).head(5)"
      },
      sql: {
        starter: "SELECT * FROM sales\n",
        solution: "SELECT * FROM sales ORDER BY revenue DESC LIMIT 5"
      },
      excel: {
        prompt: "Find the single largest revenue value (F2:F25).",
        starter: "=",
        solution: "=MAX(F2:F25)"
      }
    }
  },

  "revenue-by-region": {
    id: "revenue-by-region", topic: "sql-fundamentals", title: "Revenue per region", dataset: "sales", xp: 20,
    brief: "Which region sells the most? Total the revenue for each region. You should get one row per region (and yes, lowercase 'west' will show up as its own group — messy data strikes again).",
    expected: "One row per region with its total revenue (5 groups, because 'west' ≠ 'West').",
    hints: [
      "This is a group-then-aggregate: split rows by region, sum revenue inside each group.",
      "Python: df.groupby('region')['revenue'].sum() — add .reset_index() to get a tidy table. SQL: GROUP BY region.",
      "Python: result = df.groupby('region')['revenue'].sum().reset_index() · SQL: SELECT region, SUM(revenue) FROM sales GROUP BY region · Excel: =SUMIF(D2:D25,\"East\",F2:F25)"
    ],
    modes: {
      python: {
        starter: "# Total revenue per region\nresult = df.groupby( )",
        solution: "result = df.groupby('region')['revenue'].sum().reset_index()"
      },
      sql: {
        starter: "SELECT region, \nFROM sales\n",
        solution: "SELECT region, SUM(revenue) AS total FROM sales GROUP BY region"
      },
      excel: {
        prompt: "Total the revenue for the East region only. Regions in D2:D25, revenue in F2:F25.",
        starter: "=SUMIF(",
        solution: "=SUMIF(D2:D25,\"East\",F2:F25)"
      }
    }
  },

  /* ---------------- Pandas Cleaning ---------------- */
  "inspect-shape": {
    id: "inspect-shape", topic: "pandas-cleaning", title: "Size up the data", dataset: "employees", xp: 10,
    brief: "New dataset: employee records. First question with any new table — how many rows and columns? In pandas, `df.shape` gives (rows, columns).",
    expected: "Python: a list [rows, columns]. SQL/Excel: the row count.",
    hints: [
      "pandas DataFrames have a .shape attribute.",
      ".shape returns a tuple — wrap it in list(...) for this task.",
      "Python: result = list(df.shape) · SQL: SELECT COUNT(*) FROM employees · Excel: =COUNT(A2:A21)"
    ],
    modes: {
      python: {
        starter: "# How many rows and columns?\nresult = ",
        solution: "result = list(df.shape)"
      },
      sql: {
        starter: "-- SQL tables don't have .shape — count the rows\nSELECT ",
        solution: "SELECT COUNT(*) AS rows FROM employees"
      },
      excel: {
        prompt: "Count the employee rows using the numeric id column (A2:A21).",
        starter: "=COUNT(",
        solution: "=COUNT(A2:A21)"
      }
    }
  },

  "filter-sales-dept": {
    id: "filter-sales-dept", topic: "pandas-cleaning", title: "The Sales team", dataset: "employees", xp: 15,
    brief: "Pull out everyone who works in the Sales department. (Notice Shakil Khan appears twice — a duplicate row we'll deal with soon.)",
    expected: "Only the rows where department is 'Sales' (7 rows, duplicate included).",
    hints: [
      "Same pattern as filtering regions: a condition on one column.",
      "Python: df[df['department'] == 'Sales'].",
      "Python: result = df[df['department'] == 'Sales'] · SQL: SELECT * FROM employees WHERE department = 'Sales' · Excel: =COUNTIF(C2:C21,\"Sales\")"
    ],
    modes: {
      python: {
        starter: "# Keep only the Sales department\nresult = ",
        solution: "result = df[df['department'] == 'Sales']"
      },
      sql: {
        starter: "SELECT * FROM employees\nWHERE ",
        solution: "SELECT * FROM employees WHERE department = 'Sales'"
      },
      excel: {
        prompt: "Count how many rows belong to the Sales department (C2:C21).",
        starter: "=COUNTIF(",
        solution: "=COUNTIF(C2:C21,\"Sales\")"
      }
    }
  },

  "missing-salaries": {
    id: "missing-salaries", topic: "pandas-cleaning", title: "Find the gaps", dataset: "employees", xp: 20,
    brief: "Two salaries were entered as N/A. Real datasets are full of holes like this — your job: count how many salary values are missing. pandas reads N/A as NaN automatically.",
    expected: "A single number: how many salaries are missing.",
    hints: [
      "Missing values are NaN in pandas and NULL in SQL.",
      "Python: .isna() marks missing values as True; summing Trues counts them. SQL: WHERE salary IS NULL.",
      "Python: result = int(df['salary'].isna().sum()) · SQL: SELECT COUNT(*) FROM employees WHERE salary IS NULL · Excel: =COUNTBLANK(E2:E21)"
    ],
    modes: {
      python: {
        starter: "# Count missing values in the salary column\nresult = ",
        solution: "result = int(df['salary'].isna().sum())"
      },
      sql: {
        starter: "-- Hint: you can't use  = NULL  in SQL\nSELECT ",
        solution: "SELECT COUNT(*) AS missing FROM employees WHERE salary IS NULL"
      },
      excel: {
        prompt: "Count the empty cells in the salary column (E2:E21).",
        starter: "=COUNTBLANK(",
        solution: "=COUNTBLANK(E2:E21)"
      }
    }
  },

  /* ---------------- GroupBy & Aggregation ---------------- */
  "avg-salary-dept": {
    id: "avg-salary-dept", topic: "groupby-agg", title: "Average salary by department", dataset: "employees", xp: 20,
    brief: "What does each department earn on average? Group by department and average the salary, rounded to 2 decimals. Both pandas and SQL quietly skip missing values when averaging — handy.",
    expected: "One row per department with its average salary, rounded to 2 decimals.",
    hints: [
      "Group by department, then apply mean/AVG to salary.",
      "Round at the end: .round(2) in pandas, ROUND(AVG(salary), 2) in SQL.",
      "Python: result = df.groupby('department')['salary'].mean().round(2).reset_index() · SQL: SELECT department, ROUND(AVG(salary),2) FROM employees GROUP BY department"
    ],
    modes: {
      python: {
        starter: "# Average salary per department, rounded to 2 decimals\nresult = ",
        solution: "result = df.groupby('department')['salary'].mean().round(2).reset_index()"
      },
      sql: {
        starter: "SELECT department, \nFROM employees\n",
        solution: "SELECT department, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department"
      },
      excel: {
        prompt: "Average salary for Engineering only, rounded to 2 decimals. Departments in C2:C21, salaries in E2:E21.",
        starter: "=ROUND(AVERAGEIF(",
        solution: "=ROUND(AVERAGEIF(C2:C21,\"Engineering\",E2:E21),2)"
      }
    }
  },

  "survey-pivot": {
    id: "survey-pivot", topic: "groupby-agg", title: "Pivot the survey", dataset: "survey", xp: 25,
    brief: "New dataset: customer survey scores. Build a pivot table — products as rows, regions as columns, average score in each cell, rounded to 2 decimals. Some product–region combos have no data; those stay empty.",
    expected: "A pivot: one row per product, one column per region, average scores inside.",
    hints: [
      "pandas has pd.pivot_table(df, index=..., columns=..., values=..., aggfunc=...).",
      "Use index='product', columns='region', values='score', aggfunc='mean', then .round(2).reset_index().",
      "Python: result = pd.pivot_table(df, index='product', columns='region', values='score', aggfunc='mean').round(2).reset_index() · SQL: GROUP BY product, region (long format)"
    ],
    modes: {
      python: {
        starter: "# Pivot: products x regions, average score\nresult = pd.pivot_table(df, )",
        solution: "result = pd.pivot_table(df, index='product', columns='region', values='score', aggfunc='mean').round(2).reset_index()"
      },
      sql: {
        starter: "-- SQL doesn't pivot easily; produce the long version:\n-- one row per (product, region) with the average score\nSELECT ",
        solution: "SELECT product, region, ROUND(AVG(score), 2) AS avg_score FROM survey GROUP BY product, region"
      },
      excel: {
        prompt: "One pivot cell by hand: average score for Desk Lamp in the East region, rounded to 2 decimals. Products B2:B21, regions C2:C21, scores D2:D21.",
        starter: "=ROUND(AVERAGEIFS(",
        solution: "=ROUND(AVERAGEIFS(D2:D21,B2:B21,\"Desk Lamp\",C2:C21,\"East\"),2)"
      }
    }
  },

  "dedupe-status": {
    id: "dedupe-status", topic: "groupby-agg", title: "Dedupe, then count", dataset: "orders", xp: 25,
    brief: "New dataset: e-commerce orders. Order 5008 was logged twice. Remove exact duplicate rows first, then count how many orders are in each status. Dedup-before-aggregate is one of the most common real-world cleaning moves.",
    expected: "One row per status with its order count, computed after removing the duplicate.",
    hints: [
      "If you skip the dedup step, 'delivered' will be one too high.",
      "Python: .drop_duplicates() then group. SQL: SELECT DISTINCT * in a subquery.",
      "Python: result = df.drop_duplicates().groupby('status').size().reset_index(name='orders') · SQL: SELECT status, COUNT(*) FROM (SELECT DISTINCT * FROM orders) GROUP BY status"
    ],
    modes: {
      python: {
        starter: "# 1) remove duplicate rows  2) count orders per status\nresult = ",
        solution: "result = df.drop_duplicates().groupby('status').size().reset_index(name='orders')"
      },
      sql: {
        starter: "-- Dedupe with a subquery, then GROUP BY\nSELECT status, \nFROM (SELECT DISTINCT * FROM orders)\n",
        solution: "SELECT status, COUNT(*) AS orders FROM (SELECT DISTINCT * FROM orders) GROUP BY status"
      }
    }
  },

  /* ---------------- Joins ---------------- */
  "join-orders": {
    id: "join-orders", topic: "joins", title: "Join orders to customers", dataset: "orders", xp: 25,
    brief: "The orders table only has customer IDs like C01. The `customers` table has the names and cities. Join them on customer_id and keep four columns: order_id, name, city, amount. In Python both tables are available as `orders` and `customers`.",
    expected: "Every order row, now with the customer's name and city: columns order_id, name, city, amount.",
    hints: [
      "A join matches rows from two tables using a shared key column.",
      "Python: orders.merge(customers, on='customer_id'), then select columns with [[...]]. SQL: JOIN ... ON.",
      "Python: result = orders.merge(customers, on='customer_id')[['order_id','name','city','amount']] · SQL: SELECT o.order_id, c.name, c.city, o.amount FROM orders o JOIN customers c ON o.customer_id = c.customer_id"
    ],
    modes: {
      python: {
        starter: "# Tables available: orders, customers\n# Keep columns: order_id, name, city, amount\nresult = orders.merge( )",
        solution: "result = orders.merge(customers, on='customer_id')[['order_id', 'name', 'city', 'amount']]"
      },
      sql: {
        starter: "SELECT o.order_id, c.name, c.city, o.amount\nFROM orders o\n",
        solution: "SELECT o.order_id, c.name, c.city, o.amount FROM orders o JOIN customers c ON o.customer_id = c.customer_id"
      }
    }
  },

  "city-revenue": {
    id: "city-revenue", topic: "joins", title: "Delivered revenue by city", dataset: "orders", xp: 30,
    brief: "Combine everything so far: join orders to customers, keep only delivered orders, then total the amount per city (rounded to 2 decimals). Missing amounts are skipped by sum/SUM automatically.",
    expected: "One row per city with its total delivered revenue, rounded to 2 decimals.",
    hints: [
      "Three steps: join → filter status == 'delivered' → group by city and sum amount.",
      "Python: merge first, then df[df['status']=='delivered'], then groupby('city')['amount'].sum().",
      "Python: m = orders.merge(customers, on='customer_id'); result = m[m['status']=='delivered'].groupby('city')['amount'].sum().round(2).reset_index() · SQL: SELECT c.city, ROUND(SUM(o.amount),2) FROM orders o JOIN customers c ON o.customer_id=c.customer_id WHERE o.status='delivered' GROUP BY c.city"
    ],
    modes: {
      python: {
        starter: "# join -> filter delivered -> total per city\nm = orders.merge( )\nresult = ",
        solution: "m = orders.merge(customers, on='customer_id')\nresult = m[m['status'] == 'delivered'].groupby('city')['amount'].sum().round(2).reset_index()"
      },
      sql: {
        starter: "SELECT c.city, \nFROM orders o\nJOIN customers c ON \nWHERE \nGROUP BY ",
        solution: "SELECT c.city, ROUND(SUM(o.amount), 2) AS revenue FROM orders o JOIN customers c ON o.customer_id = c.customer_id WHERE o.status = 'delivered' GROUP BY c.city"
      }
    }
  },

  /* ---------------- Visualization ---------------- */
  "channel-chart": {
    id: "channel-chart", topic: "visualization", title: "Chart: conversions by channel", dataset: "marketing", xp: 25,
    chart: true,
    brief: "New dataset: marketing campaigns. Total the conversions for each channel — produce a 2-column result (channel, total conversions) and DataLab will draw the bar chart for you. Charts are just aggregated tables wearing nice clothes.",
    expected: "One row per channel with total conversions. A bar chart appears when it's correct.",
    hints: [
      "Same group-and-sum pattern as revenue per region.",
      "Python: df.groupby('channel')['conversions'].sum().reset_index().",
      "Python: result = df.groupby('channel')['conversions'].sum().reset_index() · SQL: SELECT channel, SUM(conversions) FROM marketing GROUP BY channel · Excel: =SUMIF(B2:B19,\"Social\",F2:F19)"
    ],
    modes: {
      python: {
        starter: "# channel + total conversions -> we draw the chart\nresult = ",
        solution: "result = df.groupby('channel')['conversions'].sum().reset_index()"
      },
      sql: {
        starter: "SELECT channel, \nFROM marketing\n",
        solution: "SELECT channel, SUM(conversions) AS conversions FROM marketing GROUP BY channel"
      },
      excel: {
        prompt: "One bar by hand: total conversions for the Social channel. Channels in B2:B19, conversions in F2:F19.",
        starter: "=SUMIF(",
        solution: "=SUMIF(B2:B19,\"Social\",F2:F19)"
      }
    }
  },

  /* ---------------- Capstone ---------------- */
  "cap-sql": {
    id: "cap-sql", topic: "capstone", title: "Step 1 · Clean revenue (SQL)", dataset: "orders", xp: 35,
    capstone: true,
    brief: "You're writing a mini report on February orders. Step 1, in SQL: compute the real delivered revenue — dedupe the orders, keep only delivered ones, ignore missing amounts, round the total to 2 decimals.",
    expected: "A single number: clean delivered revenue.",
    hints: [
      "Stack the moves you've learned: DISTINCT subquery, WHERE on status, SUM skips NULLs by itself.",
      "Shape: SELECT ROUND(SUM(amount), 2) FROM (SELECT DISTINCT * FROM orders) WHERE ...",
      "SELECT ROUND(SUM(amount), 2) AS revenue FROM (SELECT DISTINCT * FROM orders) WHERE status = 'delivered'"
    ],
    modes: {
      sql: {
        starter: "-- Clean delivered revenue, rounded to 2 decimals\nSELECT ",
        solution: "SELECT ROUND(SUM(amount), 2) AS revenue FROM (SELECT DISTINCT * FROM orders) WHERE status = 'delivered'"
      }
    }
  },

  "cap-python": {
    id: "cap-python", topic: "capstone", title: "Step 2 · Top customers (Python)", dataset: "orders", xp: 35,
    capstone: true, orderMatters: true,
    brief: "Step 2, in pandas: who are our 3 best customers? Dedupe orders, join to customers, keep delivered orders, total the amount per customer name, sort highest first, keep the top 3 (rounded to 2 decimals).",
    expected: "3 rows: customer name + delivered revenue, biggest spender first.",
    hints: [
      "Chain it: drop_duplicates → merge → filter → groupby name → sum → round → sort desc → head(3).",
      "Use .sort_values(ascending=False) on the summed amounts before .head(3), and .reset_index() for a tidy table.",
      "m = orders.drop_duplicates().merge(customers, on='customer_id')\nresult = m[m['status']=='delivered'].groupby('name')['amount'].sum().round(2).sort_values(ascending=False).reset_index().head(3)"
    ],
    modes: {
      python: {
        starter: "# top 3 customers by clean delivered revenue\nm = \nresult = ",
        solution: "m = orders.drop_duplicates().merge(customers, on='customer_id')\nresult = m[m['status'] == 'delivered'].groupby('name')['amount'].sum().round(2).sort_values(ascending=False).reset_index().head(3)"
      }
    }
  },

  "cap-excel": {
    id: "cap-excel", topic: "capstone", title: "Step 3 · Return rate (Excel)", dataset: "orders", xp: 35,
    capstone: true,
    brief: "Step 3, in Excel: what share of order rows were returned? Divide the count of 'returned' rows by the total row count, rounded to 4 decimals. Statuses are in D2:D25. When this passes, your report unlocks below.",
    expected: "A single number like 0.0833 — the return rate.",
    hints: [
      "Rate = returned rows ÷ all rows.",
      "COUNTIF for the returned rows, COUNTA for all rows, ROUND(...,4) around the division.",
      "=ROUND(COUNTIF(D2:D25,\"returned\")/COUNTA(D2:D25),4)"
    ],
    modes: {
      excel: {
        prompt: "Return rate = returned rows / all rows, rounded to 4 decimals (D2:D25).",
        starter: "=ROUND(",
        solution: "=ROUND(COUNTIF(D2:D25,\"returned\")/COUNTA(D2:D25),4)"
      }
    }
  }
};

export const MODE_META = {
  python: { label: "Python", color: "pymode", lang: "python" },
  sql: { label: "SQL", color: "sqlmode", lang: "sql" },
  excel: { label: "Excel", color: "xlmode", lang: "excel" }
};

export function taskList() {
  return TOPICS.flatMap((t) => t.tasks);
}
