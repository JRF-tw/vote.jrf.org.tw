/* 中正與遠見調查共用的SVG圖卡、資料標籤避讓與最新值版型。 */
(function () {
  'use strict';
  const percent = value => Number.isInteger(value) ? value.toFixed(1) : String(value);
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
  const hasValue = value => typeof value === 'number' && Number.isFinite(value);
  // null與breakBefore均中斷線段；breakBefore本身的資料點仍保留。
  function segmentIndices(rows,field) {
    const groups = [];
    let current = null;
    rows.forEach((row,i) => {
      if (!hasValue(row[field])) { current = null; return; }
      if (!current || row.breakBefore) { current = []; groups.push(current); }
      current.push(i);
    });
    return groups;
  }
  function placeLabels(series, rows, x, y) {
    const points = series.flatMap(([field]) => rows.flatMap((row,i) => hasValue(row[field]) ? [{field,index:i,x:x(i),y:y(row[field])}] : []));
    const segments = series.flatMap(([field]) => segmentIndices(rows,field).flatMap(group => group.slice(1).map((i,j) => [
      {x:x(group[j]),y:y(rows[group[j]][field])}, {x:x(i),y:y(rows[i][field])}
    ])));
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
  function trendChart(rows, key, title, color, options = {}) {
    const {min=0,max=100,ticks=[0,25,50,75,100]} = options;
    const validRows = rows.filter(row => hasValue(row[key]));
    const latest = validRows[validRows.length-1];
    const x = i => 64 + (rows[i].year-rows[0].year) / (rows[rows.length-1].year-rows[0].year || 1) * 418;
    const y = value => 34 + (max - value) / (max-min) * 200;
    const series = key === 'opposeDeathPenaltyAbolition' ? [
      [key,'加總',color,'2 3'],
      ['completelyOpposeAbolition','完全不贊成廢除死刑','#A63243',''],
      ['conditionallyOpposeAbolition','基本上不贊成廢除死刑，但如有配套措施願意考慮','#7550A0','6 3']
    ] : [[key,title,color,'']];
    const labelPositions = placeLabels(series,rows,x,y);
    const line = field => segmentIndices(rows,field).map(group => group.map((i,j) => `${j ? 'L' : 'M'}${x(i)} ${y(rows[i][field])}`).join(' ')).join(' ');
    const area = segmentIndices(rows,key).filter(group => group.length > 1).map(group => `${group.map((i,j) => `${j ? 'L' : 'M'}${x(i)} ${y(rows[i][key])}`).join(' ')} L${x(group[group.length-1])} ${y(min)} L${x(group[0])} ${y(min)} Z`).join(' ');
    const legend = series.length > 1 ? `<ul class="ccu-legend" aria-label="圖例">${series.map(([,label,c,dash]) => `<li><svg viewBox="0 0 30 12" aria-hidden="true"><line x1="0" x2="30" y1="6" y2="6" stroke="${c}" stroke-width="3" stroke-dasharray="${dash}"/></svg><span style="color:${c}">${label}</span></li>`).join('')}</ul>` : '';
    return `<div class="ccu-safety-plot"><svg class="ccu-safety-chart" viewBox="0 0 510 270" role="${options.interactive ? 'group' : 'img'}" aria-label="${rows[0].year} 至 ${latest.year} 年${title}折線圖，${latest.year} 年為 ${percent(latest[key])}%，縱軸${min}%至${max}%" aria-describedby="${key}-values">
      <desc id="${key}-values">${series.map(([field,label]) => `${label}：${rows.filter(row => hasValue(row[field])).map(row => options.tooltipText ? options.tooltipText(row) : `${row.year}年${percent(row[field])}%`).join('；')}`).join('。')}。</desc>
      ${ticks.map(value => `<line x1="44" x2="490" y1="${y(value)}" y2="${y(value)}" stroke="var(--safety-grid)"/><text class="safety-axis" x="32" y="${y(value)+4}" text-anchor="end">${value}%</text>`).join('')}
      <path d="${area}" fill="${color}" fill-opacity="0.07"/>
      ${series.map(([field,label,c,dash]) => `<g role="group" aria-label="${label}"><path d="${line(field)}" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="${dash}" stroke-linejoin="round" stroke-linecap="round"/>
        ${rows.map((row,i) => {
          if (!hasValue(row[field])) return '';
          const last = row.year === latest.year;
          return `<g${options.interactive ? ` class="gvm-point" tabindex="0" role="button" data-year="${row.year}" data-value="${percent(row[field])}"${options.tooltipText ? ` data-tooltip="${options.tooltipText(row)}"` : ''} data-x="${x(i)}" data-y="${y(row[field])}" aria-label="${options.tooltipText ? options.tooltipText(row) : `${row.year}年｜${percent(row[field])}%`}"` : ''}><title>${options.interactive ? (options.tooltipText ? options.tooltipText(row) : `${row.year}年｜${percent(row[field])}%`) : `${label}，${row.year}年：${percent(row[field])}%`}</title>
          ${options.interactive ? `<circle cx="${x(i)}" cy="${y(row[field])}" r="18" fill="transparent"/>` : ''}
          ${last ? `<circle cx="${x(i)}" cy="${y(row[field])}" r="9" fill="${c}" fill-opacity="0.15"/>` : ''}
          <circle cx="${x(i)}" cy="${y(row[field])}" r="${last ? 5 : 3.5}" fill="${last ? c : 'white'}" stroke="${last ? 'white' : c}" stroke-width="2"${options.interactive ? ' class="gvm-dot"' : ''}/></g>`;
        }).join('')}</g>`).join('')}
      <g class="safety-label-layer">${labelPositions.map(p => {
        const color = series.find(([field]) => field === p.field)[2];
        return `<text class="safety-label${p.last ? ' safety-label-latest' : ''}"${p.last ? ` style="fill:${color}"` : ''} data-series="${p.field}" data-year="${rows[p.index].year}" x="${p.labelX}" y="${p.labelY}" text-anchor="middle">${p.text}</text>`;
      }).join('')}</g>
      ${rows.map((row,i) => `<text class="safety-axis${i === rows.length-1 ? ' safety-year-latest' : ''}" x="${x(i)}" y="262" text-anchor="middle">${row.year}</text>`).join('')}
      </svg>${options.interactive ? '<div class="gvm-tooltip" role="status" aria-live="polite" hidden></div>' : ''}</div>${legend}`;
  }
  function trendCard(rows, key, metricTitle, metricColor, options = {}) {
    const title = options.title || metricTitle, color = options.color || metricColor;
    const validRows = rows.filter(row => hasValue(row[key]));
    const latest = validRows[validRows.length-1], previous = validRows[validRows.length-2];
    const delta = +(latest[key]-previous[key]).toFixed(1);
    const arrow = delta < 0 ? 'M6 2v8M2.5 6.5L6 10l3.5-3.5' : 'M6 10V2M2.5 5.5L6 2l3.5 3.5';
    return `<article class="poll ccu-poll ccu-safety${options.interactive ? ' gvm-trust-card' : ''}" data-metric="${key}" style="--safety-accent:${color}">
      <h2>${title}</h2>${options.rangeLabel ? `<span class="meta">${options.rangeLabel}</span>` : ''}
      <div class="ccu-safety-headline"><div class="ccu-safety-number">${percent(latest[key])}<span>%</span></div>
      <div class="ccu-safety-context"><span class="ccu-safety-year">${latest.year} 年</span><span class="ccu-safety-chip">${options.comparisonLabel || '較前一年度'}${delta === 0 ? '<span>持平</span>' : `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="${arrow}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${Math.abs(delta).toFixed(1)}%</span>`}</span></div></div>
      ${trendChart(rows,key,title,color,options)}
      ${options.note ? `<p class="meta">${options.note}</p>` : ''}
    </article>`;
  }
  window.JRF_SURVEY_CHARTS = {chart:trendChart,card:trendCard};
})();
