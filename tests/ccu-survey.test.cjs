const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({ window: {} });
for (const file of ['data/ccu-survey.js', 'assets/survey-charts.js', 'assets/ccu-survey.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const data = context.window.JRF_CCU_SURVEY;
const page = context.window.JRF_CCU_PAGE;
const keys = ['neighborhoodSafety','policeSatisfaction','judgeFairness','antiDrugSatisfaction','antiFraudSatisfaction','opposeDeathPenaltyAbolition'];

test('all 48 percentages match the supplied series and each year has provenance', () => {
  const expected = [
    [91.3,77.5,21.9,48.6,51.0,79.6], [88.0,89.0,36.4,66.3,72.4,77.4],
    [87.9,85.4,26.7,63.4,66.7,76.8], [88.0,82.5,33.1,63.2,62.0,76.3],
    [83.1,73.1,32.8,55.3,46.7,87.8], [88.8,82.86,33.24,50.58,37.62,85.83],
    [93.7,88.86,45.8,62.53,45.66,87.97], [92.1,85.95,32.95,55.43,41.31,84.67]
  ];
  assert.equal(data.rows.length, 8);
  data.rows.forEach((row,i) => {
    assert.equal(row.year,2018+i);
    assert.equal(row.rocYear,107+i);
    keys.forEach((key,j) => assert.equal(row[key],expected[i][j]));
    assert.equal(data.reports[i].year,row.year);
    assert.ok(data.reports[i].id);
  });
  assert.equal(data.reports[5].sample,1804);
  assert.equal(data.reports[5].dates,'2024/01/07–01/12');
  assert.equal(data.reports[5].differentVersion,true);
});


const cards = () => [...page.render().matchAll(/<article class="poll ccu-poll ccu-safety"[\s\S]*?<\/article>/g)].map(match => match[0]);

test('all six cards share the latest format and retain source links', () => {
  const html = page.render(), rendered = cards();
  assert.equal(rendered.length,6);
  assert.equal((html.match(/class="ccu-safety-chart"/g) || []).length,6);
  assert.equal((html.match(/class="safety-label safety-label-latest"/g) || []).length,8);
  assert.ok(!html.includes('平均'));
  assert.ok(!html.includes('ccu-latest'));
  assert.ok(!html.includes('ccu-readout'));
  assert.ok(!html.includes('<details>'));
  assert.ok(html.indexOf('資料解讀注意事項') < html.indexOf('歷年調查結果'));
  rendered.forEach((card,i) => {
    const key = keys[i];
    assert.ok(card.includes(`data-metric="${key}"`));
    assert.ok(card.includes('2025 年'));
    assert.ok(card.includes('role="img"'));
    assert.ok(!card.includes('ccu-safety-footer'));
    assert.ok(!card.includes('民國'));
    assert.ok(!card.includes('資料來源'));
    assert.ok(card.includes(String(data.rows[7][key])));
    const delta = Math.abs(data.rows[7][key]-data.rows[6][key]).toFixed(1);
    assert.ok(card.includes(`${delta}%`));
  });
  assert.ok(!html.includes('107年（2018）調查報告'));
  assert.ok(!html.includes('各年度訪問資訊'));
  assert.ok(!html.includes('調查方法與統計限制'));
  const version = html.slice(html.indexOf('id="ccu-112"'));
  assert.ok(version.includes('1,804人'));
  assert.ok(version.includes('並非本頁採用的資料'));
  data.supplementarySources.forEach(([,url]) => assert.ok(version.includes(url)));
  data.supplementarySources.forEach(([,url]) => assert.ok(html.includes(url)));
  const preview = page.preview();
  assert.ok(preview.includes('法官公平公正審理刑事案件的正面評價'));
  assert.ok(preview.includes('33.24'));
});

test('death penalty preserves three series, published precision and legends below the plot', () => {
  const expected = [[53,26.6],[46.3,31.1],[45.1,31.7],[43.6,32.7],[62.1,25.7],[62.7,23.1],[66.01,21.96],[66.91,17.76]];
  data.rows.forEach((row,i) => {
    assert.equal(row.completelyOpposeAbolition,expected[i][0]);
    assert.equal(row.conditionallyOpposeAbolition,expected[i][1]);
    if (row.year !== 2023) assert.equal(+(row.completelyOpposeAbolition + row.conditionallyOpposeAbolition).toFixed(2),row.opposeDeathPenaltyAbolition);
  });
  const html = cards()[5];
  assert.ok(html.indexOf('class="ccu-legend"') > html.indexOf('</svg></div>'));
  assert.equal((html.match(/role="group"/g) || []).length,3);
  assert.ok(html.includes('stroke-dasharray="6 3"'));
  assert.ok(!html.includes('縱軸為 0%–100%'));
  for (const label of html.matchAll(/<text class="safety-label[^"]*"[^>]*data-series="conditionallyOpposeAbolition" data-year="(\d+)"[^>]*y="([^"]+)"/g)) {
    const row = data.rows.find(r => r.year === Number(label[1]));
    assert.ok(Number(label[2]) > 34+(100-row.conditionallyOpposeAbolition)*2);
  }
});

test('safety summary is calculated from data and the truncated scale is disclosed', () => {
  let html = cards()[0];
  assert.ok(html.includes('<h2>認為住家附近治安狀況良好的比例</h2>'));
  assert.ok(html.includes('92.1<span>%</span>'));
  assert.ok(html.includes('1.6%'));
  assert.ok(!html.includes('縱軸自 80% 起，以凸顯年度變化'));
  assert.ok(html.includes('縱軸80%至96%'));
  for (const tick of [80,85,90,95]) assert.ok(html.includes(`>${tick}%</text>`));
  assert.ok(!html.includes('>0%</text>'));
  const last = data.rows[7], original = last.neighborhoodSafety;
  try {
    last.neighborhoodSafety = 95.7;
    html = cards()[0];
    assert.ok(html.includes('95.7<span>%</span>'));
    assert.ok(html.includes('2.0%'));
    assert.ok(html.includes('M6 10V2M2.5 5.5L6 2l3.5 3.5'));
  } finally { last.neighborhoodSafety = original; }
});


test('label boxes avoid all series segments, including the three death penalty lines', () => {
  cards().forEach(card => {
    const paths = [...card.matchAll(/<g role="group"[^>]*><path d="([^"]+)"/g)].map(match => {
      const coords = match[1].match(/-?[\d.]+/g).map(Number);
      return Array.from({length:coords.length/2},(_,i) => ({x:coords[i*2],y:coords[i*2+1]}));
    });
    const labels = [...card.matchAll(/<text class="(safety-label[^"]*)"[^>]*data-series="[^"]+" data-year="[^"]+" x="([^"]+)" y="([^"]+)"[^>]*>([^<]+)<\/text>/g)];
    assert.ok(labels.length >= 8);
    labels.forEach(([,cls,x,y,text]) => {
      const font = cls.includes('latest') ? 14 : 12;
      const left = Number(x)-text.length*font*0.34-4, right = Number(x)+text.length*font*0.34+4;
      const top = Number(y)-font-3, bottom = Number(y)+4;
      paths.forEach(points => points.slice(1).forEach((b,i) => {
        const a = points[i];
        for (let step=0;step<=200;step++) {
          const px = a.x+(b.x-a.x)*step/200, py = a.y+(b.y-a.y)*step/200;
          assert.ok(!(px >= left && px <= right && py >= top && py <= bottom),`line overlaps ${text}`);
        }
      }));
    });
    assert.ok(card.indexOf('class="safety-label-layer"') > card.lastIndexOf('<circle'));
  });
});
