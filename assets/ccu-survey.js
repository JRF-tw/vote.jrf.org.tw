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
  const trendChart = (rows,key,title,color) => window.JRF_SURVEY_CHARTS.chart(rows,key,title,color,chartSettings[key]);
  const trendCard = (rows,key,title,color) => window.JRF_SURVEY_CHARTS.card(rows,key,title,color,chartSettings[key]);
  function render() {
    const D = window.JRF_CCU_SURVEY, rows = D.rows, latest = rows[rows.length-1];
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a>
      <h1 class="page-title ccu-title">臺灣民眾對司法與犯罪防制滿意度調查</h1><p class="page-sub">107–114年度（2018–2025）｜國立中正大學犯罪研究中心及犯罪防治學系</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card">
      <h2>關於這項調查</h2><p>這個調查透過定期民意調查，了解臺灣民眾對居住環境治安、警察維護治安、法院刑事審判公正性及政府犯罪防制措施的主觀評價，觀察民意變化，作為公共政策研究及社會討論的參考。</p>
      <p>本頁年度依研究報告所屬年度標示。研究通常在該年度結束後、次年1月至2月進行電話訪問，調查有效樣本約1,800至1,900人，並於次年2月左右召開記者會發布結果。</p>
      <a href="#" data-ccu-jump="ccu-sources">資料來源 ↓</a>
      </div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">資料解讀注意事項</h2>
      <p>本頁整理國立中正大學犯罪研究中心歷年「臺灣民眾對司法與犯罪防制滿意度之調查研究」的公開結果。各項數據反映受訪民眾的主觀評價，不宜直接等同司法制度或治安政策的客觀成效。</p></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">歷年調查結果</h2>
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
