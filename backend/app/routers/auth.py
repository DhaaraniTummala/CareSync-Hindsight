from fastapi import APIRouter, Depends

from ..schemas import BootstrapProfile
from ..security import CurrentUser, get_current_user, get_verified_token
from ..services import firestore_service as fs

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/bootstrap-profile")
async def bootstrap_profile(payload: BootstrapProfile, decoded: dict = Depends(get_verified_token)):
    """Called once, right after Firebase signup, to create the matching
    CareSync profile (and, for a patient, their own patient record)."""
    uid = decoded["uid"]
    email = decoded.get("email", "")

    if payload.role == "patient":
        # A patient's Firestore patient doc normally uses their own uid as
        # its id, so patients/{uid} IS their profile — that keeps "can this
        # user see this patient" a single equality test everywhere else.
        #
        # Exception: a doctor may have already added this person by email
        # (e.g. at check-in, before they had a login). If so, link this new
        # account to THAT existing patient id instead of creating a second,
        # disconnected profile — otherwise the doctor ends up with two
        # copies of the same patient, each seeing none of the other's records.
        existing = fs.find_patient_by_email(email) if email else None
        if existing:
            patient_id = existing["id"]
        else:
            patient_id = uid
            fs.create_patient(
                {
                    "name": payload.name,
                    "age": payload.age or 0,
                    "sex": payload.sex or "",
                    "cond": payload.cond or "",
                    "phone": payload.phone or "",
                    "city": payload.city or "",
                    "blood": payload.blood or "O+",
                    "email": email,
                },
                patient_id=patient_id,
            )
        fs.create_user_profile(uid, email, {"role": "patient", "name": payload.name, "patient_id": patient_id})
    else:
        fs.create_user_profile(
            uid, email, {"role": "doctor", "name": payload.name, "specialty": payload.specialty or ""}
        )
    return {"ok": True}


@router.get("/me")
async def me(user: CurrentUser = Depends(get_current_user)):
    return {"uid": user.uid, "email": user.email, "role": user.role, "profile": user.profile}
