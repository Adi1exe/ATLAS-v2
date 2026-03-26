from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from routes.auth    import auth_bp
    from routes.data    import data_bp
    from routes.viz     import viz_bp
    from routes.insights import insights_bp
    from routes.predict import predict_bp
    from routes.report  import report_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(data_bp,     url_prefix="/api/data")
    app.register_blueprint(viz_bp,      url_prefix="/api/viz")
    app.register_blueprint(insights_bp, url_prefix="/api/insights")
    app.register_blueprint(predict_bp,  url_prefix="/api/predict")
    app.register_blueprint(report_bp,   url_prefix="/api/report")

    with app.app_context():
        db.create_all()

    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "ATLAS"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
