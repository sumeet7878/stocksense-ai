import React from "react";
import { useTheme } from "../ThemeContext";

export const CURRENCIES = [
  { code: "INR", symbol: "₹",    label: "INR (₹)",    rate: 1      },
  { code: "USD", symbol: "$",    label: "USD ($)",    rate: 0.012  },
  { code: "AED", symbol: "د.إ", label: "AED (د.إ)", rate: 0.044  },
  { code: "GBP", symbol: "£",   label: "GBP (£)",   rate: 0.0095 },
  { code: "EUR", symbol: "€",   label: "EUR (€)",   rate: 0.011  },
];

export function formatMoney(amountInr, currency) {
  const converted = Math.round(amountInr * currency.rate);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(converted);
  return `${currency.symbol}${formatted}`;
}

export default function CurrencySelector({ currency, onChange }) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs hidden sm:inline ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        Currency
      </span>
      <select
        value={currency.code}
        onChange={(e) => {
          const found = CURRENCIES.find((c) => c.code === e.target.value);
          if (found) onChange(found);
        }}
        className={`text-sm rounded-xl px-3 py-1.5 border focus:outline-none focus:ring-2
                   focus:ring-blue-500 cursor-pointer transition-colors
          ${isDark
            ? "bg-slate-800 border-slate-600 text-slate-100 hover:border-slate-400"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-400 shadow-sm"
          }`}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}
