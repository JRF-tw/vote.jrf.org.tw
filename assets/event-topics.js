/* 事件的原始標籤保留在資料中；以下面向只用於色彩與圈選後的關注類型。 */
(function () {
  "use strict";
  const groups = [
    { name: "憲政觀察者", emoji: "🏛️", topic: "憲政與民主", text: "你關心憲法法庭、權力分立與民主制度如何運作。", tags: ["憲法法庭", "權力分立", "憲政爭議", "憲法訴訟", "憲政制度", "國際評比", "人事同意權", "公民投票"] },
    { name: "冤案追問者", emoji: "🔍", topic: "冤案與證據", text: "你留意證據是否可靠，也關心錯誤判決能否獲得救濟。", tags: ["冤案救援", "再審", "證據法則", "污點證人", "刑事補償"] },
    { name: "人權守護者", emoji: "🛡️", topic: "人權與平等", text: "你關心兒少、被害人與不同群體能否在司法中獲得平等保障。", tags: ["少年司法", "犯罪被害人保障", "司法通譯", "人權保障", "兒少保護", "社會安全網", "性暴力", "兒少權益", "LGBTQ+", "警察執法", "性別平等"] },
    { name: "專業監督者", emoji: "⚖️", topic: "司法專業與倫理", text: "你關注法律專業者的倫理責任、辯護權與執業安全。", tags: ["律師倫理", "偵查不公開", "法官、檢察官倫理", "司法倫理", "律師執業安全"] },
    { name: "制度改革者", emoji: "🔧", topic: "司法制度與資源", text: "你關心司法的人力、程序與資源如何改善，讓制度持續運作。", tags: ["羈押與防逃", "制度改革", "司法過勞", "法庭公播", "國民法官", "制度運作", "法院安全", "司法行政"] },
    { name: "科技觀察者", emoji: "💡", topic: "科技與司法", text: "你留意科技如何改變司法，也關心資料安全與使用界線。", tags: ["AI與司法", "科技司法", "資料安全"] },
    { name: "安全關注者", emoji: "🌐", topic: "犯罪與社會安全", text: "你關注重大案件、刑事政策與境外勢力對社會安全的影響。", tags: ["重大案件", "詐欺犯罪", "刑事政策", "跨國鎮壓", "暴力犯罪", "國家安全", "境外勢力"] }
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
