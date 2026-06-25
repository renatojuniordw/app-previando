/**
 * Entry point for BullMQ workers.
 *
 * Starts all workers: CNIS processing, audit log, and deadline notifications.
 * Run with: ts-node src/jobs/worker.ts
 */

import { loadEnvFile } from 'node:process'
import Redis from 'ioredis'
import { Logger } from '../lib/logger'
import { createCnisWorker } from './cnis-worker'
import { createAuditWorker } from './audit-worker'
import { createDeadlineWorker, scheduleDeadlineJob } from './deadline-worker'

const logger = new Logger('Worker')

try {
  loadEnvFile('.env')
  logger.info('Environment variables loaded from .env')
} catch (e) {
  logger.error('Failed to load .env file natively', e)
}

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:60004', {
  maxRetriesPerRequest: null,
})

// ─── Start all workers ─────────────────────────────────────────────────────

createCnisWorker(redis)
createAuditWorker(redis)
createDeadlineWorker(redis)

// ─── Schedule daily jobs ───────────────────────────────────────────────────

scheduleDeadlineJob(redis).catch((err) => logger.error('Failed to schedule deadline job', err))

logger.info('BullMQ workers started — CNIS processing + audit log + deadline notifications')
