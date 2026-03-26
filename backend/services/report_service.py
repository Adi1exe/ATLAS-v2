"""
Report Service
- HTML report: fully self-contained, no external deps
- PDF report: uses reportlab (reliable, no browser/WeasyPrint needed)
"""
import io
import pandas as pd
from datetime import datetime


# ── HTML Report ──────────────────────────────────────────────────────────────
def generate_html_report(ds, df: pd.DataFrame) -> str:
    desc        = df.describe(include="all").fillna("—")
    desc_html   = desc.to_html(classes="data-table", border=0)
    missing     = df.isna().sum()
    missing_rows = "".join(
        f"<tr><td>{col}</td><td>{cnt:,}</td><td>{round(cnt/len(df)*100,1)}%</td></tr>"
        for col, cnt in missing.items() if cnt > 0
    ) or "<tr><td colspan='3' class='empty'>✓ No missing values</td></tr>"
    col_rows = "".join(
        f"<tr><td>{col}</td><td><span class='badge'>{str(dt)}</span></td></tr>"
        for col, dt in df.dtypes.items()
    )

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>ATLAS Report — {ds.name}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap');
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'DM Sans',sans-serif;background:#090C14;color:#E2E8F0;padding:48px;line-height:1.6}}
.header{{display:flex;align-items:center;gap:20px;margin-bottom:48px;padding-bottom:24px;border-bottom:1px solid #1C2640}}
.logo{{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:6px;background:linear-gradient(135deg,#60A5FA,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}}
.meta p{{color:#64748B;font-size:13px;margin-top:2px}}
.meta strong{{color:#94A3B8}}
.card{{background:#0F1623;border:1px solid #1C2640;border-radius:16px;padding:28px;margin-bottom:24px}}
h2{{font-family:'Syne',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#64748B;margin-bottom:20px}}
.grid3{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}
.stat{{background:#090C14;border-radius:12px;padding:18px;text-align:center;border:1px solid #1C2640}}
.stat-val{{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;background:linear-gradient(135deg,#60A5FA,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}}
.stat-lbl{{font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:2px;margin-top:6px}}
table{{width:100%;border-collapse:collapse;font-size:12px}}
th{{text-align:left;padding:10px 14px;color:#64748B;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid #1C2640}}
td{{padding:10px 14px;border-bottom:1px solid rgba(28,38,64,0.4);color:#94A3B8;font-family:'JetBrains Mono',monospace;font-size:11px}}
tr:hover td{{background:rgba(28,38,64,0.25)}}
.badge{{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;border:1px solid #1C2640;color:#60A5FA;background:rgba(37,99,235,0.1)}}
.empty{{text-align:center;color:#64748B;font-style:italic;font-family:'DM Sans',sans-serif;font-size:12px;padding:16px}}
footer{{text-align:center;color:#1C2640;font-size:11px;margin-top:48px;padding-top:24px;border-top:1px solid #1C2640}}
</style></head><body>
<div class="header">
  <div class="logo">ATLAS</div>
  <div class="meta">
    <p><strong>{ds.name}</strong></p>
    <p>Generated {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}</p>
  </div>
</div>

<div class="card">
  <h2>Dataset Overview</h2>
  <div class="grid3">
    <div class="stat"><div class="stat-val">{ds.rows:,}</div><div class="stat-lbl">Rows</div></div>
    <div class="stat"><div class="stat-val">{ds.columns}</div><div class="stat-lbl">Columns</div></div>
    <div class="stat"><div class="stat-val">{ds.missing_pct}%</div><div class="stat-lbl">Missing</div></div>
  </div>
</div>

<div class="card">
  <h2>Column Types</h2>
  <table><thead><tr><th>Column Name</th><th>Data Type</th></tr></thead>
  <tbody>{col_rows}</tbody></table>
</div>

<div class="card">
  <h2>Missing Values</h2>
  <table><thead><tr><th>Column</th><th>Missing Count</th><th>Percentage</th></tr></thead>
  <tbody>{missing_rows}</tbody></table>
</div>

<div class="card">
  <h2>Statistical Summary</h2>
  {desc_html}
</div>

<footer>ATLAS · Intelligent Data Analytics Platform · {datetime.utcnow().year}</footer>
</body></html>"""


# ── PDF Report using reportlab ────────────────────────────────────────────────
def generate_pdf_report(ds, df: pd.DataFrame) -> bytes:
    """
    Generate a clean PDF using reportlab.
    Falls back gracefully if reportlab isn't installed.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles    import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units     import cm
        from reportlab.lib           import colors
        from reportlab.platypus      import (SimpleDocTemplate, Paragraph, Spacer,
                                             Table, TableStyle, HRFlowable)
        from reportlab.lib.enums     import TA_CENTER, TA_LEFT
    except ImportError:
        raise ImportError(
            "reportlab is required for PDF export. Install it with: pip install reportlab"
        )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"ATLAS Report — {ds.name}",
        author="ATLAS Analytics",
    )

    # ── Styles ──
    PAGE_W = A4[0] - 4*cm
    C_BG   = colors.HexColor("#090C14")
    C_SURF = colors.HexColor("#0F1623")
    C_ACC  = colors.HexColor("#2563EB")
    C_CYAN = colors.HexColor("#06B6D4")
    C_TEXT = colors.HexColor("#E2E8F0")
    C_DIM  = colors.HexColor("#94A3B8")
    C_MUTE = colors.HexColor("#64748B")
    C_BDR  = colors.HexColor("#1C2640")
    C_WHITE= colors.white

    SS = getSampleStyleSheet()
    h1_style = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22,
                               textColor=C_TEXT, spaceAfter=4, alignment=TA_LEFT)
    sub_style = ParagraphStyle("sub", fontName="Helvetica", fontSize=9,
                                textColor=C_MUTE, spaceAfter=0)
    sec_style = ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=8,
                                textColor=C_MUTE, spaceAfter=8,
                                spaceBefore=16, letterSpacing=2)
    cell_style= ParagraphStyle("cell", fontName="Helvetica", fontSize=8,
                                textColor=C_DIM, leading=10)
    hdr_style = ParagraphStyle("hdr", fontName="Helvetica-Bold", fontSize=7,
                                textColor=C_MUTE, leading=9)

    def sec(title):
        return [
            Paragraph(title.upper(), sec_style),
            HRFlowable(width=PAGE_W, thickness=1, color=C_BDR, spaceAfter=6),
        ]

    def tbl(data, col_widths=None):
        t = Table(data, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1, 0), C_SURF),
            ("TEXTCOLOR",   (0,0), (-1, 0), C_MUTE),
            ("FONTNAME",    (0,0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1, 0), 7),
            ("BOTTOMPADDING",(0,0),(-1,0),  6),
            ("TOPPADDING",  (0,0), (-1, 0), 6),
            ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE",    (0,1), (-1,-1), 8),
            ("TEXTCOLOR",   (0,1), (-1,-1), C_DIM),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[C_BG, C_SURF]),
            ("LINEBELOW",   (0,0), (-1,-1), 0.4, C_BDR),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
            ("RIGHTPADDING",(0,0), (-1,-1), 8),
            ("TOPPADDING",  (0,1), (-1,-1), 5),
            ("BOTTOMPADDING",(0,1),(-1,-1), 5),
            ("ROUNDEDCORNERS", [4]),
        ]))
        return t

    story = []

    # Header
    story += [
        Paragraph("ATLAS", h1_style),
        Paragraph(f"Report: {ds.name}  ·  {datetime.utcnow().strftime('%B %d, %Y')}", sub_style),
        Spacer(1, 16),
    ]

    # Stats row
    stats_data = [
        [Paragraph("ROWS", hdr_style),     Paragraph("COLUMNS", hdr_style),  Paragraph("MISSING", hdr_style)],
        [Paragraph(f"{ds.rows:,}", ParagraphStyle("sv", fontName="Helvetica-Bold", fontSize=18, textColor=C_CYAN, alignment=TA_CENTER)),
         Paragraph(str(ds.columns), ParagraphStyle("sv", fontName="Helvetica-Bold", fontSize=18, textColor=C_CYAN, alignment=TA_CENTER)),
         Paragraph(f"{ds.missing_pct}%", ParagraphStyle("sv", fontName="Helvetica-Bold", fontSize=18, textColor=C_CYAN, alignment=TA_CENTER))],
    ]
    stats_tbl = Table(stats_data, colWidths=[PAGE_W/3]*3)
    stats_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), C_SURF),
        ("ALIGN",       (0,0),(-1,-1), "CENTER"),
        ("VALIGN",      (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",  (0,0),(-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("LINEBELOW",   (0,0),(-1,0),  0.5, C_BDR),
    ]))
    story += [*sec("Dataset Overview"), stats_tbl, Spacer(1, 16)]

    # Column types
    col_data = [[Paragraph("COLUMN", hdr_style), Paragraph("TYPE", hdr_style),
                 Paragraph("NON-NULL", hdr_style), Paragraph("UNIQUE", hdr_style)]]
    for col in df.columns:
        col_data.append([
            Paragraph(str(col),            cell_style),
            Paragraph(str(df[col].dtype),  cell_style),
            Paragraph(f"{df[col].notna().sum():,}", cell_style),
            Paragraph(f"{df[col].nunique():,}", cell_style),
        ])
    story += [*sec("Column Summary"),
              tbl(col_data, [PAGE_W*0.4, PAGE_W*0.2, PAGE_W*0.2, PAGE_W*0.2]),
              Spacer(1, 16)]

    # Missing values
    missing = df.isna().sum()
    miss_cols = [(col, int(cnt)) for col, cnt in missing.items() if cnt > 0]
    miss_data = [[Paragraph("COLUMN", hdr_style), Paragraph("MISSING", hdr_style), Paragraph("PCT", hdr_style)]]
    if miss_cols:
        for col, cnt in miss_cols:
            miss_data.append([
                Paragraph(col, cell_style),
                Paragraph(f"{cnt:,}", cell_style),
                Paragraph(f"{round(cnt/len(df)*100,1)}%", cell_style),
            ])
    else:
        miss_data.append([Paragraph("No missing values — dataset is complete ✓",
                          ParagraphStyle("ok", fontName="Helvetica", fontSize=8,
                                         textColor=colors.HexColor("#10B981"))),
                          Paragraph("", cell_style), Paragraph("", cell_style)])
    story += [*sec("Missing Values"),
              tbl(miss_data, [PAGE_W*0.5, PAGE_W*0.25, PAGE_W*0.25]),
              Spacer(1, 16)]

    # Numeric summary
    num_df = df.select_dtypes(include="number")
    if not num_df.empty:
        desc = num_df.describe().T.round(3)
        desc_data = [[Paragraph("COLUMN", hdr_style)] +
                     [Paragraph(c.upper(), hdr_style) for c in desc.columns]]
        for col, row in desc.iterrows():
            desc_data.append(
                [Paragraph(str(col), cell_style)] +
                [Paragraph(str(v), cell_style) for v in row.values]
            )
        n = len(desc.columns) + 1
        w = PAGE_W / n
        story += [*sec("Numeric Summary"), tbl(desc_data, [w]*n), Spacer(1, 12)]

    # Footer
    story.append(Paragraph(
        f"Generated by ATLAS · {datetime.utcnow().year}",
        ParagraphStyle("foot", fontName="Helvetica", fontSize=8,
                       textColor=C_MUTE, alignment=TA_CENTER, spaceBefore=24)
    ))

    doc.build(story)
    return buf.getvalue()
