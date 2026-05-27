import os
import json
import pickle
import sys
from firebase_functions import https_fn
from firebase_admin import initialize_app

# Initialize Firebase App
initialize_app()

# Add current directory to path so pickle can resolve standard imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

model = None

def get_model():
    global model
    if model is None:
        model_path = os.path.join(current_dir, "model.pkl")
        if os.path.exists(model_path):
            with open(model_path, "rb") as f:
                model = pickle.load(f)
            print("Langham predictive model loaded successfully!")
        else:
            raise FileNotFoundError(f"model.pkl not found at {model_path}")
    return model

@https_fn.on_request()
def displacement(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Triggered Cloud Function.
    Exposes POST /displacement endpoint for the React frontend.
    """
    # CORS headers
    if req.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600"
        }
        return https_fn.Response("", status=204, headers=headers)

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    }

    if req.method != "POST":
        return https_fn.Response(
            json.dumps({"error": "Method not allowed. Use POST."}),
            status=405,
            headers=headers
        )

    try:
        model_instance = get_model()
    except Exception as e:
        return https_fn.Response(
            json.dumps({"error": f"Model failed to load: {str(e)}"}),
            status=500,
            headers=headers
        )

    try:
        # Parse JSON
        body = req.get_json()
        if not body:
            return https_fn.Response(
                json.dumps({"error": "Empty or invalid JSON body."}),
                status=400,
                headers=headers
            )

        nights = body.get("nights", [])
        group_profit = float(body.get("group_profit", 0.0))
        excess_parking_days = int(body.get("excess_parking_days", 0))

        if not nights:
            return https_fn.Response(
                json.dumps({"error": "Missing required field 'nights' in payload."}),
                status=400,
                headers=headers
            )

        # Execute prediction using serialized class
        result = model_instance.predict_booking(
            nights=nights,
            group_profit=group_profit,
            excess_parking_days=excess_parking_days
        )

        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers=headers
        )

    except Exception as e:
        import traceback
        err_msg = f"Prediction error: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        return https_fn.Response(
            json.dumps({"error": f"Internal inference error: {str(e)}"}),
            status=500,
            headers=headers
        )
