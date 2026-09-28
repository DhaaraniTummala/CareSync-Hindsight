from typing import List

from fastapi import APIRouter, Depends

from ..schemas import AppointmentIn, AppointmentOut
from ..security import CurrentUser, assert_can_view_patient, get_current_user
from ..services import firestore_service as fs

router = APIRouter(prefix="/patients/{patient_id}/appointments", tags=["appointments"])


@router.get("", response_model=List[AppointmentOut])
async def list_appointments(patient_id: str, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, patient_id)
    return fs.list_appointments(patient_id)


@router.post("", response_model=AppointmentOut)
async def add_appointment(patient_id: str, payload: AppointmentIn, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, patient_id)
    return fs.add_appointment(patient_id, payload.model_dump())
