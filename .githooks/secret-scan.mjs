#!/usr/bin/env node
// Blocks commits and pushes that contain secret files or credential-looking strings.
//   node .githooks/secret-scan.mjs                   scan staged changes (pre-commit)
//   node .githooks/secret-scan.mjs --range A..B      scan files changed in a commit range (ship push)
//   node .githooks/secret-scan.mjs --worktree REF    scan everything that differs from REF, committed
//                                                    or not, plus new untracked files (ship check, CI)
// To allow a known false positive, put "secret-scan: allow" on the same line.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const opt = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const range = opt('--range'), worktree = opt('--worktree');
process.chdir(git('rev-parse', '--show-toplevel').trim());

const lines = s => s.split('\n').filter(Boolean);
let files, read;
if (range) {
  files = lines(git('diff', '--name-only', '--diff-filter=ACMR', range));
  read = f => git('show', `${range.split('..')[1] || 'HEAD'}:${f}`);
} else if (worktree) {
  files = [...new Set([...lines(git('diff', '--name-only', '--diff-filter=ACMR', worktree)), ...lines(git('ls-files', '--others', '--exclude-standard'))])];
  read = f => readFileSync(f, 'utf8');
} else {
  files = lines(git('diff', '--cached', '--name-only', '--diff-filter=ACMR'));
  read = f => git('show', `:${f}`);
}

const BAD_NAMES = [
  [/(^|\/)\.env(\.(?!example$|sample$|template$)[^/]+)?$/i, 'environment file'],
  [/\.(pem|key|p12|pfx|jks|keystore)$/i, 'private key or certificate'],
  [/(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i, 'SSH private key'],
  [/(^|\/)(credentials|service-account)[\w.-]*\.json$/i, 'credentials file'],
];
const BAD_CONTENT = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}/, 'GitHub token'],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic API key'],
  [/\bsk-(proj-)?[A-Za-z0-9_-]{32,}/, 'OpenAI-style API key'],
  [/\b(sk|rk)_live_[0-9A-Za-z]{20,}/, 'Stripe live key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'Google API key'],
  [/-----BEGIN ((RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED) )?PRIVATE KEY-----/, 'private key block'],
  [/SERVICE_ROLE_KEY\s*[:=]\s*['"]?[A-Za-z0-9._-]{20,}/, 'Supabase service role key'],
  [/\b(api[_-]?key|secret|client[_-]?secret|access[_-]?token|password)\b\s*[:=]\s*['"][^'"\s]{16,}['"]/i, 'hard-coded credential'],
];

const findings = [];
for (const f of files) {
  const nameHit = BAD_NAMES.find(([re]) => re.test(f));
  if (nameHit) { findings.push(`${f}: ${nameHit[1]} must not be committed`); continue; }
  if (worktree && !existsSync(f)) continue;
  let text;
  try { text = read(f); } catch { continue; }
  if (text.length > 2_000_000 || text.includes('\0')) continue;
  text.split('\n').forEach((line, i) => {
    if (line.includes('secret-scan: allow')) return;
    for (const [re, what] of BAD_CONTENT) if (re.test(line)) { findings.push(`${f}:${i + 1}: possible ${what}`); break; }
  });
}

if (findings.length) {
  console.error('Secret scan blocked this change:\n  ' + findings.join('\n  '));
  console.error('Remove the secret (use an environment variable instead). If it is a false positive, add "secret-scan: allow" to that line.');
  process.exit(1);
}
if (worktree || range) console.log(`secret scan: ${files.length} file(s) checked, nothing found.`);
