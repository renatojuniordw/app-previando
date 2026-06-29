/**
 * Email Service - Previando
 *
 * Sends email notifications through BullMQ queue for reliability.
 * Falls back to direct sending if queue is unavailable.
 */

import nodemailer from 'nodemailer'
import { Queue } from 'bullmq'
import { bullmqConnection } from '@/lib/redis'
import { Logger } from '@/lib/logger'
const logger = new Logger('email-service')
import {
  welcomeEmail,
  cnisProcessedEmail,
  deadlineReminderEmail,
  paymentConfirmedEmail,
  paymentFailedEmail,
  limitNearEmail,
} from '@/lib/email/templates'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? 'Previando <noreply@previando.com.br>'

// Email queue for async sending
let emailQueue: Queue | null = null

function getEmailQueue(): Queue | null {
  if (emailQueue) return emailQueue
  try {
    emailQueue = new Queue('email-notifications', { connection: bullmqConnection })
    return emailQueue
  } catch {
    return null
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html })
    logger.info('Email sent', { to, subject })
    return true
  } catch (error) {
    logger.error('Failed to send email', { error, to, subject })
    return false
  }
}

/**
 * Queue an email for sending via BullMQ worker.
 * Falls back to direct sending if queue is unavailable.
 */
async function queueEmail(to: string, subject: string, html: string): Promise<void> {
  const queue = getEmailQueue()
  if (queue) {
    await queue.add('send-email', { to, subject, html }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    })
  } else {
    // Fallback: send directly
    await sendEmail(to, subject, html)
  }
}

// --- Public API ---

export async function sendWelcomeEmail(email: string, userName: string): Promise<void> {
  const { subject, html } = welcomeEmail(userName)
  await queueEmail(email, subject, html)
}

export async function sendCnisProcessedEmail(
  email: string,
  clientName: string,
  caseUrl: string,
  totalContributions: number,
  status: 'success' | 'failed'
): Promise<void> {
  const { subject, html } = cnisProcessedEmail(clientName, caseUrl, totalContributions, status)
  await queueEmail(email, subject, html)
}

export async function sendDeadlineReminderEmail(
  email: string,
  clientName: string,
  benefitTypeLabel: string,
  deadlineDate: string,
  daysLeft: number,
  caseUrl: string
): Promise<void> {
  const { subject, html } = deadlineReminderEmail(clientName, benefitTypeLabel, deadlineDate, daysLeft, caseUrl)
  await queueEmail(email, subject, html)
}

export async function sendPaymentConfirmedEmail(
  email: string,
  planName: string,
  amount: string,
  nextBillingDate: string
): Promise<void> {
  const { subject, html } = paymentConfirmedEmail(planName, amount, nextBillingDate)
  await queueEmail(email, subject, html)
}

export async function sendPaymentFailedEmail(
  email: string,
  planName: string,
  billingUrl: string
): Promise<void> {
  const { subject, html } = paymentFailedEmail(planName, billingUrl)
  await queueEmail(email, subject, html)
}

export async function sendLimitNearEmail(
  email: string,
  resourceName: string,
  usage: number,
  limit: number
): Promise<void> {
  const { subject, html } = limitNearEmail(resourceName, usage, limit)
  await queueEmail(email, subject, html)
}
