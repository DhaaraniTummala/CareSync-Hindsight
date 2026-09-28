from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class BootstrapProfile(BaseModel):
    role: str = Field(pattern="^(doctor|patient)$")
    name: str
    # patient-only
    age: Optional[int] = None
    sex: Optional[str] = None
    cond: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    blood: Optional[str] = None
    # doctor-only
    specialty: Optional[str] = None


class PatientIn(BaseModel):
    name: str
    age: int
    sex: str
    cond: Optional[str] = ""
    phone: Optional[str] = ""
    city: Optional[str] = ""
    blood: Optional[str] = "O+"
    email: Optional[EmailStr] = None


class PatientOut(PatientIn):
    id: str


class DoctorIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    specialty: Optional[str] = "General Medicine"


class RecordIn(BaseModel):
    date: str
    type: str
    hospital: str
    title: str
    text: str
    specialty_tag: Optional[str] = "gen"
    file_url: Optional[str] = None
    file_name: Optional[str] = None


class RecordOut(RecordIn):
    id: str
    uploaded_by: Optional[str] = None
    created_at: Optional[str] = None


class AppointmentIn(BaseModel):
    date: str
    title: str
    hospital: str
    doctor_name: str


class AppointmentOut(AppointmentIn):
    id: str


class BriefRequest(BaseModel):
    patient_id: str
    specialty: str


class BriefSource(BaseModel):
    id: str
    title: str
    hospital: str
    date: str


class BriefResponse(BaseModel):
    patient_id: str
    specialty: str
    summary: str
    sources: List[BriefSource]


class ChatRequest(BaseModel):
    patient_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str


class UploadSignature(BaseModel):
    timestamp: int
    signature: str
    api_key: str
    cloud_name: str
    folder: str
