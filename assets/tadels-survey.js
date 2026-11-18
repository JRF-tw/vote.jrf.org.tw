/* 臺灣法律與社會變遷調查：沿用共用 SVG 圖表，另提供完整原始回答明細。 */
(function () {
  'use strict';
  const D = () => window.JRF_TADELS_SURVEY;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pct = (n, d) => typeof n === 'number' && d ? `${(n / d * 100).toFixed(1)}%` : '未能計算';
  const mainPct = row => row.responses.slice(0, 2).every(x => typeof x.count === 'number') ? Number(((row.responses[0].count + row.responses[1].count) / row.sampleSize * 100).toFixed(1)) : null;
  const link = (label, url) => `<a href="${url}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
  const methods = row => `${row.method}${row.year === 2019 ? '（訪問方式由電話改為面訪）' : row.year === 2024 ? '（改採網路調查）' : ''}`;
  const chartRows = (rows, seriesId) => rows.filter(row => row.seriesId === seriesId).map(row => ({...row, value: mainPct(row)}));
  function card(series) {
    const [id, title, label, color] = series, rows = chartRows(D().rows,id), valid = rows.filter(r => r.value !== null), latest = valid[valid.length - 1];
    const question = rows[0].questionText;
    const chart = window.JRF_SURVEY_CHARTS.chart(rows,'value',question,color,{min:0,max:100,ticks:[0,25,50,75,100],interactive:true,tooltipText: row => `${row.year}年｜${methods(row)}｜${row.value === null ? '未能計算' : row.value.toFixed(1)+'%'}`});
    return `<article class="poll ccu-poll ccu-safety tadels-card" data-series="${id}" style="--safety-accent:${color}"><h2>${esc(question)}</h2><p class="meta tadels-series-label"><strong>目前比例意義：</strong>${esc(label)}${id === 'lawPowerful' ? '。比例越高，代表越多受訪者認同法律偏袒權勢者，並不代表司法信任程度越高。' : ''}</p><div class="ccu-safety-headline"><div class="ccu-safety-number">${latest && latest.value !== null ? latest.value.toFixed(1) : '—'}<span>%</span></div><div class="ccu-safety-context"><span class="ccu-safety-year">${latest ? latest.year : ''} 年</span><span class="meta">共 ${rows.length} 個實際年度資料點</span></div></div>${chart}</article>`;
  }
  function render() {
    const dataWarnings = D().dataWarnings.length;
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a><h1 class="page-title ccu-title">臺灣法律與社會變遷調查</h1><p class="page-sub">Taiwan Law and Social Change Survey（TaDELS）｜2009–2024年</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card"><h2>關於這項調查</h2><p>「臺灣法律與社會變遷調查」（Taiwan Law and Social Change Survey, TaDELS）是臺灣法實證研究資料庫推動的長期調查研究，透過民意調查了解臺灣民眾對法律制度、司法機關、法律專業人員及法律公平性的認知與評價。</p><p>本頁整理2009年至2024年間，歷次調查中具有跨年度比較意義的九組司法信任相關題目，包括法院滿意度、法官與檢察官公正性、警察執法評價、律師專業角色、法律公平性及司法院大法官表現滿意度。</p><h3>歷年調查方法</h3><div class="tadels-methods"><table class="ccu-table"><thead><tr><th>年度</th><th>方式</th><th>對象</th><th>樣本數</th><th>備註</th></tr></thead><tbody><tr><th>2009</th><td>電話訪問</td><td>18歲以上民眾</td><td>1,522</td><td>第1期調查</td></tr><tr><th>2014</th><td>電話訪問</td><td>18歲以上民眾</td><td>1,500</td><td>2014/10/20–11/08</td></tr><tr><th>2019</th><td>面對面訪問</td><td>18歲以上民眾</td><td>2,052</td><td>調查方式由電話改為面訪</td></tr><tr><th>2022</th><td>網路調查</td><td>成年民眾</td><td>1,020*</td><td>僅用於大法官表現滿意度</td></tr><tr><th>2023</th><td>面對面訪問</td><td>18歲以上民眾</td><td>2,082</td><td>正式有效樣本，不包含預試</td></tr><tr><th>2024</th><td>網路調查</td><td>20歲以上民眾</td><td>1,050</td><td>使用既有電話訪問受訪者同意參與網調名單</td></tr></tbody></table></div><p class="meta">* 2022年官方調查簡介與逐題表記載的完成樣本數不一致；大法官滿意度以該題官方次數表的1,020人為分母。</p><a href="#tadels-sources" data-tadels-jump="tadels-sources">資料來源 ↓</a></div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">跨年度比較注意事項</h2><p>不同年度雖然重複調查相同或高度相似的司法信任問題，但調查方式並不完全一致。2019年由電話訪問改為面對面訪問；2024年改採網路調查，抽樣來源與受訪者年齡範圍也有所調整。這些方法差異可能影響調查結果，因此各年度的比例變化不宜完全解讀為民眾態度改變。本頁保留所有可比較年度，並明確標註方法轉換。</p>${dataWarnings ? `<p class="ccu-notice"><strong>資料驗證提醒：</strong>有 ${dataWarnings} 筆資料的人數合計不等於題目分母，或含未核實欄位。頁面不自動補值，請以各圖表的資料註記及官方來源為準。</p>` : ''}</div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">歷年調查結果</h2><div class="poll-grid tadels-grid">${D().series.map(card).join('')}</div></div></section>
      <section class="ccu-section" id="tadels-sources"><div class="wrap"><div class="card"><h2>資料來源</h2><h3>各年度研究頁面</h3><ul class="ccu-source-list"><li>2009年｜${link('第1期：生活中的法律調查（一）','https://tadels.law.ncku.edu.tw/survey/survey01/')}</li><li>2014年｜${link('第4期（1）：生活中的法律調查（二）','https://tadels.law.ncku.edu.tw/survey/survey06/')}</li><li>2019年｜${link('第5期（2）：臺灣法文化與社會變遷調查','https://tadels.law.ncku.edu.tw/survey/survey11/')}</li><li>2022年｜${link('第6期（1）：法治與疫情調查','https://tadels.law.ncku.edu.tw/survey/survey12/')}</li><li>2023年｜${link('第6期（2）：司法、社會與科技態度調查','https://tadels.law.ncku.edu.tw/survey/survey13/')}</li><li>2024年｜${link('第6期（2）：民眾參與和法律意向調查','https://tadels.law.ncku.edu.tw/survey/survey14/')}</li></ul><h3>原始問卷與次數分配</h3><ul class="ccu-source-list"><li>${link('2009年｜司法制度公正性、滿意度及執法人員信賴度','https://tadels.law.ncku.edu.tw/questionnaire/2009twenforce/')}</li><li>${link('2014年｜正式調查結果報告（PDF）','https://srda.sinica.edu.tw/file/9f84567e-480e-47aa-86fc-b7225af13aca')}</li><li>${link('2019年｜完整面訪次數分配表（PDF）','https://srda.sinica.edu.tw/file/555ba95e-bef3-4856-bca6-8283435efeb4')}</li><li>${link('2022年｜逐題調查結果','https://tadels.law.ncku.edu.tw/questionnaire/2022-%E8%87%BA%E7%81%A3%E6%B3%95%E5%BE%8B%E8%88%87%E7%A4%BE%E6%9C%83%E8%AE%8A%E9%81%B7%E8%AA%BF%E6%9F%A5%E7%AC%AC6%E6%9C%9F-1/')}</li><li>${link('2023年｜司法信賴題組（一）','https://tadels.law.ncku.edu.tw/questionnaire/2023-%E8%AA%BF%E6%9F%A5%E3%80%90%E5%8F%B8%E6%B3%95%E4%BF%A1%E8%B3%B4%E9%A1%8C%E7%B5%84%E3%80%91/')}、${link('題組（二）','https://tadels.law.ncku.edu.tw/questionnaire/2023-%E8%AA%BF%E6%9F%A5%E3%80%90%E5%8F%B8%E6%B3%95%E4%BF%A1%E8%B3%B4%E9%A1%8C%E7%B5%84%E3%80%912-2/')}</li><li>${link('2024年｜司法信賴題組（一）','https://tadels.law.ncku.edu.tw/questionnaire/2024-%E8%87%BA%E7%81%A3%E6%B3%95%E5%BE%8B%E8%88%87%E7%A4%BE%E6%9C%83%E8%AE%8A%E9%81%B7%E8%AA%BF%E6%9F%A5%E7%AC%AC6%E6%9C%9F-2%E3%80%90b-%E5%8F%B8%E6%B3%95%E4%BF%A1%E8%B3%B4-1%E3%80%91/')}</li></ul></div></div></section>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-tadels-jump]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = root.querySelector('#' + a.dataset.tadelsJump); t.focus({preventScroll:true}); t.scrollIntoView({block:'start'}); }));
    root.querySelectorAll('.tadels-card').forEach(card => {
      window.JRF_SURVEY_CHARTS.bindDistribution(card, (panel, point, explaining) => {
        const row = D().rows.find(r => r.seriesId === card.dataset.series && String(r.year) === point.dataset.year);
        if (!row) return;
        const distribution = window.JRF_SURVEY_CHARTS.distribution(row.responses.map(response => ({
          label:response.label,
          count:response.count,
          percentage:typeof response.count === 'number' ? response.count / row.sampleSize * 100 : null
        })));
        const knownTotal = row.responses.reduce((sum,response) => sum + (typeof response.count === 'number' ? response.count : 0),0);
        const incomplete = knownTotal !== row.sampleSize || row.responses.some(response => typeof response.count !== 'number');
        const header = `<div class="survey-detail-header"><button type="button" class="survey-source-button" data-survey-explain aria-pressed="${explaining}">${explaining ? '資料來源' : '詳細資料'}</button>${explaining ? '' : '<span class="survey-distribution-meta">' + row.year + '年｜調查樣本：' + row.sampleSize.toLocaleString() + ' 人｜' + esc(row.method) + (row.questionCode ? '｜題號 ' + esc(row.questionCode) : '') + '</span>'}</div>`;
        const explanation = `<a href="${row.sourceUrl}" target="_blank" rel="noopener">${esc(row.sourceName)}${row.sourcePage ? '｜PDF 頁碼：' + esc(row.sourcePage) : ''} ↗</a>${row.notes ? '<p class="survey-distribution-note">' + esc(row.notes) + '</p>' : ''}${incomplete ? '<p class="survey-distribution-note">原表人數不齊或合計有疑義；圓餅扇形僅呈現已列人數的相對分布，列表百分比仍以該題分母計算，未補值。</p>' : ''}`;
        const history = D().rows.filter(r => r.seriesId === row.seriesId && r.year !== row.year).map(r =>
          `<p class="survey-distribution-note"><strong>${r.year}年｜${esc(r.questionCode)}｜${esc(methods(r))}</strong><br>${esc(r.questionText)}<br>${link(r.sourceName + (r.sourcePage ? '｜PDF 頁碼：' + r.sourcePage : ''),r.sourceUrl)}${r.notes ? '<br>' + esc(r.notes) : ''}</p>`
        ).join('');
        panel.innerHTML = header + (explaining ? explanation + '<details class="survey-source-history"><summary>歷年題目與來源說明</summary>' + history + '</details>' : distribution);
      });
    });
  }
  function preview() { const s = D().series[1], rows = chartRows(D().rows,s[0]); return `<div class="ccu-preview" style="--chart-color:${s[3]};--safety-accent:${s[3]};--safety-grid:#E6E9EF;--safety-muted:#5B6577"><h4>${esc(s[1])}</h4>${window.JRF_SURVEY_CHARTS.chart(rows,'value',s[2],s[3],{min:0,max:100,ticks:[0,25,50,75,100]})}</div>`; }
  window.JRF_TADELS_PAGE = {render,bind,preview};
})();
