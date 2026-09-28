"""All Firestore reads/writes live here. Nothing outside this module (and
firebase_admin_init) touches the `firebase_admin.firestore` client directly.

Data model:
  users/{uid}                        -> {role, email, name, patient_id?, specialty?}
  patients/{patientId}               -> {name, age, sex, cond, phone, city, blood, email}
  patients/{patientId}/records/{id}      -> {date, type, hospital, title, text, specialty_tag, file_url?, uploaded_by, created_at}
  patients/{patientId}/appointments/{id} -> {date, title, hospital, doctor_name}

A patient's own uid IS their patient_id (see routers/auth.py bootstrap-profile),
which keeps "can this user see this patient" checks trivial.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..firebase_admin_init import get_db


def patients_ref():
    return get_db().collection("patients")


def records_ref(patient_id: str):
    return patients_ref().document(patient_id).collection("records")


def appointments_ref(patient_id: str):
    return patients_ref().document(patient_id).collection("appointments")


def create_user_profile(uid: str, email: str, data: dict) -> None:
    get_db().collection("users").document(uid).set({"email": email, **data})


def create_patient(data: dict, patient_id: Optional[str] = None) -> str:
    ref = patients_ref().document(patient_id) if patient_id else patients_ref().document()
    ref.set(data)
    return ref.id


def list_patients() -> List[Dict[str, Any]]:
    return [{"id": d.id, **d.to_dict()} for d in patients_ref().stream()]


def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    d = patients_ref().document(patient_id).get()
    return {"id": d.id, **d.to_dict()} if d.exists else None


def find_patient_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Looks up an existing patient profile by email, so a doctor pre-adding
    a patient and that patient later signing up themselves (in either order)
    land on the SAME unique patient id instead of creating two disconnected
    records with the same person's name."""
    if not email:
        return None
    docs = list(patients_ref().where("email", "==", email).limit(1).stream())
    if not docs:
        return None
    d = docs[0]
    return {"id": d.id, **d.to_dict()}


def add_record(patient_id: str, data: dict, uploaded_by: str) -> Dict[str, Any]:
    payload = {**data, "uploaded_by": uploaded_by, "created_at": datetime.now(timezone.utc).isoformat()}
    ref = records_ref(patient_id).document()
    ref.set(payload)
    return {"id": ref.id, **payload}


def list_records(patient_id: str) -> List[Dict[str, Any]]:
    docs = records_ref(patient_id).order_by("date", direction="DESCENDING").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def add_appointment(patient_id: str, data: dict) -> Dict[str, Any]:
    ref = appointments_ref(patient_id).document()
    ref.set(data)
    return {"id": ref.id, **data}


def list_appointments(patient_id: str) -> List[Dict[str, Any]]:
    docs = appointments_ref(patient_id).order_by("date").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def delete_patient(patient_id: str) -> None:
    for d in records_ref(patient_id).stream():
        d.reference.delete()
    for d in appointments_ref(patient_id).stream():
        d.reference.delete()
    patients_ref().document(patient_id).delete()
    # A self-registered patient's own uid IS their patient_id, so this also
    # cleans up their CareSync profile doc if they had a login of their own.
    get_db().collection("users").document(patient_id).delete()

