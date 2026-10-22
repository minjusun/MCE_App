#!/usr/bin/env node
// PreToolUse hook (Bash + PowerShell): enforces the Git workflow in CLAUDE.md.
// Prints a JSON permission decision, or nothing to let the normal permission flow continue.
import { execFileSync } from 'node:child_process';

const raw = await new Promise(resolve => {
  let d = '';
  process.stdin.on('data', c => (d += c));
  process.stdin.on('end', () => resolve(d));
});
let input = {};
try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }

const cmd = String(input.tool_input?.command ?? '').replace(/\s+/g, ' ');
if (!/\bgit\b|\bgh\b|ship\.mjs/.test(cmd)) process.exit(0);

const decide = (permissionDecision, permissionDecisionReason) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason } }));
  process.exit(0);
};
const deny = reason => decide('deny', reason);
const ask = reason => decide('ask', reason);

// "git" plus any global options (-C dir, -c key=val, --no-pager ...) before the subcommand
const GIT = String.raw`\bgit(?:\s+(?:-[cC]\s+\S+|--[\w-]+(?:=\S+)?))*\s+`;
const has = re => new RegExp(re, 'i').test(cmd);

function currentBranch() {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: input.cwd || process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
}

// 1. Only the main session touches Git state, pushes or PRs.
if (input.agent_id && (
  has(GIT + String.raw`(add|commit|push|pull|merge|rebase|reset|checkout|switch|branch|tag|stash|cherry-pick|revert|restore|rm|mv|clean|am|apply|update-ref)\b`) ||
  has(String.raw`\bgh\s+(pr|release|repo)\b`) || has(String.raw`ship\.mjs`))) {
  deny('Subagents must not run Git write operations, pushes or PR commands. Leave changes in the working tree and report the files you changed to the main session.');
}

// 2. Never skip Git hooks (they run the secret scan and push guard).
if (has(GIT + String.raw`(commit|push|merge|rebase|am)\b.*--no-verify`) || has(GIT + String.raw`commit\b.*\s-[a-zA-Z]*n[a-zA-Z]*(\s|$)`)) {
  deny('Skipping Git hooks (--no-verify / -n) is not allowed in this repo.');
}

// 3. Pushes only go through the ship script, which runs checks, refuses main and never force-pushes.
if (has(GIT + String.raw`push\b`)) {
  if (has(String.raw`\s(--force|--force-with-lease|--force-if-includes|-f)\b`) || has(String.raw`\s\+[\w/.-]+`)) deny('Force pushes are not allowed without explicit approval from the user. Ask them to run it themselves.');
  if (has(String.raw`\s(--delete|-d)\b`) || has(String.raw`\s:[\w/.-]+`)) deny('Deleting remote branches is not allowed without explicit approval from the user. Ask them to run it themselves.');
  deny('Do not run git push directly. Use: node .claude/scripts/ship.mjs push (runs checks, refuses main, never force-pushes, opens or updates the PR).');
}

// 4. Merging into main and deploying are the user's job.
if (has(String.raw`\bgh\s+pr\s+merge\b`) || has(String.raw`\bgh\s+api\b.*/merges?\b`)) deny('Merging pull requests is done by the user on GitHub after review.');
if (has(String.raw`\bgh\s+(repo\s+delete|release\s+(create|delete))\b`)) deny('Repository deletion and releases need explicit approval from the user.');

// 5. No commits or merges directly on main/master.
const branchSwitch = has(GIT + String.raw`(switch\s+(-c|--create)|checkout\s+-b)\s`);
if (!branchSwitch && has(GIT + String.raw`(commit|merge|cherry-pick|revert|am)\b`)) {
  const b = currentBranch();
  if (b === 'main' || b === 'master') deny(`You are on ${b}. Create a feature branch first: git switch -c <type>/<short-name>`);
}

// 6. Stage only task files, by path. Never stage secrets.
if (has(GIT + String.raw`add\s+(.*\s)?(-A|--all|-u|--update|\.|\*|:/)(\s|$)`) || has(GIT + String.raw`commit\b.*\s(--all|-[a-zA-Z]*a[a-zA-Z]*)(\s|$)`)) {
  deny('Stage only the files that belong to this task, by path (git add path/to/file ...). Unrelated changes must stay unstaged.');
}
if (has(GIT + String.raw`add\b.*(\.env(?!\.example\b|\.sample\b|\.template\b)|\.pem\b|\.key\b|\.p12\b|\.pfx\b|id_(rsa|dsa|ecdsa|ed25519)\b|credentials[\w.-]*\.json|service-account[\w.-]*\.json)`)) {
  deny('That file looks like it holds secrets. Never commit .env files, keys or credentials.');
}
if (has(GIT + String.raw`add\b.*\s(-f|--force)\b`)) ask('Force-adding a git-ignored file. Confirm it contains no secrets.');

// 7. Destructive local operations need the user's approval.
const destructive = [
  [String.raw`reset\b.*--hard`, 'git reset --hard discards uncommitted work'],
  [String.raw`clean\b.*\s-[a-zA-Z]*f`, 'git clean -f deletes untracked files'],
  [String.raw`checkout\s+(.*\s)?--\s`, 'git checkout -- discards changes to files'],
  [String.raw`checkout\s+\.(\s|$)`, 'git checkout . discards all changes'],
  [String.raw`restore\b(?!.*--staged)`, 'git restore discards working-tree changes'],
  [String.raw`branch\s+(.*\s)?-D\b`, 'git branch -D force-deletes a branch'],
  [String.raw`stash\s+(drop|clear)\b`, 'dropping stashes loses work'],
  [String.raw`rebase\b`, 'rebasing rewrites history'],
  [String.raw`(filter-branch|filter-repo|update-ref\s+-d|reflog\s+expire|gc\s+--prune)`, 'this rewrites or deletes history'],
];
for (const [re, why] of destructive) if (has(GIT + re)) ask(`Needs your approval: ${why}.`);

process.exit(0);
