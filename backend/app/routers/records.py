from typing import List

from fastapi import APIRouter, Depends

from ..schemas import RecordIn, RecordOut
from ..security import CurrentUser, assert_can_view_patient, get_current_user
from ..services import firestore_service as fs

router = APIRouter(prefix="/patients/{patient_id}/records", tags=["records"])


@router.get("", response_model=List[RecordOut])
async def list_records(patient_id: str, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, patient_id)
    return fs.list_records(patient_id)


@router.post("", response_model=RecordOut)
async def add_record(patient_id: str, payload: RecordIn, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, patient_id)
    who = f"Uploaded by Dr. {user.profile.get('name', '')}" if user.role == "doctor" else "Uploaded by patient"
    return fs.add_record(patient_id, payload.model_dump(), uploaded_by=who)
