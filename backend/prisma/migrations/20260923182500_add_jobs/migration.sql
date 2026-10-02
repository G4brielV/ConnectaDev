-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "salary" TEXT,
    "link" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jobs_external_id_key" ON "jobs"("external_id");

-- CreateIndex
CREATE INDEX "jobs_category_location_idx" ON "jobs"("category", "location");
