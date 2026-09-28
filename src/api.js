import { auth } from "./firebase.js";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// ---------------------------------------------------------------------------
// Fallback / demo mode
//
// One hardcoded credential pair works even if the backend or Firebase isn't
// fully configured yet: same email for both roles, role picked by whichever
// tab is selected on the login screen. It never touches the network — every
// api.* call below is answered from a small in-memory dataset instead.
// ---------------------------------------------------------------------------
export const FALLBACK_CREDENTIALS = {
  email: "dhaaranitummala@gmail.com",
  password: "Hack@123",
};

let mock = null; // null | { role: "doctor" | "patient" }

export function enableMockAuth(role) {
  mock = { role };
}
export function disableMockAuth() {
  mock = null;
}
export function isMockAuth() {
  return !!mock;
}

const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const isoToday = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const mockDoctor = {
  id: "doc-demo",
  role: "doctor",
  name: "Dr. Dhaarani Tummala",
  email: FALLBACK_CREDENTIALS.email,
  profile: { specialty: "Cardiology" },
};

const mockPatientProfile = {
  id: "DEMO-001",
  name: "Dhaarani Tummala",
  age: 29,
  sex: "Female",
  cond: "Hypertension",
  phone: "98765 43210",
  email: FALLBACK_CREDENTIALS.email,
  city: "Hyderabad",
  blood: "O+",
};

// Keyed by patient_id. Record/appointment shape matches what the real
// backend returns (long field names — see toRecord/toAppt in App.jsx).
const mockDb = {
  patients: { "DEMO-001": { ...mockPatientProfile } },
  records: {
    "DEMO-001": [
      {
        id: uid("rec"),
        date: daysFromNow(-40),
        type: "Lab Report",
        hospital: "Apollo Hospitals",
        title: "Lipid Profile",
        text: "LDL 148 mg/dL (borderline high), HDL 42 mg/dL, triglycerides 165 mg/dL.",
        specialty_tag: "cardio",
        file_url: null,
        uploaded_by: "doctor",
      },
      {
        id: uid("rec"),
        date: daysFromNow(-40),
        type: "Prescription",
        hospital: "Apollo Hospitals",
        title: "Atorvastatin 10mg",
        text: "Once daily at night for cholesterol management. Review in 3 months.",
        specialty_tag: "cardio",
        file_url: null,
        uploaded_by: "doctor",
      },
      {
        id: uid("rec"),
        date: daysFromNow(-10),
        type: "Lab Report",
        hospital: "Care Hospitals",
        title: "Lipid Profile (Follow-up)",
        text: "LDL 121 mg/dL (improved), HDL 45 mg/dL, triglycerides 140 mg/dL.",
        specialty_tag: "cardio",
        file_url: null,
        uploaded_by: "doctor",
      },
      {
        id: uid("rec"),
        date: daysFromNow(-3),
        type: "Hospital Visit",
        hospital: "Care Hospitals",
        title: "Cardiology Follow-up",
        text: "Blood pressure 128/82. Cholesterol trending down on current statin dose. Continue medication.",
        specialty_tag: "cardio",
        file_url: null,
        uploaded_by: "doctor",
      },
    ],
  },
  appointments: {
    "DEMO-001": [
      { id: uid("appt"), date: daysFromNow(14), title: "Cardiology Follow-up", hospital: "Care Hospitals", doctor_name: "Dr. Dhaarani Tummala" },
    ],
  },
};

function delay(v, ms = 250) {
  return new Promise((res) => setTimeout(() => res(v), ms));
}

function mockRequest(path, method, body) {
  const seg = path.split("?")[0].split("/").filter(Boolean);

  if (path === "/auth/me") {
    return delay(mock.role === "doctor" ? mockDoctor : { role: "patient", name: mockDb.patients["DEMO-001"].name, email: FALLBACK_CREDENTIALS.email, profile: { patient_id: "DEMO-001" } });
  }
  if (seg[0] === "patients" && seg.length === 1 && method === "GET") {
    return delay(Object.values(mockDb.patients));
  }
  if (seg[0] === "patients" && seg.length === 1 && method === "POST") {
    const id = uid("PT");
    mockDb.patients[id] = { id, ...body };
    mockDb.records[id] = [];
    mockDb.appointments[id] = [];
    return delay(mockDb.patients[id]);
  }
  if (seg[0] === "patients" && seg.length === 2 && method === "GET") {
    return delay(mockDb.patients[seg[1]] || null);
  }
  if (seg[0] === "patients" && seg.length === 2 && method === "DELETE") {
    delete mockDb.patients[seg[1]];
    delete mockDb.records[seg[1]];
    delete mockDb.appointments[seg[1]];
    return delay({ ok: true });
  }
  if (path === "/doctors" && method === "POST") {
    return delay({ ok: true, uid: uid("doc"), name: body.name, email: body.email });
  }
  if (seg[0] === "patients" && seg[2] === "records" && method === "GET") {
    return delay(mockDb.records[seg[1]] || []);
  }
  if (seg[0] === "patients" && seg[2] === "records" && method === "POST") {
    const rec = { id: uid("rec"), uploaded_by: mock.role, ...body };
    (mockDb.records[seg[1]] ||= []).unshift(rec);
    return delay(rec);
  }
  if (seg[0] === "patients" && seg[2] === "appointments" && method === "GET") {
    return delay(mockDb.appointments[seg[1]] || []);
  }
  if (seg[0] === "patients" && seg[2] === "appointments" && method === "POST") {
    const appt = { id: uid("appt"), ...body };
    (mockDb.appointments[seg[1]] ||= []).push(appt);
    return delay(appt);
  }
  if (seg[0] === "uploads" && seg[1] === "signature") {
    // Sentinel signature — uploadToCloudinary() below recognizes it and
    // fabricates a URL instead of calling the real Cloudinary API.
    return delay({ mock: true, cloud_name: "demo", api_key: "demo", timestamp: 0, signature: "demo", folder: "demo" });
  }
  if (path === "/ai/brief") {
    return delay(mockBrief(body.patient_id, body.specialty));
  }
  if (path === "/ai/chat") {
    return delay({ reply: mockChatReply(body.patient_id, body.message) });
  }
  return delay(null);
}

