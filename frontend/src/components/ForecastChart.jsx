import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { useTheme } from "../ThemeContext";

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-2xl p-3.5 shadow-2xl text-sm min-w-[165px] border
      ${isDark
        ? "bg-slate-900 border-slate-700 text-slate-200"
        : "bg-white border-slate-200 text-slate-700"
      }`}>
      <p className={`font-semibold mb-2.5 pb-2 border-b text-xs
        ${isDark ? "text-slate-300 border-slate-700" : "text-slate-500 border-slate-100"}`}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between items-center gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-xs">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {entry.value != null ? Math.round(entry.value).toLocaleString("en-IN") : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ForecastChart({ forecastData }) {
  const { isDark } = useTheme();
  const products = useMemo(() => forecastData.map((f) => f.product), [forecastData]);
  const [selected, setSelected] = useState(products[0] ?? "");

  const entry = useMemo(
    () => forecastData.find((f) => f.product === selected),
    [forecastData, selected]
  );

  const chartData = useMemo(() => {
    if (!entry) return [];
    const n = entry.dates.length;
    const historyEnd = n - 30;
    const start = Math.max(0, historyEnd - 30);
    return entry.dates.slice(start).map((d, i) => {
      const idx = start + i;
      return {
        date: d,
        Actual:   entry.actual[idx] ?? null,
        Forecast: entry.predicted[idx] ?? null,
        isForecast: idx >= historyEnd,
      };
    });
  }, [entry]);

  const splitDate = chartData.find((d) => d.isForecast)?.date;

  const tickFmt = (val) => {
    if (!val) return "";
    const d = new Date(val + "T00:00:00");
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
  };

  // theme-aware chart tokens
  const T = isDark
    ? { grid: "#1e293b", axis: "#475569", actualLine: "#38bdf8", forecastLine: "#a78bfa", refLine: "#60a5fa" }
    : { grid: "#e2e8f0", axis: "#94a3b8", actualLine: "#0284c7", forecastLine: "#7c3aed", refLine: "#3b82f6" };

  return (
    <div className={`rounded-2xl border transition-colors duration-300
      ${isDark
        ? "bg-slate-900/80 border-slate-700/80 shadow-lg"
        : "bg-white border-slate-200 shadow-md"
      }`}>

      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 pb-0`}>
        <div>
          <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
            Demand Forecast
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-400"}`}>
            Last 30 days actual + 30-day AI forecast
          </p>
        </div>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={`text-sm rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500
                     cursor-pointer max-w-xs w-full sm:w-auto transition-colors
            ${isDark
              ? "bg-slate-800 border-slate-600 text-slate-100 hover:border-slate-400"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400"
            }`}
        >
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Legend pills */}
      <div className="flex items-center gap-4 px-5 pt-4 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 rounded" style={{ background: T.actualLine }} />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke={T.forecastLine} strokeWidth="2" strokeDasharray="5 3" /></svg>
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Forecast</span>
        </div>
        {splitDate && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-px h-3 border-l-2 border-dashed" style={{ borderColor: T.refLine }} />
            <span className={`text-xs ${isDark ? "text-blue-400" : "text-blue-500"}`}>Forecast start</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full h-72 sm:h-80 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFmt}
              tick={{ fill: T.axis, fontSize: 11 }}
              axisLine={{ stroke: T.grid }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: T.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            {splitDate && (
              <ReferenceLine
                x={splitDate}
                stroke={T.refLine}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="Actual"
              stroke={T.actualLine}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: T.actualLine, strokeWidth: 0 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Forecast"
              stroke={T.forecastLine}
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 5, fill: T.forecastLine, strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
