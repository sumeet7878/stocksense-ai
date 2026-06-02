import React from "react";
import { formatMoney } from "./CurrencySelector";
import { useTheme } from "../ThemeContext";

const CARDS = [
  {
    key: "total_products",
    label: "Total Products",
    suffix: "SKUs tracked",
    icon: "📦",
    iconBg:    "bg-blue-500/20 border-blue-500/30",
    iconBgL:   "bg-blue-100 border-blue-200",
    topBar:    "from-blue-500 to-cyan-400",
    glow:      "glow-blue",
    valueColor: "text-blue-400",
    valueColorL:"text-blue-700",
    format: (v) => v,
  },
  {
    key: "blocked_capital_inr",
    label: "Blocked Capital",
    suffix: "tied in overstock",
    icon: "🔴",
    iconBg:    "bg-red-500/20 border-red-500/30",
    iconBgL:   "bg-red-100 border-red-200",
    topBar:    "from-red-500 to-rose-400",
    glow:      "glow-red",
    valueColor: "text-red-400",
    valueColorL:"text-red-700",
    format: (v, cur) => formatMoney(v, cur),
    highlight: true,
  },
  {
    key: "stockout_count",
    label: "Stockout Risk",
    suffix: "products at risk",
    icon: "⚠️",
    iconBg:    "bg-amber-500/20 border-amber-500/30",
    iconBgL:   "bg-amber-100 border-amber-200",
    topBar:    "from-amber-400 to-yellow-300",
    glow:      "glow-amber",
    valueColor: "text-amber-400",
    valueColorL:"text-amber-700",
    format: (v) => v,
  },
  {
    key: "estimated_lost_sales_inr",
    label: "Est. Lost Sales",
    suffix: "if not replenished",
    icon: "📉",
    iconBg:    "bg-orange-500/20 border-orange-500/30",
    iconBgL:   "bg-orange-100 border-orange-200",
    topBar:    "from-orange-500 to-amber-400",
    glow:      "glow-orange",
    valueColor: "text-orange-400",
    valueColorL:"text-orange-600",
    format: (v, cur) => formatMoney(v, cur),
    highlight: true,
  },
];

export default function KPICards({ stats, currency }) {
  const { isDark } = useTheme();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, i) => {
        const raw = stats[card.key] ?? 0;
        const display = card.highlight ? card.format(raw, currency) : card.format(raw);

        return (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-2xl card-hover
              ${isDark
                ? `bg-slate-900/80 border border-slate-700/80 ${card.glow}`
                : "bg-white border border-slate-200/80 shadow-md hover:shadow-xl"
              }`}
          >
            {/* top gradient bar */}
            <div className={`h-1 w-full bg-gradient-to-r ${card.topBar}`} />

            {/* dark shimmer overlay */}
            {isDark && <div className="absolute inset-0 shimmer-bg opacity-40 pointer-events-none" />}

            <div className="relative z-10 p-5">
              {/* icon + label row */}
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl
                  ${isDark ? card.iconBg : card.iconBgL}`}>
                  {card.icon}
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider text-right leading-tight max-w-[90px]
                  ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                  {card.label}
                </span>
              </div>

              {/* value */}
              <div className={`text-2xl sm:text-3xl font-extrabold leading-none tracking-tight
                ${isDark ? card.valueColor : card.valueColorL}`}>
                {display}
              </div>

              {/* suffix */}
              <div className={`text-xs mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {card.suffix}
              </div>
            </div>

            {/* large decorative icon bg */}
            <div className="absolute -bottom-3 -right-3 text-6xl opacity-[0.04] pointer-events-none select-none">
              {card.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
}
