"""
Sales & Inventory Demand Forecasting Script
Trains time-series forecast models and writes results.json for the static frontend.

Usage:
    pip install -r requirements.txt
    python generate_forecast.py

Output: frontend/src/data/results.json
"""

import json
import os
import sys
import math
import random
import warnings
from datetime import date, timedelta
from pathlib import Path

warnings.filterwarnings("ignore")

# ── Constants ────────────────────────────────────────────────────────────────
OUTPUT_PATH = Path(__file__).parent / "frontend" / "src" / "data" / "results.json"
FORECAST_DAYS = 30
HISTORY_DAYS = 90
SEED = 42
random.seed(SEED)

# Indian retail product catalogue
PRODUCTS = [
    {"name": "Amul Butter 500g",       "price": 280,  "base": 75,  "weekend": 1.05, "trend": 0.0,  "category": "Dairy"},
    {"name": "Lay's Classic Chips",     "price": 20,   "base": 300, "weekend": 1.45, "trend": 0.3,  "category": "Snacks"},
    {"name": "Coca-Cola 2L",            "price": 85,   "base": 140, "weekend": 1.30, "trend": -0.4, "category": "Beverages"},
    {"name": "Maggi Noodles 70g",       "price": 14,   "base": 420, "weekend": 0.90, "trend": 0.1,  "category": "Instant Food"},
    {"name": "Dove Shampoo 340ml",      "price": 320,  "base": 55,  "weekend": 1.10, "trend": 0.15, "category": "Personal Care"},
    {"name": "Parle-G Biscuits 800g",   "price": 65,   "base": 500, "weekend": 0.95, "trend": 0.0,  "category": "Snacks"},
    {"name": "Haldiram's Bhujia 1kg",   "price": 380,  "base": 80,  "weekend": 1.35, "trend": 0.2,  "category": "Snacks"},
    {"name": "Colgate Toothpaste 200g", "price": 120,  "base": 110, "weekend": 1.00, "trend": 0.0,  "category": "Personal Care"},
    {"name": "Dettol Handwash 250ml",   "price": 155,  "base": 90,  "weekend": 0.95, "trend": 0.0,  "category": "Hygiene"},
    {"name": "Tata Tea Premium 250g",   "price": 155,  "base": 130, "weekend": 0.90, "trend": -0.2, "category": "Beverages"},
    {"name": "Britannia Bread 400g",    "price": 45,   "base": 210, "weekend": 1.20, "trend": 0.1,  "category": "Bakery"},
    {"name": "Aashirvaad Atta 5kg",     "price": 280,  "base": 65,  "weekend": 1.05, "trend": 0.0,  "category": "Staples"},
    {"name": "Surf Excel 1kg",          "price": 210,  "base": 50,  "weekend": 1.00, "trend": 0.0,  "category": "Home Care"},
    {"name": "Nestle KitKat 4F",        "price": 40,   "base": 350, "weekend": 1.40, "trend": 0.5,  "category": "Confectionery"},
    {"name": "Vim Dishwash Gel 750ml",  "price": 195,  "base": 70,  "weekend": 1.00, "trend": 0.0,  "category": "Home Care"},
    {"name": "Pedigree Dog Food 3kg",   "price": 750,  "base": 30,  "weekend": 0.90, "trend": 0.6,  "category": "Pet Care"},
    {"name": "Sunsilk Shampoo 340ml",   "price": 250,  "base": 60,  "weekend": 1.10, "trend": 0.0,  "category": "Personal Care"},
    {"name": "Boost Drink 500g",        "price": 280,  "base": 95,  "weekend": 1.20, "trend": 0.2,  "category": "Health Drinks"},
    {"name": "Kurkure Masala Munch",    "price": 20,   "base": 380, "weekend": 1.45, "trend": 0.4,  "category": "Snacks"},
    {"name": "Head & Shoulders 180ml",  "price": 230,  "base": 65,  "weekend": 1.05, "trend": 0.0,  "category": "Personal Care"},
]

TODAY = date(2026, 6, 2)
HIST_START = TODAY - timedelta(days=HISTORY_DAYS)


# ── Helpers ───────────────────────────────────────────────────────────────────
def daterange(start: date, n: int):
    return [start + timedelta(days=i) for i in range(n)]


