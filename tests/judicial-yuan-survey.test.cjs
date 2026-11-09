const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function element() {
  return {children:[],_text:'',set textContent(value){this._text=value;},
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');},
    append(...children){this.children.push(...children);},replaceChildren(...children){this._text='';this.children=children;}};
}
const ctx = vm.createContext({window:{},document:{createElement:element}});
for (const file of ['data/judicial-yuan-survey.js','assets/survey-charts.js','assets/judicial-yuan-survey.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
}
const D = ctx.window.JRF_JUDICIAL_SURVEY, page = ctx.window.JRF_JUDICIAL_PAGE;
const expected = {
  law:'92.0/4.9 91.1/4.7 90.7/5.0 92.4/5.2 91.6/5.8 90.4/5.5',
  punish:'86.0/10.8 86.7/8.4 87.1/7.8 88.2/8.0 88.2/7.7 87.4/7.3',
  silence:'43.9/48.3 36.3/51.6 41.2/47.6 38.0/52.8 45.6/44.7 46.3/42.5',
  sentence:'46.5/50.1 45.6/51.6 45.4/51.5 51.9/44.5 60.6/35.1 60.4/33.4 60.8/32.8 59.6/34.6 59.5/34.9 65.8/27.3',
  lawful:'45.6/51.6 46.9/51.0 46.1/50.5 53.5/43.5 58.3/37.4 58.0/36.8 60.0/33.9 60.7/34.9 55.6/38.7 64.5/27.2',
  independent:'28.8/67.6 30.9/67.0 30.0/66.8 33.1/63.9 35.5/59.4 35.2/58.8 41.0/52.4 44.4/50.1 56.0/38.2 54.2/38.1',
  judge_trust:'35.8/58.2 39.6/56.4 38.7/56.8 44.6/50.2 53.9/41.1 54.7/38.1 58.8/34.3 58.7/34.7 55.8/38.0 59.8/31.7',
  court_overall:'63.5/31.8 67.0/30.6 68.8/26.0 69.3/25.0 74.3/19.8 73.7/19.2 75.6/17.5 76.1/18.0 73.2/18.5 74.5/19.1',
  judge_attitude:'64.8/33.4 64.6/34.0 70.2/26.7 68.6/28.8 68.4/29.4 68.2/25.6 70.2/24.2 70.6/25.0 68.6/24.9 74.4/21.2',
  hearing_time:'62.3/32.1 60.7/37.5 67.6/25.5 68.1/28.4 68.6/28.3 69.1/26.3 70.2/25.9 69.3/27.1 70.8/24.0 78.8/16.8',
  case_progress:'52.6/43.8 47.8/49.5 56.8/39.5 59.5/38.7 61.6/34.5 57.6/36.8 62.4/33.3 57.3/37.0 60.1/35.4 63.4/31.4',
  credibility:'55.7/42.5 51.7/46.2 59.1/33.9 54.3/42.2 61.3/36.0 63.9/29.2 65.1/31.3 65.2/31.8 64.7/30.3 65.1/23.4'
};
const rawKeys=['veryPositive','somewhatPositive','neutral','somewhatNegative','veryNegative','noOpinionOrRefused'];
function labelsFor(id) {
  if(['law','punish','silence'].includes(id)) return ['非常支持','還算支持','普通','不太支持','完全不支持','無意見／拒答'];
  if(['sentence','lawful','independent'].includes(id)) return ['非常同意','還算同意','普通','不太同意','完全不同意','無意見／拒答'];
  if(id==='judge_trust') return ['非常信任','還算信任','普通','不太信任','完全不信任','無意見／拒答'];
  return ['非常滿意','還算滿意','普通','不太滿意','非常不滿意','無意見／拒答'];
}
function expectedTooltip(row,id) {
  const labels=labelsFor(id);
  return [`民國${row.year}年`,`本題樣本數：${row.sampleSize.toLocaleString('zh-TW')}`,
    ...rawKeys.map((key,i)=>`${labels[i]}：${row.rawResponses[key].toFixed(1)}%`)].join('\n');
}
const cards = () => [...page.render().matchAll(/<article class="poll[\s\S]*?<\/article>/g)].map(m=>m[0]);
const getPath = html => html.match(/<g role="group"[^>]*><path d="([^"]+)"/)[1];
const segmentLengths = path => path.split('M').filter(Boolean).map(segment => 1+(segment.match(/L/g)||[]).length);

test('all 216 percentages match the supplied published totals in the requested order', () => {
  assert.deepEqual(Array.from(D.metrics,m=>m.id),Object.keys(expected));
  let count=0;
  D.metrics.forEach((metric,index) => {
    const pairs = expected[metric.id].split(' ').map(pair=>pair.split('/').map(Number));
    assert.equal(metric.rows.length,index<3 ? 6 : 10);
    metric.rows.forEach((row,i)=>{
      assert.equal(row.year,(index<3 ? 109 : 105)+i);
      assert.equal(row.positive,pairs[i][0]); assert.equal(row.negative,pairs[i][1]); count+=2;
    });
  });
  assert.equal(count,216);
});

test('12 charts keep positive paths and expose six raw categories with question-specific samples', () => {
  const html=page.render(), rendered=cards();
  assert.equal(rendered.length,12);
  assert.equal((html.match(/class="gvm-point"/g)||[]).length,108);
  assert.equal((html.match(/>100%<\/text>/g)||[]).length,12);
  assert.equal((html.match(/>0%<\/text>/g)||[]).length,12);
  assert.ok(!/<table|<details|NaN|undefined/.test(html));
  assert.equal((html.match(/href="https:\/\//g)||[]).length,1);
  assert.ok(html.includes(`href="${D.sourceUrl}" target="_blank" rel="noopener"`));
  D.metrics.forEach((metric,i) => {
    assert.equal((rendered[i].match(/<g role="group"/g)||[]).length,1);
    if(i<3) {
      assert.ok(rendered[i].includes('109–114年'));
      assert.ok(!rendered[i].includes('data-year="105"'));
      assert.ok(!rendered[i].includes('data-year="108"'));
    }
    const points=[...rendered[i].matchAll(/class="gvm-point"[^>]*data-year="(\d+)" data-value="([^"]+)" data-tooltip="([^"]+)" data-x="([^"]+)" data-y="([^"]+)"/g)];
    assert.equal(points.length,metric.rows.length);
    points.forEach((point,j)=>{
      const row=metric.rows[j];
      assert.equal(Number(point[1]),row.year);
      assert.equal(Number(point[2]),row.positive);
      assert.equal(point[3],expectedTooltip(row,metric.id));
      assert.equal(point[3].split('\n').length,8);
      assert.ok(!/正向比例|負向比例/.test(point[3]));
      assert.ok(Math.abs(Number(point[5])-(234-2*row.positive))<0.000001);
    });
  });
  assert.ok(rendered[6].includes('非常信任：10.1%'));
  assert.ok(rendered[6].includes('無意見／拒答：4.2%'));
});

test('question changes produce an independent 109 point and four same-color independence segments', () => {
  const rendered=cards();
  D.metrics.forEach((metric,i)=>{
    const expectedLengths=metric.id==='punish' ? [1,5] : metric.id==='independent' ? [4,2,2,2] : [metric.rows.length];
    assert.deepEqual(segmentLengths(getPath(rendered[i])),expectedLengths);
  });
  assert.deepEqual(Array.from(D.metrics[5].rows.filter(row=>row.breakBefore),row=>row.year),[109,111,113]);
  assert.ok(rendered[1].includes('治亂世用重典'));
  assert.ok(rendered[2].includes('112年改為'));
  assert.ok(rendered[2].includes('113–114年改為'));
  assert.ok(rendered[9].includes('陳述或辯護'));
});

test('each audience explanation precedes its associated charts', () => {
  const html=page.render();
  const first=html.indexOf('第一種調查對象：曾到法院的民眾。');
  const overall=html.indexOf('data-metric="judicial-court_overall"');
  const second=html.indexOf('第二種調查對象：曾參與訴訟且有開庭經驗的民眾。');
  const attitude=html.indexOf('data-metric="judicial-judge_attitude"');
  assert.ok(first<overall && overall<second && second<attitude);
  assert.ok(html.indexOf('全體受訪民眾。三項題目')<html.indexOf('data-metric="judicial-law"'));
  assert.ok(html.indexOf('全體受訪民眾，不限是否曾到法院。')<html.indexOf('data-metric="judicial-sentence"'));
});

test('missing values and explicit breaks do not connect or produce zero-value points', () => {
  const rows=[{year:105,value:40},{year:106,value:null},{year:107,value:50},{year:108,value:51,breakBefore:true},{year:109,value:52}];
  const html=ctx.window.JRF_SURVEY_CHARTS.chart(rows,'value','缺值測試','#246E87',{interactive:true});
  assert.deepEqual(segmentLengths(getPath(html)),[1,1,2]);
  assert.equal((html.match(/class="gvm-point"/g)||[]).length,4);
  assert.ok(!html.includes('data-year="106"'));
  assert.ok(!/NaN|data-value="0.0"|null%/.test(html));
});

test('hover, touch and keyboard return the supplied tooltip at 105 and each transition year', () => {
  const tooltip=Object.assign(element(),{hidden:true,style:{},offsetWidth:144,offsetHeight:180});
  const readTooltip=()=>{
    const [year,sample,distribution]=tooltip.children;
    const rows=[];
    for(let i=0;i<distribution.children.length;i+=2) rows.push(`${distribution.children[i].textContent}：${distribution.children[i+1].textContent}`);
    return [year.textContent,sample.textContent,...rows].join('\n');
  };
  const metric=D.metrics.find(m=>m.id==='independent');
  const points=metric.rows.map(row=>({
    dataset:{year:row.year,x:64+(row.year-105)/9*418,y:234-row.positive*2,
      tooltip:expectedTooltip(row,metric.id)},
    handlers:{},addEventListener(type,handler){this.handlers[type]=handler;},focus(){this.handlers.focus();}
  }));
  const card={querySelector:selector=>selector==='.gvm-tooltip' ? tooltip : {clientWidth:280,clientHeight:160},querySelectorAll:()=>points};
  page.bind({querySelectorAll:selector=>selector==='[data-judicial-jump]' ? [] : [card]});
  for(const year of [105,109,110,111,112,113,114]) {
    const p=points.find(p=>p.dataset.year===year);
    for(const event of ['pointerenter','focus','click']) {
      p.handlers[event]();assert.equal(tooltip.hidden,false);assert.equal(readTooltip(),p.dataset.tooltip);
      assert.ok(parseFloat(tooltip.style.left)>=76 && parseFloat(tooltip.style.left)<=204);
    }
  }
  const key=value=>({key:value,preventDefault(){}});
  points[0].handlers.keydown(key('End'));assert.equal(readTooltip(),points[9].dataset.tooltip);
  points[9].handlers.keydown(key('Home'));assert.equal(readTooltip(),points[0].dataset.tooltip);
  points[0].handlers.keydown(key('Escape'));assert.equal(tooltip.hidden,true);
});

test('new hash detail follows existing navigation without adding a menu or altering old anchors', () => {
  const app=fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8');
  const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(app.includes('href="#judicial-yuan-survey" data-go="judicial-yuan-survey"'));
  assert.ok(app.includes('"judicial-yuan-survey": pageJudicialYuanSurvey'));
  assert.ok(app.includes('"ccu-survey": pageCcuSurvey'));
  assert.ok(app.includes('"gvm-survey": pageGvmSurvey'));
  assert.ok(!app.match(/const NAV = (.*);/)[1].includes('judicial-yuan-survey'));
  assert.ok(index.indexOf('assets/survey-charts.js')<index.indexOf('assets/judicial-yuan-survey.js'));
  assert.ok(index.indexOf('data/judicial-yuan-survey.js')<index.indexOf('assets/judicial-yuan-survey.js'));
  assert.ok(index.indexOf('assets/judicial-yuan-survey.js')<index.indexOf('assets/app.js'));
});

test('all 108 raw distributions retain six published values and the proper per-question sample', () => {
  const totalSamples=[5265,5267,5056,5007,5007,5007,5004,5006,5006,5006];
  const courtSamples=[1466,1367,1354,1517,1681,1817,1687,1726,1584,1587];
  const hearingSamples=[484,389,411,407,427,502,428,506,497,394];
  let count=0;
  D.metrics.forEach((metric,i)=>metric.rows.forEach(row=>{
    const expectedSample=i<7 ? totalSamples[row.year-105] : i===7 ? courtSamples[row.year-105] : hearingSamples[row.year-105];
    assert.equal(row.sampleSize,expectedSample);
    assert.deepEqual(Object.keys(row.rawResponses),rawKeys);
    rawKeys.forEach(key=>{
      assert.equal(typeof row.rawResponses[key],'number');
      assert.ok(row.rawResponses[key]>=0 && row.rawResponses[key]<=100);
      count++;
    });
  }));
  assert.equal(count,648);
  const checks=[
    ['credibility',114,394,[16.9,48.2,3.5,11.2,12.1,8.0]],
    ['law',113,5006,[47.9,43.7,0.9,4.8,0.9,1.7]],
    ['judge_attitude',105,484,[10.1,54.7,0.6,17.9,15.5,1.2]]
  ];
  checks.forEach(([id,year,sample,values])=>{
    const row=D.metrics.find(metric=>metric.id===id).rows.find(row=>row.year===year);
    assert.equal(row.sampleSize,sample);
    assert.deepEqual(rawKeys.map(key=>row.rawResponses[key]),values);
  });
  const law=D.metrics[0].rows.find(row=>row.year===114);
  assert.equal(law.positive,90.4);
  assert.equal(+(law.rawResponses.veryPositive+law.rawResponses.somewhatPositive).toFixed(1),90.3);
  const credibility=D.metrics.find(metric=>metric.id==='credibility').rows.find(row=>row.year===114);
  assert.equal(+rawKeys.reduce((sum,key)=>sum+credibility.rawResponses[key],0).toFixed(1),99.9);
});
