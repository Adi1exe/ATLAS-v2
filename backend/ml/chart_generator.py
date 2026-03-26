"""
Chart Generator — builds Plotly figure dicts for all 10 chart types.
Supports: bar, line, scatter, pie, donut, histogram, box, violin, area, heatmap, treemap
"""
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json
from typing import List, Dict

TEMPLATE = "plotly_dark"

COLORS = [
    "#3B82F6", "#06B6D4", "#F59E0B", "#10B981",
    "#8B5CF6", "#EF4444", "#F97316", "#EC4899",
    "#14B8A6", "#A78BFA",
]

LAYOUT_BASE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="DM Sans", color="#94A3B8"),
    margin=dict(t=48, r=20, b=52, l=52),
    legend=dict(bgcolor="rgba(0,0,0,0)", bordercolor="rgba(0,0,0,0)"),
)

AXIS_STYLE = dict(gridcolor="#1C2640", zerolinecolor="#1C2640", linecolor="#1C2640")


def _serialize(fig) -> dict:
    return json.loads(fig.to_json())


def _prep(df, columns):
    """Return df restricted to requested existing columns."""
    cols = [c for c in columns if c in df.columns]
    return df[cols].copy(), cols


def generate_plotly_chart(df: pd.DataFrame, chart_type: str, columns: List[str], config: Dict) -> dict:
    """
    Generate a Plotly figure dict.
    config keys: x, y, names, values, columns (list)
    """
    df, cols = _prep(df, columns)
    if not cols:
        raise ValueError("No valid columns found in dataset.")

    x      = config.get("x", cols[0])
    y      = config.get("y", cols[1] if len(cols) > 1 else cols[0])
    names  = config.get("names", x)
    values = config.get("values", y)
    multi  = config.get("columns", [c for c in cols if pd.api.types.is_numeric_dtype(df.get(c, pd.Series(dtype=float)))])

    # Ensure x/y exist in df
    if x not in df.columns: x = cols[0]
    if y not in df.columns: y = cols[0]

    ct = chart_type.lower()

    # ── Bar ─────────────────────────────────────────────────────────────────
    if ct == "bar":
        if pd.api.types.is_numeric_dtype(df[y]) and y in df.columns:
            fig = px.bar(df, x=x, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            vc = df[x].value_counts().reset_index(); vc.columns = [x, "count"]
            fig = px.bar(vc, x=x, y="count", color_discrete_sequence=COLORS, template=TEMPLATE)
        fig.update_traces(marker_line_width=0)

    # ── Line ────────────────────────────────────────────────────────────────
    elif ct == "line":
        if multi and len(multi) >= 2:
            fig = px.line(df.reset_index(), y=multi[:4], color_discrete_sequence=COLORS, template=TEMPLATE)
        elif y in df.columns:
            fig = px.line(df, x=x, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            fig = px.line(df, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)

    # ── Area ────────────────────────────────────────────────────────────────
    elif ct == "area":
        if multi and len(multi) >= 2:
            fig = px.area(df.reset_index(), y=multi[:4], color_discrete_sequence=COLORS, template=TEMPLATE)
        elif y in df.columns:
            fig = px.area(df, x=x, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            fig = px.area(df, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)

    # ── Scatter ─────────────────────────────────────────────────────────────
    elif ct == "scatter":
        fig = px.scatter(df, x=x, y=y, color_discrete_sequence=COLORS,
                         template=TEMPLATE, opacity=0.72)
        fig.update_traces(marker=dict(size=6))

    # ── Histogram ───────────────────────────────────────────────────────────
    elif ct == "histogram":
        fig = px.histogram(df, x=x, color_discrete_sequence=COLORS, template=TEMPLATE,
                           nbins=30, opacity=0.85)
        fig.update_traces(marker_line_width=0)

    # ── Box ─────────────────────────────────────────────────────────────────
    elif ct == "box":
        if x in df.columns and y in df.columns and x != y:
            fig = px.box(df, x=x, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)
        elif multi and len(multi) >= 2:
            # Melt for side-by-side boxes
            melted = df[multi[:6]].melt(var_name="Column", value_name="Value")
            fig = px.box(melted, x="Column", y="Value", color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            fig = px.box(df, y=y, color_discrete_sequence=COLORS, template=TEMPLATE)

    # ── Violin ──────────────────────────────────────────────────────────────
    elif ct == "violin":
        if x in df.columns and y in df.columns and x != y:
            fig = px.violin(df, x=x, y=y, box=True, color_discrete_sequence=COLORS, template=TEMPLATE)
        elif multi and len(multi) >= 2:
            melted = df[multi[:5]].melt(var_name="Column", value_name="Value")
            fig = px.violin(melted, x="Column", y="Value", box=True, color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            fig = px.violin(df, y=y, box=True, color_discrete_sequence=COLORS, template=TEMPLATE)

    # ── Pie ─────────────────────────────────────────────────────────────────
    elif ct == "pie":
        if names in df.columns and values in df.columns and values != names:
            agg = df.groupby(names)[values].sum().reset_index()
            fig = px.pie(agg, names=names, values=values, color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            vc = df[names].value_counts().reset_index(); vc.columns = [names, "count"]
            fig = px.pie(vc, names=names, values="count", color_discrete_sequence=COLORS, template=TEMPLATE)
        fig.update_traces(textposition="inside", textinfo="percent+label")

    # ── Donut ────────────────────────────────────────────────────────────────
    elif ct == "donut":
        if names in df.columns and values in df.columns and values != names:
            agg = df.groupby(names)[values].sum().reset_index()
            fig = px.pie(agg, names=names, values=values, hole=0.45,
                         color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            vc = df[names].value_counts().reset_index(); vc.columns = [names, "count"]
            fig = px.pie(vc, names=names, values="count", hole=0.45,
                         color_discrete_sequence=COLORS, template=TEMPLATE)
        fig.update_traces(textposition="inside", textinfo="percent+label")

    # ── Heatmap ──────────────────────────────────────────────────────────────
    elif ct == "heatmap":
        num_df = df[multi] if multi else df.select_dtypes("number")
        if num_df.shape[1] < 2:
            raise ValueError("Heatmap needs at least 2 numeric columns.")
        corr = num_df.corr()
        fig = go.Figure(go.Heatmap(
            z=np.round(corr.values, 2),
            x=corr.columns.tolist(),
            y=corr.index.tolist(),
            colorscale=[[0, "#2563EB"], [0.5, "#0F1623"], [1, "#06B6D4"]],
            zmid=0,
            text=np.round(corr.values, 2),
            texttemplate="%{text}",
            textfont=dict(size=11),
        ))
        fig.update_layout(template=TEMPLATE)

    # ── Treemap ──────────────────────────────────────────────────────────────
    elif ct == "treemap":
        if names in df.columns:
            if values in df.columns and pd.api.types.is_numeric_dtype(df[values]):
                agg = df.groupby(names)[values].sum().reset_index()
                agg = agg[agg[values] > 0]
                fig = px.treemap(agg, path=[names], values=values,
                                 color_discrete_sequence=COLORS, template=TEMPLATE)
            else:
                vc = df[names].value_counts().reset_index()
                vc.columns = [names, "count"]
                fig = px.treemap(vc, path=[names], values="count",
                                 color_discrete_sequence=COLORS, template=TEMPLATE)
        else:
            raise ValueError("Treemap needs a categorical column.")

    else:
        raise ValueError(f"Unsupported chart type: '{chart_type}'. "
                         f"Supported: bar, line, area, scatter, histogram, box, violin, pie, donut, heatmap, treemap")

    # Apply consistent dark layout
    fig.update_layout(**LAYOUT_BASE)
    if hasattr(fig, 'update_xaxes'):
        fig.update_xaxes(**AXIS_STYLE)
        fig.update_yaxes(**AXIS_STYLE)

    return _serialize(fig)
