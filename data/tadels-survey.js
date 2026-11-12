/* TaDELS 司法信任題組：原始人數與題目資料。比例一律由 responses[0..1] / sampleSize 計算。 */
(function () {
  'use strict';
  const source = {
    2009: 'https://tadels.law.ncku.edu.tw/questionnaire/2009twenforce/',
    2014: 'https://srda.sinica.edu.tw/file/9f84567e-480e-47aa-86fc-b7225af13aca',
    2019: 'https://srda.sinica.edu.tw/file/555ba95e-bef3-4856-bca6-8283435efeb4',
    2022: 'https://tadels.law.ncku.edu.tw/questionnaire/2022-%E8%87%BA%E7%81%A3%E6%B3%95%E5%BE%8B%E8%88%87%E7%A4%BE%E6%9C%83%E8%AE%8A%E9%81%B7%E8%AA%BF%E6%9F%A5%E7%AC%AC6%E6%9C%9F-1/',
    2023: 'https://tadels.law.ncku.edu.tw/questionnaire/2023-%E8%AA%BF%E6%9F%A5%E3%80%90%E5%8F%B8%E6%B3%95%E4%BF%A1%E8%B3%B4%E9%A1%8C%E7%B5%84%E3%80%91/',
    2024: 'https://tadels.law.ncku.edu.tw/questionnaire/2024-%E8%87%BA%E7%81%A3%E6%B3%95%E5%BE%8B%E8%88%87%E7%A4%BE%E6%9C%83%E8%AE%8A%E9%81%B7%E8%AA%BF%E6%9F%A5%E7%AC%AC6%E6%9C%9F-2%E3%80%90b-%E5%8F%B8%E6%B3%95%E4%BF%A1%E8%B3%B4-1%E3%80%91/'
  };
  const labels = {
    court: ['很滿意','還算滿意','不太滿意','很不滿意','不知道','拒答'],
    fair: ['很公正','還算公正','不太公正','很不公正','不知道','拒答'],
    policeFair: ['很公正','還算公正','不太公正','很不公正','不知道','拒答'],
    policeFair23: ['很公平','還算公平','不太公平','很不公平','不知道','拒答'],
    lawyer: ['一定會','大概會','大概不會','一定不會','不知道','拒答'],
    respect: ['很尊重','還算尊重','不太尊重','很不尊重','不知道','拒答'],
    agree: ['非常同意','同意','不同意','非常不同意','無意見／不知道','拒答']
  };
  const methods = { phone: '電話訪問', face: '面對面訪問', web: '網路調查' };
  const q = (seriesId, year, questionCode, questionText, method, sampleSize, counts, optionLabels, notes = '') => ({
    seriesId, year, questionCode, questionText, method, sampleSize,
    responses: optionLabels.map((label, i) => ({ label, count: counts[i] })),
    positiveResponseIndices: [0, 1], sourceUrl: source[year], notes
  });
  const common = {
    court: '整體而言，請問您對臺灣的法院滿不滿意？並包含訴訟處理速度、法官態度、法院設施等。',
    judge: '整體而言／整體來說，請問您認為臺灣法官的判決公不公正？',
    prosecutor: '整體而言／整體來說，請問您認為檢察官在執行職務上公不公正？',
    police: '整體而言，請問您認為警察執法時公不公正？',
    lawyer: '整體而言／整體來說，請問您認為律師會不會盡心盡力地保護當事人的權益？',
    respect: '請問您認為警察在執法的過程中，對一般民眾尊不尊重？',
    powerful: '請問您同不同意這些看法：法律對有權有勢的人比較有利。',
    weak: '請問您同不同意這些看法：法律能幫弱者討公道。',
    justice: '整體而言／整體來說，請問您滿不滿意司法院大法官的表現？'
  };
  const rows = [
    q('courtSatisfaction',2009,'C1',common.court,methods.phone,1522,[33,474,523,236,null,null],labels.court,'官方文字資料在本頁輸入來源中欄位黏連；已辨識的前兩項為33、474，未辨識欄位不推算。官方同時刊載「很不滿意」236人及21.4%，兩者矛盾。'),
    q('courtSatisfaction',2014,'C1',common.court,methods.phone,1500,[82,202,662,234,319,null],labels.court,'官方報告五個回答類別合計1,499人，未單獨列出拒答；不把差額補成拒答。'),
    q('courtSatisfaction',2019,'C1','整體而言，請問您對臺灣的法院滿不滿意？',methods.face,2052,[217,798,542,241,68,186],labels.court),
    q('courtSatisfaction',2023,'B02','整體來說，請問您對台灣的法院滿不滿意？包括訴訟處理的速度、法官態度，或是法院的設施等等。',methods.face,2082,[659,666,680,185,18,33],labels.court),
    q('courtSatisfaction',2024,'B2',common.court,methods.web,1050,[133,424,91,148,5,51],labels.court),

    q('judgeFairness',2009,'C2',common.judge,methods.phone,1522,[36,581,149,225,31,46],labels.fair),
    q('judgeFairness',2014,'C2',common.judge,methods.phone,1500,[113,486,153,132,8,609],labels.fair,'原報告六個選項人數合計1,501人，較公布總數多1人；保留原始記載。'),
    q('judgeFairness',2019,'C2',common.judge,methods.face,2052,[328,367,872,223,161,101],labels.fair),
    q('judgeFairness',2023,'B04','整體來說，請問您認為台灣法官的判決公不公正？',methods.face,2082,[79,1030,690,123,156,4],labels.fair),
    q('judgeFairness',2024,'B4',common.judge,methods.web,1050,[145,343,711,104,25,2],labels.fair),

    q('prosecutorFairness',2009,'C4',common.prosecutor,methods.phone,1522,[86,650,431,188,153,14],labels.fair),
    q('prosecutorFairness',2014,'C4',common.prosecutor,methods.phone,1500,[61,606,424,175,227,6],labels.fair,'已公布選項人數合計1,499人，比總數少1人；不自行補值。'),
    q('prosecutorFairness',2019,'C4',common.prosecutor,methods.face,2052,[159,1152,441,74,218,8],labels.fair),
    q('prosecutorFairness',2023,'B08','請問您認為檢察官在執行職務，例如偵查、搜索、聲請羈押或是起訴的時候公不公正呢？',methods.face,2082,[203,1277,365,49,184,4],labels.fair),
    q('prosecutorFairness',2024,'B7',common.prosecutor,methods.web,1050,[236,662,73,56,3,11],labels.fair),

    q('policeFairness',2009,'C5',common.police,methods.phone,1522,[67,629,525,213,84,4],labels.policeFair),
    q('policeFairness',2014,'C5',common.police,methods.phone,1500,[91,670,432,143,160,4],labels.policeFair),
    q('policeFairness',2019,'C5','整體而言，請問您認為警察執法時公不公正？',methods.face,2052,[198,1262,435,80,16,7],labels.policeFair),
    q('policeFairness',2023,'B10','整體來說，請問您認為警察在執法的時候公不公平呢？',methods.face,2082,[190,1314,447,63,6,62],labels.policeFair23,'2023年題目與選項使用「公平」，其餘年度使用「公正」。'),
    q('policeFairness',2024,'B8','整體來說，請問您認為警察在執法的時候公不公正呢？',methods.web,1050,[237,512,313,14,11,0],labels.policeFair,'原始表未列拒答，但其他選項合計已達1,050人，拒答為0。'),

    q('lawyerProtection',2009,'C3',common.lawyer,methods.phone,1522,[39,572,220,46,129,10],labels.lawyer),
    q('lawyerProtection',2014,'C3',common.lawyer,methods.phone,1500,[28,769,247,53,192,6],labels.lawyer),
    q('lawyerProtection',2019,'C3',common.lawyer,methods.face,2052,[388,1174,301,33,148,8],labels.lawyer),
    q('lawyerProtection',2023,'B07',common.lawyer,methods.face,2082,[551,1103,241,16,122,49],labels.lawyer),

    q('policeRespect',2009,'C6',common.respect,methods.phone,1522,[93,727,466,160,70,6],labels.respect),
    q('policeRespect',2014,'C6',common.respect,methods.phone,1500,[101,843,369,82,101,4],labels.respect),
    q('policeRespect',2019,'C6',common.respect,methods.face,2052,[310,1313,319,51,90, null],labels.respect,'提供的公開欄位文字出現總和疑義，拒答未能由文字可靠辨識；不以差額改寫。'),
    q('policeRespect',2023,'B11',common.respect,methods.face,2082,[286,1380,322,52,4,38],labels.respect),

    q('lawPowerful',2019,'F1-01',common.powerful,methods.face,2052,[764,948,234,56,44,6],labels.agree,'2019年選項5原文為「無意見」。'),
    q('lawPowerful',2023,'B14','有人說：「法律對有權有勢的人比較有利。」請問您同不同意這樣的說法？',methods.face,2082,[503,1148,365,194,61, null],labels.agree,'本題為負向敘述的同意比例，不代表司法信任程度；提供資料未能可靠辨識第6項人數。'),
    q('lawPowerful',2024,'B10','有人說：「法律對有權有勢的人比較有利。」請問您同不同意這樣的說法？',methods.web,1050,[416,548,76,45,19, null],labels.agree,'本題為負向敘述的同意比例，不代表司法信任程度；提供資料未能可靠辨識第6項人數。'),

    q('lawHelpsWeak',2019,'F1-02',common.weak,methods.face,2052,[102,974,735,169,64,8],labels.agree,'2019年選項5原文為「無意見」。'),
    q('lawHelpsWeak',2023,'B15','有人說：「法律能幫弱者討公道。」請問您同不同意這樣的說法？',methods.face,2082,[49,1095,770,98,6,64],labels.agree),
    q('lawHelpsWeak',2024,'B11','有人說：「法律能幫弱者討公道。」請問您同不同意這樣的說法？',methods.web,1050,[203,685,131,34,141, null],labels.agree,'提供資料未能可靠辨識第6項人數。'),

    q('grandJustices',2022,'第14題',common.justice,methods.web,1020,[16,445,387,122,48,2],['非常滿意','滿意','不滿意','非常不滿意','無意見','拒答'],'官方調查介紹記載1,000份有效樣本，逐題次數表為1,020人；本頁採逐題表分母。'),
    q('grandJustices',2023,'B23',common.justice,methods.face,2082,[58,1155,504,68,284,13],['非常滿意','滿意','不滿意','非常不滿意','不知道','拒答']),
    q('grandJustices',2024,'B14',common.justice,methods.web,1050,[17,420,373,163,73,4],['很滿意','還算滿意','不太滿意','很不滿意','不知道','拒答'])
  ];
  const series = [
    ['courtSatisfaction','法院整體滿意度','很滿意＋還算滿意','#2F5BD3'],
    ['judgeFairness','法官判決公正性','很公正＋還算公正','#A63243'],
    ['prosecutorFairness','檢察官執行職務公正性','很公正＋還算公正','#167360'],
    ['policeFairness','警察執法公正性','很公正＋還算公正；2023年為很公平＋還算公平','#94600F'],
    ['lawyerProtection','律師是否盡力保護當事人權益','一定會＋大概會','#7550A0'],
    ['policeRespect','警察執法是否尊重一般民眾','很尊重＋還算尊重','#246E87'],
    ['lawPowerful','法律對有權有勢的人比較有利','同意比例（非常同意＋同意）','#A84A0C'],
    ['lawHelpsWeak','法律能幫弱者討公道','同意比例（非常同意＋同意）','#3A5BD9'],
    ['grandJustices','司法院大法官表現滿意度','前兩個滿意選項合計','#6B4FA1']
  ];
  window.JRF_TADELS_SURVEY = { rows, series, source, methods, dataWarnings: rows.filter(row => row.responses.some(x => typeof x.count !== 'number' || x.count < 0) || row.responses.reduce((sum,x) => sum + (typeof x.count === 'number' ? x.count : 0),0) !== row.sampleSize) };
})();
