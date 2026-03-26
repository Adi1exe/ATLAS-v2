import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models import Dataset
from services.data_service import load_dataframe, profile_dataframe, clean_dataframe

data_bp = Blueprint("data", __name__)

ALLOWED = {"csv", "xls", "xlsx"}

def _allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED


@data_bp.post("/upload")
@jwt_required()
def upload():
    user_id = int(get_jwt_identity())
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not _allowed(file.filename):
        return jsonify({"error": "Unsupported file type. Use CSV, XLS, or XLSX"}), 400

    dataset_id = str(uuid.uuid4())[:16]
    safe_name  = secure_filename(file.filename)
    save_path  = os.path.join(current_app.config["UPLOAD_FOLDER"], f"{dataset_id}_{safe_name}")
    file.save(save_path)

    try:
        df = load_dataframe(save_path)
        df = clean_dataframe(df)
        df.to_parquet(save_path + ".parquet", index=False)

        profile = profile_dataframe(df)
        dataset = Dataset(
            id          = dataset_id,
            user_id     = user_id,
            name        = safe_name,
            filename    = save_path + ".parquet",
            rows        = profile["rows"],
            columns     = profile["n_columns"],
            missing_pct = profile["missing_pct"],
        )
        db.session.add(dataset)
        db.session.commit()

        return jsonify({
            "dataset_id":  dataset_id,
            "name":        safe_name,
            "rows":        profile["rows"],
            "columns":     profile["n_columns"],
            "missing_pct": profile["missing_pct"],
        }), 201

    except Exception as e:
        if os.path.exists(save_path): os.remove(save_path)
        return jsonify({"error": str(e)}), 500


@data_bp.get("/list")
@jwt_required()
def list_datasets():
    user_id  = int(get_jwt_identity())
    datasets = Dataset.query.filter_by(user_id=user_id).order_by(Dataset.uploaded_at.desc()).all()
    return jsonify({"datasets": [d.to_dict() for d in datasets]}), 200


@data_bp.get("/<dataset_id>/info")
@jwt_required()
def dataset_info(dataset_id):
    user_id = int(get_jwt_identity())
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()

    import pandas as pd
    df = pd.read_parquet(ds.filename)
    columns = []
    for col in df.columns:
        columns.append({
            "name":     col,
            "dtype":    str(df[col].dtype),
            "non_null": int(df[col].notna().sum()),
            "unique":   int(df[col].nunique()),
            "sample":   str(df[col].dropna().iloc[0]) if df[col].notna().any() else None,
        })

    return jsonify({
        "id": ds.id, "name": ds.name,
        "rows": ds.rows, "columns": columns,
        "missing_pct": ds.missing_pct,
    }), 200


@data_bp.get("/<dataset_id>/preview")
@jwt_required()
def dataset_preview(dataset_id):
    user_id = int(get_jwt_identity())
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    rows = int(request.args.get("rows", 20))

    import pandas as pd
    df = pd.read_parquet(ds.filename).head(rows)
    return jsonify({
        "headers": list(df.columns),
        "rows":    df.where(df.notna(), None).to_dict(orient="records"),
    }), 200


@data_bp.delete("/<dataset_id>")
@jwt_required()
def delete_dataset(dataset_id):
    user_id = int(get_jwt_identity())
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    if os.path.exists(ds.filename): os.remove(ds.filename)
    db.session.delete(ds); db.session.commit()
    return jsonify({"message": "Deleted"}), 200
