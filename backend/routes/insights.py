from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Dataset
from ml.insights_engine import generate_insights
from ml.nlp_engine import answer_query

insights_bp = Blueprint("insights", __name__)


def _load_df(dataset_id, user_id):
    import pandas as pd
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    return pd.read_parquet(ds.filename)


@insights_bp.post("/analyze")
@jwt_required()
def analyze():
    user_id    = int(get_jwt_identity())
    data       = request.json
    dataset_id = data.get("dataset_id")
    columns    = data.get("columns", [])

    if not dataset_id:
        return jsonify({"error": "dataset_id required"}), 400

    df = _load_df(dataset_id, user_id)
    result = generate_insights(df, columns if columns else list(df.columns))
    return jsonify(result), 200


@insights_bp.post("/nlp")
@jwt_required()
def nlp():
    user_id    = int(get_jwt_identity())
    data       = request.json
    dataset_id = data.get("dataset_id")
    question   = data.get("question", "").strip()

    if not dataset_id or not question:
        return jsonify({"error": "dataset_id and question required"}), 400

    df = _load_df(dataset_id, user_id)

    try:
        result = answer_query(df, question)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e), "answer": "I couldn't process that query."}), 200
