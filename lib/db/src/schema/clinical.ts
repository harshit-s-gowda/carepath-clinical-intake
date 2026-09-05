import { createInsertSchema } from "drizzle-zod";
import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull(),
  active: boolean("active").notNull().default(true),
  ...auditColumns,
});

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  age: integer("age"),
  gender: text("gender"),
  mobile: text("mobile"),
  abhaId: text("abha_id"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  ...auditColumns,
});

export const consentsTable = pgTable("consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull(),
  purpose: text("purpose").notNull(),
  dataScope: jsonb("data_scope").notNull(),
  grantedTo: text("granted_to").notNull(),
  status: text("status").notNull(),
  version: text("version").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  ...auditColumns,
});

export const casesTable = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull(),
  status: text("status").notNull().default("Draft"),
  chiefComplaint: text("chief_complaint"),
  answers: jsonb("answers"),
  aiSummary: jsonb("ai_summary"),
  verified: boolean("verified").notNull().default(false),
  ...auditColumns,
});

export const questionsTable = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  section: text("section").notNull(),
  prompt: text("prompt").notNull(),
  type: text("type").notNull(),
  options: jsonb("options"),
  conditions: jsonb("conditions"),
  required: boolean("required").notNull().default(false),
  enabled: boolean("enabled").notNull().default(true),
  ...auditColumns,
});

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").notNull(),
  caseId: uuid("case_id"),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  processingStatus: text("processing_status").notNull().default("Queued"),
  uploadedBy: uuid("uploaded_by"),
  ...auditColumns,
});

export const documentExtractionsTable = pgTable("document_extractions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull(),
  extractedText: text("extracted_text"),
  structuredData: jsonb("structured_data"),
  confidence: text("confidence"),
  verificationStatus: text("verification_status").notNull().default("Unverified"),
  ...auditColumns,
});

export const timelineEventsTable = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  eventDate: date("event_date", { mode: "string" }),
  datePrecision: text("date_precision").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(),
  source: text("source").notNull(),
  confidence: text("confidence"),
  ...auditColumns,
});

export const redFlagRulesTable = pgTable("red_flag_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  conditions: jsonb("conditions").notNull(),
  severity: text("severity").notNull(),
  reason: text("reason").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  ...auditColumns,
});

export const redFlagsTable = pgTable("red_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  patientId: uuid("patient_id").notNull(),
  ruleId: uuid("rule_id"),
  severity: text("severity").notNull(),
  reason: text("reason").notNull(),
  triggeredSymptoms: jsonb("triggered_symptoms").notNull(),
  status: text("status").notNull().default("Open"),
  ...auditColumns,
});

export const opdQueueTable = pgTable("opd_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenNumber: text("token_number").notNull(),
  patientId: uuid("patient_id").notNull(),
  caseId: uuid("case_id"),
  department: text("department").notNull(),
  doctorId: uuid("doctor_id"),
  status: text("status").notNull().default("Waiting"),
  priority: text("priority").notNull().default("Normal"),
  queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
  ...auditColumns,
});

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  metadata: jsonb("metadata"),
  ...auditColumns,
});

export const syncRecordsTable = pgTable("sync_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  localId: text("local_id").notNull().unique(),
  resourceType: text("resource_type").notNull(),
  syncStatus: text("sync_status").notNull().default("Pending"),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  ...auditColumns,
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Patient = typeof patientsTable.$inferSelect;
export type ClinicalCase = typeof casesTable.$inferSelect;
export type Document = typeof documentsTable.$inferSelect;