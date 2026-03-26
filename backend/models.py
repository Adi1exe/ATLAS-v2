from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id          = db.Column(db.Integer,     primary_key=True)
    google_id   = db.Column(db.String(128), unique=True, nullable=False)
    email       = db.Column(db.String(255), unique=True, nullable=False)
    name        = db.Column(db.String(255), nullable=False)
    picture     = db.Column(db.String(512))
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    datasets    = db.relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    ml_models   = db.relationship("MLModel", back_populates="owner", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "picture": self.picture,
        }


class Dataset(db.Model):
    __tablename__ = "datasets"

    id           = db.Column(db.String(64),  primary_key=True)
    user_id      = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    name         = db.Column(db.String(255), nullable=False)
    filename     = db.Column(db.String(512), nullable=False)   # path on disk
    rows         = db.Column(db.Integer)
    columns      = db.Column(db.Integer)
    missing_pct  = db.Column(db.Float, default=0.0)
    uploaded_at  = db.Column(db.DateTime, default=datetime.utcnow)

    owner        = db.relationship("User", back_populates="datasets")
    ml_models    = db.relationship("MLModel", back_populates="dataset", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "rows": self.rows,
            "columns": self.columns,
            "missing_pct": self.missing_pct,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class MLModel(db.Model):
    __tablename__ = "ml_models"

    id          = db.Column(db.String(64),  primary_key=True)
    user_id     = db.Column(db.Integer,     db.ForeignKey("users.id"), nullable=False)
    dataset_id  = db.Column(db.String(64),  db.ForeignKey("datasets.id"), nullable=False)
    model_type  = db.Column(db.String(64),  nullable=False)
    features    = db.Column(db.Text)        # JSON list
    target      = db.Column(db.String(255))
    metrics     = db.Column(db.Text)        # JSON dict
    model_path  = db.Column(db.String(512)) # joblib file path
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    owner       = db.relationship("User",    back_populates="ml_models")
    dataset     = db.relationship("Dataset", back_populates="ml_models")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "model_type": self.model_type,
            "features": json.loads(self.features or "[]"),
            "target": self.target,
            "metrics": json.loads(self.metrics or "{}"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
