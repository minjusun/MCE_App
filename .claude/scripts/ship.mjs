#!/usr/bin/env node
// Deterministic quality gate and the only route Claude uses to publish work. See "Git workflow" in CLAUDE.md.
//   node .claude/scripts/ship.mjs check [--e2e]
//       Lint, type check, unit + integration tests, build, and security checks (secret scan,
//       dependency audit). Prints PASS / FAIL / SKIP per check; exits 1 if anything failed.
//       --e2e also runs end-to-end / browser tests (CI passes it).
//   node .claude/scripts/ship.mjs push [--title "PR title"] [--body-file path]
//       Re-runs the checks, pushes the current feature branch (never main, never forced)
//       and opens or updates its pull request.
// Extra repo-specific checks: .claude/checks.json = [{ "name", "cmd", "kind"?, "requires"?, "e2e"? }]
// Turn automatic pushes off for a clone with:  git config claude.autopush false
// Canonical copy: ~/.claude/repo-kit (install/update with: node ~/.claude/repo-kit/install.mjs)
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const has = cmd => spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { stdio: 'ignore' }).status === 0;
const sh = (command, env = {}) => spawnSync(command, { shell: true, stdio: 'inherit', env: { ...process.env, CI: 'true', ...env } }).status === 0;
const fail = msg => { console.error(`ship: ${msg}`); process.exit(1); };
const arg = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
const flag = name => process.argv.includes(name);
const readJson = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

