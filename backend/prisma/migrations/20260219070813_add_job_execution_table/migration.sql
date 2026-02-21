-- CreateTable
CREATE TABLE "JobExecution" (
    "id" SERIAL NOT NULL,
    "job_name" TEXT NOT NULL,
    "last_run" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobExecution_job_name_key" ON "JobExecution"("job_name");
