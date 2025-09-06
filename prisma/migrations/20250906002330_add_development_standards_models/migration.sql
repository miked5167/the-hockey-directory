/*
  Warnings:

  - You are about to drop the `reviews_ratings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `location` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `playerName` on the `leads` table. All the data in the column will be lost.
  - Added the required column `city` to the `advisors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `advisors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `advisors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `advisors` table without a default value. This is not possible if the table is not empty.
  - Made the column `message` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "reviews_ratings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reviews_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "advisors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "advisorId" TEXT,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priceMonth" INTEGER NOT NULL,
    "priceYear" INTEGER NOT NULL,
    "featuresJson" TEXT NOT NULL,
    "maxLeads" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "renewsAt" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entitlements_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "advisors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "entitlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "userId" TEXT,
    "advisorId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "events_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "advisors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "moderatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "moderation_queue_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_advisors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headshot" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "bio" TEXT,
    "website" TEXT,
    "socials" TEXT,
    "specialties" TEXT,
    "levels" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" DATETIME,
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMs" INTEGER,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "yearsExperience" INTEGER,
    "certifications" TEXT,
    "location" TEXT NOT NULL,
    "linkedIn" TEXT,
    "imageUrl" TEXT,
    "rating" REAL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_advisors" ("bio", "certifications", "createdAt", "email", "id", "imageUrl", "linkedIn", "location", "name", "phone", "rating", "reviewCount", "specialties", "updatedAt", "verified", "website", "yearsExperience") SELECT "bio", "certifications", "createdAt", "email", "id", "imageUrl", "linkedIn", "location", "name", "phone", "rating", "reviewCount", "specialties", "updatedAt", "verified", "website", "yearsExperience" FROM "advisors";
DROP TABLE "advisors";
ALTER TABLE "new_advisors" RENAME TO "advisors";
CREATE UNIQUE INDEX "advisors_slug_key" ON "advisors"("slug");
CREATE UNIQUE INDEX "advisors_email_key" ON "advisors"("email");
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "parentName" TEXT NOT NULL,
    "playerAge" INTEGER,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'website',
    "leadValue" REAL,
    "conversionDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "advisors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_leads" ("advisorId", "conversionDate", "createdAt", "id", "leadValue", "message", "notes", "parentEmail", "parentName", "parentPhone", "playerAge", "source", "status", "updatedAt") SELECT "advisorId", "conversionDate", "createdAt", "id", "leadValue", "message", "notes", "parentEmail", "parentName", "parentPhone", "playerAge", "source", "status", "updatedAt" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