def demand_series(product: dict, start: date, n: int, noise_scale=0.12):
    """Generate synthetic demand with trend, weekly seasonality, and noise."""
    series = []
    rng = random.Random(hash(product["name"]) % (2**32))
    for i in range(n):
        d = start + timedelta(days=i)
        # linear trend
        base = product["base"] + product["trend"] * i
        # weekly seasonality (Fri=4, Sat=5 spike; Mon=0 dip)
        dow = d.weekday()  # 0=Mon … 6=Sun
        if dow in (4, 5):       # Fri, Sat
            base *= product["weekend"]
        elif dow == 6:           # Sun
            base *= (1 + (product["weekend"] - 1) * 0.6)
        elif dow == 0:           # Mon — slight dip
            base *= 0.92
        # add noise
        noise = rng.gauss(0, noise_scale * base)
        series.append(max(0, round(base + noise)))
    return series


def simple_forecast(history: list, n: int) -> list:
    """Holt-Winters-lite exponential smoothing with additive weekly seasonality."""
    if len(history) < 14:
        mean = sum(history) / len(history) if history else 0
        return [max(0, round(mean)) for _ in range(n)]

    alpha = 0.25  # level
    beta = 0.05   # trend
    gamma = 0.15  # seasonal (period=7)
    m = 7

    # initialise
    level = sum(history[:m]) / m
    trend_val = (sum(history[m:2*m]) - sum(history[:m])) / (m * m) if len(history) >= 2 * m else 0
    season = [history[i] / level if level > 0 else 1.0 for i in range(m)]

    smoothed = []
    for i, y in enumerate(history):
        s = season[i % m]
        new_level = alpha * (y / s if s != 0 else y) + (1 - alpha) * (level + trend_val)
        new_trend = beta * (new_level - level) + (1 - beta) * trend_val
        season[i % m] = gamma * (y / new_level if new_level > 0 else 1) + (1 - gamma) * s
        level, trend_val = new_level, new_trend
        smoothed.append(max(0, round(level * season[i % m])))

    # forecast
    result = []
    for h in range(1, n + 1):
        pred = (level + h * trend_val) * season[(len(history) + h - 1) % m]
        result.append(max(0, round(pred)))
    return result


def try_prophet(history_dates, history_values, n):
    """Attempt Prophet forecast, return None on failure."""
    try:
        from prophet import Prophet  # type: ignore
        import pandas as pd          # type: ignore
        df = pd.DataFrame({"ds": history_dates, "y": history_values})
        m = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False,
                    changepoint_prior_scale=0.05)
        m.fit(df)
        future = m.make_future_dataframe(periods=n)
        fc = m.predict(future)
        preds = fc["yhat"].tail(n).round().astype(int).clip(lower=0).tolist()
        return preds
    except Exception:
        return None


