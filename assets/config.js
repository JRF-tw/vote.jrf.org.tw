/* =========================================================
   網站設定：上線前只需要改這個檔案
   ========================================================= */
window.JRF_CONFIG = {
  year: 2026,                              // 目前回顧的年度（對應 data/events.js 裡的年度）
  maxPicks: 5,                             // 每人最多送出幾件
  deadline: "2026-12-31T23:59:59+08:00",   // 圈選截止時間（過了就不能再送出）
  announce: "2027 年 1 月",                 // 年度結果公布時間（顯示用文字）
  siteUrl: "https://vote.jrf.org.tw/",     // 正式網址（分享圖卡會印出）
  logo: "images/jrf-logo.png",             // 頁首左側網站 LOGO
  devPreview: false,                       // true＝設計預覽模式（顯示圖片預留文字、示意連結），正式上線請保持 false

  /* Google 表單：網站直接傳送圈選與 Email，不需登入或開啟表單頁。
     設定方式見 docs/部署說明.md */
  googleForm: {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSeVv0Y7YC5aEJspfj3qvzWYJ5Fek9Gy0tY9iY7eAhucEhg9Ig/formResponse",  // 表單接收網址
    picksEntry: "entry.1333646016", // 「圈選事件」題的代號
    emailEntry: "entry.2028008171"  // 第二題「E-mail」簡答題的代號
  }
};
