package repo

import (
	"context"
	"project/backend/prisma/db"
	"time"
)

type JobExecutionRepository struct {
	client *db.PrismaClient
}

func NewJobExecutionRepository(client *db.PrismaClient) *JobExecutionRepository {
	return &JobExecutionRepository{client: client}
}

func (r *JobExecutionRepository) GetLastRun(ctx context.Context, jobName string) (*db.JobExecutionModel, error) {
	return r.client.JobExecution.FindUnique(
		db.JobExecution.JobName.Equals(jobName),
	).Exec(ctx)
}

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