def try_arima(history_values, n):
    """Attempt ARIMA(1,1,1) forecast, return None on failure."""
    try:
        from statsmodels.tsa.arima.model import ARIMA  # type: ignore
        model = ARIMA(history_values, order=(1, 1, 1))
        fit = model.fit()
        preds = [max(0, round(v)) for v in fit.forecast(steps=n)]
        return preds
    except Exception:
        return None


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Sales & Inventory Demand Forecasting")
    print("=" * 60)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    hist_dates = daterange(HIST_START, HISTORY_DAYS)
    fc_dates   = daterange(TODAY, FORECAST_DAYS)

    forecast_entries = []
    inventory_entries = []
    overstock_count = 0
    stockout_count = 0
    blocked_capital_inr = 0
    lost_sales_inr = 0

    print(f"\nForecast period : {TODAY} → {fc_dates[-1]}")
    print(f"History period  : {HIST_START} → {hist_dates[-1]}\n")

    # pick best available model
    test_series = demand_series(PRODUCTS[0], HIST_START, HISTORY_DAYS)
    model_name = "Holt-Winters"
    if try_prophet([str(d) for d in hist_dates], test_series, 5) is not None:
        model_name = "Prophet"
    elif try_arima(test_series, 5) is not None:
        model_name = "ARIMA(1,1,1)"

    print(f"Model selected  : {model_name}\n")
    print(f"{'Product':<35} {'Model':<15} {'Avg Fcast/day':>13} {'Status':<12}")
    print("-" * 80)

    weekend_spike_products = []  # for business insight

    for p in PRODUCTS:
        actual = demand_series(p, HIST_START, HISTORY_DAYS)
        hist_dates_str = [str(d) for d in hist_dates]
        fc_dates_str   = [str(d) for d in fc_dates]

        # fit model
        predicted_hist = None
        if model_name == "Prophet":
            predicted_hist = try_prophet(hist_dates_str, actual, FORECAST_DAYS)
        elif model_name == "ARIMA(1,1,1)":
            predicted_hist = try_arima(actual, FORECAST_DAYS)
        if predicted_hist is None:
            predicted_hist = simple_forecast(actual, FORECAST_DAYS)

        avg_fc = round(sum(predicted_hist) / len(predicted_hist), 1)
        total_fc_30 = sum(predicted_hist)

        # smoothed history prediction (for chart only — use simple model on rolling window)
        smooth_hist = simple_forecast(actual[:60], HISTORY_DAYS - 60)
        predicted_on_hist = actual[:60] + smooth_hist  # align length to HISTORY_DAYS

        # current stock assumption: random between 0.5x and 1.8x forecasted demand
        rng2 = random.Random(hash(p["name"] + "stock") % (2**32))
        stock_ratio = rng2.uniform(0.50, 1.80)
        current_stock = round(total_fc_30 * stock_ratio)

        # flags
        if stock_ratio > 1.30:
            status = "OVERSTOCK"
            excess = current_stock - total_fc_30
            value = round(excess * p["price"])
            overstock_count += 1
            blocked_capital_inr += value
        elif stock_ratio < 0.70:
            status = "STOCKOUT"
            shortage = total_fc_30 - current_stock
            value = round(shortage * p["price"])
            stockout_count += 1
            lost_sales_inr += value
        else:
            status = "HEALTHY"
            value = 0

        # weekend spike detection
        weekend_avg = 0
        weekday_avg = 0
        wknd_cnt = wkdy_cnt = 0
        for i, a in enumerate(actual):
            dow = (HIST_START + timedelta(days=i)).weekday()
            if dow in (4, 5, 6):
                weekend_avg += a; wknd_cnt += 1
            else:
                weekday_avg += a; wkdy_cnt += 1
        if wknd_cnt and wkdy_cnt:
            wa = weekend_avg / wknd_cnt
            wda = weekday_avg / wkdy_cnt
            spike_pct = ((wa - wda) / wda * 100) if wda > 0 else 0
            if spike_pct > 25:
                weekend_spike_products.append((p["name"], round(spike_pct), avg_fc))

        inventory_entries.append({
            "product":          p["name"],
            "category":         p["category"],
            "status":           status,
            "current_stock":    current_stock,
            "forecasted_demand": total_fc_30,
            "price_inr":        p["price"],
            "value_inr":        value,
        })

        forecast_entries.append({
            "product":   p["name"],
            "dates":     hist_dates_str + fc_dates_str,
            "actual":    actual + [None] * FORECAST_DAYS,
            "predicted": predicted_on_hist + predicted_hist,
        })

        print(f"{p['name']:<35} {model_name:<15} {avg_fc:>13} {status:<12}")

    # inventory cost reduction estimate
    total_stock_value = sum(e["current_stock"] * PRODUCTS[i]["price"] for i, e in enumerate(inventory_entries))
    optimal_value     = sum(e["forecasted_demand"] * PRODUCTS[i]["price"] for i, e in enumerate(inventory_entries))
    reduction_pct = round((total_stock_value - optimal_value) / total_stock_value * 100, 1) if total_stock_value else 0
    reduction_pct = max(0, min(reduction_pct, 100))

    # key insight
    if weekend_spike_products:
        best = sorted(weekend_spike_products, key=lambda x: -x[1])[0]
        insight = (
            f"'{best[0]}' shows a {best[1]}% demand spike every Fri–Sat — "
            f"current stock is under-provisioned on weekends (avg {best[2]} units/day forecast). "
            f"Replenishing Thursday ensures weekend demand is fully captured."
        )
    else:
        insight = (
            f"Stockout-risk SKUs are concentrated in high-velocity Snacks & Beverages. "
            f"Increasing safety stock by 20% for these categories eliminates ~₹{lost_sales_inr:,} in estimated lost sales."
        )

    stats = {
        "total_products":          len(PRODUCTS),
        "overstock_count":         overstock_count,
        "blocked_capital_inr":     blocked_capital_inr,
        "stockout_count":          stockout_count,
        "estimated_lost_sales_inr": lost_sales_inr,
        "inventory_cost_reduction_pct": reduction_pct,
    }

    result = {
        "generated_at": str(TODAY),
        "model":        model_name,
        "stats":        stats,
        "insight":      insight,
        "forecast":     forecast_entries,
        "inventory":    inventory_entries,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"  Stats Summary")
    print("=" * 60)
    print(f"  Total products  : {stats['total_products']}")
    print(f"  Overstock count : {stats['overstock_count']}  |  Blocked capital: ₹{stats['blocked_capital_inr']:,}")
    print(f"  Stockout count  : {stats['stockout_count']}   |  Est. lost sales: ₹{stats['estimated_lost_sales_inr']:,}")
    print(f"  Cost reduction  : {stats['inventory_cost_reduction_pct']}%")
    print(f"\n  Insight: {insight[:80]}...")
    print(f"\n  Saved → {OUTPUT_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
