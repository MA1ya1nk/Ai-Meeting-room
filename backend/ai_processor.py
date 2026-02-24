import json
import re
import os
from datetime import datetime, timedelta

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai


def process_meeting_with_ai(transcript, meeting_type, participants):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    genai.configure(api_key=api_key)

    today = datetime.now().strftime("%Y-%m-%d")
    participants_str = ", ".join(participants) if participants else "Not specified"

    prompt = f"""You are an expert meeting analyst. Analyze this {meeting_type} meeting transcript.

Participants: {participants_str}
Today: {today}

Transcript:
---
{transcript}
---

Return ONLY a raw JSON object. No markdown. No code fences. No explanation. Just the JSON:
{{
  "summary": "2-3 sentence summary of the meeting",
  "key_decisions": ["decision 1", "decision 2"],
  "action_items": [
    {{
      "title": "short action title",
      "description": "detailed description of what needs to be done",
      "owner": "person name or Unassigned",
      "priority": "High or Medium or Low",
      "due_date": "YYYY-MM-DD",
      "status": "Pending"
    }}
  ],
  "meeting_sentiment": "Productive or Neutral or Challenging",
  "topics_discussed": ["topic1", "topic2"]
}}

Rules:
- urgent/critical = High priority, soon/next week = Medium, later/eventually = Low
- If owner not mentioned, use Unassigned
- If due date not mentioned, default to 7 days from today ({today})
- Return ONLY the JSON. Absolutely nothing else."""

    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        response = model.generate_content(prompt)
        text = response.text.strip()

        print(f"🤖 Gemini raw response: {text[:200]}")

        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'^```\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        text = text.strip()

        result = json.loads(text)
        print("✅ AI processing successful")
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        return {"success": False, "error": f"AI returned invalid JSON: {e}", "data": _demo()}
    except Exception as e:
        print(f"❌ Gemini error: {str(e)}")
        return {"success": False, "error": str(e), "data": _demo()}


def _demo():
    due = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    return {
        "summary": "Demo mode — add your Gemini API key to backend/.env to enable AI processing.",
        "key_decisions": ["Add GEMINI_API_KEY to backend/.env to activate AI"],
        "action_items": [{
            "title": "Configure Gemini API Key",
            "description": "Get a free key from https://aistudio.google.com/app/apikey and add it to backend/.env",
            "owner": "Developer",
            "priority": "High",
            "due_date": due,
            "status": "Pending"
        }],
        "meeting_sentiment": "Neutral",
        "topics_discussed": ["Setup", "Configuration"]
    }