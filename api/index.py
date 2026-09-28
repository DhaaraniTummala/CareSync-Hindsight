"""Vercel serverless entrypoint.

Vercel's Python runtime looks for an ASGI app named `app` in this file and
forwards every /api/* request straight to it (see the root vercel.json
rewrite). The actual FastAPI app lives in backend/app so the exact same
code also runs locally with `uvicorn app.main:app` — this file just makes
that package importable from here and re-exports it.
"""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402  (import after sys.path setup)

__all__ = ["app"]
