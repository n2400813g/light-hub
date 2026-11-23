#!/usr/bin/env node
// light-hub tooling. No dependencies.
//   node scripts/hub.js build     generate each platform's packaging from hub.json (Claude, and Agent Plugins for ChatGPT/Codex and others)
//   node scripts/hub.js check     enforce the hub rules on every workflow (run in CI on each pull request)
//   node scripts/hub.js catalog   regenerate the catalog that find-workflow reads
//
// Source of truth: hub.json plus plugins/<name>/skills/<skill>/SKILL.md (open Agent Skills format).
// Everything under .claude-plugin/, .agents/, .github/CODEOWNERS, and each plugin's plugin.json, mcp.json and .mcp.json is generated.
//   node scripts/hub.js find "<words>"   keyword search, a baseline for how findable descriptions are
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Light's teams as its job board names them (GTM, Tech, Operations departments).
const TEAMS = ['sales', 'partners', 'marketing', 'customer-success', 'services', 'operations', 'finance', 'people', 'legal', 'product', 'engineering'];
// 'personal' is not a repo status: a personal skill lives in that person's own Claude. Entering the repo makes it a draft.
const STATUS = ['draft', 'team', 'company', 'retired'];
const CATALOG = path.join(ROOT, 'plugins/light-core/skills/find-workflow/references/catalog.md');

// Minimal frontmatter parser: top-level "key: value" and one nested "metadata:" block.
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = { metadata: {} };
  let inMeta = false;
  for (const line of m[1].split('\n')) {
    if (/^metadata:\s*$/.test(line)) { inMeta = true; continue; }
    const kv = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const val = kv[3].replace(/^"(.*)"$/, '$1');
    if (kv[1] && inMeta) out.metadata[kv[2]] = val; else { inMeta = false; out[kv[2]] = val; }
  }
  return out;
}

const hub = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'hub.json'), 'utf8'));

function skills() {
  const list = [];
  for (const p of hub().plugins) {
    const dir = path.join(ROOT, 'plugins', p.name, 'skills');
    if (!fs.existsSync(dir)) continue;
    for (const s of fs.readdirSync(dir)) {
      const file = path.join(dir, s, 'SKILL.md');
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      list.push({ plugin: p.name, folder: s, file: path.relative(ROOT, file), text, fm: frontmatter(text) });
    }
  }
  return list;
}

