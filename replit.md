# CarePath Clinical Intake

CarePath turns a patient’s waiting time into a consent-led, structured case sheet that clinicians can review before consultation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `pnpm --filter @workspace/clinical-case-taking run dev` — run the Expo mobile app through the managed workflow

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/clinical-case-taking/app/index.tsx` — mobile patient, clinician, and admin flows
- `artifacts/clinical-case-taking/constants/colors.ts` — CarePath light/dark semantic tokens
- `artifacts/api-server/src/routes/clinical.ts` — synthetic clinical API adapters
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/clinical.ts` — PostgreSQL/Drizzle clinical entities

## Architecture decisions

- The first runnable slice is Expo with AsyncStorage so a patient can draft and resume a case even without a server connection.
- OCR, AI summarization, red-flag evaluation, ABDM, and FHIR are boundaries/adapters; demo responses are explicitly synthetic and non-diagnostic.
- Clinician actions require verification before finalization, and patient-facing generated content is labeled as an AI-organized draft.

## Product

The current slice includes consent, patient registration, adaptive fever follow-up questions, voice-capture review, document selection and processing states, case review, token submission, clinician queue, red-flag review, timeline, document extraction, verification/finalization, and privacy-preserving admin stats.

## User preferences

No additional preferences recorded.

## Gotchas

- External clinical systems are not connected. Do not represent the synthetic OCR/AI/ABDM/FHIR adapters as production integrations.
- API contract changes require `pnpm --filter @workspace/api-spec run codegen` before using generated types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
