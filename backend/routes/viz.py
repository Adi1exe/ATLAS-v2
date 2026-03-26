from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Dataset
from ml.graph_recommender import recommend_charts
from ml.chart_generator import generate_plotly_chart

viz_bp = Blueprint("viz", __name__)


def _load_ds(dataset_id, user_id):
    import pandas as pd
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    return ds, pd.read_parquet(ds.filename)


@viz_bp.post("/recommend")
@jwt_required()
def recommend():
    user_id    = int(get_jwt_identity())
    data       = request.json
    dataset_id = data.get("dataset_id")
    columns    = data.get("columns", [])

    if not dataset_id:
        return jsonify({"error": "dataset_id required"}), 400

    ds, df = _load_ds(dataset_id, user_id)
    recs   = recommend_charts(df, columns)
    return jsonify({"recommendations": recs}), 200


@viz_bp.post("/generate")
@jwt_required()
def generate():
    user_id    = int(get_jwt_identity())
    data       = request.json
    dataset_id = data.get("dataset_id")
    chart_type = data.get("chart_type")
    columns    = data.get("columns", [])
    config     = data.get("config", {})

    if not all([dataset_id, chart_type, columns]):
        return jsonify({"error": "dataset_id, chart_type, and columns are required"}), 400

    ds, df = _load_ds(dataset_id, user_id)

    try:
        plotly_dict = generate_plotly_chart(df, chart_type, columns, config)
        return jsonify({"plotly": plotly_dict}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
