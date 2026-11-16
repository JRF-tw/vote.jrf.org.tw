/* 事件使用經確認合併的單層標籤；以下面向只用於色彩與圈選後的關注類型。 */
(function () {
  "use strict";
  const groups = [
  {
    "name": "憲政觀察者",
    "emoji": "🏛️",
    "topic": "憲政與民主",
    "text": "你關心憲法法庭、權力分立與民主制度如何運作。",
    "tags": [
      "憲法法庭",
      "憲政爭議"
    ]
  },
  {
    "name": "冤案追問者",
    "emoji": "🔍",
    "topic": "冤案與救濟",
    "text": "你留意證據是否可靠，也關心錯誤判決能否獲得救濟。",
    "tags": [
      "冤案救援"
    ]
  },
  {
    "name": "人權守護者",
    "emoji": "🛡️",
    "topic": "人權與平等",
    "text": "你關心兒少、被害人與不同群體能否在司法中獲得平等保障。",
    "tags": [
      "被害人權益",
      "司法通譯",
      "兒少保護",
      "警察執法",
      "性別平等"
    ]
  },
  {
    "name": "專業監督者",
    "emoji": "⚖️",
    "topic": "司法專業與倫理",
    "text": "你關注法律專業者的倫理責任與偵查資訊的使用界線。",
    "tags": [
      "法律專業倫理",
      "偵查不公開"
    ]
  },
  {
    "name": "制度改革者",
    "emoji": "🔧",
    "topic": "司法制度與資源",
    "text": "你關心司法的人力、安全與制度如何改善，以及法律對日常生活的影響。",
    "tags": [
      "羈押與防逃",
      "司法過勞",
      "國民法官",
      "法庭安全",
      "民事法"
    ]
  },
  {
    "name": "科技觀察者",
    "emoji": "💡",
    "topic": "科技與司法",
    "text": "你留意新興科技如何改變司法，也關心資料安全與使用界線。",
    "tags": [
      "新興科技"
    ]
  },
  {
    "name": "安全關注者",
    "emoji": "🌐",
    "topic": "重大事件與刑事政策",
    "text": "你關注重大矚目事件的發展，以及刑事政策對社會的影響。",
    "tags": [
      "重大矚目事件",
      "刑事政策"
    ]
  }
];
  const tagsOf = e => e.tags || [];
  const groupOf = tag => groups.findIndex(g => g.tags.includes(tag));
  function personaOf(events) {
    if (!events.length) return null;
    const scores = groups.map(() => 0);
    events.forEach(e => {
      const indices = [...new Set(tagsOf(e).map(groupOf).filter(i => i >= 0))];
      // 每件事件總權重相同；同面向的多個標籤不重複加分。
      indices.forEach(i => { scores[i] += 1 / indices.length; });
    });
    const max = Math.max(...scores);
    const leaders = groups.filter((g, i) => max > 0 && Math.abs(scores[i] - max) < 1e-9);
    const topics = groups.map((g, i) => ({ topic: g.topic, score: scores[i] }))
      .filter(g => g.score > 0).sort((a, b) => b.score - a.score);
    if (leaders.length === 1) return { ...leaders[0], topics };
    return { name: "多元關注者", emoji: "🧭", text: leaders.length
      ? `你同樣關注${leaders.map(g => `「${g.topic}」`).join("、")}，從多個面向看待今年的司法事件。`
      : "你從不同角度關心今年的司法事件。", topics };
  }
  window.JRF_EVENT_TOPICS = { groups, tagsOf, groupOf, personaOf };
})();
