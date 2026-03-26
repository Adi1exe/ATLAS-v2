"""
NLP Query Engine — pure rule-based, zero external model loading.
Every answer is written in plain, conversational English.
Fast: no HuggingFace, no network calls, no model downloads.
"""
import re
import pandas as pd
import numpy as np
from typing import Dict, List


# ── Intent patterns (order matters — first match wins) ──────────────────────
INTENTS = [
    # Greeting / meta
    (r"\bhello\b|\bhi\b|\bhey\b",                          "greeting"),
    (r"\bwhat columns\b|\bwhat fields\b|\bshow columns\b", "list_columns"),
    (r"\bhow many rows\b|\brow count\b|\bsize of\b",       "row_count"),
    (r"\bhow many columns\b|\bcolumn count\b",             "col_count"),

    # Stats
    (r"\baverage\b|\bmean\b",                              "mean"),
    (r"\bmedian\b",                                        "median"),
    (r"\bsum\b|\btotal\b",                                 "sum"),
    (r"\bmax(?:imum)?\b|\bhighest\b|\blargest\b|\bbiggest\b", "max"),
    (r"\bmin(?:imum)?\b|\blowest\b|\bsmallest\b",          "min"),
    (r"\bstd\b|\bstandard deviation\b|\bvariance\b",       "std"),
    (r"\bcount\b|\bhow many\b|\bnumber of\b",              "count"),
    (r"\bunique\b|\bdistinct\b|\bdifferent values\b",      "unique"),
    (r"\brange\b|\bspread\b",                              "range"),

    # Quality
    (r"\bmissing\b|\bnull\b|\bblank\b|\bempty\b|\bna\b",   "missing"),
    (r"\boutlier\b|\banomal\b|\bextreme\b",                "outliers"),
    (r"\bduplicat\b",                                      "duplicates"),

    # Relationships
    (r"\bcorrelat\b|\brelationship\b|\brelated\b",         "correlation"),

    # Top / bottom
    (r"\btop\s*(\d+)\b",                                   "top_n"),
    (r"\bbottom\s*(\d+)\b|\blowest\s*(\d+)\b|\bworst\s*(\d+)\b", "bottom_n"),
    (r"\bmost common\b|\bmost frequent\b|\bpopular\b",     "most_common"),
    (r"\bleast common\b|\brarest\b",                       "least_common"),

    # Distribution
    (r"\bdistribution\b|\bspread\b|\bskew\b",              "distribution"),
    (r"\bsummary\b|\boverall\b|\bdescribe\b|\bstatistics\b|\bstats\b", "summary"),
]


def _find_column(df: pd.DataFrame, text: str):
    """Find the most relevant column mentioned in the question."""
    t = text.lower()
    # Exact column name match
    for col in df.columns:
        if col.lower() in t:
            return col
    # Word-level partial match (handles snake_case columns)
    for col in df.columns:
        words = re.split(r'[_\s]+', col.lower())
        if any(len(w) > 2 and w in t for w in words):
            return col
    return None


def _num_cols(df): return df.select_dtypes(include='number').columns.tolist()
def _cat_cols(df): return df.select_dtypes(include='object').columns.tolist()

def _fmt(val):
    """Format a number cleanly — no scientific notation, max 4 decimal places."""
    if isinstance(val, float):
        if val == int(val): return f"{int(val):,}"
        return f"{val:,.4f}".rstrip('0').rstrip('.')
    if isinstance(val, (int, np.integer)): return f"{int(val):,}"
    return str(val)


