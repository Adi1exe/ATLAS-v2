"""
ML Predictor — trains sklearn + ARIMA models and generates
both Plotly charts AND plain-English explanations of results.
"""
import json
import joblib
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from typing import Dict, List

from sklearn.model_selection    import train_test_split
from sklearn.preprocessing      import LabelEncoder, StandardScaler
from sklearn.linear_model       import LinearRegression, LogisticRegression
from sklearn.ensemble           import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics            import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, f1_score,
)
from sklearn.pipeline           import Pipeline
from sklearn.impute             import SimpleImputer

MODEL_MAP = {
    "linear_regression":   LinearRegression,
    "random_forest_reg":   RandomForestRegressor,
    "logistic_regression": LogisticRegression,
    "random_forest_clf":   RandomForestClassifier,
}
REGRESSION_MODELS     = {"linear_regression", "random_forest_reg", "arima"}
CLASSIFICATION_MODELS = {"logistic_regression", "random_forest_clf"}


def _is_regression(model_type: str) -> bool:
    return model_type in REGRESSION_MODELS


def _build_pipeline(model_type: str) -> Pipeline:
    return Pipeline([
        ("imputer", SimpleImputer(strategy="mean")),
        ("scaler",  StandardScaler()),
        ("model",   MODEL_MAP[model_type]()),
    ])


# ── Plain-English explanation generators ─────────────────────────────────────
def _explain_regression(metrics: dict, target: str, model_type: str, n_train: int) -> str:
    r2   = metrics.get("R²", 0)
    rmse = metrics.get("RMSE", 0)
    mae  = metrics.get("MAE", 0)
    name = {"linear_regression": "Linear Regression",
            "random_forest_reg": "Random Forest"}.get(model_type, model_type)

    # R² quality label
    if r2 >= 0.9:
        quality = "excellent"
        quality_desc = "This model captures almost all variation in the data."
    elif r2 >= 0.75:
        quality = "good"
        quality_desc = "The model explains most of the patterns in the data."
    elif r2 >= 0.5:
        quality = "moderate"
        quality_desc = "The model captures some patterns but misses others."
    else:
        quality = "weak"
        quality_desc = "The model struggles to explain this target variable — consider more features or a different approach."

    return (
        f"**{name} trained on {n_train:,} rows** to predict **{target}**.\n\n"
        f"The model achieved an **R² of {r2:.2f}**, which is considered **{quality}**. "
        f"{quality_desc}\n\n"
        f"On average, predictions are off by about **{mae:.2f} units** (MAE). "
        f"The root mean squared error is **{rmse:.2f}**, which penalises larger mistakes more heavily.\n\n"
        f"{'✅ This model is production-ready.' if r2 >= 0.75 else '⚠️ Consider adding more features or trying a different model type to improve accuracy.'}"
    )


def _explain_classification(metrics: dict, target: str, model_type: str, n_train: int, n_classes: int) -> str:
    acc = metrics.get("Accuracy", 0)
    f1  = metrics.get("F1 Score", 0)
    name = {"logistic_regression": "Logistic Regression",
            "random_forest_clf":   "Random Forest"}.get(model_type, model_type)

    if acc >= 0.9:
        quality = "excellent"
    elif acc >= 0.75:
        quality = "good"
    elif acc >= 0.6:
        quality = "moderate"
    else:
        quality = "low"

    baseline = round(1 / n_classes * 100, 1)

    return (
        f"**{name} trained on {n_train:,} rows** to classify **{target}** "
        f"({n_classes} categories).\n\n"
        f"The model correctly predicted **{acc*100:.1f}%** of test samples — "
        f"this accuracy is **{quality}**. "
        f"(A random guess would get ~{baseline}% correct.)\n\n"
        f"The **F1 Score is {f1:.2f}**, which balances precision and recall — "
        f"{'good' if f1 >= 0.75 else 'moderate' if f1 >= 0.5 else 'low'} overall.\n\n"
        f"{'✅ The model is classifying well.' if acc >= 0.75 else '⚠️ The accuracy is below 75%. Try adding more relevant features or balancing the dataset.'}"
    )


