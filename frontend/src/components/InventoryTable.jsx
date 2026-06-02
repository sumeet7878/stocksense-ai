import React, { useState, useMemo } from "react";
import { formatMoney } from "./CurrencySelector";
import { useTheme } from "../ThemeContext";

const STATUS_CFG = {
  OVERSTOCK: {
    darkBadge:  "bg-red-500/15 text-red-400 border border-red-500/30",
    lightBadge: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-400",
    label: "Overstock",
    row: "hover:bg-red-500/5",
    rowL: "hover:bg-red-50/60",
  },
  STOCKOUT: {
    darkBadge:  "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    lightBadge: "bg-amber-50 text-amber-600 border border-amber-200",
    dot: "bg-amber-400",
    label: "Stockout Risk",
    row: "hover:bg-amber-500/5",
    rowL: "hover:bg-amber-50/60",
  },
  HEALTHY: {
    darkBadge:  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    lightBadge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    dot: "bg-emerald-400",
    label: "Healthy",
    row: "hover:bg-emerald-500/5",
    rowL: "hover:bg-emerald-50/60",
  },
};

const FILTERS = ["ALL", "OVERSTOCK", "STOCKOUT", "HEALTHY"];
const FILTER_COLORS = {
  ALL:       { active: "bg-blue-600 border-blue-500 text-white",       idle: "" },
  OVERSTOCK: { active: "bg-red-600 border-red-500 text-white",         idle: "" },
  STOCKOUT:  { active: "bg-amber-500 border-amber-400 text-white",     idle: "" },
  HEALTHY:   { active: "bg-emerald-600 border-emerald-500 text-white", idle: "" },
};

export default function InventoryTable({ inventory, currency }) {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("value_inr");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const filtered = useMemo(() => {
    let rows = filter === "ALL" ? inventory : inventory.filter((r) => r.status === filter);
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [inventory, filter, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  }

  const COLS = [
    { label: "Product",       key: "product",           align: "left"  },
    { label: "Category",      key: "category",          align: "left"  },
    { label: "Status",        key: "status",            align: "left"  },
    { label: "Current Stock", key: "current_stock",     align: "right" },
    { label: "30d Forecast",  key: "forecasted_demand", align: "right" },
    { label: "Value at Risk", key: "value_inr",         align: "right" },
  ];

  return (
    <div className={`rounded-2xl border transition-colors duration-300
      ${isDark
        ? "bg-slate-900/80 border-slate-700/80 shadow-lg"
        : "bg-white border-slate-200 shadow-md"
      }`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 pb-4">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
            Inventory Status
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            {filtered.length} of {inventory.length} products
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f === "ALL" ? inventory.length : inventory.filter((r) => r.status === f).length;
            const cfg = FILTER_COLORS[f];
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(0); }}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all
                  ${filter === f
                    ? cfg.active
                    : isDark
                      ? "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-white"
                  }`}
              >
                {f === "ALL" ? "All" : STATUS_CFG[f]?.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className={`mx-5 border-t ${isDark ? "border-slate-800" : "border-slate-100"}`} />

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className={isDark ? "bg-slate-800/50" : "bg-slate-50/80"}>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider
                             cursor-pointer select-none whitespace-nowrap transition-colors
                             ${col.align === "right" ? "text-right" : "text-left"}
                             ${isDark
                               ? "text-slate-400 hover:text-slate-200"
                               : "text-slate-400 hover:text-slate-600"
                             }`}
                >
                  {col.label}
                  {sortKey === col.key
                    ? <span className="ml-1 text-blue-400">{sortDir === "asc" ? " ↑" : " ↓"}</span>
                    : <span className={`ml-1 ${isDark ? "text-slate-700" : "text-slate-300"}`}>↕</span>
                  }
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paged.map((row, i) => {
              const st = STATUS_CFG[row.status] ?? STATUS_CFG.HEALTHY;
              return (
                <tr
                  key={row.product}
                  className={`border-t transition-colors
                    ${isDark
                      ? `border-slate-800/60 ${st.row} ${i % 2 !== 0 ? "bg-slate-800/20" : ""}`
                      : `border-slate-100 ${st.rowL} ${i % 2 !== 0 ? "bg-slate-50/50" : ""}`
                    }`}
                >
                  <td className={`py-3.5 px-4 font-semibold whitespace-nowrap
                    ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    {row.product}
                  </td>
                  <td className={`py-3.5 px-4 whitespace-nowrap
                    ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <span className={`text-xs px-2 py-0.5 rounded-md
                      ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                      ${isDark ? st.darkBadge : st.lightBadge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 text-right tabular-nums
                    ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {row.current_stock.toLocaleString("en-IN")}
                  </td>
                  <td className={`py-3.5 px-4 text-right tabular-nums
                    ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {row.forecasted_demand.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-bold">
                    {row.value_inr > 0 ? (
                      <span className={row.status === "OVERSTOCK" ? "text-red-400" : "text-amber-500"}>
                        {formatMoney(row.value_inr, currency)}
                      </span>
                    ) : (
                      <span className="text-emerald-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-5 py-3.5 border-t
          ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
                  ${page === p
                    ? "bg-blue-600 text-white shadow"
                    : isDark
                      ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                      : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                  }`}
              >
                {p + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
