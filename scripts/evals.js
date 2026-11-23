#!/usr/bin/env node
// Run the eval bundles a change affects, and fail if any case is below the threshold.
//   node scripts/evals.js                 bundles affected since the branch left origin/main
//   node scripts/evals.js --base <ref>    ... since <ref>
//   node scripts/evals.js --all           every bundle (the monthly full run)
// Used by the pre-push hook (.githooks/pre-push) and by CI on pull requests.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const H = require('./hub');

const ROOT = path.resolve(__dirname, '..');
const THRESHOLD = process.env.EVAL_THRESHOLD || '0.66'; // a case must hold up in about 2 of its 3 runs
const MAX_COST = process.env.EVAL_MAX_COST_USD || '5';  // per bundle; the run stops and fails past it

const bundleOf = p => (p.name === 'light-core' ? 'as-everyone' : `as-${p.audience}`);

// Which bundles a list of changed files touches. Everyone has light-core, so a core or hub.json change
// affects every bundle; a team plugin or its eval folder affects that team's bundle only.
function affected(files, plugins) {
  const all = plugins.map(bundleOf);
  const out = new Set();
  for (const f of files) {
    if (f === 'hub.json' || f.startsWith('plugins/light-core/') || f.startsWith('evals/as-everyone/')) return all;
    const plugin = f.match(/^plugins\/([^/]+)\//);
    if (plugin) { const p = plugins.find(x => x.name === plugin[1]); if (p) out.add(bundleOf(p)); }
    const evals = f.match(/^evals\/(as-[^/]+)\//);
    if (evals && all.includes(evals[1])) out.add(evals[1]);
  }
  return all.filter(b => out.has(b));
}

function changedFiles(base) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  const from = git('merge-base', 'HEAD', base);
  return [...git('diff', '--name-only', from, 'HEAD').split('\n'), ...git('diff', '--name-only', 'HEAD').split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')].filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'origin/main';
  const hub = JSON.parse(fs.readFileSync(path.join(ROOT, 'hub.json'), 'utf8'));
  const targets = args.includes('--all') ? hub.plugins.map(bundleOf) : affected(changedFiles(base), hub.plugins);
  if (!targets.length) { console.log('evals: no workflow or eval changed, nothing to run'); return; }
  if (spawnSync('claude', ['--version']).status !== 0) {
    console.error('evals: the claude CLI is needed to run evals (https://code.claude.com). Skip once with git push --no-verify.');
    process.exit(1);
  }

  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'light-hub-evals-'));
  H.bundles(out);
  console.log(`evals: running ${targets.join(', ')} (threshold ${THRESHOLD}, at most USD ${MAX_COST} each)`);
  const failed = [];
  for (const b of targets) {
    const dir = path.join(out, b);
    if (!fs.existsSync(path.join(dir, 'evals'))) { console.log(`  ${b}: no eval cases yet`); continue; }
    const json = path.join(out, `${b}.json`);
    const r = spawnSync('claude', ['plugin', 'eval', dir, '--ablation', 'none', '--trust-plugin', '--no-publish',
      '-j', '4', '--threshold', THRESHOLD, '--max-cost-usd', MAX_COST, '--json', json,
      '--report', path.join(out, `${b}.html`)], { stdio: ['ignore', 'ignore', 'inherit'] });
    let summary = `exit ${r.status}`;
    if (fs.existsSync(json)) {
      const d = JSON.parse(fs.readFileSync(json, 'utf8'));
      const shaky = d.cases.filter(c => c.arms.with.some(x => !x.passed)).map(c => `${c.name} ${c.arms.with.filter(x => x.passed).length}/${c.arms.with.length}`);
      summary = `${d.aggregates.casesPassed}/${d.aggregates.casesTotal} cases, USD ${d.costUsd.toFixed(2)}` + (shaky.length ? `; runs failed in: ${shaky.join(', ')}` : '');
    }
    console.log(`  ${b}: ${r.status === 0 ? 'pass' : 'FAIL'} (${summary})`);
    if (r.status !== 0) failed.push(b);
  }
  console.log(`evals: reports in ${out}`);
  if (failed.length) { console.error(`evals: failed in ${failed.join(', ')}. Fix the workflow or, if the grader is wrong, the grader.`); process.exit(1); }
}

module.exports = { affected };
if (require.main === module) main();
