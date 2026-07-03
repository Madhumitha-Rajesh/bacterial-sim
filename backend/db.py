
"""
db.py
-----
MongoDB persistence layer for experiment history.

Reads the connection string from the MONGODB_URI environment variable, so
it works transparently against either:
  - A local MongoDB (e.g. mongodb://localhost:27017)
  - A free MongoDB Atlas cloud cluster
    (e.g. mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority)

See ../.env.example for the variable name to copy into a real .env file.

Every function raises DatabaseUnavailable with a friendly message if the
connection isn't configured or can't be reached, so the rest of the app can
turn that into a clean 503 response instead of a stack trace.
"""

import os
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError

try:
    from dotenv import load_dotenv
    # Load backend/.env explicitly (next to this file) so it's found no
    # matter which directory `python app.py` is launched from.
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(dotenv_path=_env_path)
except ImportError:
    pass

try:
    import certifi
    _CA_FILE = certifi.where()
except ImportError:
    _CA_FILE = None

try:
    # pymongo uses dnspython under the hood for hostname/SRV/TXT lookups.
    # Some routers/ISP DNS resolvers time out or fail on these lookups even
    # though the network itself is fine. Forcing dnspython to query public
    # DNS servers directly sidesteps that unreliable resolver entirely,
    # without needing to change any Windows/OS network settings.
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ["8.8.8.8", "1.1.1.1", "8.8.4.4"]
except ImportError:
    pass

MONGODB_URI = os.environ.get("MONGODB_URI", "")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "bacterial_sim")
COLLECTION_NAME = "experiments"

_client = None


class DatabaseUnavailable(Exception):
    """Raised whenever MongoDB isn't configured or can't be reached."""


def get_collection():
    global _client
    if not MONGODB_URI:
        raise DatabaseUnavailable(
            "MONGODB_URI is not set. Add it to backend/.env (see .env.example)."
        )
    if _client is None:
        try:
            client_kwargs = {"serverSelectionTimeoutMS": 5000}
            # Use certifi's CA bundle for TLS verification. This avoids
            # SSL handshake failures (TLSV1_ALERT_INTERNAL_ERROR) that are
            # common on Windows Python installs with an outdated or
            # non-standard OpenSSL/certificate store.
            if _CA_FILE:
                client_kwargs["tlsCAFile"] = _CA_FILE
            _client = MongoClient(MONGODB_URI, **client_kwargs)
            _client.admin.command("ping")  # fail fast if unreachable
        except PyMongoError as exc:
            _client = None
            raise DatabaseUnavailable(f"Could not connect to MongoDB: {exc}") from exc
    return _client[DB_NAME][COLLECTION_NAME]


def _serialize(doc):
    """Convert Mongo's ObjectId/datetime into JSON-friendly values."""
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("createdAt"), datetime):
        doc["createdAt"] = doc["createdAt"].isoformat()
    return doc


def save_experiment(simulation_result):
    """Persist one completed simulation run. Returns the new experiment id."""
    collection = get_collection()
    doc = dict(simulation_result)
    doc["createdAt"] = datetime.now(timezone.utc)
    inserted = collection.insert_one(doc)
    return str(inserted.inserted_id)


def list_experiments(limit=100):
    """Return lightweight summaries (no full time series) for the history list."""
    collection = get_collection()
    cursor = (
        collection.find(
            {},
            {
                "species": 1,
                "parameters": 1,
                "summary": 1,
                "createdAt": 1,
            },
        )
        .sort("createdAt", DESCENDING)
        .limit(limit)
    )
    return [_serialize(doc) for doc in cursor]


def get_experiment(experiment_id):
    """Return the full experiment document, including time series, by id."""
    collection = get_collection()
    try:
        oid = ObjectId(experiment_id)
    except InvalidId as exc:
        raise ValueError(f"Invalid experiment id: {experiment_id}") from exc
    doc = collection.find_one({"_id": oid})
    if doc is None:
        return None
    return _serialize(doc)


def get_experiments(experiment_ids):
    """Return full documents for a list of ids, preserving no particular order."""
    collection = get_collection()
    oids = []
    for eid in experiment_ids:
        try:
            oids.append(ObjectId(eid))
        except InvalidId:
            continue
    cursor = collection.find({"_id": {"$in": oids}})
    return [_serialize(doc) for doc in cursor]


def delete_experiment(experiment_id):
    collection = get_collection()
    try:
        oid = ObjectId(experiment_id)
    except InvalidId as exc:
        raise ValueError(f"Invalid experiment id: {experiment_id}") from exc
    result = collection.delete_one({"_id": oid})
    return result.deleted_count > 0

























