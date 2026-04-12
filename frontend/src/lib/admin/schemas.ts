/**
 * Admin Zod Schemas — Validation for admin API inputs
 * Feature: Admin Dashboard (Gap D10)
 * Role: Type-safe validation for admin PATCH operations
 */

import { z } from 'zod';

// ============================================================
// Flag Resolution — PATCH /api/admin/flags
// ============================================================

export const ResolveFlagSchema = z.object({
  id: z.string().uuid(),
});

export type ResolveFlag = z.infer<typeof ResolveFlagSchema>;

// ============================================================
// Feature Flag Toggle — PATCH /api/admin/feature-flags
// ============================================================

export const ToggleFeatureFlagSchema = z.object({
  userId: z.string().uuid(),
  flag: z.string().min(1),
  value: z.boolean(),
});

export type ToggleFeatureFlag = z.infer<typeof ToggleFeatureFlagSchema>;
