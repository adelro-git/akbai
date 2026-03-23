/**
 * akbai-delivery Post-Edit Guard
 * Skills: data-architect, security-compliance, ai-engineer, ux-designer
 *
 * Runs after Edit/Write tool execution. Validates edited files against
 * AKBai conventions based on file path patterns.
 *
 * Exit 0 = pass (warnings in stderr), Exit 2 = issue requires attention
 */

import { readFileSync, existsSync } from 'fs';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path || '';
if (!filePath || !existsSync(filePath)) process.exit(0);

// Normalize to forward slashes for pattern matching
const p = filePath.replace(/\\/g, '/');

const warnings = [];
let blocked = false;
let blockReason = '';

let content;
try {
  content = readFileSync(filePath, 'utf8');
} catch {
  process.exit(0);
}

// ─── Migration Files (data-architect) ────────────────────────────────
if (/migrations\/.*\.sql$/i.test(p)) {
  if (/CREATE\s+TABLE/i.test(content)) {
    if (!/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(content)) {
      warnings.push('[data-architect] Table created without RLS — add ALTER TABLE ... ENABLE ROW LEVEL SECURITY');
    }
    if (!/deleted_at/i.test(content)) {
      warnings.push('[data-architect] Missing deleted_at column — soft-delete required on all tables');
    }
    if (!/user_id/i.test(content)) {
      warnings.push('[data-architect] Missing user_id — required for RLS scoping (auth.uid() = user_id)');
    }
    if (!/created_at/i.test(content)) {
      warnings.push('[data-architect] Missing created_at audit column');
    }
    if (!/updated_at/i.test(content)) {
      warnings.push('[data-architect] Missing updated_at audit column');
    }
  }
  if (/DROP\s+TABLE|DELETE\s+FROM|TRUNCATE/i.test(content)) {
    warnings.push('[data-architect] Destructive SQL detected — AKBai uses soft-delete only');
  }
}

// ─── API Routes (security-compliance) ────────────────────────────────
if (/app\/api\/.*route\.(ts|tsx)$/.test(p)) {
  if (!/import.*['"]zod['"]|from\s+['"]zod['"]|z\.\s*(object|string|number|enum|discriminatedUnion)/.test(content)) {
    warnings.push('[security-compliance] No Zod validation detected in API route — all API inputs must be validated');
  }
  if (/ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
    // API routes are server-side, but check they're using env vars properly
    if (/['"]sk-ant-|['"]sbp_/.test(content)) {
      blocked = true;
      blockReason = '[security-compliance] Hardcoded API key in route file — use process.env instead';
    }
  }
}

// ─── Client-Side Files (security-compliance) ─────────────────────────
if (/(components|app\/\(app\))\/.*\.(ts|tsx)$/.test(p)) {
  if (/ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
    blocked = true;
    blockReason = '[security-compliance] Server-side API key referenced in client file — keys must NEVER be in client code';
  }
  if (/process\.env\.(ANTHROPIC|SUPABASE_SERVICE_ROLE)/.test(content)) {
    blocked = true;
    blockReason = '[security-compliance] Server-side env var accessed in client component — use API routes instead';
  }
}

// ─── AI/Claude Modules (ai-engineer) ─────────────────────────────────
if (/lib\/(claude|kilala-kita)\/.*\.(ts|tsx)$/.test(p)) {
  if (/['"]use client['"]/.test(content)) {
    blocked = true;
    blockReason = '[ai-engineer] "use client" directive in AI module — Claude API calls must be server-side only';
  }
  // Check BIR disclaimer is present when tax content is involved
  if (/tax|bir|buwis/i.test(content) && !/disclaimer|gabay lamang/i.test(content)) {
    warnings.push('[ai-engineer] Tax-related content without BIR disclaimer reference — required on all tax outputs');
  }
}

// ─── System Prompt Files (ai-engineer) ───────────────────────────────
if (/prompt-library|system-prompt|assemble\.(ts|tsx)$/.test(p)) {
  if (!/disclaimer|gabay lamang/i.test(content) && /tax|bir/i.test(content)) {
    warnings.push('[ai-engineer] System prompt with tax/BIR content — ensure BIR disclaimer is included');
  }
}

// ─── Supabase Client Files (security-compliance) ─────────────────────
if (/lib\/supabase\/.*\.(ts|tsx)$/.test(p)) {
  if (/service_role|serviceRole|SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
    if (/['"]use client['"]/.test(content)) {
      blocked = true;
      blockReason = '[security-compliance] Service role key used in client-side Supabase module';
    }
  }
}

// ─── Money Handling (fullstack-engineer) ─────────────────────────────
if (/\.(ts|tsx)$/.test(p)) {
  // Check for float arithmetic with money (should use centavos as integers)
  const moneyFloatPattern = /(?:price|amount|cost|total|fee|balance)\s*[=:]\s*[\d.]*\.\d+/i;
  if (moneyFloatPattern.test(content) && !/centavo|cents/i.test(content)) {
    warnings.push('[fullstack-engineer] Possible float money value — AKBai uses integer centavos (₱34.50 = 3450)');
  }
}

// ─── Output ──────────────────────────────────────────────────────────
if (blocked) {
  process.stderr.write(`\n🚨 BLOCKED by akbai-delivery: ${blockReason}\n`);
  if (warnings.length) {
    process.stderr.write(warnings.map(w => `  ⚠ ${w}`).join('\n') + '\n');
  }
  process.exit(2);
}

if (warnings.length) {
  process.stderr.write(
    `\nakbai-delivery post-edit review:\n${warnings.map(w => `  ⚠ ${w}`).join('\n')}\n`
  );
}

process.exit(0);
