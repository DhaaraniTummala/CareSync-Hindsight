from typing import List

from fastapi import APIRouter, Depends, HTTPException

from ..firebase_admin_init import delete_user
from ..schemas import PatientIn, PatientOut
from ..security import CurrentUser, assert_can_view_patient, get_current_user, require_role
from ..services import firestore_service as fs

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=List[PatientOut])
async def list_patients(user: CurrentUser = Depends(require_role("doctor"))):
    return fs.list_patients()


@router.post("", response_model=PatientOut)
async def create_patient(payload: PatientIn, user: CurrentUser = Depends(require_role("doctor"))):
    # If this person already has their own patient profile (they signed up
    # themselves earlier), reuse that same unique id instead of creating a
    # second, disconnected patient — keeps one patient == one id no matter
    # which side (doctor or patient) creates the record first.
    existing = fs.find_patient_by_email(payload.email) if payload.email else None
    if existing:
        return existing
    pid = fs.create_patient(payload.model_dump())
    return {**payload.model_dump(), "id": pid}


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, patient_id)
    p = fs.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str, user: CurrentUser = Depends(require_role("doctor"))):
    p = fs.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    fs.delete_patient(patient_id)
    try:
        delete_user(patient_id)
    except Exception:
        pass  # best-effort: patient may never have had their own login
    return {"ok": True}
