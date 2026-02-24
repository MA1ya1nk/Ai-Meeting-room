from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.meetings import meetings_bp
from routes.actions import actions_bp

app = Flask(__name__)

# Allow both port 3000 and 3001
CORS(app, origins=["http://localhost:3000", "http://localhost:3001"])

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
    print(f"🚀 API running at http://localhost:{Config.FLASK_PORT}")
    key_set = Config.GEMINI_API_KEY != "your_gemini_api_key_here"
    print(f"🔑 API Key: {'Configured ✅' if key_set else 'NOT SET ⚠️'}")
    app.run(debug=True, port=Config.FLASK_PORT)