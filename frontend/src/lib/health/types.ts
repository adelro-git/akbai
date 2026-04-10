/**
 * Health Check Types — Zod schemas + TypeScript types for dependency health monitoring
 * Feature: Dependency Health Checks (Gap D4)
 * Role: Define the shape of health check results for API response and monitoring tools
 *
 * Used by: /api/health endpoint, UptimeRobot/Better Uptime monitoring
 */

import { z } from 'zod';

// ============================================================
// Service Status — Individual dependency health result
// ============================================================

export const ServiceStatusEnum = z.enum(['healthy', 'degraded', 'down']);
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>;

export const ServiceNameEnum = z.enum(['supabase', 'anthropic', 'xendit']);
export type ServiceName = z.infer<typeof ServiceNameEnum>;

export const ServiceHealthSchema = z.object({
  service: ServiceNameEnum,
  status: ServiceStatusEnum,
  latency_ms: z.number().int().nonnegative(),
  message: z.string().optional(),
  checked_at: z.string().datetime(),
});
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

// ============================================================
// Overall Health Response — Aggregate status for /api/health
// ============================================================

export const OverallStatusEnum = z.enum(['healthy', 'degraded', 'down']);
export type OverallStatus = z.infer<typeof OverallStatusEnum>;

export const HealthResponseSchema = z.object({
  status: OverallStatusEnum,
  services: z.array(ServiceHealthSchema),
  checked_at: z.string().datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ============================================================
// Fallback Error Identifier — Maps dependency failures to
// specific conversational Filipino messages
// ============================================================

export const DependencyErrorTypeEnum = z.enum([
  'supabase_down',
  'anthropic_down',
  'xendit_down',
  'general_error',
]);
export type DependencyErrorType = z.infer<typeof DependencyErrorTypeEnum>;