function outside() {
  const f = path.join(ROOT, 'catalog/outside-claude.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}

// The hub's rules. Each returns a list of problems for one workflow.
function checkSkill(s) {
  const p = [];
  const fm = s.fm;
  if (!fm) return ['no frontmatter'];
  if (fm.name !== s.folder) p.push(`name "${fm.name}" must match its folder "${s.folder}"`);
  if (/^[>|][-+]?$/.test(fm.description || '')) p.push('write the description on one line (no ">" or "|" block)');
  else if (!fm.description) p.push('missing description');
  else {
    if (!/Use when/i.test(fm.description)) p.push('description must say "Use when ..." in the words people would use');
    if (fm.description.length > 1024) p.push('description over 1024 characters');
  }
  for (const k of ['owner', 'team', 'status', 'version']) if (!fm.metadata[k]) p.push(`missing metadata.${k}`);
  if (fm.metadata.team && !TEAMS.includes(fm.metadata.team)) p.push(`unknown team "${fm.metadata.team}"`);
  if (fm.metadata.status && !STATUS.includes(fm.metadata.status)) p.push(`unknown status "${fm.metadata.status}"`);
  if (!/^## Never/m.test(s.text)) p.push('missing "## Never" section');
  p.push(...dataCheck(s.text));
  return p;
}

// Workflows carry procedure, never data.
function dataCheck(text) {
  const p = [];
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text)) p.push('contains an email address');
  if (/(€|EUR|DKK|SEK|GBP|USD|£|\$)\s?\d/.test(text)) p.push('contains a money amount');
  if (/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/.test(text)) p.push('looks like an IBAN or account number');
  if (/\b\d{8,}\b/.test(text)) p.push('contains a long number');
  return p;
}

// Packaging per platform, generated from hub.json. Adding a platform means adding one writer here;
// the skills themselves never change.
const INSTALL = { default: 'INSTALLED_BY_DEFAULT', available: 'AVAILABLE', hidden: 'NOT_AVAILABLE' };
const LOCK = path.join(ROOT, 'hub.lock.json');
const GENERATED = new Set(['plugin.json', 'mcp.json', '.mcp.json', '.claude-plugin']);

// Versions bump themselves. Each plugin's content is hashed; when the hash differs from hub.lock.json, the patch
// version goes up by one. Nobody edits a version, every merged change is a new version (which Claude's org sync and
// Codex both key updates on), and the generated files are identical on every machine.
function pluginHash(p) {
  const hash = require('crypto').createHash('sha256').update(JSON.stringify([p.description, p.connectors || null]));
  const walk = dir => fs.readdirSync(dir).filter(f => f !== '.DS_Store').sort().forEach(f => {
    const full = path.join(dir, f);
    if (dir === path.join(ROOT, 'plugins', p.name) && GENERATED.has(f)) return;
    if (fs.statSync(full).isDirectory()) walk(full);
    else hash.update(path.relative(ROOT, full)).update(fs.readFileSync(full));
  });
  walk(path.join(ROOT, 'plugins', p.name));
  return hash.digest('hex').slice(0, 12);
}
function versions(h = hub()) {
  const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : {};
  const [major, minor] = h.version.split('.');
  const out = {};
  for (const p of h.plugins) {
    const hash = pluginHash(p), prev = lock[p.name];
    if (prev && prev.hash === hash) { out[p.name] = prev; continue; }
    const patch = prev && prev.version.startsWith(`${major}.${minor}.`) ? Number(prev.version.split('.')[2]) + 1 : 0;
    out[p.name] = { hash, version: `${major}.${minor}.${patch}` };
  }
  return out;
}
const title = name => name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

function outputs() {
  const h = hub();
  const files = {};
  const json = o => JSON.stringify(o, null, 2) + '\n';
  const v = versions(h);
  files['hub.lock.json'] = json(v);
  for (const p of h.plugins) {
    const dir = `plugins/${p.name}`;
    const version = v[p.name].version;
    // Open Agent Plugins 1.0.0 core: read by Codex, ChatGPT and other compatible clients. The com.openai extension
    // only sets how Codex and ChatGPT display it; without it they show the raw name under "Other".
    files[`${dir}/plugin.json`] = json({
      $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', name: p.name, version, description: p.description, author: { name: h.owner },
      extensions: { 'com.openai': { interface: { displayName: title(p.name), shortDescription: p.description, developerName: h.owner, category: 'Productivity' } } },
    });
    // Claude's own manifest.
    files[`${dir}/.claude-plugin/plugin.json`] = json({ name: p.name, version, description: p.description, author: { name: h.owner } });
    if (p.connectors) {
      const portable = {}, claude = {};
      for (const [k, c] of Object.entries(p.connectors)) { portable[k] = { type: 'streamable-http', url: c.url }; claude[k] = { type: 'http', url: c.url }; }
      files[`${dir}/mcp.json`] = json({ $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: portable });
      files[`${dir}/.mcp.json`] = json({ mcpServers: claude });
    }
  }
  // Claude: private organisation marketplace. Who gets what is set by group in Claude's admin settings.
  files['.claude-plugin/marketplace.json'] = json({
    name: h.name, owner: { name: h.owner }, metadata: { description: h.description },
    // A hidden plugin is not listed, so no platform delivers it. Hidden is not secret: anyone who can read the repo can
    // install any skill. That is acceptable because workflows hold procedure, never data.
    plugins: h.plugins.filter(p => p.install !== 'hidden').map(p => ({ name: p.name, source: `./plugins/${p.name}`, description: p.description })),
  });
  // ChatGPT and Codex: repository marketplace.
  files['.agents/plugins/marketplace.json'] = json({
    name: h.name, interface: { displayName: h.displayName },
    plugins: h.plugins.map(p => ({ name: p.name, source: { source: 'local', path: `./plugins/${p.name}` }, policy: { installation: INSTALL[p.install], authentication: 'ON_INSTALL' }, category: 'Productivity' })),
  });
  // GitHub: each team's champion must review changes to their plugin. When a champion moves on, change one line in hub.json.
  files['.github/CODEOWNERS'] = [
    '# Generated by scripts/hub.js build from hub.json. Do not edit by hand.',
    '* @' + h.maintainer,
    // hub.json decides connectors and who gets what, so Legal & Compliance review every change to it.
    `/hub.json @${h.maintainer} @${h.compliance}`,
    ...h.plugins.map(p => `/plugins/${p.name}/ @${p.champion}`),
    '',
  ].join('\n');
  return files;
}
function build() {
  const files = outputs();
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), c); }
  return Object.keys(files);
}
function stale() {
  return Object.entries(outputs()).filter(([f, c]) => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), 'utf8') !== c).map(([f]) => f);
}