def answer_query(df: pd.DataFrame, question: str) -> Dict:
    """
    Answer a natural-language question about the DataFrame.
    Returns {"answer": str, "chart": None}.
    Responses are written in plain, friendly English.
    """
    q  = question.strip()
    ql = q.lower()
    col = _find_column(df, ql)

    # Match intent
    intent = None
    n_val  = None
    for pattern, name in INTENTS:
        m = re.search(pattern, ql)
        if m:
            intent = name
            if name in ('top_n', 'bottom_n'):
                # Extract the number from the match groups
                groups = [g for g in m.groups() if g is not None]
                n_val  = int(groups[0]) if groups else 5
            break

    if intent is None:
        # Try a catch-all numeric keyword pass
        return _fallback(df, q, col)

    nums = _num_cols(df)
    cats = _cat_cols(df)

    # ── Meta ────────────────────────────────────────────────────────────────
    if intent == "greeting":
        return _ok(f"Hello! I'm ready to answer questions about this dataset. "
                   f"It has {len(df):,} rows and {len(df.columns)} columns. "
                   f"Try asking me about averages, totals, top values, or correlations.")

    if intent == "list_columns":
        cols = ', '.join(f'"{c}"' for c in df.columns)
        return _ok(f"The dataset has {len(df.columns)} columns: {cols}.")

    if intent == "row_count":
        return _ok(f"The dataset contains {len(df):,} rows.")

    if intent == "col_count":
        return _ok(f"There are {len(df.columns)} columns in total — "
                   f"{len(nums)} numeric and {len(cats)} categorical.")

    # ── Simple scalar stats ──────────────────────────────────────────────────
    if intent in ("mean", "median", "sum", "min", "max", "std"):
        target = col or (nums[0] if nums else None)
        if not target:
            return _err("I couldn't find a numeric column to compute that. Try naming the column explicitly.")
        s    = df[target].dropna()
        ops  = {"mean": s.mean, "median": s.median, "sum": s.sum,
                "min":  s.min,  "max":    s.max,     "std": s.std}
        val  = ops[intent]()
        verb = {"mean":"average","median":"middle value","sum":"total",
                "min":"minimum","max":"maximum","std":"standard deviation"}[intent]
        return _ok(f"The {verb} of **{target}** is **{_fmt(val)}**.")

    if intent == "count":
        target = col or df.columns[0]
        non_null = int(df[target].notna().sum())
        total    = len(df)
        return _ok(f"**{target}** has **{non_null:,}** non-empty values out of {total:,} total rows.")

    if intent == "unique":
        target = col or (cats[0] if cats else df.columns[0])
        n = int(df[target].nunique())
        examples = df[target].dropna().unique()[:3]
        ex_str   = ', '.join(f'"{v}"' for v in examples)
        return _ok(f"**{target}** has **{n:,} unique values**. A few examples: {ex_str}.")

    if intent == "range":
        target = col or (nums[0] if nums else None)
        if not target:
            return _err("Range only applies to numeric columns. Please specify one.")
        s = df[target].dropna()
        return _ok(f"**{target}** ranges from **{_fmt(s.min())}** to **{_fmt(s.max())}** "
                   f"(a spread of {_fmt(s.max() - s.min())}).")

    # ── Data quality ─────────────────────────────────────────────────────────
    if intent == "missing":
        if col:
            n    = int(df[col].isna().sum())
            pct  = round(n / len(df) * 100, 1)
            if n == 0:
                return _ok(f"Good news — **{col}** has no missing values at all.")
            return _ok(f"**{col}** has **{n:,} missing values**, which is {pct}% of all rows.")
        else:
            miss = df.isna().sum()
            total_miss = int(miss.sum())
            if total_miss == 0:
                return _ok("Great news — the entire dataset has no missing values!")
            worst = miss.idxmax()
            worst_pct = round(miss[worst] / len(df) * 100, 1)
            cols_with = (miss > 0).sum()
            return _ok(f"There are **{total_miss:,} missing values** spread across {cols_with} columns. "
                       f"The worst column is **{worst}** with {worst_pct}% missing.")

    if intent == "outliers":
        target = col or (nums[0] if nums else None)
        if not target:
            return _err("I need a numeric column to detect outliers. Please name one.")
        s          = df[target].dropna()
        Q1, Q3     = s.quantile(0.25), s.quantile(0.75)
        IQR        = Q3 - Q1
        low, high  = Q1 - 1.5*IQR, Q3 + 1.5*IQR
        outliers   = s[(s < low) | (s > high)]
        n          = len(outliers)
        if n == 0:
            return _ok(f"**{target}** has no outliers — all values fall within the expected range.")
        pct = round(n/len(s)*100,1)
        return _ok(f"**{target}** has **{n:,} outliers** ({pct}% of values). "
                   f"They fall outside the range {_fmt(low)} to {_fmt(high)}. "
                   f"The most extreme value is {_fmt(outliers.abs().max())}.")

    if intent == "duplicates":
        n = int(df.duplicated().sum())
        if n == 0:
            return _ok("The dataset has no duplicate rows — every row is unique.")
        pct = round(n/len(df)*100, 1)
        return _ok(f"There are **{n:,} duplicate rows** in the dataset ({pct}% of total).")

    # ── Relationships ─────────────────────────────────────────────────────────
    if intent == "correlation":
        if len(nums) < 2:
            return _err("I need at least two numeric columns to compute correlations.")

        corr   = df[nums].corr()
        pairs  = []
        for i in range(len(nums)):
            for j in range(i+1, len(nums)):
                v = corr.iloc[i,j]
                if not np.isnan(v):
                    pairs.append((nums[i], nums[j], float(v)))
        pairs.sort(key=lambda x: abs(x[2]), reverse=True)

        top3 = pairs[:3]
        lines = []
        for a, b, v in top3:
            strength = ("strongly" if abs(v)>0.7 else "moderately" if abs(v)>0.4 else "weakly")
            direction = "positively" if v > 0 else "negatively"
            lines.append(f"**{a}** and **{b}** are {strength} {direction} correlated (r = {v:.2f})")

        return _ok("Here are the strongest relationships in the data:\n\n" + "\n\n".join(f"• {l}" for l in lines))

    # ── Top / bottom / frequency ──────────────────────────────────────────────
    if intent == "top_n":
        n      = n_val or 5
        target = col or (nums[0] if nums else cats[0] if cats else df.columns[0])
        if pd.api.types.is_numeric_dtype(df[target]):
            rows = df[target].nlargest(n)
            vals = ', '.join(_fmt(v) for v in rows.values)
            return _ok(f"The top {n} values in **{target}** are: {vals}.")
        else:
            vc   = df[target].value_counts().head(n)
            vals = ', '.join(f'"{k}" ({v:,})' for k,v in vc.items())
            return _ok(f"The top {n} most frequent values in **{target}** are: {vals}.")

    if intent == "bottom_n":
        n      = n_val or 5
        target = col or (nums[0] if nums else df.columns[0])
        if pd.api.types.is_numeric_dtype(df[target]):
            rows = df[target].nsmallest(n)
            vals = ', '.join(_fmt(v) for v in rows.values)
            return _ok(f"The bottom {n} lowest values in **{target}** are: {vals}.")
        else:
            vc   = df[target].value_counts().tail(n)
            vals = ', '.join(f'"{k}" ({v:,})' for k,v in vc.items())
            return _ok(f"The {n} least common values in **{target}** are: {vals}.")

    if intent == "most_common":
        target = col or (cats[0] if cats else df.columns[0])
        top    = df[target].value_counts().head(3)
        vals   = ', '.join(f'"{k}" ({v:,} times)' for k,v in top.items())
        return _ok(f"The most common values in **{target}** are: {vals}.")

    if intent == "least_common":
        target = col or (cats[0] if cats else df.columns[0])
        bottom = df[target].value_counts().tail(3)
        vals   = ', '.join(f'"{k}" ({v:,} times)' for k,v in bottom.items())
        return _ok(f"The rarest values in **{target}** are: {vals}.")

    # ── Distribution / Summary ────────────────────────────────────────────────
    if intent == "distribution":
        target = col or (nums[0] if nums else None)
        if not target or not pd.api.types.is_numeric_dtype(df[target]):
            target = col or (cats[0] if cats else df.columns[0])
            vc     = df[target].value_counts().head(5)
            vals   = ', '.join(f'"{k}" ({v:,})' for k,v in vc.items())
            return _ok(f"The distribution of **{target}**: {vals}.")
        s     = df[target].dropna()
        skew  = float(s.skew())
        shape = ("right-skewed (most values are low, a few are very high)"  if skew >  0.5
                 else "left-skewed (most values are high, a few are very low)" if skew < -0.5
                 else "roughly symmetric (bell-curve shaped)")
        return _ok(f"**{target}** ranges from {_fmt(s.min())} to {_fmt(s.max())} "
                   f"with a mean of {_fmt(s.mean())} and median of {_fmt(s.median())}. "
                   f"The distribution is {shape}.")

    if intent == "summary":
        target = col
        if target and target in df.columns:
            s = df[target]
            if pd.api.types.is_numeric_dtype(s):
                sd = s.dropna()
                return _ok(
                    f"**{target}** summary:\n\n"
                    f"• Total rows: {len(sd):,}\n"
                    f"• Average: {_fmt(sd.mean())}\n"
                    f"• Median: {_fmt(sd.median())}\n"
                    f"• Min → Max: {_fmt(sd.min())} → {_fmt(sd.max())}\n"
                    f"• Standard deviation: {_fmt(sd.std())}\n"
                    f"• Missing values: {int(s.isna().sum())}"
                )
            else:
                vc = s.value_counts().head(3)
                return _ok(
                    f"**{target}** summary:\n\n"
                    f"• Unique values: {s.nunique():,}\n"
                    f"• Most common: {vc.index[0]} ({vc.iloc[0]:,} times)\n"
                    f"• Missing values: {int(s.isna().sum())}"
                )

        # Overall dataset summary
        miss_pct = round(df.isna().sum().sum() / df.size * 100, 1)
        summary_lines = [
            f"**Dataset overview:**",
            f"• {len(df):,} rows and {len(df.columns)} columns",
            f"• {len(nums)} numeric columns, {len(cats)} text/categorical columns",
            f"• {miss_pct}% missing values overall",
        ]
        if nums:
            for c in nums[:2]:
                summary_lines.append(f"• **{c}**: avg {_fmt(df[c].mean())}, range {_fmt(df[c].min())} – {_fmt(df[c].max())}")
        return _ok('\n'.join(summary_lines))

    return _fallback(df, q, col)


