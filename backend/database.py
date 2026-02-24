from pymongo import MongoClient
from config import Config

_db = None

def get_db():
    global _db
    if _db is None:
        try:
            client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=3000)
            client.server_info()
            _db = client["meeting_tracker"]
            print("✅ MongoDB connected")
        except Exception as e:
            print(f"⚠️  MongoDB unavailable: {e}")
            print("⚠️  Using in-memory storage (data resets on restart)")
            _db = InMemoryDB()
    return _db


class InMemoryDB:
    def __init__(self):
        self._cols = {}

    def __getitem__(self, name):
        if name not in self._cols:
            self._cols[name] = InMemoryCollection()
        return self._cols[name]

    def __getattr__(self, name):
        return self[name]


class InMemoryCollection:
    def __init__(self):
        self._data = []

    def insert_one(self, doc):
        import uuid
        doc = dict(doc)
        doc["_id"] = str(uuid.uuid4())
        self._data.append(doc)
        class R:
            inserted_id = doc["_id"]
        return R()

    def find(self, query=None):
        results = [dict(d) for d in self._data]
        if query:
            results = [d for d in results if all(d.get(k) == v for k, v in query.items())]
        return results

    def find_one(self, query):
        for d in self._data:
            if all(d.get(k) == v for k, v in query.items()):
                return dict(d)
        return None

    def update_one(self, query, update):
        for d in self._data:
            if all(d.get(k) == v for k, v in query.items()):
                if "$set" in update:
                    d.update(update["$set"])
                break

    def delete_one(self, query):
        for i, d in enumerate(self._data):
            if all(d.get(k) == v for k, v in query.items()):
                self._data.pop(i)
                break