#!/usr/bin/env node
// Dependency audit for ship.mjs: fails on high/critical advisories in production dependencies,
// except ones listed in .claude/audit-allowlist.json with a reason and an expiry date:
//   [{ "id": "GHSA-xxxx-xxxx-xxxx", "reason": "why it does not affect us", "expires": "YYYY-MM-DD" }]
// An expired entry fails again, so every exception gets re-reviewed.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const r = spawnSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024 });
let report;
try { report = JSON.parse(r.stdout); } catch { console.error('audit: could not read npm audit output'); console.error(r.stderr); process.exit(1); }
if (report.error) { console.error(`audit: npm audit failed: ${report.error.summary || JSON.stringify(report.error)}`); process.exit(1); }

const allow = existsSync('.claude/audit-allowlist.json') ? JSON.parse(readFileSync('.claude/audit-allowlist.json', 'utf8')) : [];
const today = new Date().toISOString().slice(0, 10);
const advisories = new Map();
for (const [pkg, v] of Object.entries(report.vulnerabilities || {})) {
  for (const via of v.via) {
    if (typeof via !== 'object' || !['high', 'critical'].includes(via.severity)) continue;
    const id = (via.url || '').split('/').pop() || via.title;
    if (!advisories.has(id)) advisories.set(id, { id, severity: via.severity, title: via.title, packages: new Set() });
    advisories.get(id).packages.add(pkg);
  }
}

let failed = 0;
for (const a of advisories.values()) {
  const entry = allow.find(e => e.id === a.id);
  const where = `${a.id} ${a.severity} ${a.title} [${[...a.packages].join(', ')}]`;
  if (entry && entry.expires >= today) { console.log(`allowed   ${where}\n          reason: ${entry.reason} (review by ${entry.expires})`); continue; }
  failed++;
  console.log(`${entry ? 'EXPIRED ' : 'BLOCKING'}  ${where}`);
}
for (const e of allow) if (!advisories.has(e.id)) console.log(`note      ${e.id} is allowlisted but no longer reported; remove it`);
console.log(`audit: ${advisories.size} high/critical advisor${advisories.size === 1 ? 'y' : 'ies'}, ${failed} blocking`);
process.exit(failed ? 1 : 0);
