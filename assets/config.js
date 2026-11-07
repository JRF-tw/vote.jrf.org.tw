/* =========================================================
   網站設定：上線前只需要改這個檔案
   ========================================================= */
window.JRF_CONFIG = {
  year: 2026,                              // 目前回顧的年度（對應 data/events.js 裡的年度）
  maxPicks: 5,                             // 每人最多送出幾件
  deadline: "2026-12-31T23:59:59+08:00",   // 圈選截止時間（過了就不能再送出）
  announce: "2027 年 1 月",                 // 年度結果公布時間（顯示用文字）
  siteUrl: "https://vote.jrf.org.tw/",     // 正式網址（分享圖卡會印出）
  devPreview: false,                       // true＝設計預覽模式（顯示圖片預留文字、示意連結），正式上線請保持 false

  /* Google 表單：網站把圈選預先填入表單，民眾登入 Google 帳號後在表單頁送出（每個帳號限填一次）。
     設定方式見 docs/部署說明.md */
  googleForm: {
    viewUrl: "",     // 表單網址，結尾是 /viewform，例如 https://docs.google.com/forms/d/e/1FAIpQLS…/viewform
    picksEntry: ""   // 「圈選事件」題的代號，例如 entry.123456789
  }
};
