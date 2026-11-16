const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
const escape = text => String(text).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const primaryNews = event => event.news.some(news => news.key) ? event.news.filter(news => news.key) : event.news.slice(0, 1);
const firstDate = event => primaryNews(event).map(news => news.date).sort()[0];
const articles = html => [...html.matchAll(/<article class="ev [\s\S]*?<\/article>/g)].map(match => match[0]);
const codeOf = html => html.match(/data-pick="([^"]+)"/)[1];

function setup(storage = {}, options = {}) {
  const elements = new Map();
  let timelineButtons = [];
  const document = { querySelectorAll: selector => {
    if (selector === '#dlgInner .d-pic img.pic') return options.dialogImages || [];
    const match = selector.match(/^#timeline \.ev-pick\[data-pick="([^"]+)"\]$/);
    return match ? timelineButtons.filter(button => button.dataset.pick === match[1]) : [];
  }, addEventListener() {}, body: { dataset: {} }, activeElement: null };
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      _html: '', writes: 0,
      get innerHTML() { return this._html; },
      set innerHTML(html) {
        this._html = html;
        this.writes++;
        if (id !== '#timeline') return;
        timelineButtons = articles(html).map(cardHTML => {
          const classes = new Set(cardHTML.match(/class="([^"]+)"/)[1].split(/\s+/));
          const card = { classList: {
            toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
            contains: name => classes.has(name)
          } };
          const buttonHTML = cardHTML.slice(cardHTML.indexOf('<button class="ev-pick"'));
          const label = { textContent: buttonHTML.match(/class="pick-label">([^<]*)/)[1] };
          const attributes = { 'aria-pressed': buttonHTML.match(/aria-pressed="([^"]+)"/)[1] };
          return { dataset: { pick: codeOf(cardHTML) }, attributes,
            closest: () => card, querySelector: () => label,
            setAttribute(name, value) { attributes[name] = value; },
            focus() { document.activeElement = this; }
          };
        });
      },
      className: '', open: false, clientWidth: 100, offsetWidth: 100, scrollLeft: 0,
      getBoundingClientRect() { return { left: 0 }; },
      setAttribute(name, value) { this[name] = value; },
      classList: { add() {}, remove() {}, toggle() {} },
      showModal() { this.open = true; }, close() { this.open = false; }
    });
    return elements.get(id);
  };
  document.querySelector = element;
  const scrolls = [];
  const context = vm.createContext({
    window: { scrollY: 200, scrollTo(...args) { scrolls.push(args); } },
    document,
    localStorage: { getItem: key => storage[key] ?? null, setItem(key, value) { storage[key] = value; } },
    location: { pathname: '/', search: '', hash: '' }, history: { pushState() {} },
    setTimeout, clearTimeout, requestAnimationFrame: callback => callback()
  });
  for (const file of ['assets/config.js', 'data/events.js', 'assets/event-topics.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const config = context.window.JRF_CONFIG;
  assert.ok(Number.isFinite(Date.parse(config.deadline)), 'configured deadline must be valid');
  // Functional tests simulate an open voting round immediately before its deadline.
  // Production dates and round status must not make these tests expire.
  const data = context.window.JRF_DATA[config.year];
  if (options.fixtures) {
    const base = JSON.parse(JSON.stringify(data.events[0]));
    const year = config.year;
    data.events = [
      { ...base, code: '1', title: '事件「一」 & <原標題>', summary: '摘要 & <內容>', full: '回顧第一段\n回顧第二段',
        image: config.logo, imageRatio: 'original', imageSource: ['來源 & <名稱>', ''],
        news: [
          { date: `${year}/01/02`, title: '最初新聞', media: '媒體', url: '', key: true },
          { date: `${year}/09/30`, title: '第二則 & <新聞>', media: '來源 & <媒體>', url: 'https://example.com/second', key: true },
          { date: `${year}/10/01`, title: '第三則新聞', media: '媒體', url: '', key: true }
        ] },
      { ...base, code: '2', title: '沒有圖片與詳細版的事件', summary: '以摘要作為回顧', full: '', image: '', imageSource: null,
        news: [{ date: `${year}/02/03`, title: '未指定重點時採第一則新聞', media: '媒體', url: '' }] }
    ];
    context.window.JRF_TAGS = [...new Set(data.events.flatMap(event => event.tags))];
  }
  data.status = 'open';
  data.final = null;
  config.devPreview = false;
  context.testNow = Date.parse(config.deadline) + (options.afterDeadline ? 1 : -60000);
  vm.runInContext('Date.now = () => testNow', context);
  // Run actual rendering/selection functions with a simulated DOM, without browser bootstrapping or network requests.
  const boot = appSource.lastIndexOf('  renderChrome();');
  assert.ok(boot >= 0, 'application bootstrap marker must exist');
  vm.runInContext(appSource.slice(0, boot) +
    'window.test = {go, openDetail, togglePick, personaOf, toggleTagList, toggleFilter, st}; })();', context);
  return { ...context.window, element, document, scrolls, events: data.events,
    buttonsFor: code => timelineButtons.filter(button => button.dataset.pick === code) };
}

function assertDate(value) {
  assert.match(value, /^\d{4}\/\d{2}\/\d{2}$/);
  const [year, month, day] = value.split('/').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  assert.deepEqual([date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()], [year, month, day]);
}

test('active-year events have valid unique codes, used tags, local images and news dates', () => {
  const { events, JRF_TAGS, JRF_EVENT_TOPICS } = setup();
  assert.ok(events.length > 0);
  assert.deepEqual(Array.from(events, event => event.code), Array.from({ length: events.length }, (_, i) => String(i + 1)));
  const used = [...new Set(events.flatMap(event => event.tags))].sort();
  assert.deepEqual([...JRF_TAGS].sort(), used);
  const covered = JRF_EVENT_TOPICS.groups.flatMap(group => group.tags);
  assert.equal(new Set(covered).size, covered.length, 'each tag belongs to one persona group');
  assert.deepEqual([...covered].sort(), used);
  for (const event of events) {
    assert.ok(event.title.trim() && event.summary.trim());
    assert.ok(event.tags.length > 0);
    assert.equal(new Set(event.tags).size, event.tags.length);
    if (event.image) {
      const image = fs.readFileSync(path.join(root, event.image));
      assert.equal(image.readUInt32BE(16), event.imageWidth, `${event.image} width`);
      assert.equal(image.readUInt32BE(20), event.imageHeight, `${event.image} height`);
    }
    assert.ok(event.news.length > 0);
    for (const news of event.news) {
      assertDate(news.date);
      assert.ok(news.title.trim() && news.media.trim());
      if (news.url) assert.ok(['https:', 'http:'].includes(new URL(news.url).protocol));
    }
  }
  const chronological = [...events].sort((a, b) => firstDate(a).localeCompare(firstDate(b)) || Number(a.code) - Number(b.code));
  assert.deepEqual(chronological.map(event => event.code), Array.from(events, event => event.code));
});

test('ballot versions isolate old votes and preserve this round’s duplicate-vote protection', () => {
  const baseline = setup({}, { fixtures: true });
  const [first, second] = baseline.events;
  assert.ok(second, 'selection tests require at least two events');
  const { year, ballotVersion } = baseline.JRF_CONFIG;
  const previousVote = JSON.stringify({ picks: [first.code], sent: true, at: 1 });
  const legacyKey = `jrf-review-${year}`, oldVersionKey = `${legacyKey}-previous-test-round`;
  const storage = { [legacyKey]: previousVote, [oldVersionKey]: previousVote };
  const fresh = setup(storage, { fixtures: true });
  assert.equal(fresh.test.st.sent, false);
  assert.equal(fresh.test.st.picks.length, 0);
  fresh.test.togglePick(second.code);
  const key = `${legacyKey}-${ballotVersion || 'launch-1'}`;
  assert.deepEqual(JSON.parse(storage[key]).picks, [second.code]);
  assert.equal(storage[legacyKey], previousVote);
  assert.equal(storage[oldVersionKey], previousVote);
  storage[key] = previousVote;
  const sent = setup(storage, { fixtures: true });
  sent.test.togglePick(second.code);
  assert.deepEqual(Array.from(sent.test.st.picks), [first.code]);
});

test('selection is blocked after the configured deadline', () => {
  const { test: app, events } = setup({}, { afterDeadline: true });
  app.togglePick(events[0].code);
  assert.equal(app.st.picks.length, 0);
});

test('each tag filters all matching events and the complete timeline follows primary dates', () => {
  const { test: app, element, JRF_TAGS, events } = setup();
  for (const tag of JRF_TAGS) {
    app.go('review', { tag });
    const codes = articles(element('#timeline').innerHTML).map(codeOf);
    assert.deepEqual([...new Set(codes)].sort(), Array.from(events.filter(event => event.tags.includes(tag)), event => event.code).sort(), tag);
  }
  app.go('review');
  const html = element('#timeline').innerHTML;
  const codes = articles(html).map(codeOf);
  assert.deepEqual([...new Set(codes)], Array.from(events, event => event.code));
  const dates = [...html.matchAll(/<(?:span|time[^>]*)>(\d{4})年(\d+)月(\d+)日<\/(?:span|time)>/g)]
    .map(match => `${match[1]}/${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`);
  const expected = events.flatMap(event => primaryNews(event).map(news => news.date)).sort();
  assert.deepEqual(dates, Array.from(expected));
});

test('selection updates all occurrences in place without rebuilding cards, filters or losing focus', () => {
  const { test: app, element, document, buttonsFor } = setup({}, { fixtures: true });
  app.go('review');
  const cards = articles(element('#timeline').innerHTML);
  assert.deepEqual(cards.map(codeOf), ['1', '2', '1', '1']);
  const buttons = buttonsFor('1'), other = buttonsFor('2')[0];
  const timelineWrites = element('#timeline').writes, filterWrites = element('#filters').writes;
  buttons[1].focus();
  app.togglePick('1');
  assert.deepEqual(Array.from(app.st.picks), ['1']);
  for (const button of buttons) {
    assert.equal(button.attributes['aria-pressed'], 'true');
    assert.ok(button.attributes['aria-label'].startsWith('取消圈選：'));
    assert.equal(button.querySelector('.pick-label').textContent, '已圈');
    assert.ok(button.closest('.ev').classList.contains('picked'));
  }
  assert.equal(document.activeElement, buttons[1]);
  assert.equal(element('#timeline').writes, timelineWrites);
  assert.equal(element('#filters').writes, filterWrites);
  assert.equal(buttonsFor('1')[1], buttons[1]);
  assert.equal(other.attributes['aria-pressed'], 'false');
  app.togglePick('1');
  assert.equal(app.st.picks.length, 0);
  for (const button of buttons) {
    assert.equal(button.attributes['aria-pressed'], 'false');
    assert.equal(button.querySelector('.pick-label').textContent, '圈選');
    assert.ok(!button.closest('.ev').classList.contains('picked'));
  }
  assert.equal(document.activeElement, buttons[1]);
  assert.equal(element('#timeline').writes, timelineWrites);
  assert.equal(element('#filters').writes, filterWrites);
});

test('details render current titles, full paragraphs and primary-news emphasis without the old badge', () => {
  const { test: app, element, events } = setup();
  for (const event of events) {
    app.openDetail(event.code);
    const html = element('#dlgInner').innerHTML;
    if (event.image) {
      assert.ok(html.includes(`width="${event.imageWidth}" height="${event.imageHeight}"`));
      assert.ok(html.includes(`aspect-ratio:auto ${event.imageWidth}/${event.imageHeight}`));
      assert.ok(html.includes('loading="eager"'));
    }
    assert.ok(html.includes(escape(event.title)));
    for (const paragraph of (event.full || event.summary).split(/\n+/).filter(text => text.trim())) {
      assert.ok(html.includes(`<p>${escape(paragraph.trim())}</p>`));
    }
    assert.match(html, /<h3 class="d-sec">相關事件時間軸<\/h3>/);
    assert.ok(!html.includes('keytag'));
    assert.equal((html.match(/<li class="key">/g) || []).length, event.news.filter(news => news.key).length);
    assert.equal((html.match(/class="tag /g) || []).length, event.tags.length);
  }
});

test('timeline thumbnails keep CSS sizing while detail images reserve their dimensions', () => {
  const { test: app, element, events } = setup();
  app.go('review');
  const images = [...element('#timeline').innerHTML.matchAll(/<img\b[^>]*>/g)];
  assert.ok(images.length > 0);
  for (const [image] of images) {
    assert.doesNotMatch(image, /\s(?:width|height|style)=/);
    assert.match(image, /loading="lazy"/);
  }
  const event = events.find(event => event.image);
  app.openDetail(event.code);
  assert.ok(element('#dlgInner').innerHTML.includes(`width="${event.imageWidth}" height="${event.imageHeight}"`));
});

test('dialog image credits wait for image decoding and ignore replaced images', async () => {
  let resolveDecode;
  const classes = new Set();
  const img = { isConnected: true, naturalWidth: 640,
    decode: () => new Promise(resolve => { resolveDecode = resolve; }),
    closest: () => ({ classList: { add: name => classes.add(name) } }) };
  const { test: app } = setup({}, { dialogImages: [img] });
  app.openDetail('1');
  assert.equal(classes.has('image-ready'), false);
  resolveDecode();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(classes.has('image-ready'), true);
  classes.clear();
  app.openDetail('2');
  img.isConnected = false;
  resolveDecode();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(classes.has('image-ready'), false);
});

test('missing news URLs, image credits, images and full reviews use supported fallbacks', () => {
  const { test: app, element, events } = setup({}, { fixtures: true });
  app.openDetail('1');
  let html = element('#dlgInner').innerHTML;
  assert.ok(html.includes(escape(events[0].title)));
  assert.ok(!html.includes('<原標題>'));
  assert.ok(html.includes(`<span class="source-tag">圖片來源：${escape(events[0].imageSource[0])}</span>`));
  assert.equal((html.match(/class="nolink"/g) || []).length, 2);
  assert.ok(!html.includes('href=""') && !html.includes('google.com/search'));
  app.openDetail('2');
  html = element('#dlgInner').innerHTML;
  assert.ok(!html.includes('class="d-pic"'));
  assert.ok(html.includes('<p>以摘要作為回顧</p>'));
});

test('updated topic membership gives filters and event tags matching color families', () => {
  const { JRF_EVENT_TOPICS: topics, test: app, element } = setup();
  const expected = {
    '羈押與防逃': '重大事件與刑事政策',
    '偵查不公開': '重大事件與刑事政策',
    '冤案救援': '重大事件與刑事政策',
    '新興科技': '司法制度與資源'
  };
  assert.ok(topics.groups.every(group => group.tags.length > 0));
  app.go('review');
  for (const [tag, topic] of Object.entries(expected)) {
    const index = topics.groupOf(tag);
    assert.equal(topics.groups[index].topic, topic);
    app.toggleFilter(tag);
    assert.ok(element('#filters').innerHTML.includes(`class="chip t-tone-${index}" aria-pressed="true" data-f="${tag}"`));
    assert.ok(element('#timeline').innerHTML.includes(`class="tag tag-filter t-tone-${index}" data-f="${tag}" aria-pressed="true"`));
  }
});

test('personas weight events equally, deduplicate groups and handle ties independently of pick order', () => {
  const { JRF_EVENT_TOPICS: topics, test: app, events } = setup();
  const [first, second] = topics.groups.filter(group => group.tags.length);
  const persona = topics.personaOf;
  assert.equal(persona([]), null);
  assert.equal(persona([{ tags: [first.tags[0], first.tags[0]] }]).name, first.name);
  const multi = [{ tags: [first.tags[0], first.tags[0], second.tags[0]] }];
  assert.equal(persona(multi).name, '多元關注者');
  assert.equal(persona(multi).topics[0].score, 0.5);
  const choices = [...multi, { tags: [second.tags[0]] }];
  assert.equal(persona(choices).name, second.name);
  assert.equal(persona([...choices].reverse()).name, second.name);
  for (const event of events) assert.ok(app.personaOf([event.code]).name);
});

test('topic filters sort by event count, counting repeated timeline appearances only once', () => {
  const { test: app, element, JRF_TAGS, events } = setup();
  const counts = tag => events.filter(event => event.tags.includes(tag)).length;
  const expected = [...JRF_TAGS].sort((a, b) => counts(b) - counts(a));
  const filterTags = () => [...element('#filters').innerHTML.matchAll(/data-f="([^"]+)"/g)].map(match => match[1]);
  app.go('review');
  assert.deepEqual(filterTags(), ['全部', ...expected]);
  app.toggleTagList('filters');
  app.toggleFilter(expected.at(-1));
  assert.deepEqual(filterTags(), ['全部', ...expected]);
  for (const tag of expected) {
    assert.ok(element('#filters').innerHTML.includes(`data-f="${tag}">${tag}<span class="n">${counts(tag)}</span>`));
  }
});

test('tag lists start collapsed and keep the selected tag visible after collapse', () => {
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
  const visible = [...element('#filters').innerHTML.matchAll(/data-f="([^"]+)"/g)].slice(0, 5).map(match => match[1]);
  assert.ok(visible.includes(JRF_TAGS.at(-1)));
});

test('results page uses the annual voting results label in its heading and browser title', () => {
  const { test: app, element, document, JRF_CONFIG } = setup();
  app.go('result');
  assert.ok(element('#main').innerHTML.includes(`${JRF_CONFIG.year} 年度票選結果`));
  assert.match(document.title, /^年度票選結果｜/);
});

test('event tags toggle the same filter as the toolbar without changing selected events', () => {
  const { test: app, element, JRF_TAGS, events } = setup();
  const tag = JRF_TAGS.find(value => events.some(event => !event.tags.includes(value)));
  assert.ok(tag, 'use a tag that filters a subset of the current events');
  app.go('review');
  app.togglePick(events[0].code);
  assert.ok(element('#timeline').innerHTML.includes(`data-f="${escape(tag)}" aria-pressed="false"`));
  app.toggleFilter(tag);
  const selected = element('#timeline').innerHTML;
  const expected = events.filter(event => event.tags.includes(tag)).map(event => event.code);
  assert.deepEqual([...new Set(articles(selected).map(codeOf))].sort(), Array.from(expected).sort());
  assert.ok(selected.includes(`data-f="${escape(tag)}" aria-pressed="true" aria-label="取消篩選：${escape(tag)}"`));
  assert.ok(element('#filters').innerHTML.includes(`aria-pressed="true" data-f="${tag}"`));
  app.toggleFilter(tag);
  assert.deepEqual([...new Set(articles(element('#timeline').innerHTML).map(codeOf))], Array.from(events, event => event.code));
  assert.ok(element('#timeline').innerHTML.includes(`data-f="${escape(tag)}" aria-pressed="false"`));
  assert.deepEqual(Array.from(app.st.picks), [events[0].code]);
});

test('card tag filtering keeps event 5 below the sticky header when enabling and clearing a filter', () => {
  const { test: app, element, scrolls, events } = setup();
  const event = events.find(event => event.code === '5');
  app.go('review');
  element('.topbar').getBoundingClientRect = () => ({ bottom: 96 });
  const selector = '#timeline [data-event-code="5"]';
  element(selector).getBoundingClientRect = () => ({ top: 500 });
  scrolls.length = 0;
  for (const expectedCount of [events.filter(item => item.tags.includes(event.tags[0])).length, events.length]) {
    app.toggleFilter(event.tags[0], '5');
    assert.equal(new Set(articles(element('#timeline').innerHTML).map(codeOf)).size, expectedCount);
    assert.ok(element('#timeline').innerHTML.includes('data-event-code="5"'));
    assert.equal(scrolls.at(-1)[0].top, 200 + 500 - 96 - 16);
    assert.equal(scrolls.at(-1)[0].behavior, 'instant');
  }
  assert.equal(scrolls.length, 2);
  app.toggleFilter(event.tags[0]);
  assert.equal(scrolls.length, 2, 'toolbar filtering does not anchor to an event');
});

test('repeat cards show the current news headline and open their event without a separate review button or image credit', () => {
  const { test: app, element, events } = setup({}, { fixtures: true });
  app.go('review');
  const cards = articles(element('#timeline').innerHTML);
  assert.match(cards[0], /class="pic ratio-original"/);
  assert.match(cards[0], /<\/button><p class="pic-source"><span class="source-tag"/);
  const repeats = cards.filter(card => card.includes('class="ev repeat '));
  assert.equal(repeats.length, 2);
  for (const [index, card] of repeats.entries()) {
    const news = events[0].news[index + 1];
    assert.ok(card.includes(`<button class="repeat-news" data-open="1">${escape(news.title)}</button>`));
    assert.match(card, /<h3><time class="repeat-date"/);
    assert.ok(card.indexOf('class="repeat-date"') < card.indexOf('class="news-source"'));
    assert.ok(card.indexOf(`>${escape(news.media)}</span>`) < card.indexOf('class="repeat-news"'));
    assert.ok(card.includes(`<button class="repeat-review" data-open="1"><b>回看事件 1｜</b><span class="repeat-event-title">${escape(events[0].title)}</span>`));
    assert.ok(!/class="ev-code"|看完整回顧 →|class="btn btn-dark btn-small"|pic-source/.test(card));
    assert.match(card, /class="pic ratio-3-2"/);
  }
});

test('image height accounts for source/padding, updates on resize and keeps repeated pictures cropped', () => {
  let bodyHeight = 240, onResize, repeated = false;
  const img = { style: {}, clientWidth: 200, naturalWidth: 200, naturalHeight: 400, complete: true };
  const body = { getBoundingClientRect: () => ({ height: bodyHeight }) };
  const credit = { getBoundingClientRect: () => ({ height: 34 }) };
  const frame = { querySelector: selector => selector === 'img.pic' ? img : credit };
  const card = { classList: { contains: name => repeated && name === 'repeat' },
    querySelector: selector => selector === '.ev-body' ? body : selector === '.ev-image' ? frame : selector === '.pic-source' ? credit : img };
  const context = vm.createContext({
    document: { querySelectorAll: () => [card] },
    ResizeObserver: class { constructor(callback) { onResize = callback; } observe() {} disconnect() {} },
    getComputedStyle: node => node === frame ? { paddingTop: '20px', paddingBottom: '20px' }
      : node === credit ? { marginTop: '6px', marginBottom: '0px' } : { aspectRatio: 'auto' }
  });
  const start = appSource.indexOf('  let eventImageObserver;'), end = appSource.indexOf('  const expandedTagLists');
  assert.ok(start >= 0 && end > start);
  vm.runInContext(appSource.slice(start, end), context);
  context.fitEventImages();
  assert.equal(img.style.maxHeight, '160px');
  assert.equal(img.style.objectFit, 'contain');
  bodyHeight = 280;
  onResize();
  assert.equal(img.style.maxHeight, '200px');
  img.naturalHeight = 100;
  onResize();
  assert.equal(img.style.objectFit, '');
  repeated = true;
  img.naturalHeight = 400;
  onResize();
  assert.equal(img.style.objectFit, 'cover');
});
