"""Groq-backed clinical brief generation and patient chatbot replies.

Both prompts are deliberately restrictive: the model is told to synthesize
only from the records it's given, never invent findings, and never diagnose
or recommend treatment. Citation numbers for the clinical brief are assigned
by *this code*, not the model, so a citation can never point at a record
that doesn't exist.

Groq's API is OpenAI-compatible, so we talk to it with the `openai` SDK
pointed at Groq's base URL instead of a Groq-specific client.
"""
from typing import List

from ..config import settings

_client = None

SPEC_TAGS = {"Cardiology": "cardio", "Endocrinology": "endo", "General Medicine": None}


def _get_client():
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError("Groq is not configured. Set GROQ_API_KEY in backend/.env.")
        from openai import OpenAI

        _client = OpenAI(api_key=settings.groq_api_key, base_url=settings.groq_base_url)
    return _client


def select_relevant_records(records: List[dict], specialty: str) -> List[dict]:
    tag = SPEC_TAGS.get(specialty)
    if tag is None:  # "General Medicine" (or an unrecognized specialty) sees everything
        return records
    return [r for r in records if r.get("specialty_tag") in (tag, "gen")]


def generate_brief(patient: dict, records: List[dict], specialty: str) -> dict:
    relevant = select_relevant_records(records, specialty)
    if not relevant:
        return {"summary": f"No records match {specialty} for this patient yet.", "sources": []}

    numbered = "\n".join(
        f"[{i + 1}] {r['date']} · {r['type']} · {r['hospital']} · {r['title']}: {r['text']}"
        for i, r in enumerate(relevant)
    )
    system = (
        "You are a clinical summarization assistant for doctors. You are given a numbered list of a "
        "patient's medical records. Write a short (3-5 sentence) clinical brief for the given specialty, "
        "synthesizing only what is in the records below — never invent findings, medications, or "
        "values. Refer to specific records using their bracketed number exactly as given, e.g. [1], [2]. "
        "Never introduce a citation number that isn't in the list. Be concise and clinical in tone."
    )
    user_msg = (
        f"Patient: {patient.get('name')}, {patient.get('age')} yrs, {patient.get('sex')}, "
        f"known conditions: {patient.get('cond') or 'none on file'}.\n"
        f"Specialty focus: {specialty}\n\nRecords:\n{numbered}\n\nWrite the clinical brief now."
    )
    resp = _get_client().chat.completions.create(
        model=settings.groq_model,
        max_tokens=500,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    )
    sources = [
        {"id": str(i + 1), "title": r["title"], "hospital": r["hospital"], "date": r["date"]}
        for i, r in enumerate(relevant)
    ]
    return {"summary": resp.choices[0].message.content, "sources": sources}


def chat_reply(patient: dict, records: List[dict], memories: List[str], message: str) -> str:
    records_text = "\n".join(
        f"- {r['date']} · {r['type']} · {r['hospital']}: {r['title']} — {r['text']}"
        for r in records
    ) or "No records on file yet."
    memory_text = "\n".join(f"- {m}" for m in memories) or "No earlier context."
    system = (
        "You are CareSync's AI health assistant, speaking directly to a patient about their own "
        "records. Only use the medical record data and prior conversation context given below — "
        "never invent facts, never diagnose, and never recommend a treatment. For anything outside "
        "what's on file, tell the patient to check with their doctor. Keep replies short, warm, and "
        "in plain language."
    )
    user_msg = (
        f"Patient: {patient.get('name')}, {patient.get('age')} yrs, {patient.get('sex')}.\n\n"
        f"Their medical records:\n{records_text}\n\n"
        f"Relevant memory from earlier conversations:\n{memory_text}\n\n"
        f"Patient's message: {message}"
    )
    resp = _get_client().chat.completions.create(
        model=settings.groq_model,
        max_tokens=400,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    )
    return resp.choices[0].message.content
