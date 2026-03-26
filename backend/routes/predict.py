import os
import uuid
import json
import joblib
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Dataset, MLModel
from ml.predictor import train_model_pipeline, predict_with_model

predict_bp = Blueprint("predict", __name__)


def _load_df(dataset_id, user_id):
    import pandas as pd
    ds = Dataset.query.filter_by(id=dataset_id, user_id=user_id).first_or_404()
    return pd.read_parquet(ds.filename)


@predict_bp.post("/train")
@jwt_required()
def train():
    user_id    = int(get_jwt_identity())
    data       = request.json
    dataset_id = data.get("dataset_id")
    model_type = data.get("model_type")
    features   = data.get("features", [])
    target     = data.get("target")

    if not all([dataset_id, model_type, features, target]):
        return jsonify({"error": "dataset_id, model_type, features, and target are required"}), 400

    df = _load_df(dataset_id, user_id)

    try:
        model_id   = str(uuid.uuid4())[:16]
        model_path = os.path.join(current_app.config["UPLOAD_FOLDER"], f"model_{model_id}.joblib")

        result = train_model_pipeline(df, model_type, features, target, model_path)

        ml_model = MLModel(
            id         = model_id,
            user_id    = user_id,
            dataset_id = dataset_id,
            model_type = model_type,
            features   = json.dumps(features),
            target     = target,
            metrics    = json.dumps(result["metrics"]),
            model_path = model_path,
        )
        db.session.add(ml_model); db.session.commit()

        return jsonify({
            "model_id": model_id,
            "metrics":  result["metrics"],
            "plot":     result.get("plot"),
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@predict_bp.post("/<model_id>/predict")
@jwt_required()
def predict(model_id):
    user_id  = int(get_jwt_identity())
    ml_model = MLModel.query.filter_by(id=model_id, user_id=user_id).first_or_404()
    input_data = request.json.get("data", [])

    try:
        preds = predict_with_model(ml_model.model_path, input_data)
        return jsonify({"predictions": preds}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@predict_bp.get("/models")
@jwt_required()
def list_models():
    user_id    = int(get_jwt_identity())
    dataset_id = request.args.get("dataset_id")
    q = MLModel.query.filter_by(user_id=user_id)
    if dataset_id:
        q = q.filter_by(dataset_id=dataset_id)
    models = q.order_by(MLModel.created_at.desc()).all()
    return jsonify({"models": [m.to_dict() for m in models]}), 200
