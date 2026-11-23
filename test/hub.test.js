// Run with: node --test test/hub.test.js
const test = require('node:test');
const assert = require('node:assert');
const H = require('../scripts/hub');

test('every workflow in the hub passes the rules', () => {
  assert.deepStrictEqual(H.check(), []);
});

test('the rules catch a workflow with no owner, no "Use when" and customer data in it', () => {
  const text = `---\nname: bad-one\ndescription: Writes emails.\nmetadata:\n  team: sales\n  status: team\n  version: "1"\n---\nSend to tom@kestrel.io and offer EUR 12,000 off.`;
  const problems = H.checkSkill({ folder: 'bad-one', text, fm: H.frontmatter(text) });
  for (const p of ['missing metadata.owner', 'description must say "Use when ..." in the words people would use', 'missing "## Never" section', 'contains an email address', 'contains a money amount'])
    assert.ok(problems.includes(p), p);
});

test('the catalog lists every workflow that is not retired', () => {
  const n = H.catalog();
  assert.strictEqual(n, H.entries().filter(e => e.status !== 'retired').length);
});

// Requests in the words people at Light would use, not the words in the skill names.
// expected: the workflow that should come back, or null when nothing in the hub fits.
const REQUESTS = [
  ['I just got off a discovery call, can you write the recap email', 'call-follow-up'],
  ['email the prospect after the demo', 'call-follow-up'],
  ['prep me for my meeting with a new company tomorrow', 'account-research'],
  ['does this company fit our ideal customer', 'account-research'],
  ['is this deal real before the forecast call', 'deal-review'],
  ['inspect my pipeline for the weekly review', 'deal-review'],
  ['an accounting firm just introduced a prospect to us', 'partner-referral-intake'],
  ['who should take this referral from a fractional CFO', 'partner-referral-intake'],
  ['the prospect wants a discount, how do I get it approved', 'pricing-approval-memo'],
  ['has anyone built something for summarising board meetings', 'find-workflow'],
  ['I keep doing this report by hand every week', 'request-workflow'],
  ['save this prompt so my team can use it', 'publish-workflow'],
  ['write a paragraph describing Light for a partner newsletter', 'light-context'],
  ['how are inbound leads routed', 'EXAMPLE inbound-lead-routing'],
  ['how do supplier invoices get into Light', 'EXAMPLE vendor-invoice-intake'],
  ['book a meeting room in Copenhagen', null],
  ['translate my holiday request into Danish', null],
];

test('findability: requests in people\'s own words find the right workflow', () => {
  const misses = [];
  let top1 = 0, top3 = 0, falseHits = 0, expectedCount = 0;
  for (const [q, want] of REQUESTS) {
    const r = H.find(q);
    if (want === null) { if (r.length && r[0].score >= 1) falseHits++; continue; }
    expectedCount++;
    const names = r.map(x => x.name);
    if (names[0] === want) top1++;
    if (names.includes(want)) top3++; else misses.push(`${q} -> ${names.join(', ') || 'nothing'} (wanted ${want})`);
  }
  console.log(`keyword baseline: top-1 ${top1}/${expectedCount}, top-3 ${top3}/${expectedCount}, confident false hits ${falseHits}`);
  if (misses.length) console.log(misses.join('\n'));
  assert.strictEqual(top3, expectedCount, 'every request should find its workflow in the top three');
});

test('packaging for every platform is generated from hub.json and up to date', () => {
  assert.deepStrictEqual(H.stale(), []);
});

test('each plugin carries the portable core and Claude\'s manifest, and both marketplaces list every plugin', () => {
  const fs = require('fs'), path = require('path');
  const root = path.resolve(__dirname, '..');
  const hub = JSON.parse(fs.readFileSync(path.join(root, 'hub.json'), 'utf8'));
  const claude = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));
  const agents = JSON.parse(fs.readFileSync(path.join(root, '.agents/plugins/marketplace.json'), 'utf8'));
  for (const p of hub.plugins) {
    const portable = JSON.parse(fs.readFileSync(path.join(root, 'plugins', p.name, 'plugin.json'), 'utf8'));
    assert.match(portable.$schema, /agent-plugins\.org/);
    assert.strictEqual(portable.name, p.name);
    assert.ok(fs.existsSync(path.join(root, 'plugins', p.name, '.claude-plugin/plugin.json')));
    assert.ok(claude.plugins.some(x => x.name === p.name));
    assert.ok(agents.plugins.some(x => x.name === p.name && x.source.path === `./plugins/${p.name}`));
  }
});

test('a skill is written once: no platform-specific copies of any SKILL.md', () => {
  const names = H.skills().map(s => s.fm.name);
  assert.strictEqual(new Set(names).size, names.length);
});

test('generated manifests carry no version, so every merged change reaches people on the next sync', () => {
  for (const [f, c] of Object.entries(H.outputs())) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(c);
    assert.strictEqual(o.version, undefined, `${f} sets version`);
    assert.strictEqual(o.metadata?.version, undefined, `${f} sets metadata.version`);
    for (const p of o.plugins || []) assert.strictEqual(p.version, undefined, `${f} pins ${p.name}`);
  }
});

test('a workflow that points people to a workflow in a hidden plugin fails the check', () => {
  const memo = '---\nname: pricing-approval-memo\n---\n';
  const followUp = '---\nname: call-follow-up\n---\nNever quote a price; use `pricing-approval-memo`.';
  const list = [
    { plugin: 'light-finance', file: 'memo', text: memo, fm: H.frontmatter(memo) },
    { plugin: 'light-sales', file: 'follow-up', text: followUp, fm: H.frontmatter(followUp) },
  ];
  const plugins = [{ name: 'light-sales', install: 'default' }, { name: 'light-finance', install: 'hidden' }];
  assert.strictEqual(H.crossRefs(list, plugins).length, 1);
  plugins[1].install = 'available';
  assert.deepStrictEqual(H.crossRefs(list, plugins), []);
});

test('CODEOWNERS gives each plugin folder to its champion', () => {
  const owners = H.outputs()['.github/CODEOWNERS'];
  const hub = JSON.parse(require('fs').readFileSync(require('path').resolve(__dirname, '../hub.json'), 'utf8'));
  for (const p of hub.plugins) assert.ok(owners.includes(`/plugins/${p.name}/ @${p.champion}`), p.name);
});

test('"personal" is not a repo status, and a multi-line description gets a clear error', () => {
  const text = '---\nname: x-y\ndescription: >\n  Does a thing. Use when asked.\nmetadata:\n  owner: A\n  team: sales\n  status: personal\n  version: "1"\n---\n## Never\n';
  const problems = H.checkSkill({ folder: 'x-y', text, fm: H.frontmatter(text) });
  assert.ok(problems.includes('unknown status "personal"'));
  assert.ok(problems.some(p => p.startsWith('write the description on one line')));
});
