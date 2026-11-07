/* =========================================================
   年度司法大事記｜圈選送出服務
   網站 → 這個 Worker（檢查來源、圈選內容、人機驗證、截止時間）→ Google 表單
   Google 表單網址只存在 Worker 的密鑰裡，不會出現在網站前端。
   ========================================================= */
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = okOrigin
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" }
      : { "Vary": "Origin" };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (new URL(req.url).pathname !== "/submit") return reply(404, { ok: false, error: "not_found" });
    if (req.method === "OPTIONS") return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    if (req.method !== "POST") return reply(405, { ok: false, error: "method" });
    if (!okOrigin) return reply(403, { ok: false, error: "origin" });
    if (env.DEADLINE && Date.now() > new Date(env.DEADLINE).getTime()) return reply(403, { ok: false, error: "closed" });

    let body;
    try { body = await req.json(); } catch (e) { return reply(400, { ok: false, error: "bad_request" }); }

    // 圈選內容：1 到 MAX_PICKS 件、不重複、每個都是 01 到 EVENT_COUNT 的兩位數代碼
    const max = Number(env.MAX_PICKS || 5), count = Number(env.EVENT_COUNT || 0);
    const picks = Array.isArray(body.picks) ? body.picks : [];
    const valid = picks.length >= 1 && picks.length <= max && new Set(picks).size === picks.length &&
      picks.every(c => typeof c === "string" && /^\d{2}$/.test(c) && +c >= 1 && +c <= count);
    if (!valid) return reply(400, { ok: false, error: "bad_picks" });

    // 人機驗證：向 Cloudflare 確認 token，並確認是在我們的網站上取得的
    const fd = new FormData();
    fd.append("secret", env.TURNSTILE_SECRET || "");
    fd.append("response", String(body.token || ""));
    const ip = req.headers.get("CF-Connecting-IP");
    if (ip) fd.append("remoteip", ip);
    let v = {};
    try { v = await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: fd })).json(); } catch (e) { }
    const hosts = allowed.map(o => { try { return new URL(o).hostname; } catch (e) { return ""; } });
    if (!v.success || (v.hostname && !hosts.includes(v.hostname))) return reply(403, { ok: false, error: "captcha" });

    // 寫入 Google 表單
    const form = new URLSearchParams();
    picks.forEach(c => form.append(env.PICKS_ENTRY, c));
    let r;
    try { r = await fetch(env.FORM_ACTION, { method: "POST", body: form }); } catch (e) { return reply(502, { ok: false, error: "form" }); }
    if (!r.ok) return reply(502, { ok: false, error: "form" });
    return reply(200, { ok: true });
  }
};
