import os
import sys
import pickle
import mimetypes
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Explicitly register .jsx MIME type to avoid browser sniff blockages on Windows
mimetypes.add_type("application/javascript", ".jsx")

# Add functions/ to sys.path so pickle can resolve standard imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(current_dir, "functions"))

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app) # Enable CORS for robust local development cross-calls

@app.after_request
def add_header(response):
    """Disable caching for all responses to prevent browser caching issues during local development."""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Load pre-trained model at server startup
model = None
model_path = os.path.join(current_dir, "functions", "model.pkl")

if os.path.exists(model_path):
    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("Langham predictive model loaded successfully!")
    except Exception as e:
        print(f"Error loading serialized model.pkl: {e}")
else:
    print(f"Warning: model.pkl not found at {model_path}. Run train_model.py first.")

@app.route("/")
def serve_index():
    """Serves the main frontend entrypoint."""
    return send_from_directory("public", "index.html")

@app.route("/api/displacement", methods=["POST"])
def displacement_endpoint():
    """Exposes POST /api/displacement, matching the Firebase Rewrite route."""
    if model is None:
        return jsonify({"error": "Model is not trained/loaded on the server. Please check setup."}), 500

    try:
        body = request.get_json()
        if not body:
            return jsonify({"error": "Empty or invalid JSON body."}), 400

        nights = body.get("nights", [])
        group_profit = float(body.get("group_profit", 0.0))
        excess_parking_days = int(body.get("excess_parking_days", 0))

        if not nights:
            return jsonify({"error": "Missing required field 'nights' in payload."}), 400

        # Execute prediction
        result = model.predict_booking(
            nights=nights,
            group_profit=group_profit,
            excess_parking_days=excess_parking_days
        )

        return jsonify(result)

    except Exception as e:
        import traceback
        err_msg = f"Prediction error: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        return jsonify({"error": f"Internal inference error: {str(e)}"}), 500

@app.route("/<path:path>")
def serve_static(path):
    """Fallback handler to serve static frontend assets (e.g. App.jsx)."""
    return send_from_directory("public", path)

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  LANGHAM HOTEL DISPLACEMENT SUITE — LOCAL DEVELOPMENT SERVER")
    print("=" * 70)
    print("  Serving React UI & Python Model API locally.")
    print("  Open your browser and navigate to: http://127.0.0.1:8000")
    print("=" * 70 + "\n")
    app.run(host="127.0.0.1", port=8000, debug=True, use_reloader=False)
