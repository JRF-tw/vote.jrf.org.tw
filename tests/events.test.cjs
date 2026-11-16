const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

function setup(storage = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', className: '', open: false, clientWidth: 100, offsetWidth: 100, scrollLeft: 0,
      getBoundingClientRect() { return { left: 0 }; },
      setAttribute(name, value) { this[name] = value; },
      classList: { add() {}, remove() {}, toggle() {} },
      showModal() { this.open = true; }, close() { this.open = false; }
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    window: { scrollTo() {} },
    document: { querySelector: element, querySelectorAll: () => [],
      addEventListener() {}, body: { dataset: {} } },
    localStorage: { getItem: key => storage[key] ?? null, setItem(key, value) { storage[key] = value; } },
    location: { pathname: '/', search: '', hash: '' }, history: { pushState() {} },
    setTimeout, clearTimeout
  });
  for (const file of ['assets/config.js', 'data/events.js', 'assets/event-topics.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  vm.runInContext('Date.now = () => new Date("2026-11-16T00:00:00Z").getTime()', context);
  const source = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  // Exercise real rendering and selection handlers, without browser bootstrapping or form submission.
  vm.runInContext(source.slice(0, source.lastIndexOf('  renderChrome();')) +
    'window.test = {go, openDetail, togglePick, personaOf, toggleTagList, st}; })();', context);
  return { ...context.window, element };
}

test('new dataset contains all 27 events, 47 used tags, images and 116 timeline entries', () => {
  const { JRF_DATA, JRF_TAGS, JRF_EVENT_TOPICS } = setup();
  const events = JRF_DATA[2026].events;
  assert.deepEqual(Array.from(events, e => e.code), Array.from({ length: 27 }, (_, i) => String(i + 1)));
  assert.equal(JRF_TAGS.length, 47);
  assert.equal(events.reduce((n, e) => n + e.news.length, 0), 116);
  assert.equal(events.flatMap(e => e.news).filter(n => !n.url).length, 0);
  const covered = JRF_EVENT_TOPICS.groups.flatMap(g => g.tags);
  assert.equal(new Set(covered).size, covered.length);
  assert.deepEqual([...covered].sort(), [...JRF_TAGS].sort());
  for (const e of events) {
    assert.ok(e.title && e.summary && e.full);
    assert.ok(e.image && fs.existsSync(path.join(root, e.image)));
    assert.ok(e.news.some(n => n.key));
    for (const n of e.news) {
      assert.match(n.date, /^202[56]\/\d{2}\/\d{2}$/);
      if (n.url) assert.match(n.url, /^https?:\/\//);
    }
  }
  const ordered = events.filter(e => e.image).sort((a, b) => {
    const first = e => e.news.filter(n => n.key).map(n => n.date).sort()[0];
    return first(a).localeCompare(first(b)) || Number(a.code) - Number(b.code);
  });
  assert.equal(ordered.length, 27);
  for (const e of ordered) assert.equal(e.image, `images/2026/${e.code.padStart(2, '0')}.png`);
  assert.ok(events.find(e => e.wordCode === '15').image);
});

test('new ballot version ignores old test votes and preserves duplicate-vote protection for this round', () => {
  const previousVote = JSON.stringify({ picks: ['1'], sent: true, at: 1 });
  const storage = { 'jrf-review-2026': previousVote };
  const fresh = setup(storage);
  assert.equal(fresh.test.st.sent, false);
  assert.equal(fresh.test.st.picks.length, 0);
  fresh.test.togglePick('2');
  const key = `jrf-review-2026-${fresh.JRF_CONFIG.ballotVersion}`;
  assert.deepEqual(JSON.parse(storage[key]).picks, ['2']);
  assert.equal(storage['jrf-review-2026'], previousVote);
  storage[key] = previousVote;
  const sent = setup(storage);
  assert.equal(sent.test.st.sent, true);
  sent.test.togglePick('2');
  assert.deepEqual(Array.from(sent.test.st.picks), ['1']);
});

test('every tag filters all matching events; chronological repeats share a single pick', () => {
  const { test: app, element, JRF_TAGS, JRF_DATA } = setup();
  const events = JRF_DATA[2026].events;
  for (const tag of JRF_TAGS) {
    app.go('review', { tag });
    const codes = [...element('#timeline').innerHTML.matchAll(/class="ev-code">(\d+)</g)].map(m => m[1]);
    const expected = events.filter(e => e.tags.includes(tag)).map(e => e.code);
    assert.deepEqual([...new Set(codes)].sort(), [...expected].sort(), tag);
  }
  app.go('review');
  const html = element('#timeline').innerHTML;
  const codesInOrder = [...html.matchAll(/class="ev-code">(\d+)</g)].map(m => m[1]);
  assert.deepEqual([...new Set(codesInOrder)], Array.from({length: 27}, (_, i) => String(i + 1)));
  assert.match(html, /相關事件也出現在9月/);
  assert.ok(!html.includes('同一事件也出現在'));
  const dates = [...html.matchAll(/<(?:span|time[^>]*)>(2026)年(\d+)月(\d+)日<\/(?:span|time)>/g)]
    .map(m => `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`);
  assert.equal(dates.length, events.reduce((n, e) => n + e.news.filter(n => n.key).length, 0));
  assert.deepEqual(dates, [...dates].sort());
  assert.equal((html.match(/data-pick="1"/g) || []).length, 2);
  app.togglePick('1');
  assert.deepEqual(Array.from(app.st.picks), ['1']);
  assert.equal((element('#timeline').innerHTML.match(/data-pick="1" aria-pressed="true"/g) || []).length, 2);
  app.togglePick('1');
  assert.equal(app.st.picks.length, 0);
});

test('details preserve full text and missing sources stay plain text without invented links', () => {
  const { test: app, element, JRF_DATA } = setup();
  for (const e of JRF_DATA[2026].events) {
    app.openDetail(e.code);
    const html = element('#dlgInner').innerHTML;
    assert.ok(html.includes(e.title.replaceAll('&', '&amp;').replaceAll('"', '&quot;')));
    assert.ok(!html.includes('href=""'));
    assert.ok(!html.includes('google.com/search'));
    assert.match(html, /<h3 class="d-sec">相關事件時間軸<\/h3>/);
    assert.ok(!html.includes('keytag'));
    assert.equal((html.match(/<li class="key">/g) || []).length, e.news.filter(n => n.key).length);
    assert.equal((html.match(/class="tag /g) || []).length, e.tags.length);
  }
  app.openDetail('14');
  assert.match(element('#dlgInner').innerHTML, /class="source-tag">圖片來源：民間司改會<\/span>/);
  app.openDetail('4');
  assert.match(element('#dlgInner').innerHTML, /href="https:\/\/news.tvbs.com.tw\/local\/4031274"/);
  assert.match(element('#dlgInner').innerHTML, /西門町知名BDSM酒吧遭突襲搜索　負責人遭帶走爆執法爭議/);
  for (const code of ['17']) {
    app.openDetail(code);
    assert.ok(element('#dlgInner').innerHTML.includes('src="images/2026/17.png"'));
  }
});

test('personas weight events equally, deduplicate a topic and handle ties independently of pick order', () => {
  const { JRF_EVENT_TOPICS: topics, test: app } = setup();
  const persona = topics.personaOf;
  assert.equal(persona([]), null);
  assert.equal(persona([{ tags: ['冤案救援', '證據法則', '再審'] }]).name, '冤案追問者');
  const multi = [{ tags: ['人權保障', '憲法法庭', '憲政爭議', '權力分立'] }];
  assert.equal(persona(multi).name, '多元關注者');
  assert.equal(persona(multi).topics[0].score, 0.5);
  const choices = [...multi, { tags: ['人權保障'] }];
  assert.equal(persona(choices).name, '人權守護者');
  assert.equal(persona([...choices].reverse()).name, '人權守護者');
  assert.equal(app.personaOf(['2', '26']).name, '冤案追問者');
  for (let i = 1; i <= 27; i++) assert.ok(app.personaOf([String(i)]).name);
});

test('tag lists start collapsed, expand accessibly and keep the active tag visible on collapse', () => {
  const { test: app, element, JRF_TAGS } = setup();
  app.go('review');
  assert.match(element('#main').innerHTML, /class="filters tag-options"/);
  assert.match(element('#main').innerHTML, /aria-controls="filters" aria-expanded="false"/);
  app.toggleTagList('filters');
  assert.equal(element('[data-toggle-tags="filters"]')['aria-expanded'], 'true');
  app.go('review', { tag: JRF_TAGS.at(-1) });
  assert.match(element('#main').innerHTML, /class="filters tag-options expanded"/);
  app.toggleTagList('filters');
  assert.equal(element('[data-toggle-tags="filters"]')['aria-expanded'], 'false');
  const visible = [...element('#filters').innerHTML.matchAll(/data-f="([^"]+)"/g)].slice(0, 5).map(m => m[1]);
  assert.ok(visible.includes(JRF_TAGS.at(-1)));
  app.go('home');
  assert.match(element('#main').innerHTML, /class="topics tag-options"/);
});

test('portrait previews retain native proportions and the restored AI picture uses chronological number 11', () => {
  const { test: app, element, JRF_DATA } = setup();
  const events = JRF_DATA[2026].events;
  for (const e of events.filter(e => e.image)) {
    const image = fs.readFileSync(path.join(root, e.image));
    const width = image.readUInt32BE(16), height = image.readUInt32BE(20);
    if (height <= width) continue;
    assert.equal(e.imageRatio, 'original');
    app.go('review', { tag: e.tags[0] });
    assert.ok(element('#timeline').innerHTML.includes(`class="pic ratio-original" src="${e.image}"`));
  }
  const ai = events.find(e => e.title.startsWith('司法機關導入生成式AI'));
  assert.equal(ai.code, '11');
  app.openDetail(ai.code);
  assert.match(element('#dlgInner').innerHTML, /src="images\/2026\/11.png"/);
});

test('repeat cards place media before the headline and integrate numbered event review into the subtitle', () => {
  const { test: app, element, JRF_DATA } = setup();
  app.go('review');
  const html = element('#timeline').innerHTML;
  const repeatCards = [...html.matchAll(/<article class="ev repeat [\s\S]*?<\/article>/g)].map(m => m[0]);
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  let expected = 0;
  for (const e of JRF_DATA[2026].events) {
    const laterNews = e.news.filter(n => n.key).sort((a, b) => a.date.localeCompare(b.date)).slice(1);
    expected += laterNews.length;
    for (const n of laterNews) {
      const card = repeatCards.find(c => c.includes(`data-pick="${e.code}"`) && c.includes(escape(n.title)));
      assert.ok(card, n.title);
      assert.ok(card.includes(`class="repeat-news" data-open="${e.code}"`));
      assert.ok(card.includes(`>${escape(n.media)}</span>`));
      assert.match(card, /<h3><time class="repeat-date"/);
      assert.ok(!card.includes('class="ev-code"'));
      assert.ok(!card.includes('看完整回顧 →'));
      assert.ok(card.indexOf('class="repeat-date"') < card.indexOf('class="news-source"'));
      assert.ok(card.indexOf(`>${escape(n.media)}</span>`) < card.indexOf('class="repeat-news"'));
      assert.ok(card.includes(`<button class="repeat-review" data-open="${e.code}"><b>回看事件 ${e.code}｜</b><span class="repeat-event-title">${escape(e.title)}</span>`));
      assert.ok(!card.includes('class="btn btn-dark btn-small"'));
    }
  }
  assert.equal(repeatCards.length, expected);
  assert.equal((html.match(/class="btn btn-dark btn-small" data-open=/g) || []).length,
    JRF_DATA[2026].events.length);
  assert.ok(!html.includes('pic-credit'));
  assert.match(html, /<\/button><p class="pic-source"><(?:a|span) class="source-tag"/);
});