def _fallback(df, question: str, col) -> Dict:
    """Catch-all: try to extract something useful or give a clear help message."""
    nums = _num_cols(df)
    cats = _cat_cols(df)

    # If column was identified but no intent, give a quick profile
    if col and col in df.columns:
        s = df[col]
        if pd.api.types.is_numeric_dtype(s):
            sd = s.dropna()
            return _ok(f"Here's what I know about **{col}**: "
                       f"average = {_fmt(sd.mean())}, "
                       f"min = {_fmt(sd.min())}, max = {_fmt(sd.max())}, "
                       f"missing = {int(s.isna().sum())} values.")
        else:
            top = s.value_counts().index[0] if s.nunique() > 0 else "N/A"
            return _ok(f"**{col}** has {s.nunique():,} unique values. "
                       f"The most common is \"{top}\". "
                       f"Missing values: {int(s.isna().sum())}.")

    # Generic help
    col_list = ', '.join(f'"{c}"' for c in df.columns[:6])
    return _ok(
        f"I'm not sure how to answer that exactly. "
        f"The dataset has columns: {col_list}{'…' if len(df.columns)>6 else ''}. "
        f"You can ask things like:\n\n"
        f"• \"What is the average of [column]?\"\n"
        f"• \"Show me the top 5 values in [column]\"\n"
        f"• \"Are there any missing values?\"\n"
        f"• \"What is the correlation between columns?\"\n"
        f"• \"Give me a summary of the dataset\""
    )


def _ok(msg: str) -> Dict:
    return {"answer": msg, "chart": None}

def _err(msg: str) -> Dict:
    return {"answer": f"⚠️ {msg}", "chart": None}
