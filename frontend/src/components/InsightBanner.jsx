import React from "react";
import { useTheme } from "../ThemeContext";

export default function InsightBanner({ insight, model, generatedAt }) {
  const { isDark } = useTheme();

  return (
    <div className={`relative overflow-hidden rounded-2xl border
      ${isDark
        ? "bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-violet-950/50 border-blue-500/25"
        : "bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-lg"
      }`}>

      {/* Decorative circles */}
      <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none
        ${isDark ? "bg-blue-500/8" : "bg-white/10"}`} />
      <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none
        ${isDark ? "bg-violet-500/8" : "bg-white/10"}`} />

      {isDark && <div className="absolute inset-0 shimmer-bg opacity-30 pointer-events-none" />}

      <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
          ${isDark
            ? "bg-blue-500/20 border border-blue-400/30"
            : "bg-white/20 border border-white/30"
          }`}>
          💡
        </div>

        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className={`text-xs font-bold uppercase tracking-wider
              ${isDark ? "text-blue-400" : "text-blue-100"}`}>
              Key Business Insight
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
              ${isDark
                ? "bg-slate-800 text-slate-400 border border-slate-700"
                : "bg-white/20 text-white/90 border border-white/20"
              }`}>
              {model}
            </span>
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-blue-100/70"}`}>
              {generatedAt}
            </span>
          </div>

          {/* Insight text */}
          <p className={`text-sm sm:text-base leading-relaxed font-medium
            ${isDark ? "text-slate-100" : "text-white"}`}>
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}
