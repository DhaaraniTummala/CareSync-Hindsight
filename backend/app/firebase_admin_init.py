"""Lazy Firebase Admin SDK setup.

Nothing here runs at import time — the app must be able to boot (and serve
/health) even before Firebase credentials exist, so a project can be stood
up incrementally. The first call to get_db()/verify_id_token() initializes
the SDK and raises a clear, actionable error if credentials are missing.
"""
import json
import os
from typing import Optional

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials, firestore

from .config import settings

_app: Optional[firebase_admin.App] = None
_db = None


def init_firebase() -> None:
    global _app, _db
    if _app is not None:
        return

    cred_path = settings.firebase_service_account_json
    inline = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON_INLINE")

    if inline:
        cred = credentials.Certificate(json.loads(inline))
    elif os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    else:
        raise RuntimeError(
            "Firebase is not configured. Download a service account key from "
            "Firebase Console > Project settings > Service accounts > Generate new "
            "private key, save it as backend/firebase-service-account.json (or set "
            "FIREBASE_SERVICE_ACCOUNT_JSON_INLINE in backend/.env), then restart the server."
        )

    _app = firebase_admin.initialize_app(cred)
    _db = firestore.client()


def get_db():
    if _db is None:
        init_firebase()
    return _db


def verify_id_token(token: str) -> dict:
    if _app is None:
        init_firebase()
    return fb_auth.verify_id_token(token)


def create_user(email: str, password: str, display_name: str):
    if _app is None:
        init_firebase()
    return fb_auth.create_user(email=email, password=password, display_name=display_name)


def get_user_by_email(email: str):
    if _app is None:
        init_firebase()
    return fb_auth.get_user_by_email(email)


def delete_user(uid: str) -> None:
    """Best-effort: deleting a patient who never had their own login
    (added by a doctor, not self-registered) has no matching Auth user."""
    if _app is None:
        init_firebase()
    try:
        fb_auth.delete_user(uid)
    except fb_auth.UserNotFoundError:
        pass
