#!/usr/bin/env node
// Keeps ONBOARDING.md / ARCHITECTURE.md honest. Two parts:
//
// 1. Accuracy (always): relative links and repo paths in the developer docs exist, `npm run <x>`
//    scripts exist in package.json, and every environment variable named in the docs is in
//    .env.example (and every variable in .env.example is documented in ONBOARDING.md).
//
// 2. PR coverage (with --pr): if the branch changes setup-sensitive files (dependencies, env
//    template, migrations, CI, Claude Code config, ...) then ONBOARDING.md or ARCHITECTURE.md must
//    change too, OR the PR description must tick "No documentation changes needed".
//
//   node scripts/docs-check.mjs                                   accuracy only
//   node scripts/docs-check.mjs --pr --base origin/main            + coverage, advisory (exit 0)
//   node scripts/docs-check.mjs --pr --base <sha> --body-file f    + coverage, enforced (CI)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
process.chdir(git('rev-parse', '--show-toplevel'));

const DOCS = ['ONBOARDING.md', 'ARCHITECTURE.md', 'CLAUDE.md', 'README.md'].filter(existsSync);
const problems = [];
const tracked = new Set(git('ls-files').split('\n'));
const topLevel = new Set([...tracked].map(f => f.split('/')[0]));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const envTemplate = existsSync('.env.example')
  ? [...readFileSync('.env.example', 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(m => m[1]) : [];

const pathExists = p => {
  const clean = p.replace(/\/$/, '');
  return existsSync(clean) || [...tracked].some(f => f === clean || f.startsWith(clean + '/'));
};

// GitHub-style heading anchors: lowercase, punctuation dropped, spaces to hyphens
const anchorCache = new Map();
function anchorsOf(file) {
  if (!anchorCache.has(file)) {
    const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    anchorCache.set(file, new Set([...text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map(h =>
      h[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s/g, '-'))));
  }
  return anchorCache.get(file);
}

// ---- 1. accuracy ----
for (const doc of DOCS) {
  const text = readFileSync(doc, 'utf8');
  const prose = text.replace(/```[\s\S]*?```/g, m => m.replace(/[^\n]/g, ' ')); // keep line numbers
  const lineOf = i => text.slice(0, i).split('\n').length;

  for (const m of prose.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z]+:/i.test(m[1])) continue;
    const [target, anchor] = m[1].split('#');
    const resolved = target ? normalize(join(dirname(doc), decodeURI(target))).replace(/\\/g, '/') : doc;
    if (!pathExists(resolved)) { problems.push(`${doc}:${lineOf(m.index)}: link target not found: ${m[1]}`); continue; }
    if (anchor && resolved.endsWith('.md') && !anchorsOf(resolved).has(anchor))
      problems.push(`${doc}:${lineOf(m.index)}: no heading for anchor #${anchor} in ${resolved}`);
  }
  // `path/like/this` — only checked when it starts with a real top-level entry, so package
  // imports such as `expo-router/stack` are not mistaken for repo paths
  for (const m of text.matchAll(/`([^`\s]+)`/g)) {
    const p = m[1].replace(/^\.\//, '').replace(/[),.:;]+$/, '');
    if (/[*<>$|{}]|^~|^-|^https?:/.test(p) || !(p.includes('/') || /\.[a-z]{2,5}$/i.test(p))) continue;
    if (!topLevel.has(p.split('/')[0])) continue;
    if (!pathExists(p)) problems.push(`${doc}:${lineOf(m.index)}: path not found: ${p}`);
  }
  for (const m of text.matchAll(/npm run (?:-s )?([a-z][\w:-]*)/g)) {
    if (!pkg.scripts?.[m[1]]) problems.push(`${doc}:${lineOf(m.index)}: npm script not in package.json: ${m[1]}`);
  }
  for (const m of text.matchAll(/\b((?:EXPO_PUBLIC|SUPABASE)_[A-Z0-9_]+)\b/g)) {
    if (!envTemplate.includes(m[1]) && !/SERVICE_ROLE/.test(m[1])) problems.push(`${doc}:${lineOf(m.index)}: env var not in .env.example: ${m[1]}`);
  }
}
if (existsSync('ONBOARDING.md')) {
  const onboarding = readFileSync('ONBOARDING.md', 'utf8');
  for (const v of envTemplate) if (!onboarding.includes(v)) problems.push(`ONBOARDING.md: .env.example variable not documented: ${v}`);
}

// ---- 2. PR coverage ----
const SETUP_SENSITIVE = [
  [/^package\.json$|^package-lock\.json$|^\.nvmrc$/, 'dependencies or runtime'],
  [/^\.env\.example$/, 'environment variables'],
  [/^(app\.json|app\.config\.[jt]s|tsconfig\.json|eslint\.config\.js|babel\.config\.js|metro\.config\.js|eas\.json)$/, 'app/build configuration'],
  [/^supabase\/(migrations\/|config\.toml)/, 'database schema or Supabase config'],
  [/^\.github\/workflows\//, 'CI'],
  [/^(\.claude\/(settings\.json|skills\/|hooks\/|scripts\/|checks\.json)|CLAUDE\.md$|skills-lock\.json$)/, 'Claude Code configuration'],
  [/^(\.githooks\/|scripts\/)/, 'developer tooling'],
];
let coverageFailed = false;
if (process.argv.includes('--pr')) {
  const base = arg('--base') || 'origin/main';
  let changed = [];
  try {
    changed = git('diff', '--name-only', `${base}...HEAD`).split('\n');
    // locally, also count work that isn't committed yet
    if (!arg('--body-file')) changed.push(...git('diff', '--name-only', 'HEAD').split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n'));
    changed = [...new Set(changed.filter(Boolean))];
  }
  catch { console.error(`docs-check: cannot diff against ${base}; fetch it first (git fetch origin main).`); process.exit(1); }
  const sensitive = changed.flatMap(f => { const hit = SETUP_SENSITIVE.find(([re]) => re.test(f)); return hit ? [[f, hit[1]]] : []; });
  const docsChanged = changed.filter(f => f === 'ONBOARDING.md' || f === 'ARCHITECTURE.md');
  const bodyFile = arg('--body-file');
  const body = bodyFile && existsSync(bodyFile) ? readFileSync(bodyFile, 'utf8') : '';
  const acknowledged = /-\s*\[[xX]\]\s*No documentation changes needed/.test(body);

  if (!sensitive.length) console.log('docs-check: no setup-sensitive files changed; no documentation update required.');
  else {
    console.log(`docs-check: setup-sensitive changes:\n${sensitive.map(([f, why]) => `  - ${f} (${why})`).join('\n')}`);
    if (docsChanged.length) console.log(`docs-check: documentation updated in this PR: ${docsChanged.join(', ')}. Reviewers: check it describes the changes above.`);
    else if (acknowledged) console.log('docs-check: PR description states no documentation changes are needed.');
    else {
      const msg = 'Update ONBOARDING.md (setup, commands, env vars) and/or ARCHITECTURE.md (design, schema, integrations) for these changes, ' +
        'or tick "No documentation changes needed" in the PR description and say why.';
      if (bodyFile) { coverageFailed = true; console.log(`::error title=Documentation review needed::${msg}`); }
      else console.log(`docs-check: ACTION NEEDED (advisory locally, enforced on the PR): ${msg}`);
    }
  }
}

if (problems.length) {
  console.log(`docs-check: ${problems.length} accuracy problem(s):`);
  for (const p of problems) console.log(`::error::${p}`.replace(/^::error::/, process.env.GITHUB_ACTIONS ? '::error::' : '  - '));
}
if (!problems.length) console.log(`docs-check: links, paths, npm scripts and env vars in ${DOCS.join(', ')} are consistent with the repo.`);
process.exit(problems.length || coverageFailed ? 1 : 0);
