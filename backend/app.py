import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.meetings import meetings_bp
from routes.actions import actions_bp

app = Flask(__name__)

CORS(app, origins=["*"])

app.register_blueprint(meetings_bp, url_prefix="/api")
app.register_blueprint(actions_bp, url_prefix="/api")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 API running at http://localhost:{port}")
    app.run(debug=False, host="0.0.0.0", port=port)