const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({window:{}});
for (const file of ['data/gvm-survey.js','assets/survey-charts.js','assets/gvm-survey.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
}
const D = ctx.window.JRF_GVM_SURVEY, page = ctx.window.JRF_GVM_PAGE;
const plain = value => JSON.parse(JSON.stringify(value));

test('all specified data are preserved without interpolating missing years', () => {
  assert.deepEqual(plain(D.judge.map(({year,trust}) => [year,trust])),[
    [2006,47.6],[2008,40],[2013,32.5],[2015,42],[2017,32.8],[2019,39.6],[2021,43.1],[2024,45.8]
  ]);
  assert.deepEqual(plain(D.police.map(({year,trust}) => [year,trust])),[
    [2006,45.2],[2008,45.6],[2013,50.5],[2015,61.8],[2017,70],[2019,76.5],[2024,70]
  ]);
  assert.deepEqual(plain(D.fairness.map(({year,negative}) => [year,negative])),[
    [2008,47.2],[2013,68.9],[2017,65.8],[2019,63]
  ]);
  for (const rows of [D.judge,D.police,D.fairness]) {
    rows.forEach(row => assert.ok(D.sources.some(source => source.id === row.sourceId)));
  }
  for (const rows of [D.judge,D.police]) {
    rows.filter(row => row.year <= 2017).forEach(row => assert.equal(row.sourceId,'npa2017'));
    assert.ok(rows.every(row => row.year !== 2001));
  }
});

test('three charts use 0–100 axes, actual year distances, and exact tooltip text', () => {
  const html = page.render();
  assert.equal((html.match(/class="ccu-safety-chart"/g)||[]).length,3);
  assert.equal((html.match(/>100%<\/text>/g)||[]).length,3);
  assert.equal((html.match(/>0%<\/text>/g)||[]).length,3);
  const charts = [...html.matchAll(/<article class="poll[\s\S]*?<\/article>/g)].map(m => m[0]);
  [D.judge,D.police,D.fairness].forEach((rows,i) => {
    const field = i === 2 ? 'negative' : 'trust';
    const points = [...charts[i].matchAll(/class="gvm-point"[^>]*data-year="(\d+)" data-value="([^"]+)" data-x="([^"]+)"/g)];
    assert.equal(points.length,rows.length);
    points.forEach((point,j) => {
      assert.equal(Number(point[1]),rows[j].year);
      assert.equal(point[2],rows[j][field].toFixed(1));
      assert.ok(charts[i].includes(`aria-label="${point[1]}年｜${point[2]}%"`));
      const expected = 64+(rows[j].year-rows[0].year)/(rows[rows.length-1].year-rows[0].year)*418;
      assert.ok(Math.abs(Number(point[3])-expected)<0.000001);
    });
    const x = year => Number(points.find(p => Number(p[1])===year)[3]);
    if (i < 2) assert.ok(Math.abs((x(2013)-x(2008))/(x(2017)-x(2015))-2.5)<0.000001);
    else assert.ok(Math.abs((x(2013)-x(2008))/(x(2019)-x(2017))-2.5)<0.000001);
  });
  assert.ok(!charts[1].includes('data-year="2021"'));
});

test('fairness chart, shared note and all source URLs appear in the required order', () => {
  const html = page.render();
  assert.equal((html.match(/class="card gvm-fairness-card"/g)||[]).length,0);
  assert.equal((html.match(/<strong>資料說明：/g)||[]).length,1);
  assert.ok(html.indexOf('data-metric="gvmFairness"') < html.indexOf('gvm-data-note'));
  assert.ok(html.indexOf('gvm-data-note') < html.indexOf('<h2>資料來源</h2>'));
  assert.ok(!html.includes('<table'));
  assert.ok(!html.includes('律師'));
  assert.ok(!html.includes('排名'));
  assert.ok(html.includes('1,074名20歲以上'));
  assert.ok(html.includes('僅適用2024年'));
  const urls = [
    'https://www.npa.gov.tw/ch/app/data/doc?detailNo=798843201229189120&module=wg031&type=s',
    'https://gvsrc.cwgv.com.tw/articles/index/14810/6','https://www.gvm.com.tw/article/61091',
    'https://www.judicial.gov.tw/en/cp-1637-821633-be437-2.html',
    'https://www.gvm.com.tw/article/112824','https://www.gvm.com.tw/article/18138',
    'https://www.sunnyswa.org.tw/15842/'
  ];
  urls.forEach(url => assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener"`)));
  assert.ok(html.includes('新聞轉載來源'));
});

test('pointer, touch and keyboard show only the selected year and percentage', () => {
  const tooltip = {hidden:true,style:{}};
  const points = D.judge.map((row,i) => ({
    dataset:{year:String(row.year),value:row.trust.toFixed(1),x:64+i*50,y:100}, handlers:{},
    addEventListener(type,handler) { this.handlers[type]=handler; },
    focus() { this.handlers.focus(); }
  }));
  const card = {querySelector:() => tooltip,querySelectorAll:() => points};
  page.bind({querySelectorAll:() => [card]});
  for (const type of ['pointerenter','focus','click']) {
    points[4].handlers[type]();
    assert.equal(tooltip.hidden,false);
    assert.equal(tooltip.textContent,'2017年｜32.8%');
  }
  let prevented = 0;
  const key = value => ({key:value,preventDefault(){prevented++;}});
  points[4].handlers.keydown(key('ArrowRight'));
  assert.equal(tooltip.textContent,'2019年｜39.6%');
  points[5].handlers.keydown(key('End'));
  assert.equal(tooltip.textContent,'2024年｜45.8%');
  points[7].handlers.keydown(key('Home'));
  assert.equal(tooltip.textContent,'2006年｜47.6%');
  points[0].handlers.keydown(key('Escape'));
  assert.equal(tooltip.hidden,true);
  points[0].handlers.click(); points[0].handlers.blur();
  assert.equal(tooltip.hidden,true);
  assert.equal(prevented,3);
});

test('shared card format, headings and judge preview integrate under judicial polls', () => {
  const html = page.render();
  assert.equal((html.match(/<h2 class="sec-title">歷年調查結果<\/h2>/g)||[]).length,1);
  assert.ok(!html.includes('<h2 class="sec-title">司法能否維護公平正義'));
  assert.ok(html.includes('<h2>法官信任度</h2>'));
  assert.ok(html.includes('<h2>警察信任度</h2>'));
  assert.equal((html.match(/class="ccu-safety-chip"/g)||[]).length,3);
  assert.equal((html.match(/較前次調查/g)||[]).length,3);
  assert.equal((html.match(/class="safety-label-layer"/g)||[]).length,3);
  assert.equal((html.match(/class="safety-label(?: safety-label-latest)?"/g)||[]).length,19);
  const preview = page.preview();
  assert.ok(preview.includes('<h4>法官信任度</h4>'));
  assert.ok(preview.includes('47.6'));
  assert.ok(preview.includes('45.8'));
  assert.ok(!preview.includes('警察'));
  const app = fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8');
  const nav = app.match(/const NAV = (.*);/)[1];
  assert.ok(!nav.includes('gvm-survey'));
  assert.ok(app.includes('window.JRF_GVM_PAGE.preview()'));
  assert.ok(app.includes('["ccu-survey", "gvm-survey"].includes(PAGE) ? "polls"'));
});
