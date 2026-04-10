/**
 * Health Check API Route — GET /api/health
 * Feature: Dependency Health Checks (Gap D4)
 * Role: Aggregate health status endpoint for monitoring tools (UptimeRobot, Better Uptime)
 *
 * Flow: Run all dependency checks in parallel → derive overall status → return JSON
 * Returns: 200 if all healthy/degraded, 503 if any critical service is down
 *
 * No auth required — this is a public monitoring endpoint.
 * Does not expose sensitive information (no API keys, no internal errors).
 */

import { NextResponse } from 'next/server';
import { runAllChecks, deriveOverallStatus, HealthResponseSchema } from '@/lib/health';
import type { HealthResponse } from '@/lib/health';

export async function GET() {
  try {
    // --- Run All Checks in Parallel ---
    const services = await runAllChecks();

    // --- Derive Overall Status ---
    const overallStatus = deriveOverallStatus(services);

    // --- Build Response ---
    const response: HealthResponse = {
      status: overallStatus,
      services,
      checked_at: new Date().toISOString(),
    };

    // --- Validate Response Shape (defense-in-depth) ---
    HealthResponseSchema.parse(response);

    // --- HTTP Status: 200 for healthy/degraded, 503 for down ---
    const httpStatus = overallStatus === 'down' ? 503 : 200;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('[Health] Unexpected error in health check:', error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        status: 'down',
        services: [],
        checked_at: new Date().toISOString(),
        error: 'Health check failed unexpectedly',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