def _explain_arima(metrics: dict, target: str, n_points: int) -> str:
    rmse = metrics.get("RMSE", 0)
    mae  = metrics.get("MAE", 0)

    return (
        f"**ARIMA model** trained on **{n_points:,} historical data points** of **{target}**.\n\n"
        f"The forecast error (MAE) is **{mae:.4f}**, meaning predictions are on average "
        f"off by that amount from the actual future values.\n\n"
        f"The RMSE is **{rmse:.4f}** — higher than MAE because it penalises larger forecast errors more heavily.\n\n"
        f"The chart shows historical values in blue and the forecast in orange. "
        f"{'✅ Low forecast error — the model has a good grasp of the trend.' if mae < rmse * 0.8 else '⚠️ Consider collecting more data or tuning the ARIMA order for better accuracy.'}"
    )


def _explain_feature_importance(pipeline, features: List[str], model_type: str) -> str:
    """Extract and narrate the most important features if the model supports it."""
    try:
        model = pipeline.named_steps["model"]
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
            pairs = sorted(zip(features, imp), key=lambda x: x[1], reverse=True)
            top3  = pairs[:3]
            lines = [f"**{f}** ({v*100:.1f}%)" for f, v in top3]
            return (
                f"\n\n**Most influential features:** "
                + ", ".join(lines)
                + ". These are the columns driving the predictions the most."
            )
        elif hasattr(model, "coef_"):
            coefs = model.coef_.flatten() if model.coef_.ndim > 1 else model.coef_
            pairs = sorted(zip(features, coefs), key=lambda x: abs(x[1]), reverse=True)
            top3  = pairs[:3]
            lines = [f"**{f}** (coef {v:+.3f})" for f, v in top3]
            return (
                f"\n\n**Strongest coefficients:** "
                + ", ".join(lines)
                + ". A positive coefficient means the feature pushes the prediction up; negative means down."
            )
    except Exception:
        pass
    return ""


# ── Plot helpers ──────────────────────────────────────────────────────────────
LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="DM Sans", color="#94A3B8"),
    legend=dict(bgcolor="rgba(0,0,0,0)"),
    margin=dict(t=48, r=20, b=52, l=52),
)
AXIS = dict(gridcolor="#1C2640", zerolinecolor="#1C2640")


def _regression_plot(y_test, y_pred, target):
    idx = list(range(len(y_test)))
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=idx, y=y_test.tolist(), mode="lines+markers", name="Actual",
                             line=dict(color="#06B6D4"), marker=dict(size=5)))
    fig.add_trace(go.Scatter(x=idx, y=y_pred.tolist(), mode="lines+markers", name="Predicted",
                             line=dict(color="#F59E0B", dash="dash"), marker=dict(size=5)))
    fig.update_layout(title=f"Actual vs Predicted — {target}", template="plotly_dark",
                      xaxis_title="Sample", yaxis_title=target, **LAYOUT)
    fig.update_xaxes(**AXIS); fig.update_yaxes(**AXIS)
    return json.loads(fig.to_json())


def _classification_plot(y_test, y_pred, classes):
    from sklearn.metrics import confusion_matrix
    cm   = confusion_matrix(y_test, y_pred)
    lbls = [str(c) for c in classes]
    fig  = go.Figure(go.Heatmap(
        z=cm.tolist(), x=lbls, y=lbls,
        colorscale=[[0,"#0F1623"],[0.5,"#1e3a8a"],[1,"#3B82F6"]],
        text=cm.tolist(), texttemplate="%{text}",
        showscale=True,
    ))
    fig.update_layout(title="Confusion Matrix", template="plotly_dark",
                      xaxis_title="Predicted", yaxis_title="Actual", **LAYOUT)
    return json.loads(fig.to_json())


