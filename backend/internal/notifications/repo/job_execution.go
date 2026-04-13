/*
File: job_execution.go

Contains:
Repository helpers for tracking scheduled job executions.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package repo

import (
	"context"
	"project/backend/prisma/db"
	"time"
)

// JobExecutionRepository stores last-run metadata for scheduled jobs.
type JobExecutionRepository struct {
	client *db.PrismaClient
}

// NewJobExecutionRepository creates a job execution repository.
func NewJobExecutionRepository(client *db.PrismaClient) *JobExecutionRepository {
	return &JobExecutionRepository{client: client}
}

// GetLastRun returns the latest execution row for a job name.
func (r *JobExecutionRepository) GetLastRun(ctx context.Context, jobName string) (*db.JobExecutionModel, error) {
	return r.client.JobExecution.FindUnique(
		db.JobExecution.JobName.Equals(jobName),
	).Exec(ctx)
}

// UpsertLastRun stores or updates the last execution time for a job.
func (r *JobExecutionRepository) UpsertLastRun(ctx context.Context, jobName string, lastRun time.Time) error {
	_, err := r.client.JobExecution.UpsertOne(
		db.JobExecution.JobName.Equals(jobName),
	).Create(
		db.JobExecution.JobName.Set(jobName),
		db.JobExecution.LastRun.Set(lastRun),
	).Update(
		db.JobExecution.LastRun.Set(lastRun),
	).Exec(ctx)
	return err
}
