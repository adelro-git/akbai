/**
 * BIR Deadline Watcher — Types and Zod Schemas
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Shared types for deadline data, request/response validation
 *
 * This file defines:
 * - DeadlineSchema: Zod validator for deadline records from Supabase
 * - GetDeadlinesResponseSchema: API response envelope for /api/deadlines
 * - Derived TypeScript types from Zod schemas
 *
 * All monetary values in centavos. All dates in ISO 8601 (YYYY-MM-DD).
 * Timezone handling: all dates stored UTC; display in Asia/Manila.
 */

import { z } from 'zod';

// ============================================================
// Deadline Row Schema — matches bir_deadlines table in Supabase
// ============================================================
export const DeadlineSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  form_type: z.string().min(1).max(20),  // e.g., '1701Q', '2550M', '2551Q', '1702'
  due_date: z.string().date(),            // ISO 8601 date string (YYYY-MM-DD)
  filed: z.boolean().default(false),
  filed_at: z.string().datetime().nullable().default(null),
  notification_sent_7d: z.boolean().default(false),
  notification_sent_3d: z.boolean().default(false),
  notification_sent_1d: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable().optional(),
});

export type Deadline = z.infer<typeof DeadlineSchema>;

// ============================================================
// API Response Schemas
// ============================================================

// Success response: list of upcoming deadlines
export const GetDeadlinesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(DeadlineSchema),
});

export type GetDeadlinesResponse = z.infer<typeof GetDeadlinesResponseSchema>;

// Error response envelope (matches AKBai standard error format)
export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    message_tl: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// ============================================================
// Display-Friendly Deadline with Computed Fields
// ============================================================
export interface DeadlineDisplay {
  id: string;
  formType: string;
  dueDate: string;           // ISO 8601 date
  daysRemaining: number;     // Computed: days from today until due_date
  filed: boolean;
  filedAt: string | null;
  urgencyStatus: 'green' | 'amber' | 'red'; // green: >7, amber: 3-7, red: <=3
  isOverdue: boolean;        // Today > due_date
}
