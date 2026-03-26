import io
from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Dataset
from services.report_service import generate_html_report, generate_pdf_report

report_bp = Blueprint("report", __name__)


@report_bp.get("/<dataset_id>/export")
@jwt_required()
def export(dataset_id):
    import pandas as pd
    user_id = int(get_jwt_identity())
    fmt     = request.args.get("format", "pdf").lower()

    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    df = pd.read_parquet(ds.filename)

    if fmt == "csv":
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)
        return send_file(
            io.BytesIO(buf.getvalue().encode()),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"atlas_{ds.name}.csv",
        )

    elif fmt == "html":
        html_content = generate_html_report(ds, df)
        return send_file(
            io.BytesIO(html_content.encode()),
            mimetype="text/html",
            as_attachment=True,
            download_name=f"atlas_report_{ds.id}.html",
        )

    elif fmt == "pdf":
        try:
            pdf_bytes = generate_pdf_report(ds, df)
            return send_file(
                io.BytesIO(pdf_bytes),
                mimetype="application/pdf",
                as_attachment=True,
                download_name=f"atlas_report_{ds.id}.pdf",
            )
        except ImportError:
            # Fallback to HTML if weasyprint not installed
            html_content = generate_html_report(ds, df)
            return send_file(
                io.BytesIO(html_content.encode()),
                mimetype="text/html",
                as_attachment=True,
                download_name=f"atlas_report_{ds.id}.html",
            )

    return jsonify({"error": f"Unsupported format: {fmt}"}), 400
