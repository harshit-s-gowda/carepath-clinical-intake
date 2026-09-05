import { Router, type IRouter } from "express";
import {
  EvaluateRedFlagsBody,
  EvaluateRedFlagsResponse,
  FinalizeCaseBody,
  FinalizeCaseResponse,
  GetAdminStatsResponse,
  GetCaseParams,
  GetCaseResponse,
  GetDocumentExtractionParams,
  GetDocumentExtractionResponse,
  GetOpdQueueResponse,
  GetPatientParams,
  GetPatientResponse,
  ProcessDocumentParams,
  ProcessDocumentResponse,
  SubmitCaseBody,
  SubmitCaseParams,
  SubmitCaseResponse,
  SummarizeCaseBody,
  SummarizeCaseResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type DemoCase = {
  id: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    abhaId: string | null;
    token: string | null;
  };
  status: "Draft" | "Submitted" | "In Progress" | "Finalized";
  chiefComplaint: string;
  duration?: string;
  summary: {
    text: string;
    sourceLabel: string;
    disclaimer: string;
  };
  timeline: Array<{
    id: string;
    date: string;
    datePrecision: "exact" | "month" | "year" | "approximate";
    title: string;
    description: string;
    eventType: string;
    source: string;
    confidence: number;
  }>;
  redFlags: Array<{
    alertId: string;
    ruleId: string;
    severity: "Normal" | "Review" | "High";
    reason: string;
    triggeredSymptoms: string[];
    status: "Open" | "Acknowledged" | "Resolved";
  }>;
  verified: boolean;
  doctorNotes?: string;
};

const demoCase: DemoCase = {
  id: "case-rahul-104",
  patient: {
    id: "patient-rahul-104",
    name: "Rahul Kumar",
    age: 42,
    gender: "Male",
    abhaId: null,
    token: "104",
  },
  status: "Submitted",
  chiefComplaint: "Fever",
  duration: "3 days",
  summary: {
    text: "42-year-old male reporting fever for 3 days with cough and chills. History of diabetes reported. Currently reports metformin use.",
    sourceLabel: "Organized from patient answers and document text",
    disclaimer: "This is an AI-organized summary, not a diagnosis. Clinician verification is required.",
  },
  timeline: [
    {
      id: "event-2018",
      date: "2018",
      datePrecision: "year",
      title: "Diabetes reported",
      description: "Patient reported a history of diabetes.",
      eventType: "condition",
      source: "Patient answer",
      confidence: 0.91,
    },
    {
      id: "event-2024",
      date: "2024",
      datePrecision: "year",
      title: "Blood investigation",
      description: "Previous document contains a blood investigation.",
      eventType: "investigation",
      source: "Previous prescription.pdf",
      confidence: 0.94,
    },
    {
      id: "event-current",
      date: "2026-09-04",
      datePrecision: "exact",
      title: "Fever with cough and chills",
      description: "Current consultation concern.",
      eventType: "consultation",
      source: "Patient answer",
      confidence: 0.99,
    },
  ],
  redFlags: [
    {
      alertId: "alert-104",
      ruleId: "respiratory-symptoms",
      severity: "Review",
      reason: "Reported symptoms require clinical review.",
      triggeredSymptoms: ["Fever", "Cough", "Chills"],
      status: "Open",
    },
  ],
  verified: false,
};

const queue = [
  {
    id: "queue-104",
    token: "104",
    patientId: demoCase.patient.id,
    patientName: demoCase.patient.name,
    detail: "42 · Male · Fever",
    status: "Priority" as const,
    priority: "High" as const,
  },
  {
    id: "queue-103",
    token: "103",
    patientId: "patient-meena-103",
    patientName: "Meena Rao",
    detail: "36 · Female · Follow-up",
    status: "Waiting" as const,
    priority: "Review" as const,
  },
  {
    id: "queue-102",
    token: "102",
    patientId: "patient-arjun-102",
    patientName: "Arjun Shah",
    detail: "28 · Male · Cough",
    status: "Waiting" as const,
    priority: "Normal" as const,
  },
  {
    id: "queue-101",
    token: "101",
    patientId: "patient-sana-101",
    patientName: "Sana Iyer",
    detail: "61 · Female · Diabetes review",
    status: "Completed" as const,
    priority: "Normal" as const,
  },
];

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

router.get("/opd/queue", (_req, res): void => {
  res.json(GetOpdQueueResponse.parse(queue));
});

router.get("/patients/:id", (req, res): void => {
  const parsed = GetPatientParams.safeParse({ id: param(req.params.id) });
  if (!parsed.success || parsed.data.id !== demoCase.patient.id) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(GetPatientResponse.parse(demoCase.patient));
});

