from fastapi import APIRouter, Depends, Query

from ..schemas import UploadSignature
from ..security import CurrentUser, assert_can_view_patient, get_current_user
from ..services.cloudinary_service import make_upload_signature

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/signature", response_model=UploadSignature)
async def signature(patient_id: str = Query(...), user: CurrentUser = Depends(get_current_user)):
    """Frontend calls this first, then uploads the file straight to Cloudinary
    with the returned fields (POST to
    https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload) so the file
    bytes never pass through this API and the API secret never reaches the
    browser."""
    assert_can_view_patient(user, patient_id)
    return make_upload_signature(subfolder=patient_id)
