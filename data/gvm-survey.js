/* 遠見臺灣社會信任調查：僅整理指定且可確認的結果，不補齊缺年。
   2006–2017年信任度固定採2017年版警政工作年報；2021年僅收法官。
   sourceId 對應下方來源，調查方法的樣本數與誤差僅適用2024年。 */
window.JRF_GVM_SURVEY = {
  judge: [
    {year:2006,trust:47.6,sourceId:'npa2017'},
    {year:2008,trust:40.0,sourceId:'npa2017'},
    {year:2013,trust:32.5,sourceId:'npa2017'},
    {year:2015,trust:42.0,sourceId:'npa2017'},
    {year:2017,trust:32.8,sourceId:'npa2017'},
    {year:2019,trust:39.6,sourceId:'gvm2019'},
    {year:2021,trust:43.1,sourceId:'judicial2021'},
    {year:2024,trust:45.8,sourceId:'gvm2024'}
  ],
  police: [
    {year:2006,trust:45.2,sourceId:'npa2017'},
    {year:2008,trust:45.6,sourceId:'npa2017'},
    {year:2013,trust:50.5,sourceId:'npa2017'},
    {year:2015,trust:61.8,sourceId:'npa2017'},
    {year:2017,trust:70.0,sourceId:'npa2017'},
    {year:2019,trust:76.5,sourceId:'gvm2019'},
    {year:2024,trust:70.0,sourceId:'gvm2024'}
  ],
  fairness: [
    {year:2008,negative:47.2,sourceId:'gvm2013'},
    {year:2013,negative:68.9,sourceId:'gvm2013'},
    {year:2017,negative:65.8,sourceId:'sunny2017'},
    {year:2019,negative:63.0,sourceId:'gvm2019article'}
  ],
  sources: [
    {id:'npa2017',years:'2006、2008、2013、2015、2017年',label:'內政部警政署《106年警政工作年報》',url:'https://www.npa.gov.tw/ch/app/data/doc?detailNo=798843201229189120&module=wg031&type=s',note:'法官、警察信任度採2017年版歷年社會角色信任度比較圖，引用中華民國群我倫理促進會調查。'},
    {id:'gvm2019',years:'2019年',label:'遠見民意研究調查：〈「2019臺灣社會信任」調查結果出爐〉',url:'https://gvsrc.cwgv.com.tw/articles/index/14810/6',note:'法官與警察信任度。'},
    {id:'gvm2019article',years:'2019年',label:'遠見雜誌：2019年臺灣社會信任調查報導',url:'https://www.gvm.com.tw/article/61091',note:'信任度及司法公平正義負面評價63.0%。'},
    {id:'judicial2021',years:'2021年',label:'司法院：2023年3月2日新聞稿',url:'https://www.judicial.gov.tw/en/cp-1637-821633-be437-2.html',note:'引用2021年遠見調查法官信任度43.1%；不列入司法院自行委託調查的數據。'},
    {id:'gvm2024',years:'2024年',label:'遠見雜誌：〈台灣人最相信誰？最新調查：「縣市首長」信任度勝過「總統」〉',url:'https://www.gvm.com.tw/article/112824',note:'2024年5月17日公布；法官與警察信任度及當年調查方法。'},
    {id:'gvm2013',years:'2008、2013年',label:'遠見雜誌：2013年臺灣社會信任調查報導',url:'https://www.gvm.com.tw/article/18138',note:'司法公平正義評價的2008年與2013年比較。'},
    {id:'sunny2017',years:'2017年',label:'晴天社會福利協會：轉載聯合新聞網2017年調查報導',url:'https://www.sunnyswa.org.tw/15842/',note:'新聞轉載來源；司法公平正義負面評價65.8%。'}
  ]
};
