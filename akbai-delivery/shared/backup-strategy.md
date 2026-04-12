# AKBai --- Data Backup Strategy
> For: Anton (solo founder) | Last updated: 2026-04-12

## Supabase Backup Configuration

### Point-in-Time Recovery (PITR)
- Available on Supabase Pro plan ($25/mo)
- Enables recovery to any point in the last 7 days
- MUST be enabled before storing production financial data

### Daily Backups
- Supabase includes daily backups on all paid plans
- Retention: 7 days
- Access: Dashboard -> Settings -> Backups

## Backup Verification
- Monthly: download a backup and verify it restores
- Check: all tables present, row counts reasonable, RLS policies intact

## Recovery Procedure
1. Go to Supabase Dashboard -> Settings -> Backups
2. Select the backup point (or PITR timestamp)
3. Restore to a new project first (verify before overwriting production)
4. If verified: restore to production project
5. Verify /api/health returns 200
6. Spot-check: user profiles, transactions, subscriptions

## Data Classification
- PII (name, email, phone): encrypted at rest by Supabase
- Financial (transactions, invoices): encrypted at rest, RLS-scoped
- Analytics (feature usage): anonymized where possible

## Retention Policy (Gap D11 --- pending legal review)
- Active users: retain all data indefinitely
- Churned users (>12 months inactive): pending NPC guidance
- Deleted accounts: 7-day purge window after deletion request (NPC requirement)
