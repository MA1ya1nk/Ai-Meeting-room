from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from database import get_db

actions_bp = Blueprint("actions", __name__)


def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


def _find_by_id(collection, item_id):
    try:
        result = collection.find_one({"_id": ObjectId(item_id)})
        if result:
            return result
    except Exception:
        pass
    return collection.find_one({"_id": item_id})


@actions_bp.route("/actions", methods=["GET"])
def get_actions():
    try:
        db = get_db()
        owner = request.args.get("owner", "").strip()
        priority = request.args.get("priority", "").strip()
        status = request.args.get("status", "").strip()
        meeting_id = request.args.get("meeting_id", "").strip()

        all_items = db["action_items"].find({})
        result = []
        for doc in all_items:
            doc = _serialize(doc)
            if owner and doc.get("owner", "").lower() != owner.lower():
                continue
            if priority and doc.get("priority") != priority:
                continue
            if status and doc.get("status") != status:
                continue
            if meeting_id and doc.get("meeting_id") != meeting_id:
                continue
            result.append(doc)
        result.sort(key=lambda x: x.get("created_at",""), reverse=True)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@actions_bp.route("/actions/<action_id>", methods=["PATCH"])
def update_action(action_id):
    try:
        db = get_db()
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data"}), 400

        allowed = {"status", "owner", "due_date", "priority", "title", "description"}
        updates = {k: v for k, v in data.items() if k in allowed}
        if not updates:
            return jsonify({"success": False, "error": "No valid fields"}), 400

        updates["updated_at"] = datetime.now().isoformat()

        existing = _find_by_id(db["action_items"], action_id)
        if not existing:
            return jsonify({"success": False, "error": "Not found"}), 404

        try:
            db["action_items"].update_one({"_id": ObjectId(action_id)}, {"$set": updates})
        except Exception:
            db["action_items"].update_one({"_id": action_id}, {"$set": updates})

        updated = _find_by_id(db["action_items"], action_id)
        return jsonify({"success": True, "data": _serialize(updated)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@actions_bp.route("/actions/<action_id>", methods=["DELETE"])
def delete_action(action_id):
    try:
        db = get_db()
        existing = _find_by_id(db["action_items"], action_id)
        if not existing:
            return jsonify({"success": False, "error": "Not found"}), 404

        try:
            db["action_items"].delete_one({"_id": ObjectId(action_id)})
        except Exception:
            db["action_items"].delete_one({"_id": action_id})

        return jsonify({"success": True, "message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500