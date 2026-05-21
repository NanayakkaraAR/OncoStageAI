-- This migration adds the remaining core tables used by the application.

-- doctor_patient_assignments
CREATE TABLE IF NOT EXISTS "doctor_patient_assignments" (
  "id" SERIAL NOT NULL,
  "doctorId" INTEGER NOT NULL,
  "patientId" INTEGER NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "weekStartDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "doctor_patient_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "doctor_patient_assignments_patientId_key" ON "doctor_patient_assignments" ("patientId");
CREATE INDEX IF NOT EXISTS "doctor_patient_assignments_doctorId_weekStartDate_idx" ON "doctor_patient_assignments" ("doctorId", "weekStartDate");

ALTER TABLE "doctor_patient_assignments"
  ADD CONSTRAINT "doctor_patient_assignments_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "doctor_patient_assignments"
  ADD CONSTRAINT "doctor_patient_assignments_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- messages
CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL NOT NULL,
  "senderId" INTEGER NOT NULL,
  "receiverId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages" ("senderId");
CREATE INDEX IF NOT EXISTS "messages_receiverId_idx" ON "messages" ("receiverId");

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- reports
CREATE TABLE IF NOT EXISTS "reports" (
  "id" SERIAL NOT NULL,
  "patientId" INTEGER NOT NULL,
  "doctorId" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileContent" BYTEA,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reports_patientId_idx" ON "reports" ("patientId");
CREATE INDEX IF NOT EXISTS "reports_doctorId_idx" ON "reports" ("doctorId");

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL NOT NULL,
  "patientId" INTEGER NOT NULL,
  "doctorId" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reviews_patientId_idx" ON "reviews" ("patientId");
CREATE INDEX IF NOT EXISTS "reviews_doctorId_idx" ON "reviews" ("doctorId");

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
