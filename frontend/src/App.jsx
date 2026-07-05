import React, { useState } from "react";
import data from "./data/results.json";
import { useTheme } from "./ThemeContext.jsx";
import KPICards from "./components/KPICards.jsx";
import ForecastChart from "./components/ForecastChart.jsx";
import InventoryTable from "./components/InventoryTable.jsx";
import InsightBanner from "./components/InsightBanner.jsx";
import CurrencySelector, { CURRENCIES } from "./components/CurrencySelector.jsx";

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`relative w-14 h-7 rounded-full border transition-all duration-300 flex items-center
        ${isDark
          ? "bg-slate-700 border-slate-600 hover:border-slate-400"
          : "bg-blue-100 border-blue-200 hover:border-blue-400"
        }`}
    >
      <span className={`absolute text-base transition-all duration-300
        ${isDark ? "left-0.5 opacity-100" : "left-0.5 opacity-0"}`}>🌙</span>
      <span className={`absolute text-base transition-all duration-300
        ${isDark ? "right-0.5 opacity-0" : "right-0.5 opacity-100"}`}>☀️</span>
      <span className={`absolute w-5 h-5 rounded-full shadow-md transition-all duration-300
        ${isDark
          ? "translate-x-7 bg-slate-200"
          : "translate-x-1 bg-blue-500"
        }`} />
    </button>
  );
}

export default function App() {
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const { isDark } = useTheme();

  const healthy = data.stats.total_products - data.stats.overstock_count - data.stats.stockout_count;

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300
      ${isDark ? "bg-[#060b17]" : "bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30"}`}>

      {/* ── Dark-mode animated ambient blobs ──────────────────────────── */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full
                          bg-blue-600/10 blur-[100px] animate-float-slow" />
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full
                          bg-violet-600/10 blur-[100px] animate-float-mid" />
          <div className="absolute bottom-0 left-1/3 w-[450px] h-[300px] rounded-full
                          bg-cyan-500/8 blur-[100px] animate-float-fast" />
        </div>
      )}
      {/* ── Light-mode subtle accent blob ─────────────────────────────── */}
      {!isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
          <div className="absolute -top-24 right-0 w-[600px] h-[400px] rounded-full
                          bg-blue-200/40 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full
                          bg-indigo-200/30 blur-[100px]" />
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300
        ${isDark
          ? "border-slate-800/80 bg-[#060b17]/80 backdrop-blur-xl"
          : "border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

          {/* Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg
              ${isDark ? "bg-blue-500/20 border border-blue-500/30" : "bg-blue-600 shadow-md"}`}>
              📊
            </div>
            <div className="min-w-0">
              <h1 className={`text-base sm:text-lg font-extrabold truncate leading-tight
                ${isDark ? "text-gradient-blue" : "text-gradient-dark"}`}>
                Demand Forecast
              </h1>
              <p className={`text-xs hidden sm:block truncate
                ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Sales &amp; Inventory Intelligence Dashboard
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live badge */}
            <div className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border
              ${isDark
                ? "text-slate-400 bg-slate-800/70 border-slate-700"
                : "text-slate-500 bg-white border-slate-200 shadow-sm"
              }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Updated {data.generated_at}
            </div>
            <CurrencySelector currency={currency} onChange={setCurrency} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">

        {/* Insight */}
        <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
          <InsightBanner insight={data.insight} model={data.model} generatedAt={data.generated_at} />
        </div>

        {/* KPI Cards */}
        <div className="animate-slide-up" style={{ animationDelay: "60ms" }}>
          <KPICards stats={data.stats} currency={currency} />
        </div>

        {/* Summary bar */}
        <div className="animate-slide-up flex flex-wrap items-center gap-3" style={{ animationDelay: "100ms" }}>
          <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm border
            ${isDark
              ? "bg-emerald-950/50 border-emerald-500/25 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
            }`}>
            <span className="text-lg">✅</span>
            <span className="font-semibold">
              {data.stats.inventory_cost_reduction_pct}% inventory cost reduction achievable
            </span>
            <span className={`text-xs hidden sm:inline ${isDark ? "text-emerald-500" : "text-emerald-500"}`}>
              by right-sizing overstock to forecast
            </span>
          </div>

          <div className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm border
            ${isDark
              ? "bg-slate-800/60 border-slate-700 text-slate-400"
              : "bg-white border-slate-200 text-slate-500 shadow-sm"
            }`}>
            <span>🏪</span>
            <span className="text-red-400 font-medium">{data.stats.overstock_count} overstock</span>
            <span className={isDark ? "text-slate-600" : "text-slate-300"}>·</span>
            <span className="text-amber-500 font-medium">{data.stats.stockout_count} stockout-risk</span>
            <span className={isDark ? "text-slate-600" : "text-slate-300"}>·</span>
            <span className={`font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{healthy} healthy</span>
          </div>
        </div>

        {/* Forecast chart */}
        <div className="animate-slide-up" style={{ animationDelay: "140ms" }}>
          <ForecastChart forecastData={data.forecast} />
        </div>

        {/* Inventory table */}
        <div className="animate-slide-up" style={{ animationDelay: "180ms" }}>
          <InventoryTable inventory={data.inventory} currency={currency} />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className={`relative z-10 border-t mt-8 transition-colors duration-300
        ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center
                          justify-between gap-3 text-xs
          ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>Predictions pre-computed at build time — instant load, zero hosting cost.</span>
            <span className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Currency conversion uses fixed approximate rates for presentation purposes.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Model: <strong className={isDark ? "text-slate-400" : "text-slate-600"}>{data.model}</strong></span>
            <span>React · Vite · Tailwind · Recharts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
