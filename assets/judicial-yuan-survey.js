/* 沿用中正調查的入口、hash詳情及共用圖卡；12題一次完整呈現。 */
(function () {
  'use strict';
  const responseKeys = ['veryPositive','somewhatPositive','neutral','somewhatNegative','veryNegative','noOpinionOrRefused'];
  function responseLabels(id) {
    if (['law','punish','silence'].includes(id)) return ['非常支持','還算支持','普通','不太支持','完全不支持','無意見／拒答'];
    if (['sentence','lawful','independent'].includes(id)) return ['非常同意','還算同意','普通','不太同意','完全不同意','無意見／拒答'];
    if (id === 'judge_trust') return ['非常信任','還算信任','普通','不太信任','完全不信任','無意見／拒答'];
    return ['非常滿意','還算滿意','普通','不太滿意','非常不滿意','無意見／拒答'];
  }
  function tooltipText(row,id) {
    const labels = responseLabels(id);
    return [`民國${row.year}年`,`本題樣本數：${row.sampleSize.toLocaleString('zh-TW')}`,
      ...responseKeys.map((key,i) => `${labels[i]}：${row.rawResponses[key].toFixed(1)}%`)].join('\n');
  }
  function chartRows(metric) {
    return metric.rows.map(row => ({...row,[`judicial-${metric.id}`]:row.positive}));
  }
  function options(metric) {
    return {min:0,max:100,ticks:[0,25,50,75,100],interactive:true,tooltipText:row => tooltipText(row,metric.id),
      rangeLabel:`${metric.rows[0].year}–${metric.rows[metric.rows.length-1].year}年`,note:metric.note};
  }
  function card(metric) {
    return window.JRF_SURVEY_CHARTS.card(chartRows(metric),`judicial-${metric.id}`,metric.title,metric.color,options(metric));
  }
  function render() {
    const D = window.JRF_JUDICIAL_SURVEY;
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a>
      <h1 class="page-title ccu-title">司法院一般民眾對司法認知調查</h1><p class="page-sub">105–114年（2016–2025年）</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card"><h2>關於這項調查</h2>
      <p>司法院自民國95年起，每年辦理「一般民眾對司法認知調查」，了解民眾對法律與司法制度的認識、司法審判的觀感、法官信任程度，以及實際到法院辦事或參與訴訟的經驗與滿意程度，作為司法政策及法院服務改進的參考。</p>
      <p>本頁整理民國105年至114年（2016–2025年）的12項調查結果，依「法律觀念與刑事司法態度」、「法官審判與司法信任」、「法院經驗與審判滿意度」三組呈現。</p>
      <p>調查均以電話訪問方式辦理，並按人口特性進行統計加權。105–108年以市話訪問，109年起加入手機樣本；111年調查區域擴及金門、連江；112年起調查對象從20歲以上調整為18歲以上；114年報告另採用並說明市話與手機雙底冊樣本推估及合併加權程序。歷年調查方法與受訪人口有所變動，趨勢比較應留意這些差異。</p>
      <p>114年調查於8月28日至10月3日進行，由循證民調有限公司執行，完成5,006份有效訪問，報告於同年12月編印。各年度訪問時間與抽樣條件不盡相同。</p>
      <a href="#" data-judicial-jump="judicial-yuan-sources">資料來源 ↓</a></div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第一組｜法律觀念與刑事司法態度</h2>
      <p><strong>調查對象：</strong>全體受訪民眾。三項題目均自109年開始調查，因此僅比較109–114年。圖表正向數據為「非常支持」與「還算支持」合計，負向數據為「不太支持」與「完全不支持」合計；「普通」及「無意見／拒答」未併入正負向比例。</p>
      <div class="poll-grid">${D.metrics.slice(0,3).map(card).join('')}</div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第二組｜法官審判與司法信任</h2>
      <p><strong>調查對象：</strong>全體受訪民眾，不限是否曾到法院。前三題正向為「非常同意」及「還算同意」合計，負向為「不太同意」及「完全不同意」合計；法官信任度正向為「非常信任」及「還算信任」，負向為「不太信任」及「完全不信任」。</p>
      <div class="poll-grid">${D.metrics.slice(3,7).map(card).join('')}</div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第三組｜法院經驗與審判滿意度</h2>
      <p><strong>第一種調查對象：曾到法院的民眾。</strong>「法院整體經驗滿意度」以曾到法院辦理事務者為統計對象，包括訴訟及其他法院事務，不限是否曾出庭。正向為「非常滿意」加「還算滿意」，負向為「不太滿意」加「非常不滿意」。</p>
      <div class="poll-grid">${card(D.metrics[7])}</div>
      <p class="judicial-audience"><strong>第二種調查對象：曾參與訴訟且有開庭經驗的民眾。</strong>下列四項評價的受訪者，必須曾參與訴訟並有法官主持開庭經驗，<strong>不是全部受訪者，也不是所有曾到法院者</strong>。正向與負向百分比定義同上；因樣本數較少，解讀年度波動時應留意抽樣誤差。</p>
      <div class="poll-grid">${D.metrics.slice(8).map(card).join('')}</div></div></section>
      <section class="ccu-section" id="judicial-yuan-sources"><div class="wrap"><div class="card"><h2>資料來源</h2>
      <p><a href="${D.sourceUrl}" target="_blank" rel="noopener">司法院｜一般民眾對司法認知調查（歷年調查報告） ↗</a></p></div></div></section>`;
  }
  function preview() {
    const metric = window.JRF_JUDICIAL_SURVEY.metrics.find(m => m.id === 'judge_trust');
    return `<div class="ccu-preview" style="--chart-color:${metric.color};--safety-accent:${metric.color};--safety-grid:#E6E9EF;--safety-muted:#5B6577"><h4>${metric.title}</h4>${window.JRF_SURVEY_CHARTS.chart(chartRows(metric),`judicial-${metric.id}`,metric.title,metric.color,options(metric))}</div>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-judicial-jump]').forEach(link => link.addEventListener('click',event => {
      event.preventDefault();
      const target = root.querySelector('#'+link.dataset.judicialJump);
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); target.scrollIntoView({block:'start'});
    }));
    root.querySelectorAll('[data-metric^="judicial-"], .judicial-yuan-entry .ccu-preview').forEach(card => {
      const tooltip = card.querySelector('.gvm-tooltip');
      const points = [...card.querySelectorAll('.gvm-point')];
      const hide = () => { tooltip.hidden = true; };
      function show(point) {
        const [year,sample,...responses] = point.dataset.tooltip.split('\n');
        const heading = document.createElement('strong'); heading.textContent = year;
        const sampleLine = document.createElement('div'); sampleLine.textContent = sample;
        const distribution = document.createElement('dl'); distribution.className = 'judicial-tooltip-distribution';
        responses.forEach(response => {
          const separator = response.lastIndexOf('：');
          const label = document.createElement('dt'); label.textContent = response.slice(0,separator);
          const value = document.createElement('dd'); value.textContent = response.slice(separator+1);
          distribution.append(label,value);
        });
        tooltip.replaceChildren(heading,sampleLine,distribution);
        tooltip.hidden = false;
        const plot = card.querySelector('.ccu-safety-plot');
        const width = plot.clientWidth, half = tooltip.offsetWidth/2;
        tooltip.style.left = `${Math.max(half+4,Math.min(width-half-4,Number(point.dataset.x)/510*width))}px`;
        const pointY = Number(point.dataset.y)/270*plot.clientHeight;
        const height = tooltip.offsetHeight;
        const above = pointY-height-12;
        const top = above >= 0 ? above : Math.max(0,Math.min(pointY+12,plot.clientHeight-height));
        tooltip.style.top = `${top}px`;
      }
      points.forEach((point,i) => {
        ['pointerenter','focus','click'].forEach(type => point.addEventListener(type,() => show(point)));
        ['pointerleave','blur'].forEach(type => point.addEventListener(type,hide));
        point.addEventListener('keydown',event => {
          let next = i;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(i+1,points.length-1);
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(i-1,0);
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = points.length-1;
          else if (event.key === 'Escape') { hide(); return; }
          else if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault(); points[next].focus(); show(points[next]);
        });
      });
    });
  }
  window.JRF_JUDICIAL_PAGE = {render,bind,preview};
})();