function check() {
  const problems = stale().map(f => `${f}: out of date, run "node scripts/hub.js build"`);
  const h = hub();
  if (!h.maintainer) problems.push('hub.json: missing maintainer (GitHub handle of the hub owner)');
  if (!h.compliance) problems.push('hub.json: missing compliance (GitHub team that reviews connectors and access)');
  for (const p of h.plugins) if (!p.champion) problems.push(`hub.json "${p.name}": missing champion (GitHub handle)`);
  const names = new Set();
  for (const s of skills()) {
    if (s.fm && names.has(s.fm.name)) problems.push(`${s.file}: duplicate name "${s.fm.name}"`);
    if (s.fm) names.add(s.fm.name);
    for (const x of checkSkill(s)) problems.push(`${s.file}: ${x}`);
  }
  for (const x of crossRefs()) problems.push(x);
  for (const o of outside()) {
    for (const k of ['name', 'description', 'team', 'owner', 'status', 'runs_in', 'link']) if (!o[k]) problems.push(`catalog/outside-claude.json "${o.name}": missing ${k}`);
    if (o.description && !/Use when/i.test(o.description)) problems.push(`catalog/outside-claude.json "${o.name}": description must say "Use when ..."`);
    if (o.status && o.status !== 'draft' && !/^https?:\/\//.test(o.link || '')) problems.push(`catalog/outside-claude.json "${o.name}": link must be a URL unless status is draft`);
    if (o.status && !STATUS.includes(o.status)) problems.push(`catalog/outside-claude.json "${o.name}": unknown status "${o.status}"`);
  }
  return problems;
}

// A workflow that points people to another workflow must point to one they can run:
// it must exist, and live in light-core, in the same plugin, or in a plugin that is not hidden.
function crossRefs(list = skills(), plugins = hub().plugins) {
  const where = new Map(list.filter(s => s.fm).map(s => [s.fm.name, s.plugin]));
  const install = Object.fromEntries(plugins.map(p => [p.name, p.install]));
  const problems = [];
  for (const s of list) {
    const body = s.text.replace(/^---\n[\s\S]*?\n---/, '').replace(/```[\s\S]*?```/g, '');
    for (const [, ref] of body.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)) {
      if (!where.has(ref) || ref === s.fm?.name) continue;
      const target = where.get(ref);
      if (target !== s.plugin && target !== 'light-core' && install[target] === 'hidden')
        problems.push(`${s.file}: points to \`${ref}\`, which is in ${target}, a hidden plugin most people cannot run`);
    }
  }
  return problems;
}

