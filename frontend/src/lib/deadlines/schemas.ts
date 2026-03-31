/**
 * Deadlines Zod Schemas — validation for deadline API inputs
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Zod schemas for GET query, POST generate, and PATCH status update.
 */

import { z } from 'zod';
import { BIR_TAX_TYPES, DEADLINE_STATUSES } from './types';

// ============================================================
// GET query params — filter deadlines
// ============================================================

export const DeadlinesQuerySchema = z.object({
  status: z.enum(DEADLINE_STATUSES).optional(),
});

export type DeadlinesQuery = z.infer<typeof DeadlinesQuerySchema>;

// ============================================================
// POST body — generate deadlines for a tax type
// ============================================================

export const GenerateDeadlinesSchema = z.object({
  tax_type: z.enum(BIR_TAX_TYPES),
  year: z.number().int().min(2020).max(2030).optional(),
});

export type GenerateDeadlinesPayload = z.infer<typeof GenerateDeadlinesSchema>;

// ============================================================
// PATCH body — update deadline status
// ============================================================

export const UpdateDeadlineSchema = z.object({
  id: z.string().uuid('Kailangan ng valid deadline ID.'),
  status: z.enum(DEADLINE_STATUSES),
});

export type UpdateDeadlinePayload = z.infer<typeof UpdateDeadlineSchema>;
