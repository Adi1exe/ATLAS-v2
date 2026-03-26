import pandas as pd
import numpy as np
from typing import List, Dict


def generate_insights(df: pd.DataFrame, columns: List[str]) -> Dict:
    """
    Generate automated insights:
    - Summary narrative
    - Top correlations
    - Anomaly hints (IQR-based)
    - Data quality notes
    """
    cols = [c for c in columns if c in df.columns]
    df   = df[cols]

    num_df = df.select_dtypes(include="number")
    cat_df = df.select_dtypes(exclude="number")

    summary = _build_summary(df, num_df, cat_df)
    correlations = _correlations(num_df)
    anomalies = _detect_anomalies(num_df)

    return {
        "summary":      summary,
        "correlations": correlations,
        "anomalies":    anomalies,
    }


def _build_summary(df, num_df, cat_df) -> str:
    parts = [f"The dataset has {len(df):,} rows and {len(df.columns)} columns."]

    if not num_df.empty:
        top = num_df.mean().idxmax()
        parts.append(f"The numeric column with the highest average is '{top}'.")

    if not cat_df.empty:
        top_cat = cat_df.nunique().idxmax()
        n_unique = cat_df[top_cat].nunique()
        parts.append(f"'{top_cat}' has the most diversity with {n_unique} unique values.")

    missing = df.isna().sum().sum()
    if missing > 0:
        pct = round(missing / df.size * 100, 1)
        parts.append(f"There are {missing:,} missing values ({pct}% of cells).")
    else:
        parts.append("No missing values found — data is complete.")

    return " ".join(parts)


def _correlations(num_df: pd.DataFrame) -> List[Dict]:
    if num_df.shape[1] < 2:
        return []

    corr = num_df.corr()
    pairs = []
    cols  = corr.columns.tolist()

    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            val = corr.iloc[i, j]
            if not np.isnan(val) and abs(val) > 0.3:
                pairs.append({
                    "col1":  cols[i],
                    "col2":  cols[j],
                    "value": round(float(val), 3),
                })

    return sorted(pairs, key=lambda p: abs(p["value"]), reverse=True)[:10]


def _detect_anomalies(num_df: pd.DataFrame) -> List[str]:
    anomalies = []

    for col in num_df.columns:
        s = num_df[col].dropna()
        if len(s) < 10:
            continue

        Q1, Q3 = s.quantile(0.25), s.quantile(0.75)
        IQR    = Q3 - Q1
        if IQR == 0:
            continue

        lower  = Q1 - 3 * IQR
        upper  = Q3 + 3 * IQR
        n_out  = int(((s < lower) | (s > upper)).sum())

        if n_out > 0:
            pct = round(n_out / len(s) * 100, 1)
            anomalies.append(
                f"'{col}' has {n_out} extreme outlier(s) ({pct}%) beyond ±3×IQR bounds."
            )

        # Skewness hint
        skew = float(s.skew())
        if abs(skew) > 2:
            direction = "right" if skew > 0 else "left"
            anomalies.append(
                f"'{col}' is heavily {direction}-skewed (skew={skew:.2f}) — consider log transformation."
            )

    return anomalies[:8]
