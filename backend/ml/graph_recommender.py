"""
Graph Recommendation Engine — returns up to 10 ranked chart suggestions
based on column types, cardinality, and data characteristics.
"""
import pandas as pd
import numpy as np
from typing import List, Dict


def _col_type(series: pd.Series) -> str:
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    return "categorical"


def _cardinality(series: pd.Series) -> str:
    """low (<= 10 unique), medium (<= 50), high (> 50)"""
    n = series.nunique()
    if n <= 10:  return "low"
    if n <= 50:  return "medium"
    return "high"


def _is_binary(series: pd.Series) -> bool:
    return series.nunique() == 2


def recommend_charts(df: pd.DataFrame, columns: List[str]) -> List[Dict]:
    """
    Return a ranked list (best first) of up to 10 chart recommendations.
    Each item: {type, reason, config}
    """
    if not columns:
        columns = list(df.columns)
    columns = [c for c in columns if c in df.columns]
    if not columns:
        return []

    types  = {c: _col_type(df[c]) for c in columns}
    cards  = {c: _cardinality(df[c]) for c in columns}
    num    = [c for c, t in types.items() if t == "numeric"]
    cat    = [c for c, t in types.items() if t == "categorical"]
    dt     = [c for c, t in types.items() if t == "datetime"]

    recs   = []
    seen   = set()

    def add(chart_type, reason, config, score=50):
        if chart_type not in seen:
            seen.add(chart_type)
            recs.append({"type": chart_type, "reason": reason, "config": config, "_score": score})

    # ── Single-column rules ────────────────────────────────────────────────
    if len(columns) == 1:
        c = columns[0]
        t = types[c]
        card = cards[c]

        if t == "numeric":
            add("histogram",     "Shows the distribution of a numeric column",            {"x": c},             95)
            add("box",           "Reveals outliers and the interquartile spread",         {"y": c},             85)
            add("violin",        "Like a box plot, but also shows density shape",         {"y": c},             75)
            add("line",          "Treats index as x-axis to show value trend over rows",  {"y": c},             60)
        elif t == "categorical":
            if card == "low":
                add("pie",       f"Only {df[c].nunique()} categories — great for a pie chart", {"names": c},    90)
                add("donut",     "Donut variant of the pie, easier to read percentages",  {"names": c},         85)
                add("bar",       "Horizontal bars make category labels easy to read",     {"x": c},             80)
            else:
                add("bar",       "Value counts per category",                             {"x": c},             90)
                add("treemap",   "Proportional area per category, handles many values",   {"names": c},         75)
        elif t == "datetime":
            add("line",          "Time-series line chart — perfect for temporal data",    {"x": c},             95)
            add("area",          "Area chart emphasises cumulative volume over time",     {"x": c},             80)
        return _rank(recs)

    # ── Two-column rules ───────────────────────────────────────────────────
    if len(columns) == 2:
        c1, c2 = columns[0], columns[1]
        t1, t2 = types[c1], types[c2]

        if t1 == "numeric" and t2 == "numeric":
            add("scatter",    "Best for showing correlation between two numeric columns",     {"x": c1, "y": c2}, 98)
            add("line",       "Useful if one column represents a sequential ordering",        {"x": c1, "y": c2}, 80)
            add("area",       "Area chart if both columns have a natural flow",               {"x": c1, "y": c2}, 65)
            add("histogram",  f"Overlay histograms — compare distributions of {c1} vs {c2}", {"x": c1},          55)

        elif t1 == "categorical" and t2 == "numeric":
            add("bar",        "Compare numeric values across categories",                     {"x": c1, "y": c2}, 95)
            add("box",        "Distribution of numeric values per category",                  {"x": c1, "y": c2}, 85)
            add("violin",     "Richer distribution shape per category",                       {"x": c1, "y": c2}, 75)
            add("scatter",    "Spread of numeric values per category",                        {"x": c1, "y": c2}, 65)
            if cards[c1] == "low":
                add("pie",    f"Pie share of {c2} per {c1} category",                        {"names": c1, "values": c2}, 70)

        elif t1 == "numeric" and t2 == "categorical":
            add("bar",        "Compare numeric values across categories",                     {"x": c2, "y": c1}, 95)
            add("box",        "Distribution per category",                                    {"x": c2, "y": c1}, 85)
            add("violin",     "Density shape per category",                                   {"x": c2, "y": c1}, 75)

        elif t1 == "datetime" and t2 == "numeric":
            add("line",       "Time-series trend — classic and clear",                        {"x": c1, "y": c2}, 98)
            add("area",       "Area chart emphasises volume change over time",                {"x": c1, "y": c2}, 88)
            add("scatter",    "Individual data points over time",                             {"x": c1, "y": c2}, 70)
            add("bar",        "Bar chart can work well for discrete time periods",            {"x": c1, "y": c2}, 60)

        elif t1 == "categorical" and t2 == "categorical":
            add("bar",        "Count of each combination of categories",                      {"x": c1, "y": c2}, 80)
            add("treemap",    "Nested area proportional to frequency",                        {"names": c1},      70)
            if cards[c1] == "low" and cards[c2] == "low":
                add("heatmap","Frequency matrix of two categorical columns",                  {"columns": [c1,c2]},75)
        else:
            add("bar",        "Default comparison chart",                                     {"x": c1, "y": c2}, 70)

        return _rank(recs)

    # ── Multi-column rules ─────────────────────────────────────────────────
    if num and cat:
        add("bar",     f"Group {num[0]} by {cat[0]}",                                   {"x": cat[0], "y": num[0]},                   90)
        add("box",     f"Distribution of {num[0]} per {cat[0]}",                        {"x": cat[0], "y": num[0]},                   85)
        add("scatter", f"Scatter of first two numeric columns",                          {"x": num[0], "y": num[1] if len(num)>1 else num[0]}, 80)
        if dt:
            add("line", f"Time trend of {num[0]}",                                      {"x": dt[0], "y": num[0]},                    88)
        if len(num) >= 2:
            add("heatmap", "Correlation matrix of all numeric columns",                 {"columns": num},                              78)
        if cards.get(cat[0]) == "low":
            add("pie",  f"Share breakdown by {cat[0]}",                                 {"names": cat[0]},                            70)
        add("treemap", f"Proportional area grouped by {cat[0]}",                        {"names": cat[0]},                            65)
        if len(num) >= 2:
            add("area", "Multi-column area chart showing trends together",              {"columns": num[:3]},                          60)
        add("violin",  f"Distribution shape of {num[0]} per {cat[0]}",                 {"x": cat[0], "y": num[0]},                   58)

    elif len(num) >= 2:
        add("scatter", "Correlation between numeric columns",                           {"x": num[0], "y": num[1]},                   95)
        add("heatmap", "Full correlation matrix",                                       {"columns": num},                              90)
        add("line",    "Multi-line trend",                                              {"columns": num[:4]},                          80)
        add("area",    "Stacked area for numeric trends",                               {"columns": num[:4]},                          72)
        add("box",     "Side-by-side distributions",                                    {"columns": num[:5]},                          65)
        add("histogram","Overlay histograms",                                           {"x": num[0]},                                 60)
        if dt:
            add("line","Time-series with multiple numeric columns",                     {"x": dt[0], "y": num[0]},                    88)

    elif dt and num:
        add("line",    "Time-series trend",                                             {"x": dt[0], "y": num[0]},                    95)
        add("area",    "Area chart over time",                                          {"x": dt[0], "y": num[0]},                    85)
        add("scatter", "Data points over time",                                         {"x": dt[0], "y": num[0]},                    72)
        add("bar",     "Bar chart for discrete time periods",                           {"x": dt[0], "y": num[0]},                    65)

    else:
        add("bar",     "Default bar chart",                                             {"x": columns[0], "y": columns[1] if len(columns)>1 else columns[0]}, 70)

    return _rank(recs)


def _rank(recs: List[Dict]) -> List[Dict]:
    """Sort by score descending, strip internal score field, cap at 10."""
    recs.sort(key=lambda r: r.get("_score", 0), reverse=True)
    for r in recs:
        r.pop("_score", None)
    return recs[:10]