process.chdir(git('rev-parse', '--show-toplevel'));
const base = (tryGit('symbolic-ref', '--short', 'refs/remotes/origin/HEAD') || 'origin/main').replace(/^origin\//, '');

// Each check: { name, kind, cmd } to run, or { name, kind, skip: reason }.
function detectChecks({ e2e }) {
  const checks = [];
  const add = (kind, name, cmd) => checks.push({ kind, name, cmd });
  const skip = (kind, name, reason) => checks.push({ kind, name, skip: reason });

  const pkg = readJson('package.json');
  if (pkg) {
    const s = pkg.scripts || {};
    const pm = existsSync('pnpm-lock.yaml') ? 'pnpm' : existsSync('yarn.lock') ? 'yarn' : existsSync('bun.lockb') || existsSync('bun.lock') ? 'bun' : 'npm';
    const run = k => `${pm} run ${k}`;
    if (!existsSync('node_modules')) skip('setup', 'dependencies', `node_modules missing; run "${pm} install" first`);
    s.lint ? add('lint', 'lint', run('lint')) : skip('lint', 'lint', 'no "lint" script');
    const tc = ['typecheck', 'type-check', 'check-types', 'tsc'].find(k => s[k]);
    if (tc) add('types', 'type check', run(tc));
    else if (existsSync('tsconfig.json') && existsSync('node_modules/typescript')) add('types', 'type check', 'npx tsc --noEmit');
    else skip('types', 'type check', existsSync('tsconfig.json') ? 'typescript not installed' : 'not a TypeScript project');
    const unit = s['test:unit'] ? 'test:unit' : s.test && !/no test specified/.test(s.test) ? 'test' : null;
    unit ? add('unit', 'unit tests', run(unit)) : skip('unit', 'unit tests', 'no "test" or "test:unit" script');
    if (s['test:integration']) add('integration', 'integration tests', run('test:integration'));
    const e2eScript = ['test:e2e', 'e2e'].find(k => s[k]);
    if (e2eScript) e2e ? add('e2e', 'end-to-end tests', run(e2eScript)) : skip('e2e', 'end-to-end tests', 'pass --e2e to run (CI does)');
    s.build ? add('build', 'build', run('build')) : skip('build', 'build', 'no "build" script');
    if (pm === 'npm' && existsSync('package-lock.json')) add('security', 'dependency audit', 'npm audit --omit=dev --audit-level=high');
    else if (pm === 'pnpm') add('security', 'dependency audit', 'pnpm audit --prod --audit-level high');
    else skip('security', 'dependency audit', `no supported lockfile audit for ${pm}`);
  }
  if (existsSync('pyproject.toml') || existsSync('requirements.txt') || existsSync('setup.py')) {
    const py = existsSync('pyproject.toml') ? readFileSync('pyproject.toml', 'utf8') : '';
    if (/\[tool\.ruff/.test(py)) has('ruff') ? add('lint', 'ruff', 'ruff check .') : skip('lint', 'ruff', 'ruff not installed');
    if (/\[tool\.mypy/.test(py) || existsSync('mypy.ini')) has('mypy') ? add('types', 'mypy', 'mypy .') : skip('types', 'mypy', 'mypy not installed');
    if (/pytest/.test(py) || existsSync('pytest.ini') || existsSync('tests')) spawnSync('python', ['-m', 'pytest', '--version'], { stdio: 'ignore' }).status === 0 ? add('unit', 'pytest', 'python -m pytest -q') : skip('unit', 'pytest', 'pytest not installed');
  }
  if (existsSync('go.mod')) has('go') ? (add('lint', 'go vet', 'go vet ./...'), add('unit', 'go test', 'go test ./...'), add('build', 'go build', 'go build ./...')) : skip('build', 'go', 'go not installed');
  if (existsSync('Cargo.toml')) has('cargo') ? (add('unit', 'cargo test', 'cargo test'), add('build', 'cargo build', 'cargo build')) : skip('build', 'cargo', 'cargo not installed');

  // Repo-specific extras
  for (const c of readJson('.claude/checks.json') || []) {
    if (c.e2e && !e2e) skip(c.kind || 'e2e', c.name, 'pass --e2e to run (CI does)');
    else if (c.requires && !existsSync(c.requires)) skip(c.kind || 'custom', c.name, `${c.requires} not found${c.hint ? `; ${c.hint}` : ''}`);
    else add(c.kind || 'custom', c.name, c.cmd);
  }

  // Secret scan of everything that differs from the base branch, committed or not
  if (existsSync('.githooks/secret-scan.mjs')) {
    const ref = tryGit('rev-parse', '--verify', '--quiet', `origin/${base}`) ? `origin/${base}` : 'HEAD';
    add('security', 'secret scan', `node .githooks/secret-scan.mjs --worktree ${ref}`);
  } else skip('security', 'secret scan', '.githooks/secret-scan.mjs not installed');
  return checks;
}

function runChecks() {
  const checks = detectChecks({ e2e: flag('--e2e') });
  const results = [];
  for (const c of checks) {
    if (c.skip) { results.push({ ...c, status: 'SKIP' }); continue; }
    console.log(`\nship: ${c.name}: ${c.cmd}`);
    const t = Date.now(), ok = sh(c.cmd);
    results.push({ ...c, status: ok ? 'PASS' : 'FAIL', secs: ((Date.now() - t) / 1000).toFixed(1) });
  }
  console.log('\nship: check summary');
  for (const r of results) console.log(`  ${r.status.padEnd(4)}  ${r.name.padEnd(20)} ${r.status === 'SKIP' ? r.skip : `${r.secs}s  ${r.cmd}`}`);
  const failed = results.filter(r => r.status === 'FAIL'), ran = results.filter(r => r.status === 'PASS');
  if (failed.length) fail(`${failed.length} check(s) failed: ${failed.map(r => r.name).join(', ')}. Changes stay local.`);
  console.log(ran.length ? `ship: ${ran.length} passed, ${results.length - ran.length} skipped. Report skipped checks as skipped, not passed.` : 'ship: nothing could run; report that no checks were performed.');
}

function push() {
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === 'HEAD') fail('detached HEAD. Switch to a feature branch first.');
  if (branch === base || ['main', 'master', 'production', 'release'].includes(branch)) fail(`refusing to push ${branch}. Create a feature branch: git switch -c <type>/<short-name>`);
  if (tryGit('config', '--get', 'claude.autopush') === 'false') {
    console.log('ship: automatic pushes are off for this clone (git config claude.autopush false). Commits stay local.');
    return;
  }
  if (!tryGit('remote', 'get-url', 'origin')) fail('no "origin" remote configured.');

  tryGit('fetch', '--quiet', 'origin', base);
  const ahead = Number(tryGit('rev-list', '--count', `origin/${base}..HEAD`) || 0);
  if (!ahead) fail(`no commits on ${branch} that are not already on ${base}. Nothing to push.`);
  const dirty = (tryGit('status', '--porcelain') || '').split('\n').filter(Boolean).length;
  if (dirty) console.log(`ship: note: ${dirty} uncommitted change(s) stay local and are not pushed.`);

  runChecks();
  if (existsSync('.githooks/secret-scan.mjs') && spawnSync('node', ['.githooks/secret-scan.mjs', '--range', `origin/${base}..HEAD`], { stdio: 'inherit' }).status !== 0)
    fail('secret scan of the commits to push failed. Nothing was pushed.');

  if (tryGit('rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`)) {
    tryGit('fetch', '--quiet', 'origin', branch);
    if (spawnSync('git', ['merge-base', '--is-ancestor', `origin/${branch}`, 'HEAD']).status !== 0)
      fail(`origin/${branch} has commits that are not in your local branch. Merge them in first; ship never force-pushes.`);
  }

  console.log(`\nship: pushing ${branch} (${ahead} commit${ahead === 1 ? '' : 's'} ahead of ${base})`);
  if (spawnSync('git', ['push', '-u', 'origin', branch], { stdio: 'inherit' }).status !== 0) fail('push failed. Commits are still local.');

  const ghReady = spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' }).status === 0;
  if (!ghReady) {
    const url = git('remote', 'get-url', 'origin').replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
    console.log(`\nship: GitHub CLI not available or not signed in, so no PR was created automatically.\nOpen or review the PR here: ${url}/compare/${base}...${encodeURIComponent(branch)}?expand=1`);
    return;
  }
  const view = spawnSync('gh', ['pr', 'view', branch, '--json', 'url,state', '--jq', 'select(.state=="OPEN") | .url'], { encoding: 'utf8' });
  const existing = (view.stdout || '').trim();
  const title = arg('--title'), body = arg('--body-file');
  if (existing) {
    const edit = ['pr', 'edit', branch];
    if (title) edit.push('--title', title);
    if (body) edit.push('--body-file', body);
    if (edit.length > 3) spawnSync('gh', edit, { stdio: 'inherit' });
    console.log(`\nship: updated pull request ${existing}`);
  } else {
    const create = ['pr', 'create', '--base', base, '--head', branch];
    if (title) create.push('--title', title); else create.push('--fill');
    if (body) create.push('--body-file', body); else if (title) create.push('--body', '');
    if (spawnSync('gh', create, { stdio: 'inherit' }).status !== 0) fail('pushed, but creating the pull request failed.');
  }
}

const mode = process.argv[2];
if (mode === 'check') runChecks();
else if (mode === 'push') push();
else fail('usage: node .claude/scripts/ship.mjs check [--e2e] | push [--title "..."] [--body-file path]');
