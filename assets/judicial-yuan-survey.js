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
  function valueLabel(id) {
    if (id === 'judge_trust') return '信任';
    if (['law','punish','silence','sentence','lawful','independent'].includes(id)) return '同意';
    return '滿意';
  }
  function valueDefinition(id) {
    const labels = responseLabels(id);
    return valueLabel(id) + '為「' + labels[0] + '」及「' + labels[1] + '」的合計比例。';
  }
  function options(metric) {
    return {min:0,max:100,ticks:[0,25,50,75,100],interactive:true,questionText:metric.questionText,valueLabel:valueLabel(metric.id),sourceUrl:window.JRF_JUDICIAL_SURVEY.sourceUrl,tooltipText:row => tooltipText(row,metric.id)};
  }
  function card(metric) {
    return window.JRF_SURVEY_CHARTS.card(chartRows(metric),`judicial-${metric.id}`,metric.title,metric.color,options(metric));
  }
  function render() {
    const D = window.JRF_JUDICIAL_SURVEY;
    return `<div class="wrap page-head"><a href="#polls" data-go="polls">← 司法民調觀測站</a>
      <h1 class="page-title ccu-title">司法院一般民眾對司法認知調查</h1><p class="page-sub">105–114年（2016–2025年）</p></div>
      <section class="ccu-section"><div class="wrap"><div class="card"><h2>關於這項調查</h2>
      <p>「一般民眾對司法認知調查」由司法院每年辦理，114年委由「循證民調有限公司」執行。調查的主要目的，是為了瞭解民眾對法治價值的認知傾向、民眾獲得司法消息或資訊的來源、民眾對司法審判的看法、民眾對上法院解決紛爭之意願、民眾對法院提供各項服務及法官案件審理之滿意程度與民眾對法律知識的認知程度，作為日後持續改進的依據。</p>
      <h2>調查方法</h2>
      <p>分別就市話及手機電話進行抽樣，114年調查共訪問5,006位18歲以上民眾（訪問成功率為14.8%）。加權後有1,587位民眾曾經到過法院。在95%信心水準下，全體抽樣誤差在正負1.4個百分點以內；曾經到過法院民眾，在95%信心水準下，抽樣誤差在正負2.5個百分點以內。</p>
      <details><summary>歷年調查方法差異</summary><p>105–108年以市話訪問，109年起加入手機樣本；111年調查區域擴及金門、連江；112年起調查對象從20歲以上調整為18歲以上；114年報告另採用並說明市話與手機雙底冊樣本推估及合併加權程序。歷年調查方法與受訪人口有所變動，趨勢比較應留意這些差異。</p></details>
      <h2>調查內容</h2>
      <p>114年調查內容共分為8組面向（含受訪者基本資料），問卷編為21個主題號，另含子題、篩選與訪員記錄項目；不是每位受訪者都會被詢問所有題目。就各項調查結果，請參考下方資料來源所列的司法院原始調查報告。</p>
      <p>本頁節錄民國105年至114年（2016–2025年）的12項調查結果，依以下三組呈現。</p>
      <h2 id="judicial-yuan-sources">資料來源</h2>
      <p><a href="${D.sourceUrl}" target="_blank" rel="noopener">司法院｜一般民眾對司法認知調查（歷年調查報告） ↗</a></p>
      </div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第一組：民眾對法治價值之認知傾向</h2>
      <p><strong>調查對象：</strong>全體受訪民眾。三項題目均自109年開始調查，因此僅比較109–114年。</p>
      <div class="poll-grid">${D.metrics.slice(0,3).map(card).join('')}</div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第二組：民眾對司法審判看法</h2>
      <p><strong>調查對象：</strong>全體受訪民眾，不限是否曾到法院。</p>
      <div class="poll-grid">${D.metrics.slice(3,7).map(card).join('')}</div></div></section>
      <section class="ccu-section"><div class="wrap"><h2 class="sec-title">第三組：曾赴法院民眾對法院評價</h2>
      <p><strong>第一種調查對象：曾到法院的民眾。</strong>「法院整體經驗滿意度」以曾到法院辦理事務者為統計對象，包括訴訟及其他法院事務，不限是否曾出庭。</p>
      <div class="poll-grid">${card(D.metrics[7])}</div>
      <p class="judicial-audience"><strong>第二種調查對象：曾到法院參與訴訟並有開庭經驗的民眾。</strong>下列四項滿意程度包含法官問案的態度、法官給予陳述或答辯的時間、法官審理案件的進度及法官審判的公信力。受訪者必須曾參與訴訟並有法官主持開庭經驗，<strong>不是全部受訪者，也不是所有曾到法院者</strong>；因樣本數較少，解讀年度波動時應留意抽樣誤差。</p>
      <div class="poll-grid">${D.metrics.slice(8).map(card).join('')}</div></div></section>`;
  }
  function preview() {
    const metric = window.JRF_JUDICIAL_SURVEY.metrics.find(m => m.id === 'judge_trust');
    return `<div class="ccu-preview" style="--chart-color:${metric.color};--safety-accent:${metric.color};--safety-grid:#E6E9EF;--safety-muted:#5B6577"><h4>${metric.questionText}</h4>${window.JRF_SURVEY_CHARTS.chart(chartRows(metric),`judicial-${metric.id}`,metric.questionText,metric.color,options(metric))}</div>`;
  }
  function bind(root) {
    root.querySelectorAll('[data-judicial-jump]').forEach(link => link.addEventListener('click',event => {
      event.preventDefault();
      const target = root.querySelector('#'+link.dataset.judicialJump);
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); target.scrollIntoView({block:'start'});
    }));
    root.querySelectorAll('[data-metric^="judicial-"], .judicial-yuan-entry .ccu-preview').forEach(card => {
      const metric = window.JRF_JUDICIAL_SURVEY.metrics.find(m => 'judicial-' + m.id === card.dataset.metric)
        || window.JRF_JUDICIAL_SURVEY.metrics.find(m => m.id === 'judge_trust');
      window.JRF_SURVEY_CHARTS.bindDistribution(card, (panel, point, explaining) => {
        const [year, sample, ...responses] = point.dataset.tooltip.split('\n');
        const heading = document.createElement('div');
        heading.className = 'survey-detail-header';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'survey-source-button';
        button.dataset.surveyExplain = '';
        button.textContent = explaining ? '備註' : '詳細資料';
        button.setAttribute('aria-pressed', String(explaining));
        const sampleLine = document.createElement('span');
        sampleLine.className = 'survey-distribution-meta';
        sampleLine.textContent = year + '｜調查樣本：' + sample.replace('本題樣本數：','') + ' 人｜電訪'
          + (Number(point.dataset.year) === metric.questionYear ? '｜題號 ' + metric.questionCode : '');
        heading.append(button);
        if (!explaining) heading.append(sampleLine);
        const chart = document.createElement('div');
        chart.innerHTML = window.JRF_SURVEY_CHARTS.distribution(responses.map(response => {
          const separator = response.lastIndexOf('：');
          return {label:response.slice(0,separator),percentage:parseFloat(response.slice(separator+1))};
        }));
        if (explaining) {
          const multipleNotes = Boolean(metric.questionPreface || metric.note);
          const notes = document.createElement(multipleNotes ? 'ol' : 'ul');
          notes.className = 'survey-distribution-note survey-note-list' + (multipleNotes ? '' : ' survey-note-single');
          if (metric.questionPreface) {
            const preface = document.createElement('li');
            preface.textContent = metric.questionPreface;
            notes.append(preface);
          }
          const definition = document.createElement('li');
          definition.textContent = valueDefinition(metric.id) + '原報告為加權百分比，各選項原始人數未提供。';
          notes.append(definition);
          if (metric.note) {
            const additionalNote = document.createElement('li');
            additionalNote.textContent = metric.note;
            notes.append(additionalNote);
          }
          panel.replaceChildren(heading,notes);
        } else {
          panel.replaceChildren(heading,chart);
        }
      });
    });
  }
  window.JRF_JUDICIAL_PAGE = {render,bind,preview};
})();
