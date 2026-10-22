// Runs the Supabase migrations and pgTAP tests in PGlite (Postgres compiled to WebAssembly), so the
// database can be tested without Docker. The same test files run on a real Supabase database with
// `npx supabase test db` (CI does that on every PR).
//   npm run test:db [-- path/to/one.test.sql ...]
import { PGlite } from '@electric-sql/pglite';
import { pgtap } from '@electric-sql/pglite-pgtap';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const sqlFiles = dir => readdirSync(join(root, dir)).filter(f => f.endsWith('.sql')).sort().map(f => join(root, dir, f));
const migrations = sqlFiles('supabase/migrations');
const tests = process.argv.slice(2).length ? process.argv.slice(2).map(p => resolve(p)) : sqlFiles('supabase/tests/database');
if (!tests.length) { console.error('no test files found'); process.exit(1); }

const db = new PGlite({ extensions: { pgtap, pg_trgm } });
await db.exec(readFileSync(join(root, 'scripts/db-test/supabase-shim.sql'), 'utf8'));
for (const m of migrations) {
  try { await db.exec(readFileSync(m, 'utf8')); }
  catch (e) { console.error(`migration failed: ${relative(root, m)}\n  ${e.message}`); process.exit(1); }
}
await db.exec('create extension if not exists pgtap');
console.log(`applied ${migrations.length} migration(s) on ${(await db.query('select version()')).rows[0].version.split(' on ')[0]} (PGlite)\n`);

let failedFiles = 0, totalOk = 0, totalNotOk = 0;
for (const file of tests) {
  const name = relative(root, file);
  let lines = [];
  try {
    const results = await db.exec(readFileSync(file, 'utf8'));
    for (const r of results) for (const row of r.rows) for (const v of Object.values(row)) if (typeof v === 'string') lines.push(...v.split('\n'));
  } catch (e) {
    await db.exec('rollback').catch(() => {});
    lines.push(`not ok - aborted: ${e.message}`);
  }
  const tap = lines.filter(l => /^(not )?ok \d|^not ok|^1\.\.\d+|^# /.test(l));
  const planLine = tap.find(l => /^1\.\.\d+/.test(l));
  const plan = planLine ? Number(planLine.split('..')[1]) : 0;
  const ok = tap.filter(l => /^ok /.test(l)).length, notOk = tap.filter(l => /^not ok/.test(l));
  // a file without a plan, with an empty plan, or that ran a different number of tests is a failure
  const problems = [];
  if (!planLine || plan === 0) problems.push('no test plan (missing plan()/finish(), or an empty file)');
  if (ok + notOk.length !== plan) problems.push(`planned ${plan} tests but ran ${ok + notOk.length}`);
  if (tap.some(l => /Looks like you planned/.test(l))) problems.push('pgTAP reported a plan mismatch');
  const failed = notOk.length > 0 || problems.length > 0;
  totalOk += ok; totalNotOk += notOk.length;
  if (failed) failedFiles++;
  console.log(`${failed ? 'FAIL' : 'PASS'}  ${name}  (${ok}/${plan})`);
  for (const p of [...new Set(problems)]) console.log(`      ${p}`);
  for (const l of notOk) console.log(`      ${l}`);
  for (const l of tap.filter(l => l.startsWith('#'))) console.log(`      ${l}`);
}
console.log(`\n${totalOk} passed, ${totalNotOk} failed across ${tests.length} file(s)${failedFiles ? `; ${failedFiles} file(s) FAILED` : ''}`);
process.exit(failedFiles ? 1 : 0);