# ── Public API ────────────────────────────────────────────────────────────────
def train_model_pipeline(
    df: pd.DataFrame,
    model_type: str,
    features: List[str],
    target: str,
    model_path: str,
) -> Dict:
    missing_cols = [c for c in features + [target] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Columns not found: {missing_cols}")

    if model_type == "arima":
        return _arima_train(df, target, model_path)

    df_clean = df[features + [target]].dropna()
    if len(df_clean) < 20:
        raise ValueError("Need at least 20 non-null rows to train a model.")

    X = df_clean[features].copy()
    y = df_clean[target]

    # Encode categoricals
    encoders = {}
    for col in X.select_dtypes("object").columns:
        le = LabelEncoder(); X[col] = le.fit_transform(X[col].astype(str)); encoders[col] = le

    target_encoder = None
    if model_type in CLASSIFICATION_MODELS and y.dtype == object:
        target_encoder = LabelEncoder(); y = target_encoder.fit_transform(y.astype(str))

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline = _build_pipeline(model_type)
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    if _is_regression(model_type):
        metrics = {
            "R²":   round(float(r2_score(y_test, y_pred)), 4),
            "RMSE": round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4),
            "MAE":  round(float(mean_absolute_error(y_test, y_pred)), 4),
        }
        plot        = _regression_plot(y_test, y_pred, target)
        feat_note   = _explain_feature_importance(pipeline, features, model_type)
        explanation = _explain_regression(metrics, target, model_type, len(X_train)) + feat_note
    else:
        classes = pipeline.named_steps["model"].classes_
        metrics = {
            "Accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "F1 Score": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        }
        plot        = _classification_plot(y_test, y_pred, classes)
        feat_note   = _explain_feature_importance(pipeline, features, model_type)
        explanation = _explain_classification(metrics, target, model_type, len(X_train), len(classes)) + feat_note

    joblib.dump({"type": model_type, "pipeline": pipeline,
                 "encoders": encoders, "target_encoder": target_encoder,
                 "features": features}, model_path)

    return {"metrics": metrics, "plot": plot, "explanation": explanation}


def _arima_train(df: pd.DataFrame, target: str, model_path: str) -> Dict:
    from statsmodels.tsa.arima.model import ARIMA

    series      = df[target].dropna()
    n_forecast  = max(10, int(len(series) * 0.1))
    train       = series.iloc[:-n_forecast]
    test        = series.iloc[-n_forecast:]

    model = ARIMA(train, order=(2, 1, 2)).fit()
    preds = model.forecast(steps=n_forecast)

    metrics = {
        "RMSE": round(float(np.sqrt(mean_squared_error(test, preds))), 4),
        "MAE":  round(float(mean_absolute_error(test, preds)), 4),
    }

    fig = go.Figure()
    fig.add_trace(go.Scatter(y=series.values.tolist(), name="Historical",
                             line=dict(color="#06B6D4"), mode="lines"))
    fig.add_trace(go.Scatter(x=list(range(len(train), len(series))),
                             y=preds.values.tolist(), name="Forecast",
                             line=dict(color="#F59E0B", dash="dash"), mode="lines"))
    fig.update_layout(title=f"ARIMA Forecast — {target}", template="plotly_dark",
                      xaxis_title="Time Index", yaxis_title=target, **LAYOUT)
    fig.update_xaxes(**AXIS); fig.update_yaxes(**AXIS)

    joblib.dump({"type": "arima", "fit": model}, model_path)

    return {
        "metrics":     metrics,
        "plot":        json.loads(fig.to_json()),
        "explanation": _explain_arima(metrics, target, len(series)),
    }


def predict_with_model(model_path: str, input_data: List[Dict]) -> List:
    bundle   = joblib.load(model_path)
    pipeline = bundle["pipeline"]
    encoders = bundle.get("encoders", {})
    features = bundle.get("features", [])

    df = pd.DataFrame(input_data)
    for col, le in encoders.items():
        if col in df.columns:
            df[col] = le.transform(df[col].astype(str))

    preds = pipeline.predict(df[features])
    te    = bundle.get("target_encoder")
    if te:
        preds = te.inverse_transform(preds)
    return preds.tolist()
