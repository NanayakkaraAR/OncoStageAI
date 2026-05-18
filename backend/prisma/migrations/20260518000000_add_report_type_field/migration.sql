-- Add reportType column to reports table
ALTER TABLE "reports" ADD COLUMN "reportType" TEXT NOT NULL DEFAULT 'Clinical';
