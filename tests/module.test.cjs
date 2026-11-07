const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../scripts/main.js'), 'utf8');

function setup({ gm = true, active = 'gm', enabled = true, scenes = [] } = {}) {
  const hooks = new Map(), settings = new Map(), writes = [];
  const values = { enabled, colour: '#123456' };
  const context = {
    console, Hooks: { once: (k, f) => hooks.set(k, f), on: (k, f) => hooks.set(k, f) },
    game: {
      ready: true, user: { id: 'gm', isGM: gm }, users: { activeGM: { id: active } }, scenes,
      settings: { get: (_, k) => values[k], register: (_, k, v) => settings.set(k, v) }
    },
    foundry: { data: { fields: { ColorField: class {} } } },
    CONFIG: { Scene: { documentClass: { updateDocuments: async updates => writes.push(updates) } } },
    ui: { notifications: { error: message => { throw Error(message); } } }
  };
  vm.runInNewContext(source, context);
  hooks.get('init')();
  return { hooks, settings, writes, values };
}

test('registers world settings and starts disabled by default', () => {
  const { settings } = setup();
  assert.equal(settings.get('enabled').default, false);
  assert.equal(settings.get('colour').scope, 'world');
  assert.equal(settings.get('enabled').scope, 'world');
});

test('bulk application covers every scene and v14 level; skips matching colours', async () => {
  const { hooks, writes } = setup({ scenes: [
    { id: 'a', backgroundColor: '#ffffff', levels: [{ id: 'l', background: { color: 0 } }] },
    { id: 'b', backgroundColor: '#000000' },
    { id: 'c', backgroundColor: '#123456', levels: [{ id: 'm', background: { color: 0x123456 } }] }
  ] });
  await hooks.get('ready')();
  assert.equal(writes[0].length, 2);
  assert.equal(writes[0][0].levels[0]['background.color'], 0x123456);
  assert.equal(writes[0][1].backgroundColor, '#123456');
});

test('players, secondary GMs and disabled worlds never run bulk writes', async () => {
  for (const options of [{ gm: false }, { active: 'other' }, { enabled: false }]) {
    const { hooks, writes } = setup({ ...options, scenes: [{ id: 'a', backgroundColor: '#fff' }] });
    await hooks.get('ready')();
    assert.equal(writes.length, 0);
  }
});

test('creation/import preserves level images and other scene data', () => {
  const { hooks } = setup();
  let update;
  hooks.get('preCreateScene')({
    toObject: () => ({ levels: [{ _id: 'l', background: { src: 'map.webp', color: 0 }, name: 'Ground' }] }),
    updateSource: data => { update = data; }
  });
  assert.equal(update.backgroundColor, '#123456');
  assert.equal(update.levels[0].background.src, 'map.webp');
  assert.equal(update.levels[0].background.color, 0x123456);
  assert.equal(update.levels[0].name, 'Ground');
});

test('updates enforce both nested and flattened level colours', () => {
  const { hooks } = setup();
  const changes = { name: 'New name', levels: [
    { _id: 'a', background: { src: 'map.webp', color: 1 } },
    { _id: 'b', 'background.color': 2 }
  ] };
  hooks.get('preUpdateScene')({}, changes);
  assert.equal(changes.backgroundColor, '#123456');
  assert.equal(changes.levels[0].background.src, 'map.webp');
  assert.equal(changes.levels[0].background.color, 0x123456);
  assert.equal(changes.levels[1]['background.color'], 0x123456);
  const levelChanges = { 'background.color': 0 };
  hooks.get('preUpdateLevel')({ parent: {} }, levelChanges);
  assert.equal(levelChanges['background.color'], 0x123456);
});

test('new levels receive the shared colour', () => {
  const { hooks } = setup();
  let update;
  hooks.get('preCreateLevel')({ parent: {}, updateSource: data => { update = data; } });
  assert.equal(update['background.color'], 0x123456);
});

test('compendium sources and disabled scene edits are untouched', () => {
  for (const options of [{ enabled: false }, {}]) {
    const { hooks } = setup(options);
    const scene = options.enabled === false ? {} : { pack: 'pack.scenes' };
    const changes = { backgroundColor: '#abcdef' };
    hooks.get('preUpdateScene')(scene, changes);
    assert.equal(changes.backgroundColor, '#abcdef');
    hooks.get('preCreateScene')({ ...scene, updateSource: () => assert.fail('Unexpected write') });
  }
});

test('setting changes apply the latest saved colour', async () => {
  const { settings, values, writes } = setup({ scenes: [{ id: 'a', backgroundColor: '#000000' }] });
  values.colour = '#abcdef';
  await settings.get('colour').onChange();
  assert.equal(writes[0][0].backgroundColor, '#abcdef');
});
