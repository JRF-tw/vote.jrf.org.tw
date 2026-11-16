/* =========================================================
   年度司法大事記｜主程式
   分頁用按鈕切換（不改網址），在任何預覽環境都能運作
   ========================================================= */
(function () {
  "use strict";

  const MEDIA = window.JRF_MEDIA || {};
  const C = window.JRF_CONFIG, DATA = window.JRF_DATA, TAGS = window.JRF_TAGS, TOPICS = window.JRF_EVENT_TOPICS;
  const YEAR = C.year, YD = DATA[YEAR];
  const DEV = !!C.devPreview;   // 設計預覽模式：顯示圖片預留文字、示意連結等
  /* 重點新聞：標了 key 的新聞；都沒標就用第一則 */
  const keyNews = e => { const k = e.news.filter(n => n.key); return k.length ? k : e.news.slice(0, 1); };
  const firstKey = e => keyNews(e).map(n => n.date).sort()[0];
  const ymd = d => { const [y, m, dd] = d.split("/").map(Number); return { y, m, d: dd }; };
  const fmtD = d => { const x = ymd(d); return `${x.y}年${x.m}月${x.d}日`; };
  const monthLabel = d => { const x = ymd(d); return x.y === YEAR ? `${x.m}月` : `${x.y}年${x.m}月`; };
  /* 事件的發生時間：重點新聞日期（多則時以「、」連接） */
  const dateOf = e => {
    const ds = keyNews(e).map(n => n.date).sort();
    return ds.map((d, i) => { const x = ymd(d), p = i ? ymd(ds[i - 1]) : null; return p && p.y === x.y ? `${x.m}月${x.d}日` : fmtD(d); }).join("、");
  };
  const EV = [...YD.events].sort((a, b) => firstKey(a).localeCompare(firstKey(b)) || Number(a.code) - Number(b.code));
  const byCode = Object.fromEntries(EV.map(e => [e.code, e]));
  const DEADLINE = new Date(C.deadline).getTime();
  const CLOSED = YD.status === "closed" || Date.now() > DEADLINE;   // 圈選截止
  const PUBLISHED = YD.status === "closed" && !!YD.final;              // 結果已公布

  /* ---------- 工具 ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const STAMP = cls => `<svg class="stamp-svg ${cls || ""}" viewBox="0 0 100 100" aria-hidden="true"><use href="#bu"/></svg>`;
  const mem = {};
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return mem[k] || null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { mem[k] = v; } }
  };
  const KEY = `jrf-review-${YEAR}-${C.ballotVersion || "launch-1"}`;
  let st = store.get(KEY) || { picks: [], sent: false, at: 0 };
  st.picks = (st.picks || []).filter(c => byCode[c]);   // 事件代碼若被改動，丟掉瀏覽器裡已不存在的舊代碼，避免頁面壞掉
  const save = () => store.set(KEY, st);
  const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; };

  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  const tagsOf = TOPICS.tagsOf;
  const tagClass = tag => `t-tone-${Math.max(0, TOPICS.groupOf(tag))}`;
  const tagsHTML = e => tagsOf(e).map(t => `<span class="tag ${tagClass(t)}">${esc(t)}</span>`).join("");
  const tagsText = e => tagsOf(e).join("／");
  const personaOf = codes => TOPICS.personaOf(codes.map(c => byCode[c]).filter(Boolean));
  let eventImageObserver;
  function fitEventImages() {
    if (typeof ResizeObserver === "undefined") return;
    if (eventImageObserver) eventImageObserver.disconnect();
    const cards = [...document.querySelectorAll("#timeline .ev")];
    const fit = () => cards.forEach(card => {
      const body = card.querySelector(".ev-body"), frame = card.querySelector(".ev-image");
      const img = frame && frame.querySelector("img.pic");
      if (!body || !img) return;
      const credit = frame.querySelector(".pic-source");
      const padding = getComputedStyle(frame);
      const creditStyle = credit && getComputedStyle(credit);
      const creditHeight = credit ? credit.getBoundingClientRect().height + parseFloat(creditStyle.marginTop) + parseFloat(creditStyle.marginBottom) : 0;
      const available = Math.max(0, body.getBoundingClientRect().height - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom) - creditHeight);
      img.style.maxHeight = `${available}px`;
      // 限高時完整縮放圖片，避免裁掉直式圖的內容。
      const ratio = getComputedStyle(img).aspectRatio.split("/").map(Number);
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const displayRatio = ratio.length === 2 && ratio.every(Number.isFinite) ? ratio[0] / ratio[1] : naturalRatio;
      img.style.objectFit = card.classList?.contains("repeat") ? "cover" : img.clientWidth / displayRatio > available ? "contain" : "";
    });
    eventImageObserver = new ResizeObserver(fit);
    cards.forEach(card => {
      eventImageObserver.observe(card.querySelector(".ev-body"));
      const credit = card.querySelector(".pic-source"), img = card.querySelector("img.pic");
      if (credit) eventImageObserver.observe(credit);
      if (img && !img.complete) img.addEventListener("load", fit, { once: true });
    });
    fit();
  }
  const expandedTagLists = new Set();
  const tagToggleHTML = id => `<div class="tag-toggle-row"><button class="more tag-toggle" data-toggle-tags="${id}" aria-controls="${id}" aria-expanded="${expandedTagLists.has(id)}">${expandedTagLists.has(id) ? "收合標籤" : "展開全部標籤"}</button></div>`;
  function toggleTagList(id) {
    if (expandedTagLists.has(id)) expandedTagLists.delete(id);
    else expandedTagLists.add(id);
    const expanded = expandedTagLists.has(id);
    $("#" + id).classList.toggle("expanded", expanded);
    const button = document.querySelector(`[data-toggle-tags="${id}"]`);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "收合標籤" : "展開全部標籤";
  }

  /* ---------- 分頁切換 ---------- */
  let PAGE = "home", PARAMS = {};
  const NAV = [["review", `票選${YEAR}年司法大事`], ["result", "年度結果"], ["polls", "司法民調"], ["about", "關於"]];
  const pageFromHash = () => (location.hash.slice(1) || "home").split("?")[0];
  function go(page, params, fromHistory) {
    if (eventImageObserver) eventImageObserver.disconnect();
    PAGE = Object.hasOwn(PAGES, page) ? page : "home";
    if (!fromHistory) { try { history.pushState({ page: PAGE, params: params || {} }, "", PAGE === "home" ? location.pathname + location.search : "#" + PAGE); } catch (e) { } }
    PARAMS = params || {};
    document.body.dataset.page = PAGE;
    const navName = PAGE === "judicial-yuan-survey" ? "司法院一般民眾對司法認知調查" : PAGE === "gvm-survey" ? "遠見臺灣社會信任調查" : PAGE === "ccu-survey" ? "臺灣民眾對司法與犯罪防制滿意度調查（2018–2025）" : PAGE === "tadels-survey" ? "臺灣法律與社會變遷調查" : (NAV.find(n => n[0] === PAGE) || [])[1];
    document.title = (navName ? navName + "｜" : "") + `${YEAR} 年度司法大事記｜民間司改會`;
    if ($("#dlg").open) $("#dlg").close();
    document.querySelectorAll(".nav [data-go]").forEach(a => a.toggleAttribute("aria-current", a.dataset.go === (["ccu-survey", "gvm-survey", "judicial-yuan-survey"].includes(PAGE) ? "polls" : PAGE === "tadels-survey" ? "polls" : PAGE)));
    document.querySelectorAll(".nav [aria-current]").forEach(a => a.setAttribute("aria-current", "page"));
    // 手機版選單可橫向捲動：把目前頁面的按鈕捲進畫面
    const cur = $(".nav [aria-current]"), nav = $(".nav");
    if (cur) nav.scrollLeft += cur.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - cur.offsetWidth) / 2;
    $("#tray").classList.add("hide");
    PAGES[PAGE]();
    window.scrollTo(0, 0);
  }
  // 所有 data-go 連結都由這裡接手
  document.addEventListener("click", ev => {
    const toggle = ev.target.closest("[data-toggle-tags]");
    if (toggle) { toggleTagList(toggle.dataset.toggleTags); return; }
    const g = ev.target.closest("[data-go]");
    if (!g) return;
    ev.preventDefault();
    const params = {};
    if (g.dataset.tag) params.tag = g.dataset.tag;
    if (g.dataset.year) params.year = g.dataset.year;
    if (g.dataset.preview) params.preview = true;
    go(g.dataset.go, params);
  });

  function renderChrome() {
    document.body.insertAdjacentHTML("afterbegin", `
      <svg width="0" height="0" style="position:absolute" aria-hidden="true">
        <symbol id="bu" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="7"/><path d="M50 8 V92 M50 42 L88.9 65.7" fill="none" stroke="currentColor" stroke-width="8"/></symbol>
      </svg>
      <header class="topbar"><div class="wrap">
        <a class="brand" href="#" data-go="home" aria-label="回首頁">
          <img class="brand-logo" src="${esc(C.logo || "images/jrf-logo.png")}" alt="民間司法改革基金會">
          <span>年度司法大事記<small>民間司法改革基金會</small></span>
        </a>
        <nav class="nav" aria-label="主要選單">${NAV.map(([k, t]) => `<a href="#${k}" data-go="${k}">${t}</a>`).join("")}</nav>
      </div></header>
      <main id="main"></main>`);
    document.body.insertAdjacentHTML("beforeend", `
      <div class="tray hide" id="tray" role="region" aria-label="我的年度大事">
        <div class="wrap">
          <div class="tray-slots" id="traySlots"></div>
          <div class="tray-text" id="trayText"></div>
          <button class="btn btn-primary" id="submitBtn" disabled>完成我的清單</button>
        </div>
      </div>
      <footer><div class="wrap">
        <div>© 財團法人民間司法改革基金會<br>台北市大同區民生西路290號4樓｜(02)2523-1178</div>
        <div><a href="https://www.jrf.org.tw/" target="_blank" rel="noopener">司改會官網</a>　<a href="#" data-go="about">隱私與免責聲明</a></div>
      </div></footer>
      <dialog id="dlg"><button class="dlg-close" id="dlgClose" aria-label="關閉">×</button><div class="dlg-inner" id="dlgInner"></div></dialog>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>`);
    $("#dlgClose").onclick = () => $("#dlg").close();
    $("#dlg").addEventListener("click", e => { if (e.target === $("#dlg")) $("#dlg").close(); });
    $("#submitBtn").onclick = confirmList;
    // 圈選與詳情（任何頁面都適用）
    document.addEventListener("click", ev => {
      const u = ev.target.closest("[data-unpick]"); if (u) return togglePick(u.dataset.unpick);
      const p = ev.target.closest("[data-pick]"); if (p) return togglePick(p.dataset.pick);
      const o = ev.target.closest("[data-open]"); if (o) return openDetail(o.dataset.open, o.dataset.year);
      const f = ev.target.closest("[data-f]"); if (f) { filter = f.dataset.f; renderReviewList(); }
    });
  }
  const main = html => { $("#main").innerHTML = html; };
  function openDialog(html) { $("#dlgInner").innerHTML = html; $("#dlg").showModal(); $("#dlg").scrollTop = 0; }

  /* 段落：依換行分段，每段首行縮排兩字 */
  const paras = t => String(t || "").split(/\n+/).filter(s => s.trim()).map(s => `<p>${esc(s.trim())}</p>`).join("");
  /* 圖片比例：未設定時沿用 3:2；比例名稱採白名單，避免直接把資料當 CSS 注入。 */
  const IMAGE_RATIOS = { "original": "ratio-original", "3:2": "ratio-3-2", "2:3": "ratio-2-3", "4:5": "ratio-4-5", "5:4": "ratio-5-4", "9:16": "ratio-9-16" };
  const imageRatio = e => Object.prototype.hasOwnProperty.call(IMAGE_RATIOS, e.imageRatio) ? e.imageRatio : "3:2";
  const imageRatioClass = e => IMAGE_RATIOS[imageRatio(e)];
  /* 圖片：沒有圖時顯示預留框 */
  const picHTML = e => e.image ? `<img class="pic ${imageRatioClass(e)}" src="${esc(e.image)}" alt="" loading="lazy">`
    : DEV ? `<span class="pic-ph ${imageRatioClass(e)}"><span><b>🖼</b>圖片預留<br>建議 ${imageRatio(e)}</span></span>` : `<span class="pic-ph pic-empty ${imageRatioClass(e)}">${STAMP()}</span>`;
  /* 正式版沒有圖片時，不顯示圖片區塊 */
  const hasPic = e => !!e.image || DEV;
  const imgBtn = (e, repeat = false) => hasPic(e) ? `<div class="ev-image"><button class="ev-img-btn" data-open="${e.code}" aria-label="看完整回顧：${esc(e.title)}">${picHTML(repeat ? { ...e, imageRatio: "3:2" } : e)}</button>${repeat ? "" : picCredit(e)}</div>` : "";
  const picCredit = e => {
    if (!e.image || !e.imageSource || !e.imageSource.some(Boolean)) return "";
    const [name, url] = e.imageSource;
    const label = esc(name || url);
    return `<p class="pic-source">${url ? `<a class="source-tag" href="${esc(url)}" target="_blank" rel="noopener">圖片來源：${label}</a>` : `<span class="source-tag">圖片來源：${label}</span>`}</p>`;
  };
  const mediaStyle = m => { const c = MEDIA[m] || ["#ECEEF2", "#4A5168"]; return `background:${c[0]};color:${c[1]}`; };

  function openDetail(code, year) {
    const D = year ? DATA[year] : YD;
    const e = D.events.find(x => x.code === code);
    const canPick = D === YD && !st.sent && !CLOSED;
    const on = st.picks.includes(code);
    openDialog(`
      <div class="d-meta"><span class="ev-code">${e.code}</span>${tagsHTML(e)}<span>${dateOf(e)}</span></div>
      <h2 class="d-title">${esc(e.title)}</h2>
      ${hasPic(e) ? `<div class="d-pic">${picHTML(e)}${picCredit(e)}</div>` : ""}
      <h3 class="d-sec">事件回顧</h3>
      <div class="full">${e.full ? paras(e.full) : paras(e.summary) + (DEV ? `<p class="draft-note" style="text-indent:0">詳細版撰寫中，目前先顯示簡短版。</p>` : "")}</div>
      <h3 class="d-sec">相關事件時間軸</h3>
      <ol class="tl">${[...e.news].sort((x, y) => x.date.localeCompare(y.date)).map(n => `
        <li class="${n.key ? "key" : ""}"><${n.url ? `a href="${esc(n.url)}" target="_blank" rel="noopener"` : `div class="nolink"`}>
          <span class="when">${fmtD(n.date)}</span>
          <span class="h">${esc(n.title)}</span><span class="media" style="${mediaStyle(n.media)}">${esc(n.media)}</span>
        </${n.url ? "a" : "div"}></li>`).join("")}</ol>
      <div class="dlg-actions" style="margin-top:24px">
        ${canPick ? `<button class="btn ${on ? "btn-ghost" : "btn-primary"}" id="dlgPick">${on ? "取消圈選" : "圈選"}</button>` : ""}
        <button class="btn btn-ghost" id="dlgBack">關閉</button>
      </div>`);
    $("#dlgBack").onclick = () => $("#dlg").close();
    const pb = $("#dlgPick"); if (pb) pb.onclick = () => { $("#dlg").close(); togglePick(code); };
  }

  /* ===================== 首頁 ===================== */
  function pageHome() {
    const figures = [
      ["6.7 倍", "2025年法院使用323件，較2024年的48件增加至6.7倍。", "3"],
      ["2 / 71", "新北地院書記官缺71人僅2人報到。", "12"],
      ["14 年", "2026年5月，高院裁定開始再審，10月1日改判無罪，11月2日無罪確定，歷時14年的冤案終獲平反。", "26"],
      ["20 歲", "刑法三讀修正　兒少性侵案被害人20歲前不計追訴期", "16"]
    ];
    main(`
      <section class="hero"><div class="wrap">
        <div>
          <h1>${YEAR}，<br>司法圈發生了什麼事？</h1>
          <p class="lead">我們整理了今年 ${EV.length} 件重要的司法事件，邀你一起閱讀事件摘要、完整回顧與新聞時間軸，圈選心中的年度司法大事。</p>
          <button class="btn btn-primary" data-go="review">開始回顧</button>
        </div>
        <div class="ballot" aria-hidden="true">
          <div class="ballot-head">${YEAR} 司法大事記</div>
          ${["1", "8", "11", "26"].map(code => {
            const e = byCode[code];
            return `<div class="ballot-row"><span>${monthLabel(firstKey(e))}</span><span>${esc(e.title)}</span><span class="slot"></span></div>`;
          }).join("")}
        </div>
      </div></section>

      <section><div class="wrap">
        <h2 class="sec-title">今年的幾個數字</h2>
        <p class="sec-sub">點一下，看看數字背後的事件。</p>
        <div class="figures">${figures.map(f => `<button class="fig" data-open="${f[2]}"><b>${f[0]}</b><span>${f[1]}</span><small>看這件事</small></button>`).join("")}</div>
      </div></section>

      <section><div class="wrap">
        <h2 class="sec-title">依主題回顧</h2>
        <p class="sec-sub">依事件標籤探索今年的司法大事；同一事件可以有多個標籤。</p>
        <div class="topics tag-options${expandedTagLists.has("homeTopics") ? " expanded" : ""}" id="homeTopics">${[...TAGS].sort((a, b) => EV.filter(e => tagsOf(e).includes(b)).length - EV.filter(e => tagsOf(e).includes(a)).length).map(t => `<button class="topic ${tagClass(t)}" data-go="review" data-tag="${t}"><b>${t}</b><span>${EV.filter(e => tagsOf(e).includes(t)).length} 件事件</span></button>`).join("")}</div>
        ${tagToggleHTML("homeTopics")}
      </div></section>

      <section><div class="wrap">
        <h2 class="sec-title">回顧完，圈出你心中的年度大事</h2>
        <p class="sec-sub">看完今年發生的事，哪幾件讓你印象最深、覺得影響最大？</p>
        <ol class="how">
          <li><b>回顧</b><span>依月份讀完今年的司法大事，想知道更多就點開完整版</span></li>
          <li><b>圈選</b><span>在你覺得最重要的事件旁蓋章，最多 ${C.maxPicks} 件</span></li>
          <li><b>留下你的清單</b><span>得到專屬圖卡和關注類型，大家的選擇會在 ${C.announce} 一起公布</span></li>
        </ol>
      </div></section>

      <section><div class="wrap">
        <div class="doors">
          <button class="door" data-go="polls" style="text-align:left"><div class="ico">🔎</div><h3>司法民調</h3><p>這一年，民眾怎麼看司法？各單位的調查一次看懂。</p></button>
          <button class="door" data-go="about" style="text-align:left"><div class="ico">💬</div><h3>關於這個網站</h3><p>為什麼要回顧一年的司法大事？事件是怎麼整理的？</p></button>
        </div>
      </div></section>`);
  }

  /* ===================== 大事記 ===================== */
  let filter = "全部";
  function pageReview() {
    filter = PARAMS.tag || "全部";
    let notice = "";
    if (st.sent) notice = `<div class="notice">你已經留下了自己的年度大事清單，紅色印章是你圈的事件。<a href="#" data-go="result">看我的清單</a></div>`;
    else if (CLOSED) notice = `<div class="notice">${YEAR} 年度大事的圈選已經結束，謝謝大家參與！</div>`;
    main(`
      <div class="wrap page-head">
        <h1 class="page-title">票選${YEAR}年司法大事</h1>
        <p class="page-sub">依時間順序回顧今年的 ${EV.length} 件司法大事。讀到覺得重要的，就在右邊蓋個章，最後選出最重要的 ${C.maxPicks} 件送出。</p>
      </div>
      <section style="padding-top:24px"><div class="wrap">
        ${notice}
        <div class="filters tag-options${expandedTagLists.has("filters") ? " expanded" : ""}" role="group" aria-label="依主題篩選" id="filters"></div>
        ${tagToggleHTML("filters")}
        <div id="timeline"></div>
      </div></section>`);
    renderReviewList();
    renderTray();
  }

  function renderReviewList() {
    if (!$("#timeline")) return;
    const options = ["全部", ...TAGS];
    // 收合後仍看得到正在使用的分類。
    if (options.indexOf(filter) >= 5) { options.splice(options.indexOf(filter), 1); options.splice(4, 0, filter); }
    $("#filters").innerHTML = options.map(t => {
      const n = t === "全部" ? EV.length : EV.filter(e => tagsOf(e).includes(t)).length;
      return `<button class="chip" aria-pressed="${t === filter}" data-f="${t}">${t}<span class="n">${n}</span></button>`;
    }).join("");
    const locked = st.sent || CLOSED;
    const list = EV.filter(e => filter === "全部" || tagsOf(e).includes(filter));
    const occ = list.flatMap(e => keyNews(e).map(n => ({ e, n })))
      .sort((x, y) => x.n.date.localeCompare(y.n.date) || Number(x.e.code) - Number(y.e.code));
    const months = [...new Set(occ.map(o => o.n.date.slice(0, 7)))];
    const seen = new Set();
    occ.forEach(o => { o.repeat = seen.has(o.e.code); seen.add(o.e.code); });
    $("#timeline").className = locked ? "locked-list" : "";
    $("#timeline").innerHTML = months.map(ym => {
      const items = occ.filter(o => o.n.date.slice(0, 7) === ym);
      const x = ymd(items[0].n.date);
      return `<div class="month">
        <div class="month-label"><b>${x.m}月</b><small>${x.y}</small></div>
        <div class="month-events">${items.map(({ e, n, repeat }) => {
          const on = st.picks.includes(e.code);
          const pick = `<button class="ev-pick" data-pick="${e.code}" aria-pressed="${on}" ${locked ? "disabled" : ""} aria-label="${on ? "取消圈選" : "圈選"}：${esc(e.title)}">
              <span class="ring">${STAMP()}</span>${locked ? (on ? "我圈的" : "") : (on ? "已圈" : "圈選")}
            </button>`;
          const cls = `${on ? "picked" : ""} ${hasPic(e) ? "" : "noimg"}`;
          if (repeat) return `<article class="ev repeat ${cls}">
            ${imgBtn(e, true)}
            <div class="ev-body">
              <h3><time class="repeat-date" datetime="${n.date.replaceAll("/", "-")}">${fmtD(n.date)}</time> <span class="news-source" style="${mediaStyle(n.media)}">${esc(n.media)}</span> <button class="repeat-news" data-open="${e.code}">${esc(n.title)}</button></h3>
              <p class="repeat-subtitle"><button class="repeat-review" data-open="${e.code}"><b>回看事件 ${e.code}｜</b><span class="repeat-event-title">${esc(e.title)}</span></button></p>
            </div>${pick}
          </article>`;
          const others = keyNews(e).filter(k => k !== n).map(k => monthLabel(k.date));
          return `<article class="ev ${cls}">
            ${imgBtn(e)}
            <div class="ev-body">
              <div class="ev-top"><span class="ev-code">${e.code}</span>${tagsHTML(e)}<span>${fmtD(n.date)}</span>${others.length ? `<span class="dup">相關事件也出現在${others.join("、")}</span>` : ""}</div>
              <h3>${esc(e.title)}</h3>
              <div class="sum">${paras(e.summary)}</div>
              <button class="btn btn-dark btn-small" data-open="${e.code}">看完整回顧</button>
            </div>
            ${pick}
          </article>`;
        }).join("")}</div>
      </div>`;
    }).join("");
    fitEventImages();
  }

  function togglePick(code) {
    if (st.sent || CLOSED) return;
    if (st.picks.includes(code)) st.picks = st.picks.filter(p => p !== code);
    else st.picks.push(code);
    save(); renderReviewList(); renderTray();
  }

  function renderTray() {
    if (PAGE !== "review") return;
    const n = st.picks.length, max = C.maxPicks, displaySlots = 10, over = n > max;
    let html = st.picks.map((c, i) => `<span class="pick-wrap">
        <button class="pick-chip ${i >= max ? "extra" : ""}" data-unpick="${c}" aria-label="取消圈選 ${c}：${esc(byCode[c].title)}">${c}</button>
        <span class="tip"><button class="tip-box" data-open="${c}"><span class="tt">${esc(byCode[c].title)}</span><small>點標題看完整回顧，點編號取消圈選</small></button></span>
      </span>`).join("");
    for (let i = n; i < displaySlots; i++) {
      const slotType = i < max ? "available" : "preview";
      html += `<span class="tray-slot ${slotType}" aria-label="${slotType === "available" ? "可投票空格" : "示意空格，不列入投票"}"></span>`;
    }
    $("#traySlots").innerHTML = html;
    $("#trayText").innerHTML = n === 0
      ? `<b>我的年度大事</b><br>讀到覺得重要的事件，就在右邊蓋章`
      : over
        ? `<b class="warn">已圈 ${n} 件</b><br>最多只能送出 ${max} 件，請再取消 ${n - max} 件`
        : `<b>已圈 ${n} 件</b><br>${n < max ? `還可以再圈 ${max - n} 件，也可以先完成清單` : "圈滿了！完成你的年度大事清單吧"}`;
    $("#tray").classList.toggle("over", over);
    $("#submitBtn").disabled = n === 0;
    $("#tray").classList.toggle("hide", st.sent || CLOSED);
  }

  function confirmList() {
    if (!st.picks.length) return;
    if (st.picks.length > C.maxPicks) {
      const extra = st.picks.length - C.maxPicks;
      openDialog(`
        <h2>最多只能圈 ${C.maxPicks} 件喔</h2>
        <p>你目前圈了 <b>${st.picks.length}</b> 件，請先取消 <b>${extra}</b> 件再送出。</p>
        <p class="draft-note">在頁面最下方的清單點一下事件編號，就能取消圈選。</p>
        <div class="dlg-actions"><button class="btn btn-primary" id="dlgBack">好，我去調整</button></div>`);
      $("#dlgBack").onclick = () => $("#dlg").close();
      const t = $("#tray"); t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake");
      return;
    }
    openDialog(`
      <h2>這是你心中的 ${YEAR} 司法大事</h2>
      <ul class="mylist">${st.picks.map(c => `<li>${STAMP()}<span>${esc(byCode[c].title)}<small>${dateOf(byCode[c])}</small></span></li>`).join("")}</ul>
      <label class="email-field" for="voterEmail">Email</label>
      <input class="email-input" id="voterEmail" type="text" inputmode="email" autocomplete="email" placeholder="請填寫您的 Email" aria-required="true" aria-describedby="emailHint">
      <p class="email-hint" id="emailHint">請留下 Email，供司改會核對投票資料。</p>
      <p class="draft-note">送出後無法修改。你的選擇會在 ${C.announce} 和司改會的評選一起公布。</p>
      <div class="dlg-actions">
        <button class="btn btn-primary" id="doSend" disabled>送出我的清單</button>
        <button class="btn btn-ghost" id="dlgBack">再看看</button>
      </div>`);
    $("#dlgBack").onclick = () => $("#dlg").close();
    $("#voterEmail").oninput = () => { $("#doSend").disabled = sending || !$("#voterEmail").value.trim(); };
    $("#doSend").onclick = sendList;
    $("#voterEmail").focus();
  }

  /* ---------- 送出：在網站內填寫 Email，直接傳送到 Google 表單 ---------- */
  const F = C.googleForm || {};
  let sending = false;
  async function sendList() {
    if (sending || st.sent) return;
    const input = $("#voterEmail");
    const email = input.value.trim();
    if (!email) {
      $("#doSend").disabled = true;
      input.focus();
      return toast("請先填寫 Email");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input.focus();
      return toast("請填寫正確的 Email 格式，例如 name@example.com");
    }
    if (!st.picks.length || st.picks.length > C.maxPicks) return;
    if (YD.status === "closed" || Date.now() > DEADLINE) return toast("圈選已截止，謝謝你的關注");
    if (!F.action || !F.picksEntry || !F.emailEntry) return toast("送出功能尚未設定完成，請稍後再試");
    const btn = $("#doSend");
    sending = true;
    input.disabled = true;
    btn.disabled = true;
    btn.textContent = "送出中…";
    try {
      const body = new URLSearchParams();
      st.picks.forEach(c => body.append(F.picksEntry, c));
      body.append(F.emailEntry, email);
      // Google 不提供跨來源回應；實際入表結果需由管理者在回覆試算表確認。
      await fetch(F.action, { method: "POST", mode: "no-cors", credentials: "omit", body });
      st.sent = true; st.at = Date.now(); save();
      $("#dlg").close(); go("result"); toast("謝謝你一起回顧這一年！");
    } catch (e) {
      toast("送出失敗，請確認網路連線後再試一次");
    } finally {
      sending = false;
      input.disabled = false;
      btn.disabled = !input.value.trim();
      btn.textContent = "送出我的清單";
    }
  }

  /* ===================== 年度結果 ===================== */
  function pageResult() {
    if (PUBLISHED) {
      main(`<div class="wrap page-head"><h1 class="page-title">${YEAR} 年度十大司法事件</h1>
        <p class="page-sub">共 ${YD.final.voters.toLocaleString()} 人留下了自己的年度清單。</p></div>
        <section style="padding-top:24px"><div class="wrap">${resultsBlock(YD, YD.final.votes, YD.jrfTop, st.picks)}</div></section>`);
      animateBars($("#main"));
      return;
    }
    const p = st.sent ? personaOf(st.picks) : null;
    const head = `<div class="wrap page-head"><h1 class="page-title">${st.sent ? `我心中的 ${YEAR} 司法大事` : `${YEAR} 年度結果`}</h1>
      <p class="page-sub">${st.sent ? "謝謝你一起回顧這一年。這是你圈出的年度大事清單。" : `大家心中的年度大事，會在 ${C.announce} 和司改會評選一起公布。`}</p></div>`;
    const announce = `<div class="announce"><div class="big">⏳</div>
        <h3>年度結果將在 ${C.announce} 公布</h3>
        <p>屆時會並列「大家心中的年度大事」與「司改會評選」，看看我們關心的地方有哪些相同、哪些不同。</p>
        ${st.sent ? "" : `<button class="btn btn-primary" data-go="review">先去回顧今年大事</button>`}</div>`;
    if (!p) { main(head + `<section style="padding-top:24px"><div class="wrap">${announce}</div></section>`); return; }
    main(head + `<section style="padding-top:24px"><div class="wrap">
      <div class="persona">
        <div class="emoji" aria-hidden="true">${p.emoji}</div>
        <div>
          <p class="small">從你圈的事件來看，你的司法關注類型是</p>
          <h3>${p.name}</h3>
          <p>${esc(p.text)}</p>
          <div class="persona-topics">${p.topics.map(t => `<span>${esc(t.topic)}</span>`).join("")}</div>
          <p class="persona-note">依圈選事件的主題歸納，僅供趣味參考。</p>
          <div class="acts">
            <button class="btn btn-primary btn-small" id="cardBtn">製作我的年度大事圖卡</button>
            <button class="btn btn-ghost btn-small" id="shareBtn">分享文字</button>
          </div>
        </div>
      </div>
      <ul class="mylist">${st.picks.map(c => `<li>${STAMP()}<span><button class="more" style="text-decoration:none" data-open="${c}">${esc(byCode[c].title)}</button><small>${esc(tagsText(byCode[c]))}｜${dateOf(byCode[c])}</small></span></li>`).join("")}</ul>
      ${announce}</div></section>`);
    $("#cardBtn").onclick = () => openShareCard(p);
    $("#shareBtn").onclick = shareText;
  }

  function rankingHTML(events, votes, mine, year) {
    const sorted = [...events].sort((a, b) => votes[b.code] - votes[a.code]);
    const max = Math.max(1, votes[sorted[0].code]);
    return `<ol class="rank">${sorted.map((e, i) => {
      const m = mine.includes(e.code);
      return `<li class="${m ? "mine" : ""}"><span class="pos">${i + 1}</span><div>
        <div class="r-title"><span><button class="more" style="text-decoration:none" data-open="${e.code}" ${year ? `data-year="${year}"` : ""}>${esc(e.title)}</button>${m ? `<span class="mine-badge">${STAMP()}你圈的</span>` : ""}</span><span class="r-count">${votes[e.code].toLocaleString()} 人</span></div>
        <div class="bar"><i data-w="${(votes[e.code] / max * 100).toFixed(1)}"></i></div></div></li>`;
    }).join("")}</ol>`;
  }
  function compareHTML(events, votes, jrfTop, n) {
    const pub = [...events].sort((a, b) => votes[b.code] - votes[a.code]).slice(0, n).map(e => e.code);
    const jrf = jrfTop.slice(0, n);
    const both = pub.filter(c => jrf.includes(c));
    const col = (cls, h, who, codes) => `<div class="cmp-col ${cls}"><h3>${h}</h3><p class="who">${who}</p><ol>
      ${codes.map((c, i) => `<li class="${both.includes(c) ? "both" : ""}"><span class="p">${i + 1}</span><span>${esc(events.find(x => x.code === c).title)}</span></li>`).join("")}</ol></div>`;
    return `<div class="compare">${col("public", "大家心中的年度大事", "依網站參與者的圈選統計", pub)}${col("jrf", "司改會評選", "由民間司改會同仁與顧問評選", jrf)}</div>
      <p class="cmp-legend"><i></i>兩邊都選進前 ${n} 名的事件，共 ${both.length} 件</p>`;
  }
  function resultsBlock(D, votes, jrfTop, mine, year) {
    return `${jrfTop ? compareHTML(D.events, votes, jrfTop, 10) : ""}
      <h3 class="sub">大家心中的年度大事：完整排名</h3>${rankingHTML(D.events, votes, mine, year)}`;
  }
  function animateBars(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll(".bar i").forEach(b => b.style.width = b.dataset.w + "%")));
  }

  async function shareText() {
    const text = `我心中的 ${YEAR} 司法大事：\n${st.picks.map(c => "・" + byCode[c].title).join("\n")}\n一起來回顧今年的司法大事吧！`;
    const url = C.siteUrl || location.href.split("#")[0];
    try {
      if (navigator.share) { await navigator.share({ title: `${YEAR} 年度司法大事記`, text, url }); return; }
      await navigator.clipboard.writeText(text + "\n" + url); toast("已複製分享文字，貼到社群就能分享");
    } catch (e) { }
  }

  /* ---------- 分享圖卡 ---------- */
  function wrapText(ctx, s, maxW, maxLines) {
    const lines = []; let cur = "";
    for (const ch of s) { if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines); let last = kept[maxLines - 1];
      while (ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      kept[maxLines - 1] = last + "…"; return kept;
    }
    return lines;
  }
  function drawStamp(ctx, cx, cy, r) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.14); ctx.strokeStyle = "#D62839"; ctx.lineCap = "round";
    ctx.lineWidth = r * 0.15; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = r * 0.19; ctx.lineCap = "butt";
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
    const ang = 22 * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.19); ctx.lineTo(r * Math.cos(ang), r * Math.sin(ang)); ctx.stroke();
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  async function drawCard(p) {
    const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const HAND = '"LXGW WenKai TC","Kaiti TC",serif', BODY = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    const url = (C.siteUrl || "").replace(/^https?:\/\//, "") || "民間司改會官網";
    const all = st.picks.map(c => byCode[c].title).join("") + p.name + `民間司改會${YEAR}年度司法大事記我心中的司法大事關注類型一起回顧今年月` + url;
    try { await Promise.all([document.fonts.load(`700 96px "LXGW WenKai TC"`, all), document.fonts.load(`500 40px "Noto Sans TC"`, all)]); } catch (e) { }
    x.fillStyle = "#1B2559"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#FFCB47"; x.font = `700 42px ${HAND}`; x.fillText(`民間司改會｜${YEAR} 年度司法大事記`, 80, 150);
    x.fillStyle = "#FFFFFF"; x.font = `700 92px ${HAND}`; x.fillText(`我心中的 ${YEAR}`, 80, 270); x.fillText("司法大事", 80, 375);
    x.font = `500 36px ${BODY}`;
    const rows = st.picks.map(c => ({ m: monthLabel(firstKey(byCode[c])), lines: wrapText(x, byCode[c].title, 640, 3) }));
    const rowH = rows.map(r => r.lines.length * 48 + 32);
    const paperY = 440, paperH = 40 + rowH.reduce((a, b) => a + b, 0) + 20;
    x.fillStyle = "#FFFFFF"; roundRect(x, 60, paperY, 960, paperH, 18); x.fill();
    let y = paperY + 30;
    rows.forEach((r, i) => {
      x.fillStyle = "#D62839"; x.font = `700 40px ${HAND}`; x.fillText(r.m, 104, y + 54);
      x.fillStyle = "#1B2559"; x.font = `500 36px ${BODY}`;
      r.lines.forEach((ln, j) => x.fillText(ln, 220, y + 54 + j * 48));
      drawStamp(x, 940, y + rowH[i] / 2, 42);
      y += rowH[i];
      if (i < rows.length - 1) { x.strokeStyle = "#D3DAE2"; x.lineWidth = 2; x.beginPath(); x.moveTo(100, y); x.lineTo(980, y); x.stroke(); }
    });
    const py = Math.min(paperY + paperH + 80, H - 420);
    x.fillStyle = "#FFCB47"; x.beginPath(); x.arc(170, py + 90, 90, 0, Math.PI * 2); x.fill();
    x.font = `96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(p.emoji, 170, py + 96); x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillStyle = "rgba(255,255,255,.7)"; x.font = `500 36px ${BODY}`; x.fillText("我的司法關注類型", 300, py + 60);
    x.fillStyle = "#FFFFFF"; x.font = `700 88px ${HAND}`; x.fillText(p.name, 300, py + 160, W - 380);
    x.fillStyle = "#FFCB47"; x.font = `700 52px ${HAND}`; x.fillText("一起回顧今年的司法大事", 80, H - 150);
    x.fillStyle = "rgba(255,255,255,.8)"; x.font = `500 36px ${BODY}`; x.fillText(url, 80, H - 90);
    drawStamp(x, 950, H - 140, 64);
    return cv;
  }
  async function openShareCard(p) {
    openDialog(`<h2>我的年度大事圖卡</h2><p style="color:var(--muted)">製作中…</p>`);
    const cv = await drawCard(p);
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const file = new File([blob], `jrf-${YEAR}-my-list.png`, { type: "image/png" });
    const href = URL.createObjectURL(blob);
    const canShare = navigator.canShare && navigator.canShare({ files: [file] });
    $("#dlgInner").innerHTML = `<h2>我的年度大事圖卡</h2>
      <img class="share-preview" src="${href}" alt="我的年度大事圖卡預覽">
      <div class="dlg-actions" style="justify-content:center">
        ${canShare ? `<button class="btn btn-primary" id="shareFile">分享到社群</button>` : ""}
        <a class="btn ${canShare ? "btn-ghost" : "btn-primary"}" href="${href}" download="${file.name}">下載圖片</a>
      </div>
      <p class="draft-note" style="margin-top:16px">圖片尺寸 1080×1920，適合 Instagram 與 Facebook 限時動態。</p>`;
    const sb = $("#shareFile");
    if (sb) sb.onclick = async () => { try { await navigator.share({ files: [file], text: `我心中的 ${YEAR} 司法大事` }); } catch (e) { } };
  }

  /* ===================== 司法民調 ===================== */
  function pagePolls() {
    const P = window.JRF_POLLS;
    main(`<div class="wrap page-head"><h1 class="page-title">司法民調觀測站</h1>
        <div class="polls-intro">
          <p>司法是否受到人民信任，長期以來一直是臺灣社會關注的議題。媒體報導與公共討論經常引用各種民意調查，呈現民眾對法官、法院及司法制度的不同評價。然而，不同調查的提問方式、調查對象與時間範圍各有差異，單看某一年度的數字，未必能充分理解民意的長期變化。</p>
          <p>為了更完整地呈現臺灣民眾對司法的觀感，民間司法改革基金會整理不同機構公布的歷年調查結果，將相關數據與變化趨勢集中呈現，並保留原始資料來源，希望提供社會大眾一個更容易查詢、理解及檢視司法民意的參考平台。</p>
        </div></div>
      <section class="polls-reading"><div class="wrap"><h2 class="sec-title">如何閱讀這些民調？</h2>
        <div class="polls-copy"><p>民意調查反映的是特定時間內，受訪民眾對司法及相關制度的認知與評價，不能直接等同司法運作或改革成效的客觀表現。民意的變化可能受到重大社會事件、媒體報導、調查方法等因素影響，因此不能僅憑數字升降，判斷司法改革是否成功。</p>
        <p>儘管如此，長期累積的民調資料，仍有助於觀察社會對司法的態度及其變化，具有重要的公共討論與政策參考價值。閱讀時應留意各調查的題目、對象與方法差異，不宜直接比較不同機構的百分比。</p></div></div></section>
      <section class="polls-directory"><div class="wrap"><h2 class="sec-title">歷年調查一覽</h2>
        <div class="poll-directory-grid">
          <a class="poll-directory-card" href="#judicial-yuan-survey" data-go="judicial-yuan-survey">
            <span class="poll-directory-meta">司法院｜2016–2025 年</span><h3>一般民眾對司法認知調查</h3>
            <p>司法信任、法官審判觀感、法院使用經驗及法律觀念。</p><span class="poll-directory-bottom"><span class="poll-directory-count">節錄 12 組指標</span><span class="poll-directory-link">查看調查結果</span></span>
          </a>
          <a class="poll-directory-card" href="#tadels-survey" data-go="tadels-survey">
            <span class="poll-directory-meta">臺灣法實證研究資料庫｜2009–2024 年</span><h3>臺灣法律與社會變遷調查</h3>
            <p>法院與法律專業評價、法律公平性及大法官表現。</p><span class="poll-directory-bottom"><span class="poll-directory-count">節錄 9 組指標</span><span class="poll-directory-link">查看調查結果</span></span>
          </a>
          <a class="poll-directory-card" href="#gvm-survey" data-go="gvm-survey">
            <span class="poll-directory-meta">遠見臺灣社會信任調查｜2006–2024 年</span><h3>遠見臺灣社會信任調查</h3>
            <p>法官與警察信任程度，以及司法公平正義的社會評價。</p><span class="poll-directory-bottom"><span class="poll-directory-count">節錄 3 組指標</span><span class="poll-directory-link">查看調查結果</span></span>
          </a>
          <a class="poll-directory-card" href="#ccu-survey" data-go="ccu-survey">
            <span class="poll-directory-meta">國立中正大學犯罪研究中心｜2018–2025 年</span><h3>臺灣民眾對司法與犯罪防制滿意度調查</h3>
            <p>刑事審判公正性、治安與警政、犯罪防制及死刑議題。</p><span class="poll-directory-bottom"><span class="poll-directory-count">節錄 6 組指標</span><span class="poll-directory-link">查看調查結果</span></span>
          </a>
        </div>
        <p class="polls-maintenance">各年度的原始問卷、調查結果及資料來源，詳見各調查頁面。<br>資料最後整理日期：${P.updated}</p>
      </div></section>`);
  }

  function pageCcuSurvey() {
    main(window.JRF_CCU_PAGE.render());
    window.JRF_CCU_PAGE.bind($("#main"));
  }

  function pageGvmSurvey() {
    main(window.JRF_GVM_PAGE.render());
    window.JRF_GVM_PAGE.bind($("#main"));
  }

  function pageJudicialYuanSurvey() {
    main(window.JRF_JUDICIAL_PAGE.render());
    window.JRF_JUDICIAL_PAGE.bind($("#main"));
  }

  function pageTadelsSurvey() {
    main(window.JRF_TADELS_PAGE.render());
    window.JRF_TADELS_PAGE.bind($("#main"));
  }

  /* ===================== 關於 ===================== */
  function pageAbout() {
    main(`<div class="wrap page-head"><h1 class="page-title">關於年度司法大事記</h1></div>
      <section style="padding-top:24px"><div class="wrap about">
        <div>
          <div class="card"><h2>為什麼要回顧一年的司法大事？</h2>
            <p>司法離每個人的生活都很近，但新聞一則接一則，很容易看過就忘。每到年底，我們把這一年重要的司法事件整理成大事記，邀請大家一起回頭看看：哪些事情影響了我們的權利，哪些改革還在路上。</p>
            <p>事件由民間司改會依當年度新聞整理。回顧之後，你也可以圈出心中最重要的幾件。大家的選擇會在 ${C.announce} 與司改會評選一起公布，看看彼此關心的地方。</p></div>
          <div class="card" style="margin-top:18px"><h2>參與方式與隱私</h2>
            <ol class="rules">
              <li>每人最多圈 ${C.maxPicks} 件，送出後無法修改。</li>
              <li>在網站填寫 Email 後即可送出，不需要登入 Google 帳號；同一個瀏覽器送出後無法再次投票。</li>
              <li>電子郵件只用來核對投票資料，不公開、不另作他用，只有負責統計的司改會同仁看得到，結果公布後刪除。想查詢或刪除自己的資料，請透過司改會官網與我們聯絡。</li>
              <li>圈選到 ${fmtDate(DEADLINE)} 截止，結果在 ${C.announce} 公布。</li>
            </ol></div>
          <div class="card" style="margin-top:18px"><h2>免責聲明</h2>
            <ol class="rules">
              <li>事件內容依公開的新聞報導、判決與官方資料整理，反映整理當時的資訊，不是法律意見。</li>
              <li>尚未判決確定的案件，被告依法推定無罪；列入大事記不代表司改會認定任何人有罪。</li>
              <li>事件圖片引用自各媒體報導，版權屬原媒體，出處標示於圖片下方；權利人如不同意使用，請與我們聯絡，我們會立即撤下。</li>
              <li>新聞連結的內容由各媒體負責。</li>
              <li>年度結果是參與者自願圈選的統計，不是抽樣民調。</li>
              <li>內容如有錯誤，歡迎透過司改會官網與我們聯絡。</li>
            </ol></div>
        </div>
        <div class="support"><h3>一起讓司法更值得信賴</h3>
          <p>民間司改會三十年來監督司法、救援冤案、推動修法，靠的是每一位支持者。</p>
          <a class="btn" href="https://www.jrf.org.tw/" target="_blank" rel="noopener">支持司改會</a></div>
      </div></section>`);
  }

  const PAGES = { home: pageHome, review: pageReview, result: pageResult, polls: pagePolls, "ccu-survey": pageCcuSurvey, "gvm-survey": pageGvmSurvey, "judicial-yuan-survey": pageJudicialYuanSurvey, "tadels-survey": pageTadelsSurvey, about: pageAbout };
  renderChrome();
  window.addEventListener("popstate", e => { const s = e.state || {}; go(s.page || pageFromHash(), s.params || {}, true); });
  go(pageFromHash(), {}, true);
})();
