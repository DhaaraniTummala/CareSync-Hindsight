"""Wraps the Hindsight memory service (https://hindsight.vectorize.io) so the
chatbot can recall earlier conversations with a patient. One memory bank per
patient, keyed off their patient_id, so memories never cross between patients.

Memory is an enhancement, not a hard dependency: every call here is wrapped
so that if Hindsight is unreachable or not yet configured, the chatbot still
works (just without long-term recall) instead of erroring out.
"""
from typing import List

from ..config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        from hindsight_client import Hindsight

        kwargs = {"base_url": settings.hindsight_base_url}
        if settings.hindsight_api_key:
            kwargs["api_key"] = settings.hindsight_api_key
        _client = Hindsight(**kwargs)
    return _client


def _bank_id(patient_id: str) -> str:
    return f"caresync-patient-{patient_id}"


def remember(patient_id: str, content: str) -> None:
    try:
        _get_client().retain(bank_id=_bank_id(patient_id), content=content)
    except Exception as e:  # noqa: BLE001 - deliberately broad, memory must never break chat
        print(f"[hindsight] retain failed (continuing without it): {e}")


def recall(patient_id: str, query: str) -> List[str]:
    try:
        result = _get_client().recall(bank_id=_bank_id(patient_id), query=query)
    except Exception as e:  # noqa: BLE001
        print(f"[hindsight] recall failed (continuing without it): {e}")
        return []

    items = result if isinstance(result, list) else getattr(result, "memories", []) or []
    out = []
    for it in items:
        text = it.get("content") if isinstance(it, dict) else getattr(it, "content", None)
        if text:
            out.append(text)
    return out
