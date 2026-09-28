from fastapi import APIRouter, Depends, HTTPException

from ..firebase_admin_init import create_user
from ..schemas import DoctorIn
from ..security import CurrentUser, require_role
from ..services import firestore_service as fs

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.post("")
async def create_doctor(payload: DoctorIn, user: CurrentUser = Depends(require_role("doctor"))):
    """Any signed-in doctor can add another doctor account (no separate admin
    role yet) — creates the Firebase Auth user and their CareSync profile in
    one step, so the new doctor can sign in immediately with the given
    password (no signup step needed)."""
    try:
        new_user = create_user(payload.email, payload.password, payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Couldn't create that doctor account: {e}")
    fs.create_user_profile(
        new_user.uid, payload.email, {"role": "doctor", "name": payload.name, "specialty": payload.specialty or ""}
    )
    return {"ok": True, "uid": new_user.uid, "name": payload.name, "email": payload.email}
