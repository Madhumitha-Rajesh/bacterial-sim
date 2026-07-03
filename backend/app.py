"""
app.py
------
Flask API for the Bacterial Growth Virtual Simulation.

Endpoints:
  GET  /api/health         -> simple health check
  GET  /api/config         -> bacteria / antibiotic / nutrient JSON configs
                               (used by the frontend to populate dropdowns)
  POST /api/simulate       -> run a growth simulation, body:
        {
          "species": "E. coli",
          "temperature": 37,
          "nutrientLevel": "Medium",
          "antibioticType": "Ampicillin",
          "antibioticPct": 0,
          "durationHours": 24
        }

Run with:  python app.py   (listens on http://localhost:5000)
"""

import os

from flask import Flask, request, jsonify
from flask_cors import CORS

from growth_model import run_simulation, load_configs
import db

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (localhost:5173) to call this API


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/config", methods=["GET"])
def get_config():
    try:
        return jsonify(load_configs())
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/api/simulate", methods=["POST"])
def simulate():
    body = request.get_json(silent=True) or {}

    required = [
        "species",
        "temperature",
        "nutrientLevel",
        "antibioticType",
        "antibioticPct",
        "durationHours",
    ]
    missing = [key for key in required if key not in body]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        result = run_simulation(
            species=body["species"],
            temperature=body["temperature"],
            nutrient_level=body["nutrientLevel"],
            antibiotic_type=body["antibioticType"],
            antibiotic_pct=body["antibioticPct"],
            duration_hours=body["durationHours"],
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Simulation failed: {exc}"}), 500

    # Best-effort save to history — a simulation should still succeed and be
    # returned to the user even if the database is unreachable/unconfigured.
    try:
        result["experimentId"] = db.save_experiment(result)
    except db.DatabaseUnavailable as exc:
        result["experimentId"] = None
        result["historyWarning"] = str(exc)

    return jsonify(result)


@app.route("/api/experiments", methods=["GET"])
def experiments_list():
    try:
        limit = int(request.args.get("limit", 100))
        return jsonify(db.list_experiments(limit=limit))
    except db.DatabaseUnavailable as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/api/experiments/<experiment_id>", methods=["GET"])
def experiment_detail(experiment_id):
    try:
        doc = db.get_experiment(experiment_id)
        if doc is None:
            return jsonify({"error": "Experiment not found"}), 404
        return jsonify(doc)
    except db.DatabaseUnavailable as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/api/experiments/<experiment_id>", methods=["DELETE"])
def experiment_delete(experiment_id):
    try:
        deleted = db.delete_experiment(experiment_id)
        if not deleted:
            return jsonify({"error": "Experiment not found"}), 404
        return jsonify({"deleted": True})
    except db.DatabaseUnavailable as exc:
        return jsonify({"error": str(exc)}), 503
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.route("/api/experiments/compare", methods=["POST"])
def experiments_compare():
    body = request.get_json(silent=True) or {}
    ids = body.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Provide a non-empty 'ids' array"}), 400
    if len(ids) > 6:
        return jsonify({"error": "Compare at most 6 experiments at a time"}), 400
    try:
        return jsonify(db.get_experiments(ids))
    except db.DatabaseUnavailable as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
