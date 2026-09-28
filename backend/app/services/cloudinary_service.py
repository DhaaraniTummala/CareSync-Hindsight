"""Signed-upload helper for Cloudinary.

We never proxy the file bytes through this API — the frontend uploads
directly to Cloudinary using a short-lived signature this endpoint issues,
so the API secret never leaves the server. See /uploads/signature.
"""
import time

import cloudinary
import cloudinary.utils

from ..config import settings


def _ensure_configured() -> None:
    if not (settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret):
        raise RuntimeError(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY "
            "and CLOUDINARY_API_SECRET in backend/.env."
        )
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def make_upload_signature(subfolder: str = "") -> dict:
    _ensure_configured()
    timestamp = int(time.time())
    folder = f"{settings.cloudinary_upload_folder}/{subfolder}".rstrip("/")
    params_to_sign = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.cloudinary_api_secret)
    return {
        "timestamp": timestamp,
        "signature": signature,
        "api_key": settings.cloudinary_api_key,
        "cloud_name": settings.cloudinary_cloud_name,
        "folder": folder,
    }
