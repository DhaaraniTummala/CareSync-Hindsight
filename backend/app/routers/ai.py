from fastapi import APIRouter, Depends, HTTPException

from ..schemas import BriefRequest, BriefResponse, ChatRequest, ChatResponse
from ..security import CurrentUser, assert_can_view_patient, get_current_user, require_role
from ..services import ai_service
from ..services import firestore_service as fs
from ..services import hindsight_service as mem

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/brief", response_model=BriefResponse)
async def brief(payload: BriefRequest, user: CurrentUser = Depends(require_role("doctor"))):
    patient = fs.get_patient(payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    records = fs.list_records(payload.patient_id)
    result = ai_service.generate_brief(patient, records, payload.specialty)
    return {"patient_id": payload.patient_id, "specialty": payload.specialty, **result}


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, user: CurrentUser = Depends(get_current_user)):
    assert_can_view_patient(user, payload.patient_id)
    patient = fs.get_patient(payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    records = fs.list_records(payload.patient_id)
    memories = mem.recall(payload.patient_id, payload.message)
    reply = ai_service.chat_reply(patient, records, memories, payload.message)
    mem.remember(payload.patient_id, f"Patient asked: {payload.message}\nAssistant replied: {reply}")
    return {"reply": reply}
