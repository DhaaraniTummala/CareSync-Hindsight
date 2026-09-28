from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .firebase_admin_init import get_db, verify_id_token

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, uid: str, email: str, role: str, profile: dict):
        self.uid = uid
        self.email = email
        self.role = role
        self.profile = profile


def _verify(creds: HTTPAuthorizationCredentials) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        return verify_id_token(creds.credentials)
    except RuntimeError as e:
        # Firebase isn't configured yet — surface that clearly instead of "invalid token".
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")


async def get_verified_token(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """Confirms the Firebase ID token is valid, without requiring a CareSync
    profile to already exist. Used only by /auth/bootstrap-profile, since a
    brand-new signup has a Firebase Auth account but no Firestore profile yet."""
    return _verify(creds)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> CurrentUser:
    decoded = _verify(creds)
    uid = decoded["uid"]
    email = decoded.get("email", "")
    doc = get_db().collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(
            status_code=403,
            detail="No CareSync profile found for this account. Complete signup first.",
        )
    profile = doc.to_dict()
    return CurrentUser(uid=uid, email=email, role=profile.get("role", ""), profile=profile)


def require_role(*roles: str):
    async def _checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"This action requires role: {', '.join(roles)}")
        return user

    return _checker


def assert_can_view_patient(user: CurrentUser, patient_id: str) -> None:
    if user.role == "doctor":
        return
    if user.role == "patient" and user.profile.get("patient_id") == patient_id:
        return
    raise HTTPException(status_code=403, detail="Not allowed to view this patient")
