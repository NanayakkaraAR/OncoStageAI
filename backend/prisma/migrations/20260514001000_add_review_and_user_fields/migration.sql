-- Add missing profile/notification fields on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "doctorFeedback" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "predictionAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "smsNotifications" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "systemUpdates" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weeklyReports" BOOLEAN NOT NULL DEFAULT true;

-- Add review/workflow fields on predictions
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Pending Review';
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "doctorComments" TEXT;
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "doctorRecommendation" TEXT;
ALTER TABLE "predictions" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
