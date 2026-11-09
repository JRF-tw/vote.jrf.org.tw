/* 沿用網站SVG圖表，不另引入套件。原始數值及年度來源獨立存於資料檔。 */
(function () {
  'use strict';
  const metrics = [
    ['neighborhoodSafety','住家附近治安狀況良好','民眾對自身居住社區及住家附近治安狀況的正面觀感。','#3A5BD9'],
    ['policeSatisfaction','警察維護治安工作滿意度','民眾對警察維護社會治安工作表現的滿意程度。','#167360'],
    ['judgeFairness','法官公平公正審理刑事案件的正面評價','民眾對法院法官能否公平公正審理與判決刑事案件的主觀評價。不等同於司法院調查中的「法官信任度」。','#A63243'],
    ['antiDrugSatisfaction','政府強力緝毒滿意度','民眾對政府強力查緝毒品犯罪相關作為的正面評價。','#7550A0'],
    ['antiFraudSatisfaction','政府防制詐騙滿意度','民眾對政府防制詐騙犯罪措施與努力的滿意程度。','#94600F'],
    ['opposeDeathPenaltyAbolition','不贊成廢除死刑','包括「完全不贊成廢除死刑」及「基本上不贊成廢除死刑，但如有配套措施願意考慮」。不代表全體反對者皆無條件支持死刑。','#246E87']
  ];
  const percent = value => Number.isInteger(value) ? value.toFixed(1) : String(value);
  const link = (label, url) => `<a href="${url}" target="_blank" rel="noopener">${label} ↗</a>`;
  const chartSettings = {
    neighborhoodSafety: {title:'認為住家附近治安狀況良好的比例', color:'#2F5BD3', min:80, max:96, ticks:[80,85,90,95]},
    policeSatisfaction: {min:70, max:95, ticks:[70,75,80,85,90,95]},
    judgeFairness: {min:20, max:50, ticks:[20,30,40,50]},
    antiDrugSatisfaction: {min:40, max:70, ticks:[40,50,60,70]},
    antiFraudSatisfaction: {min:30, max:80, ticks:[30,40,50,60,70,80]},
    opposeDeathPenaltyAbolition: {min:0, max:100, ticks:[0,25,50,75,100]}
  };
  // 以文字外框檢查所有序列的線段、資料點與已放置標籤；不以線段斜率決定位置。
  function segmentHitsBox(a, b, box) {
    let start = 0, end = 1;
    for (const [position, distance, low, high] of [
      [a.x,b.x-a.x,box.left,box.right], [a.y,b.y-a.y,box.top,box.bottom]
    ]) {
      if (distance === 0) { if (position < low || position > high) return false; }
      else {
        const t1 = (low-position)/distance, t2 = (high-position)/distance;
        start = Math.max(start,Math.min(t1,t2)); end = Math.min(end,Math.max(t1,t2));
        if (start > end) return false;
      }
    }
    return true;
  }
  function placeLabels(series, rows, x, y) {
    const points = series.flatMap(([field]) => rows.map((row,i) => ({field,index:i,x:x(i),y:y(row[field])})));
    const segments = series.flatMap(([field]) => rows.slice(1).map((row,i) => [
      {x:x(i),y:y(rows[i][field])}, {x:x(i+1),y:y(row[field])}
    ]));
    const placed = [];
    return points.map(point => {
      const last = point.index === rows.length-1, font = last ? 14 : 12;
      const text = percent(rows[point.index][point.field]);
      const halfWidth = text.length*font*0.34 + 4;
      const purple = point.field === 'conditionallyOpposeAbolition';
      const offsets = purple ? [24,34,44,54] : [-16,24,-28,36,-40,48];
      const candidates = offsets.flatMap(dy => [0,-12,12].map(dx => {
        const labelX = Math.max(44+halfWidth,Math.min(504-halfWidth,point.x+dx));
        const labelY = Math.max(18,Math.min(240,point.y+dy));
        const box = {left:labelX-halfWidth,right:labelX+halfWidth,top:labelY-font-3,bottom:labelY+4};
        const lineHits = segments.filter(([a,b]) => segmentHitsBox(a,b,box)).length;
        const pointHits = points.filter(p => {
          const radius = p.index === rows.length-1 ? 10 : 5;
          const nearX = Math.max(box.left,Math.min(box.right,p.x));
          const nearY = Math.max(box.top,Math.min(box.bottom,p.y));
          return (nearX-p.x)**2+(nearY-p.y)**2 <= radius**2;
        }).length;
        const labelHits = placed.filter(b => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top).length;
        return {labelX,labelY,box,score:lineHits*1000+pointHits*1000+labelHits*3000+Math.abs(dy)*0.1+Math.abs(dx)*0.2};
      }));
      const best = candidates.sort((a,b) => a.score-b.score)[0];
      placed.push(best.box);
      return {...point,...best,last,text};
    });
  }
  function trendChart(rows, key, title, color) {
    const {min,max,ticks} = chartSettings[key], latest = rows[rows.length-1];
    const x = i => 64 + i * (510 - 64 - 28) / (rows.length-1);
    const y = value => 34 + (max - value) / (max-min) * 200;
    const series = key === 'opposeDeathPenaltyAbolition' ? [
      [key,'加總',color,'2 3'],
      ['completelyOpposeAbolition','完全不贊成廢除死刑','#A63243',''],
      ['conditionallyOpposeAbolition','基本上不贊成廢除死刑，但如有配套措施願意考慮','#7550A0','6 3']
    ] : [[key,title,color,'']];
    const labelPositions = placeLabels(series,rows,x,y);
    const line = field => rows.map((row,i) => `${i ? 'L' : 'M'}${x(i)} ${y(row[field])}`).join(' ');
    const legend = series.length > 1 ? `<ul class="ccu-legend" aria-label="圖例">${series.map(([,label,c,dash]) => `<li><svg viewBox="0 0 30 12" aria-hidden="true"><line x1="0" x2="30" y1="6" y2="6" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/></svg><span style="color:${c}">${label}</span></li>`).join('')}</ul>` : '';
    return `<div class="ccu-safety-plot"><svg class="ccu-safety-chart" viewBox="0 0 510 270" role="img" aria-label="${rows[0].year} 至 ${latest.year} 年${title}折線圖，${latest.year} 年為 ${percent(latest[key])}%，縱軸${min}%至${max}%" aria-describedby="${key}-values">
      <desc id="${key}-values">${series.map(([field,label]) => `${label}：${rows.map(row => `${row.year}年${percent(row[field])}%`).join('；')}`).join('。')}。</desc>
      ${ticks.map(value => `<line x1="44" x2="490" y1="${y(value)}" y2="${y(value)}" stroke="var(--safety-grid)"/><text class="safety-axis" x="32" y="${y(value)+4}" text-anchor="end">${value}%</text>`).join('')}
      <path d="${line(key)} L${x(rows.length-1)} ${y(min)} L${x(0)} ${y(min)} Z" fill="${color}" fill-opacity="0.07"/>
      ${series.map(([field,label,c,dash]) => `<g role="group" aria-label="${label}"><path d="${line(field)}" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="${dash}" stroke-linejoin="round" stroke-linecap="round"/>
        ${rows.map((row,i) => {
          const last = i === rows.length-1;
          return `<g><title>${label}，${row.year}年：${percent(row[field])}%</title>
          ${last ? `<circle cx="${x(i)}" cy="${y(row[field])}" r="9" fill="${c}" fill-opacity="0.15"/>` : ''}
          <circle cx="${x(i)}" cy="${y(row[field])}" r="${last ? 5 : 3.5}" fill="${last ? c : 'white'}" stroke="${last ? 'white' : c}" stroke-width="2"/></g>`;
        }).join('')}</g>`).join('')}
      <g class="safety-label-layer">${labelPositions.map(p => {
        const color = series.find(([field]) => field === p.field)[2];
        return `<text class="safety-label${p.last ? ' safety-label-latest' : ''}"${p.last ? ` style="fill:${color}"` : ''} data-series="${p.field}" data-year="${rows[p.index].year}" x="${p.labelX}" y="${p.labelY}" text-anchor="middle">${p.text}</text>`;
      }).join('')}</g>
      ${rows.map((row,i) => `<text class="safety-axis${i === rows.length-1 ? ' safety-year-latest' : ''}" x="${x(i)}" y="262" text-anchor="middle">${row.year}</text>`).join('')}
      </svg></div>${legend}`;
  }
  function trendCard(rows, key, metricTitle, metricColor) {
    const settings = chartSettings[key], title = settings.title || metricTitle, color = settings.color || metricColor;
    const latest = rows[rows.length-1], previous = rows[rows.length-2];
    const delta = +(latest[key]-previous[key]).toFixed(1);
    const arrow = delta < 0 ? 'M6 2v8M2.5 6.5L6 10l3.5-3.5' : 'M6 10V2M2.5 5.5L6 2l3.5 3.5';
    return `<article class="poll ccu-poll ccu-safety" data-metric="${key}" style="--safety-accent:${color}">
      <h2>${title}</h2>
      <div class="ccu-safety-headline"><div class="ccu-safety-number">${percent(latest[key])}<span>%</span></div>
      <div class="ccu-safety-context"><span class="ccu-safety-year">${latest.year} 年</span><span class="ccu-safety-chip">較前一年度${delta === 0 ? '<span>持平</span>' : `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="${arrow}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${Math.abs(delta).toFixed(1)}%</span>`}</span></div></div>
      ${trendChart(rows,key,title,color)}
    </article>`;
  }
  function render() {
    const D = window.JRF_CCU_SURVEY, rows = D.rows, latest = rows[rows.length-1];
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a>
      <h1 class="page-title ccu-title">臺灣民眾對司法與犯罪防制滿意度調查</h1><p class="page-sub">107–114年度（2018–2025）｜國立中正大學犯罪研究中心及犯罪防治學系</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card">
      <h2>關於這項調查</h2><p>這個調查透過定期民意調查，了解臺灣民眾對居住環境治安、警察維護治安、法院刑事審判公正性及政府犯罪防制措施的主觀評價，觀察民意變化，作為公共政策研究及社會討論的參考。</p>
      <p>本頁年度依研究報告所屬年度標示。研究通常在該年度結束後、次年1月至2月進行電話訪問，調查有效樣本約1,800至1,900人，並於次年2月左右召開記者會發布結果。</p>
      <a href="#" data-ccu-jump="ccu-sources">資料來源與112年度版本說明 ↓</a>
      </div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">資料解讀注意事項</h2>
      <p>本頁整理國立中正大學犯罪研究中心歷年「臺灣民眾對司法與犯罪防制滿意度之調查研究」的公開結果。各項數據反映受訪民眾的主觀評價，不宜直接等同司法制度或治安政策的客觀成效。</p></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">六項指標的歷年變化</h2>
      <div class="poll-grid">${metrics.map(([key,title,,color]) => trendCard(rows,key,title,color)).join('')}</div></div></section>
      <section class="ccu-section" id="ccu-sources"><div class="wrap"><div class="card"><h2>資料來源</h2>
      <p>${link('國立中正大學犯罪研究中心：研究系列官方列表',D.seriesUrl)}</p>
      <div class="ccu-notice" id="ccu-112">
      <p>112年度調查單位研究網頁所刊為2023年12月訪問3,001人的另一版本，並非本頁採用的資料。本頁使用的資料為2024年1月7日至12日訪問、有效樣本1,804人的結果，連結如下：</p>
            <ul class="ccu-source-list">${D.supplementarySources.map(([label,url]) => `<li>${link(label,url)}</li>`).join('')}</ul></div>
      </div></div></section>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-ccu-jump]').forEach(a => a.addEventListener('click', ev => {
      ev.preventDefault();
      const target = root.querySelector('#' + a.dataset.ccuJump);
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); target.scrollIntoView({block:'start'});
    }));
  }
  function preview() {
    const [key,title,,color] = metrics.find(([key]) => key === 'judgeFairness');
    return `<div class="ccu-preview" style="--chart-color:${color};--safety-accent:${color};--safety-grid:#E6E9EF;--safety-muted:#5B6577"><h4>${title}</h4>${trendChart(window.JRF_CCU_SURVEY.rows,key,title,color)}</div>`;
  }
  window.JRF_CCU_PAGE = {render,bind,preview};
})();