router.get("/cases/:id", (req, res): void => {
  const parsed = GetCaseParams.safeParse({ id: param(req.params.id) });
  if (!parsed.success || parsed.data.id !== demoCase.id) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  res.json(GetCaseResponse.parse(demoCase));
});

router.post("/cases/:id/submit", (req, res): void => {
  const params = SubmitCaseParams.safeParse({ id: param(req.params.id) });
  const body = SubmitCaseBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "A patient name, concern, and duration are required." });
    return;
  }
  if (params.data.id !== demoCase.id) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  demoCase.patient.name = body.data.patientName;
  demoCase.chiefComplaint = body.data.chiefComplaint;
  demoCase.duration = body.data.duration;
  demoCase.status = "Submitted";
  res.json(SubmitCaseResponse.parse(demoCase));
});

router.post("/cases/:id/finalize", (req, res): void => {
  const params = FinalizeCaseBody.safeParse(req.body);
  const id = param(req.params.id);
  if (!params.success || id !== demoCase.id) {
    res.status(400).json({ error: "A valid case and verification status are required." });
    return;
  }
  if (!params.data.verified) {
    res.status(409).json({ error: "Case must be verified before it can be finalized." });
    return;
  }
  demoCase.verified = true;
  demoCase.status = "Finalized";
  demoCase.doctorNotes = params.data.doctorNotes;
  res.json(FinalizeCaseResponse.parse(demoCase));
});

router.post("/documents/:id/process", (req, res): void => {
  const parsed = ProcessDocumentParams.safeParse({ id: param(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Document id is required." });
    return;
  }
  res.json(ProcessDocumentResponse.parse({
    id: parsed.data.id,
    status: "Completed",
    message: "Document processed by the development OCR adapter. Review extracted fields before use.",
  }));
});

router.get("/documents/:id/extraction", (req, res): void => {
  const parsed = GetDocumentExtractionParams.safeParse({ id: param(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Document id is required." });
    return;
  }
  res.json(GetDocumentExtractionResponse.parse({
    documentId: parsed.data.id,
    sourceName: "Previous prescription.pdf",
    confidence: 0.94,
    fields: [
      { name: "Hemoglobin", value: "9.2", unit: "g/dL", verificationStatus: "Unverified" },
      { name: "Blood Pressure", value: "150/95", unit: null, verificationStatus: "Unverified" },
      { name: "Medication", value: "Metformin 500 mg", unit: null, verificationStatus: "Unverified" },
    ],
  }));
});

router.post("/ai/summarize", (req, res): void => {
  const parsed = SummarizeCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Patient, complaint, and duration are required." });
    return;
  }
  const { age, gender, chiefComplaint, duration, associatedSymptoms, pastHistory, medications } = parsed.data;
  const symptoms = associatedSymptoms?.join(" and ") || "no associated symptoms selected";
  const history = pastHistory?.join(", ") || "no past history reported";
  const medicines = medications?.join(", ") || "no regular medicines reported";
  res.json(SummarizeCaseResponse.parse({
    text: `${age}-year-old ${gender.toLowerCase()} reporting ${chiefComplaint.toLowerCase()} for ${duration} with ${symptoms}. Past history: ${history}. Medicines: ${medicines}.`,
    sourceLabel: "Structured from supplied patient and document information",
    disclaimer: "AI organizes reported information only. It does not diagnose or prescribe. Clinician review is required.",
  }));
});

router.post("/red-flags/evaluate", (req, res): void => {
  const parsed = EvaluateRedFlagsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Symptoms must be provided as a list." });
    return;
  }
  const symptoms = parsed.data.symptoms.map((symptom) => symptom.toLowerCase());
  const hasBreathlessness = symptoms.some((symptom) => symptom.includes("breath"));
  const hasChestPain = symptoms.some((symptom) => symptom.includes("chest"));
  const high = hasBreathlessness && hasChestPain;
  const review = hasBreathlessness || symptoms.length >= 3;
  const severity = high ? "High" : review ? "Review" : "Normal";
  const alerts = review ? [{
    alertId: `alert-${Date.now()}`,
    ruleId: high ? "chest-pain-breathlessness" : "symptom-review",
    severity,
    reason: high
      ? "Chest pain and breathing difficulty require immediate clinical evaluation."
      : "Reported symptoms require clinical review.",
    triggeredSymptoms: parsed.data.symptoms,
    status: "Open" as const,
  }] : [];
  res.json(EvaluateRedFlagsResponse.parse({ priority: severity, alerts }));
});

router.get("/admin/stats", (_req, res): void => {
  res.json(GetAdminStatsResponse.parse({
    patientsRegisteredToday: 12,
    casesCompleted: 8,
    waitingPatients: 4,
    highPriorityPatients: 1,
    documentsProcessed: 9,
  }));
});

export default router;