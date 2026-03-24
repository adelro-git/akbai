/**
 * akbai-delivery Pre-Bash Guard
 * Skills: fullstack-engineer, security-compliance, data-architect, devops-engineer, qa-engineer
 *
 * Runs before Bash tool execution. Validates git commits, pushes, and builds
 * against AKBai non-negotiable rules.
 *
 * Exit 0 = allow, Exit 2 = block (stderr shown to Claude as feedback)
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const command = input?.tool_input?.command || '';
const warnings = [];
let blocked = false;
let blockReason = '';

// ─── Git Commit Guard ────────────────────────────────────────────────
// Skills: fullstack-engineer, security-compliance, data-architect
if (/git\s+commit/.test(command)) {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    if (staged) {
      const files = staged.split('\n').filter(Boolean);

      // [fullstack-engineer] Check TypeScript strict — no `any` types
      const tsFiles = files.filter(f => /\.(ts|tsx)$/.test(f) && existsSync(f));
      for (const f of tsFiles) {
        const content = readFileSync(f, 'utf8');
        // Match `: any` but not inside comments or strings (simple heuristic)
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('//') || line.startsWith('*')) continue;
          if (/:\s*any[\s;,)>\]}]/.test(line)) {
            warnings.push(`[fullstack-engineer] TypeScript \`any\` type in ${f}:${i + 1} — strict mode requires typed code`);
            break; // One warning per file
          }
        }
      }

      // [security-compliance] Block API keys in client-side files
      const clientFiles = tsFiles.filter(f =>
        /(components\/|app\/\(app\)\/)/.test(f.replace(/\\/g, '/'))
      );
      for (const f of clientFiles) {
        const content = readFileSync(f, 'utf8');
        if (/ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(content)) {
          blocked = true;
          blockReason = `[security-compliance] Server-side API key referenced in client file ${f} — keys must NEVER be in client code`;
          break;
        }
      }

      // [data-architect] Validate migration files
      const migrations = files.filter(f =>
        /migrations\/.*\.sql$/i.test(f.replace(/\\/g, '/')) && existsSync(f)
      );
      for (const f of migrations) {
        const content = readFileSync(f, 'utf8');
        if (/CREATE\s+TABLE/i.test(content)) {
          if (!/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(content)) {
            warnings.push(`[data-architect] Migration ${f} creates table without RLS — ENABLE ROW LEVEL SECURITY required`);
          }
          if (!/deleted_at/i.test(content)) {
            warnings.push(`[data-architect] Migration ${f} creates table without deleted_at — soft-delete required`);
          }
          if (!/user_id/i.test(content)) {
            warnings.push(`[data-architect] Migration ${f} missing user_id column — needed for RLS (auth.uid() = user_id)`);
          }
        }
        if (/DROP\s+TABLE|DELETE\s+FROM|TRUNCATE/i.test(content)) {
          warnings.push(`[data-architect] Destructive SQL in ${f} — AKBai uses soft-delete only, no hard deletes`);
        }
      }

      // [security-compliance] Check .env files not committed
      const envFiles = files.filter(f => /\.env(?!\.example)/.test(f));
      if (envFiles.length) {
        blocked = true;
        blockReason = `[security-compliance] Environment file staged for commit: ${envFiles.join(', ')} — never commit .env files`;
      }
    }
  } catch {
    // Outside git repo or git not available — silently pass
  }
}

// ─── Git Push Guard ──────────────────────────────────────────────────
// Skill: devops-engineer
if (/git\s+push/.test(command)) {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (branch === 'main' || branch === 'master') {
      warnings.push(
        `[devops-engineer] Pushing from \`${branch}\` — branch workflow requires claude/* branch + PR to main`
      );
    }
  } catch {
    // Ignore
  }
}

// ─── Build Guard ─────────────────────────────────────────────────────
// Skill: qa-engineer
if (/next\s+build|npm\s+run\s+build/.test(command)) {
  try {
    // Check if tests have been run in this session (look for recent test output)
    const testResult = execSync('npm run test -- --reporter=dot 2>&1 || true', {
      encoding: 'utf8',
      timeout: 30000,
      cwd: process.env.CLAUDE_PROJECT_DIR
        ? `${process.env.CLAUDE_PROJECT_DIR}/frontend`
        : undefined,
    });
    const passMatch = testResult.match(/(\d+)\s+pass/i);
    const failMatch = testResult.match(/(\d+)\s+fail/i);
    if (failMatch && parseInt(failMatch[1]) > 0) {
      warnings.push(
        `[qa-engineer] ${failMatch[1]} failing test(s) detected — fix before building`
      );
    } else if (passMatch) {
      // Tests passed, no warning needed
    }
  } catch {
    warnings.push('[qa-engineer] Could not run tests before build — consider running `npm run test` first');
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
    `\nakbai-delivery pre-command review:\n${warnings.map(w => `  ⚠ ${w}`).join('\n')}\n`
  );
}

process.exit(0);
