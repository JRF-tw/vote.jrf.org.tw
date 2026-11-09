/* 司法民調之遠見調查詳情與預覽；共用中正調查的圖卡及標籤避讓。 */
(function () {
  'use strict';
  const external = source => `<a href="${source.url}" target="_blank" rel="noopener">${source.label} ↗</a>`;
  const chartOptions = {min:0,max:100,ticks:[0,25,50,75,100],interactive:true,comparisonLabel:'較前次調查'};
  const chartRows = (rows, key, field) => rows.map(row => ({year:row.year,[key]:row[field]}));
  function trustCard(rows,key,title,color,field='trust') {
    return window.JRF_SURVEY_CHARTS.card(chartRows(rows,key,field),key,title,color,chartOptions);
  }
  function render() {
    const D = window.JRF_GVM_SURVEY;
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a><h1 class="page-title ccu-title">遠見臺灣社會信任調查</h1><p class="page-sub">法官、警察信任度與司法公平正義評價</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card"><h2>關於這項調查</h2>
      <p>「臺灣社會信任調查」由中華民國群我倫理促進會發起，自2001年起，長期觀察臺灣民眾對不同社會角色的信任程度，藉以瞭解社會信任的現況與變化。截至2024年累計進行12次，並非每年固定辦理。</p>
      <p>調查以臺灣成年民眾為對象，主要透過電話訪問蒐集民意，各年度的調查時間、方法及樣本數可能有所不同。本頁選取法官、警察的信任度，以及民眾對司法能否維護公平正義的評價。</p>
      <h3>2024年調查方法與發布時間</h3><p>2024年由遠見民意研究調查執行，於4月24日至28日進行電腦輔助電話訪問，成功訪問1,074名20歲以上民眾。在95%信心水準下，抽樣誤差為±2.99個百分點，結果於2024年5月17日公布。以上方法、樣本數與誤差僅適用2024年。</p></div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">歷年調查結果</h2>
      <div class="poll-grid">${trustCard(D.judge,'gvmJudge','法官信任度','#A63243')}${trustCard(D.police,'gvmPolice','警察信任度','#167360')}${trustCard(D.fairness,'gvmFairness','認為司法不能維護公平正義的比例','#3A5BD9','negative')}</div></div></section>
      <section class="ccu-section"><div class="wrap"><p class="gvm-data-note"><strong>資料說明：</strong>「臺灣社會信任調查」並非每年固定辦理，圖表僅呈現可確認的調查結果。各年度的調查方法、問卷題目及選項分類可能有所不同，跨年度比較時應留意相關差異。法官、警察信任度與司法公平正義評價屬於不同調查指標，不宜直接混合比較。</p></div></section>
      <section class="ccu-section"><div class="wrap"><div class="card"><h2>資料來源</h2><h3>歷年信任度數據</h3><ul class="ccu-source-list">${D.sources.slice(0,5).map(source => `<li><strong>${source.years}</strong>｜${external(source)}<p class="gvm-source-note">${source.note}</p></li>`).join('')}</ul>
      <p>2006–2017年歷史比例以2017年版警政工作年報為準，不混用2019年版年報。2021年法官信任度採司法院引用的遠見結果；不使用2001年反推值，亦不補入未確認數據。</p>
      <h3>司法公平正義評價</h3><ul class="ccu-source-list">${[D.sources[5],D.sources[6],D.sources[2]].map(source => `<li><strong>${source.years}</strong>｜${external(source)}<p class="gvm-source-note">${source.note}</p></li>`).join('')}</ul></div></div></section>`;
  }
  function bind(root) {
    root.querySelectorAll('.gvm-trust-card, .gvm-entry .ccu-preview').forEach(card => {
      const tooltip = card.querySelector('.gvm-tooltip');
      const points = [...card.querySelectorAll('.gvm-point')];
      const show = point => {
        tooltip.textContent = `${point.dataset.year}年｜${point.dataset.value}%`;
        tooltip.style.left = `${Math.max(16,Math.min(84,Number(point.dataset.x)/510*100))}%`;
        tooltip.style.top = `${Math.max(0,Number(point.dataset.y)/270*100-16)}%`;
        tooltip.hidden = false;
      };
      const hide = () => { tooltip.hidden = true; };
      points.forEach((point,i) => {
        ['pointerenter','focus','click'].forEach(event => point.addEventListener(event,() => show(point)));
        ['pointerleave','blur'].forEach(event => point.addEventListener(event,hide));
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
  function preview() {
    const key = 'gvmJudge', color = '#A63243', title = '法官信任度';
    return `<div class="ccu-preview" style="--chart-color:${color};--safety-accent:${color};--safety-grid:#E6E9EF;--safety-muted:#5B6577"><h4>${title}</h4>${window.JRF_SURVEY_CHARTS.chart(chartRows(window.JRF_GVM_SURVEY.judge,key,'trust'),key,title,color,chartOptions)}</div>`;
  }
  window.JRF_GVM_PAGE = {render,bind,preview};
})();
