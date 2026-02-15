-- Add firebase_uid column to users table
ALTER TABLE "users" ADD COLUMN "firebase_uid" VARCHAR(255);

-- Make firebase_uid unique
ALTER TABLE "users" ADD CONSTRAINT "users_firebase_uid_key" UNIQUE ("firebase_uid");

-- Add index for faster lookups
CREATE INDEX "users_firebase_uid_idx" ON "users"("firebase_uid");
