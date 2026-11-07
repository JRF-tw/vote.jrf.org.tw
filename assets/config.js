/* =========================================================
   網站設定：上線前只需要改這個檔案
   Google 表單的三個值可以用 setup.html（表單嫁接小幫手）自動產生
   ========================================================= */
window.JRF_CONFIG = {
  year: 2026,                              // 目前回顧的年度（對應 data/events.js 裡的年度）
  maxPicks: 5,                             // 每人最多送出幾件
  deadline: "2026-12-31T23:59:59+08:00",   // 圈選截止時間（過了就不能再送出）
  announce: "2027 年 1 月",                 // 年度結果公布時間（顯示用文字）
  siteUrl: "https://vote.jrf.org.tw/",     // 正式網址（分享圖卡會印出）
  devPreview: false,                       // true＝設計預覽模式（顯示圖片預留文字、示意連結），正式上線請保持 false

  /* 送出設定：網站把圈選送到 Cloudflare Worker，Worker 驗證後才寫入 Google 表單。
     Google 表單網址存在 Worker 的密鑰裡，不放在這裡。設定方式見 docs/部署說明.md */
  submit: {
    url: "",              // Worker 的送出網址，例如 https://jrf-vote-submit.<帳號>.workers.dev/submit
    turnstileSiteKey: ""  // Cloudflare Turnstile 的 site key（公開值，可以放在網站上）
  }
};