function entries() {
  const install = Object.fromEntries(hub().plugins.map(p => [p.name, p.install]));
  const rows = skills().filter(s => s.fm).map(s => ({
    name: s.fm.name, description: s.fm.description, team: s.fm.metadata.team, owner: s.fm.metadata.owner,
    status: s.fm.metadata.status, version: s.fm.metadata.version,
    run: install[s.plugin] === 'hidden'
      ? `Not released yet (${s.plugin} plugin); ask ${s.fm.metadata.owner}`
      : `skill \`${s.fm.name}\` (${s.plugin} plugin)`,
    runnable: true,
  }));
  for (const o of outside()) rows.push({ name: o.name, description: o.description, team: o.team, owner: o.owner, status: o.status, version: '', run: `${o.runs_in}: ${o.link}`, runnable: /^https?:\/\//.test(o.link) });
  const order = { company: 0, team: 1, draft: 2, retired: 3 };
  return rows.sort((a, b) => a.team.localeCompare(b.team) || order[a.status] - order[b.status] || a.name.localeCompare(b.name));
}

function catalog() {
  const esc = s => String(s).replace(/\|/g, '\\|');
  // Rows nobody can run yet (an outside workflow with no real link) are left out: they only distract.
  const rows = entries().filter(e => e.status !== 'retired' && e.runnable);
  const md = [
    '# Light workflow catalog',
    '',
    `Generated by \`scripts/hub.js catalog\` from the light-hub repository. ${rows.length} workflows. Do not edit by hand.`,
    '',
    '| Workflow | Team | Status | Owner | What it does and when to use it | How to run it |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(e => `| ${esc(e.name)} | ${e.team} | ${e.status} | ${esc(e.owner)} | ${esc(e.description)} | ${esc(e.run)} |`),
    '',
  ].join('\n');
  fs.mkdirSync(path.dirname(CATALOG), { recursive: true });
  fs.writeFileSync(CATALOG, md);
  return rows.length;
}

// Keyword baseline: how well do descriptions match the words people actually use?
const STOP = new Set('a an the and or to of for in on at by with is are be it this that i we my our me you your how do does can should what who whom which when there any someone something get got just'.split(' '));
const stem = w => w.replace(/(ing|ed|es|s)$/, '');
const tokens = s => s.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w)).map(stem);
function find(query, k = 3) {
  const q = new Set(tokens(query));
  return entries().filter(e => e.status !== 'retired').map(e => {
    const t = tokens(`${e.name.replace(/-/g, ' ')} ${e.description}`);
    const hits = [...q].filter(w => t.includes(w)).length;
    return { name: e.name, score: hits / Math.sqrt(q.size || 1) };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

// Eval bundles: one test plugin per kind of person, holding exactly the skills they have installed
// (light-core plus their team plugin; a hidden plugin's team gets light-core only), with that person's eval
// cases from evals/<bundle>/. Run: claude plugin eval <out>/<bundle> --ablation none
function bundles(out) {
  const made = [];
  for (const p of hub().plugins) {
    const name = p.name === 'light-core' ? 'as-everyone' : `as-${p.audience}`;
    const from = p.name === 'light-core' || p.install === 'hidden' ? ['light-core'] : ['light-core', p.name];
    const dir = path.resolve(out, name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin/plugin.json'), JSON.stringify({ name, description: `What ${p.audience} has installed: ${from.join(' + ')}` }, null, 2) + '\n');
    for (const f of from) fs.cpSync(path.join(ROOT, 'plugins', f, 'skills'), path.join(dir, 'skills'), { recursive: true });
    const cases = path.join(ROOT, 'evals', name);
    if (fs.existsSync(cases)) fs.cpSync(cases, path.join(dir, 'evals'), { recursive: true });
    made.push(dir);
  }
  return made;
}

module.exports = { versions, pluginHash, bundles, frontmatter, skills, checkSkill, dataCheck, check, crossRefs, entries, catalog, find, tokens, build, outputs, stale };

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'build') {
    console.log(`wrote ${build().length} packaging files from hub.json`);
  } else if (cmd === 'check') {
    const p = check();
    if (p.length) { console.error(p.join('\n')); process.exit(1); }
    console.log(`ok: ${skills().length} skills and ${outside().length} outside workflows pass the hub rules`);
  } else if (cmd === 'catalog') {
    console.log(`wrote ${path.relative(ROOT, CATALOG)} with ${catalog()} workflows`);
  } else if (cmd === 'bundles') {
    for (const d of bundles(rest[0] || path.join(require('os').tmpdir(), 'light-hub-evals'))) console.log(d);
  } else if (cmd === 'find') {
    console.log(find(rest.join(' ')));
  } else {
    console.log('usage: hub.js build | check | catalog | bundles [dir] | find "<words>"');
  }
}
