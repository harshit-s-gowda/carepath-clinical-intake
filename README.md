# CarePath Clinical Intake

CarePath is a mobile-first clinical pre-consultation experience. It turns waiting time into a guided patient story that a clinician can review, verify, and finalize.

## Current runnable scope

- Patient intake with explicit consent and resumable local draft
- English-first UI with a structure ready for Hindi and Kannada localization
- Adaptive complaint follow-up questions
- Voice capture review state, without silently saving uncertain transcription
- Document picker flow with OCR processing and extraction states
- AI-organized summary language with a clear non-diagnostic disclaimer
- Deterministic red-flag evaluation language
- Clinician queue, case detail, timeline, extraction audit trail, verification, and finalization
- Administrator overview with privacy-preserving operational counts
- Express API contract and synthetic development adapters
- Drizzle/PostgreSQL schema for patients, consents, cases, questions, documents, extraction, timeline, alerts, queue, audit, and sync

## Run locally in Replit

```bash
pnpm --filter @workspace/clinical-case-taking run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm run typecheck
```

The managed Expo workflow provides the mobile preview. The API workflow serves under `/api`.

## API contract

`lib/api-spec/openapi.yaml` is the source of truth. After changes:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Useful demo endpoints:

- `GET /api/opd/queue`
- `GET /api/cases/case-rahul-104`
- `POST /api/ai/summarize`
- `POST /api/red-flags/evaluate`
- `POST /api/documents/:id/process`
- `GET /api/admin/stats`

## Safety and privacy

This repository uses synthetic demo content only. The AI and OCR layers organize supplied information; they do not diagnose, prescribe, or replace a treating professional. Red flags are potential alerts that require clinical evaluation. Production ABDM, FHIR, OCR, object storage, authentication, and encryption require a separately configured deployment and credentials.

Never commit secrets. Use Replit's environment and integration tooling for credentials.