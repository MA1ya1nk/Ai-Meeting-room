from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from database import get_db
from ai_processor import process_meeting_with_ai

meetings_bp = Blueprint("meetings", __name__)


def _serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    return doc


def _find_by_id(collection, meeting_id):
    # Try ObjectId first (MongoDB), fallback to string (in-memory)
    try:
        result = collection.find_one({"_id": ObjectId(meeting_id)})
        if result:
            return result
    except Exception:
        pass
    return collection.find_one({"_id": meeting_id})


@meetings_bp.route("/meetings", methods=["GET"])
def get_meetings():
    try:
        db = get_db()
        search = request.args.get("search", "").strip().lower()
        all_meetings = db["meetings"].find({})
        result = []
        for m in all_meetings:
            m = _serialize(m)
            if search:
                haystack = (m.get("title","") + m.get("transcript","") + m.get("ai_summary","")).lower()
                if search not in haystack:
                    continue
            result.append(m)
        result.sort(key=lambda x: x.get("created_at",""), reverse=True)
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@meetings_bp.route("/meetings/create", methods=["POST"])
def create_meeting():
    try:
        data = request.get_json()
        if not data or not data.get("transcript", "").strip():
            return jsonify({"success": False, "error": "Transcript is required"}), 400

        meeting_type = data.get("meeting_type", "General")
        doc = {
            "title": data.get("title") or f"{meeting_type} Meeting — {datetime.now().strftime('%b %d, %Y')}",
            "transcript": data["transcript"].strip(),
            "meeting_type": meeting_type,
            "participants": data.get("participants", []),
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "ai_summary": None,
            "key_decisions": [],
            "topics_discussed": [],
            "meeting_sentiment": None,
        }
        db = get_db()
        res = db["meetings"].insert_one(doc)
        return jsonify({"success": True, "data": {"meeting_id": str(res.inserted_id), "title": doc["title"]}}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@meetings_bp.route("/meetings/process", methods=["POST"])
def process_meeting():
    try:
        data = request.get_json()
        meeting_id = data.get("meeting_id")
        if not meeting_id:
            return jsonify({"success": False, "error": "meeting_id required"}), 400

        db = get_db()
        meeting = _find_by_id(db["meetings"], meeting_id)
        if not meeting:
            return jsonify({"success": False, "error": "Meeting not found"}), 404

        ai = process_meeting_with_ai(
            meeting["transcript"],
            meeting["meeting_type"],
            meeting.get("participants", [])
        )
        d = ai["data"]

        try:
            db["meetings"].update_one(
                {"_id": ObjectId(meeting_id)},
                {"$set": {
                    "status": "processed",
                    "ai_summary": d.get("summary", ""),
                    "key_decisions": d.get("key_decisions", []),
                    "topics_discussed": d.get("topics_discussed", []),
                    "meeting_sentiment": d.get("meeting_sentiment", "Neutral"),
                    "processed_at": datetime.now().isoformat(),
                }}
            )
        except Exception:
            db["meetings"].update_one(
                {"_id": meeting_id},
                {"$set": {
                    "status": "processed",
                    "ai_summary": d.get("summary", ""),
                    "key_decisions": d.get("key_decisions", []),
                    "topics_discussed": d.get("topics_discussed", []),
                    "meeting_sentiment": d.get("meeting_sentiment", "Neutral"),
                    "processed_at": datetime.now().isoformat(),
                }}
            )

        action_items = []
        for item in d.get("action_items", []):
            doc = {
                "meeting_id": meeting_id,
                "title": item.get("title", "Untitled"),
                "description": item.get("description", ""),
                "owner": item.get("owner", "Unassigned"),
                "priority": item.get("priority", "Medium"),
                "due_date": item.get("due_date", ""),
                "status": "Pending",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            res = db["action_items"].insert_one(doc)
            doc["_id"] = str(res.inserted_id)
            action_items.append(doc)

        return jsonify({
            "success": True,
            "ai_success": ai["success"],
            "error_message": ai.get("error"),
            "data": {
                "summary": d.get("summary"),
                "key_decisions": d.get("key_decisions", []),
                "topics_discussed": d.get("topics_discussed", []),
                "meeting_sentiment": d.get("meeting_sentiment"),
                "action_items": action_items,
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@meetings_bp.route("/meetings/<meeting_id>", methods=["GET"])
def get_meeting(meeting_id):
    try:
        db = get_db()
        m = _find_by_id(db["meetings"], meeting_id)
        if not m:
            return jsonify({"success": False, "error": "Not found"}), 404
        return jsonify({"success": True, "data": _serialize(m)}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500