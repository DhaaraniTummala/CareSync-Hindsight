"""Creates one demo doctor and one demo patient (Firebase Auth + Firestore
profiles), plus a couple of sample records and an appointment, so you have
working logins to test the app with once Firebase is configured.

Run from backend/:  python scripts/seed_demo.py

Demo logins created:
  Doctor:  dr.priya@example.com  / demo1234
  Patient: rohan.singh@email.com / demo1234
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from firebase_admin import auth as fb_auth  # noqa: E402

from app.firebase_admin_init import get_db, init_firebase  # noqa: E402


def get_or_create_user(email: str, password: str, display_name: str):
    try:
        return fb_auth.create_user(email=email, password=password, display_name=display_name)
    except fb_auth.EmailAlreadyExistsError:
        return fb_auth.get_user_by_email(email)


def main() -> None:
    init_firebase()
    db = get_db()

    doctor = get_or_create_user("dr.priya@example.com", "demo1234", "Dr. Priya Sharma")
    db.collection("users").document(doctor.uid).set(
        {"role": "doctor", "email": "dr.priya@example.com", "name": "Dr. Priya Sharma", "specialty": "Cardiology"}
    )

    patient = get_or_create_user("rohan.singh@email.com", "demo1234", "Rohan Singh")
    pid = patient.uid
    db.collection("patients").document(pid).set(
        {
            "name": "Rohan Singh",
            "age": 28,
            "sex": "Male",
            "cond": "Diabetes, Hypertension",
            "phone": "+91 98765 43210",
            "city": "Bangalore, KA",
            "blood": "B+",
            "email": "rohan.singh@email.com",
        }
    )
    db.collection("users").document(pid).set(
        {"role": "patient", "email": "rohan.singh@email.com", "name": "Rohan Singh", "patient_id": pid}
    )

    sample_records = [
        {
            "date": "2026-09-15",
            "type": "Hospital Visit",
            "hospital": "Apollo Hospital, Bangalore",
            "title": "Chest Pain Evaluation",
            "text": "Presented with chest discomfort. ECG normal. Discharged with advice.",
            "specialty_tag": "cardio",
        },
        {
            "date": "2026-08-22",
            "type": "Lab Report",
            "hospital": "Manipal Hospital, Bangalore",
            "title": "HbA1c Test",
            "text": "HbA1c: 7.1% (High)",
            "specialty_tag": "endo",
        },
    ]
    for r in sample_records:
        db.collection("patients").document(pid).collection("records").document().set(
            {**r, "uploaded_by": "Seed script", "created_at": datetime.now(timezone.utc).isoformat()}
        )

    db.collection("patients").document(pid).collection("appointments").document().set(
        {
            "date": "2026-10-05",
            "title": "Cardiology Follow-up",
            "hospital": "Apollo Hospital, Bangalore",
            "doctor_name": "Dr. Priya Sharma",
        }
    )

    print("Seeded successfully.")
    print("  Doctor login:  dr.priya@example.com  / demo1234")
    print("  Patient login: rohan.singh@email.com / demo1234")


if __name__ == "__main__":
    main()