function mockBrief(patientId, specialty) {
  const patient = mockDb.patients[patientId] || mockPatientProfile;
  const records = [...(mockDb.records[patientId] || [])].sort((a, b) => b.date.localeCompare(a.date));
  if (!records.length) {
    return { patient, summary: "No records are on file for this patient yet.", sources: [] };
  }
  const src = records.slice(0, 4).map((r, i) => ({ id: i + 1, title: r.title, hospital: r.hospital, date: r.date }));
  const latest = records[0];
  const labs = records.filter((r) => r.type === "Lab Report");
  let trend = "";
  if (labs.length >= 2) {
    trend = ` Comparing the two most recent lab reports shows improving lipid values [${src.findIndex((s) => s.title === labs[0].title) + 1}] versus the earlier reading [${src.findIndex((s) => s.title === labs[1].title) + 1}].`;
  }
  const summary =
    `${patient.name} (${patient.age} yrs, ${patient.sex}) has a history of ${patient.cond || "no recorded conditions"}. ` +
    `Most recent encounter: "${latest.title}" at ${latest.hospital} on ${latest.date} — ${latest.text} [1].` +
    trend +
    ` This is a demo brief generated locally under the hardcoded fallback login; connect a real Groq API key on the backend for AI-generated, fully source-grounded briefs.`;
  return { patient, summary, sources: src };
}

function mockChatReply(patientId, message) {
  const records = mockDb.records[patientId] || [];
  const appts = mockDb.appointments[patientId] || [];
  const m = message.toLowerCase();
  if (m.includes("appointment") || m.includes("upcoming") || m.includes("visit")) {
    if (!appts.length) return "You have no upcoming appointments on file.";
    return "Your next appointment: " + appts.map((a) => `${a.title} at ${a.hospital} on ${a.date}`).join("; ") + ".";
  }
  if (m.includes("compare") || m.includes("trend") || m.includes("lab")) {
    const labs = records.filter((r) => r.type === "Lab Report").sort((a, b) => a.date.localeCompare(b.date));
    if (labs.length < 2) return "There's only one lab report on file, so there isn't a trend to compare yet.";
    return `Comparing your lab reports: earliest (${labs[0].date}) — ${labs[0].text} Most recent (${labs.at(-1).date}) — ${labs.at(-1).text}`;
  }
  if (m.includes("summary") || m.includes("overall") || m.includes("health")) {
    return `You have ${records.length} record(s) on file across ${new Set(records.map((r) => r.hospital)).size} hospital(s), most recently "${records[0]?.title || "—"}". This is a local demo reply from the hardcoded fallback login — connect a real Groq API key on the backend for a fully AI-generated assistant.`;
  }
  return "I'm running in demo fallback mode right now (no live AI backend configured), so I can only answer a few canned questions — try asking about your reports, a comparison, or upcoming appointments.";
}

async function authHeader() {
  const u = auth?.currentUser;
  if (!u) return {};
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request(path, { method = "GET", body } = {}) {
  if (mock) return mockRequest(path, method, body);

  const headers = { ...(await authHeader()) };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`Couldn't reach the CareSync API at ${BASE}. Is the backend running?`);
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => request("/auth/me"),
  bootstrapProfile: (payload) => request("/auth/bootstrap-profile", { method: "POST", body: payload }),
  createDoctor: (payload) => request("/doctors", { method: "POST", body: payload }),
  listPatients: () => request("/patients"),
  createPatient: (payload) => request("/patients", { method: "POST", body: payload }),
  getPatient: (id) => request(`/patients/${id}`),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),
  listRecords: (id) => request(`/patients/${id}/records`),
  addRecord: (id, payload) => request(`/patients/${id}/records`, { method: "POST", body: payload }),
  listAppointments: (id) => request(`/patients/${id}/appointments`),
  addAppointment: (id, payload) => request(`/patients/${id}/appointments`, { method: "POST", body: payload }),
  uploadSignature: (patientId) => request(`/uploads/signature?patient_id=${encodeURIComponent(patientId)}`),
  generateBrief: (patientId, specialty) =>
    request("/ai/brief", { method: "POST", body: { patient_id: patientId, specialty } }),
  chat: (patientId, message) => request("/ai/chat", { method: "POST", body: { patient_id: patientId, message } }),
};

// Uploads straight to Cloudinary with a short-lived signature from the
// backend, so the file bytes never pass through our own API.
export async function uploadToCloudinary(file, sig) {
  if (sig.mock) {
    // Demo fallback mode: fabricate a URL instead of hitting Cloudinary.
    return delay({ secure_url: `demo://local-file/${encodeURIComponent(file.name)}` }, 300);
  }
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", sig.timestamp);
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("File upload to Cloudinary failed.");
  return res.json(); // { secure_url, ... }
}
