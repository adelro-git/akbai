// AKBai Gap D4 — Health check module barrel export

export { checkSupabase, checkAnthropic, checkXendit, runAllChecks, deriveOverallStatus } from './checks';
export { DEPENDENCY_FALLBACK_MESSAGES, getDependencyFallback, identifyDependencyError } from './fallbacks';
export { HealthResponseSchema, ServiceHealthSchema, ServiceStatusEnum, ServiceNameEnum } from './types';
export type {
  ServiceHealth,
  ServiceStatus,
  ServiceName,
  OverallStatus,
  HealthResponse,
  DependencyErrorType,
} from './types';
