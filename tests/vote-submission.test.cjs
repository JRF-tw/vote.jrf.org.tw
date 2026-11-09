const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the actual dialog and submission handlers with a simulated DOM and network.
const source = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
const handlers = source.slice(source.indexOf('  function confirmList()'), source.indexOf('  /* ===================== 年度結果'));

function setup(fetchImpl = async () => ({})) {
  const elements = Object.fromEntries(['#voterEmail', '#doSend', '#dlgBack', '#dlg'].map(id => [id, {
    value: '', disabled: false, focus() {}, close() {}
  }]));
  const requests = [], messages = [], saved = [];
  const context = {
    C: { maxPicks: 5, announce: '2027 年 1 月', googleForm: {
      action: 'https://example.com/formResponse', picksEntry: 'entry.picks', emailEntry: 'entry.email'
    } },
    st: { picks: ['01', '02'], sent: false }, YD: { status: 'open' },
    YEAR: 2026, DEADLINE: Infinity, Date, URLSearchParams,
    byCode: { '01': { title: '事件一' }, '02': { title: '事件二' } },
    $: id => elements[id], STAMP: () => '', esc: value => value, dateOf: () => '',
    openDialog: html => { context.dialog = html; },
    toast: message => messages.push(message),
    save: () => saved.push(JSON.stringify(context.st)), go: page => { context.page = page; },
    fetch: async (...args) => { requests.push(args); return fetchImpl(...args); }
  };
  vm.createContext(context);
  vm.runInContext(handlers, context);
  context.confirmList();
  return { context, elements, requests, messages, saved };
}

test('empty or whitespace-only Email disables submission and makes no request', async () => {
  const { context, elements, requests } = setup();
  assert.match(context.dialog, /id="doSend" disabled/);
  assert.match(context.dialog, /type="text" inputmode="email"/);
  for (const value of ['', '   ']) {
    elements['#voterEmail'].value = value;
    elements['#voterEmail'].oninput();
    assert.equal(elements['#doSend'].disabled, true);
    await context.sendList();
  }
  assert.equal(requests.length, 0);
  assert.equal(context.st.sent, false);
});

test('valid Email is trimmed and sent with all selected event codes', async () => {
  const { context, elements, requests, saved } = setup();
  elements['#voterEmail'].value = '  voter+news@example.com  ';
  elements['#voterEmail'].oninput();
  assert.equal(elements['#doSend'].disabled, false);
  await context.sendList();
  assert.equal(requests.length, 1);
  const [url, options] = requests[0];
  assert.equal(url, context.C.googleForm.action);
  assert.equal(options.method, 'POST');
  assert.equal(options.mode, 'no-cors');
  assert.deepEqual(options.body.getAll('entry.picks'), ['01', '02']);
  assert.equal(options.body.get('entry.email'), 'voter+news@example.com');
  assert.equal(context.st.sent, true);
  assert.equal(context.page, 'result');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].includes('voter+news@example.com'), false);
});

test('in-flight requests cannot be duplicated', async () => {
  let finish;
  const { context, elements, requests } = setup(() => new Promise(resolve => { finish = resolve; }));
  elements['#voterEmail'].value = 'voter@example.com';
  const pending = context.sendList();
  assert.equal(elements['#doSend'].disabled, true);
  assert.equal(elements['#voterEmail'].disabled, true);
  await context.sendList();
  assert.equal(requests.length, 1);
  finish();
  await pending;
});

test('network failure keeps the input and allows retry without marking sent', async () => {
  const { context, elements, requests, saved } = setup(async () => { throw new Error('offline'); });
  elements['#voterEmail'].value = 'voter@example.com';
  await context.sendList();
  assert.equal(context.st.sent, false);
  assert.equal(saved.length, 0);
  assert.equal(elements['#voterEmail'].value, 'voter@example.com');
  assert.equal(elements['#voterEmail'].disabled, false);
  assert.equal(elements['#doSend'].disabled, false);
  await context.sendList();
  assert.equal(requests.length, 2);
});

test('missing Email field configuration and expired voting prevent requests', async () => {
  for (const condition of ['missing-entry', 'expired']) {
    const { context, elements, requests } = setup();
    elements['#voterEmail'].value = 'voter@example.com';
    if (condition === 'missing-entry') context.C.googleForm.emailEntry = '';
    else context.DEADLINE = 0;
    await context.sendList();
    assert.equal(requests.length, 0);
    assert.equal(context.st.sent, false);
  }
});


test('basic Email format rejects missing parts, spaces, and repeated @ without sending', async () => {
  for (const email of ['test', 'name@', '@example.com', 'name@example', 'name example@test.com', 'name@@example.com']) {
    const { context, elements, requests, messages } = setup();
    elements['#voterEmail'].value = email;
    await context.sendList();
    assert.equal(requests.length, 0, email);
    assert.equal(context.st.sent, false);
    assert.match(messages.at(-1), /Email 格式/);
    assert.equal(elements['#doSend'].disabled, false);
  }
});
