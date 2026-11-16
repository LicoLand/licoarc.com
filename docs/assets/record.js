/* The home page record: one protected exchange drawn step by step. */
(() => {
"use strict";
const rook = (c, x, y, s) => { const w = s, h = s * 1.3, l = x - w / 2, t = y - h, m = w / 5; c.rect(l + w * 0.1, t + m * 0.9, w * 0.8, h - m * 0.9 - h * 0.14); c.rect(l, y - h * 0.16, w, h * 0.16); for (let i = 0; i < 3; i += 1) c.rect(l + w * 0.1 + i * (w * 0.8 - m) / 2, t, m, m); };
const { hash, glyph, trace, INKS } = LicoTiles, TAU = Math.PI * 2;
const NOTES = ["Independent Endpoint identity. End-to-end protection before transport.", "A Station routes opaque protected records. It cannot grant trust.", "Authenticated Endpoint confirmation establishes finality."];
const cv = document.getElementById("art"), ctx = cv.getContext("2d"), ease = (t) => t * t * (3 - 2 * t), mix = (a, b, t) => a + (b - a) * t;
const FONT = '"Bricolage Grotesque", sans-serif';
const size = () => { const W = cv.clientWidth, H = cv.clientHeight, r = Math.min(devicePixelRatio || 1, 2); if (cv.width !== Math.round(W * r)) { cv.width = Math.round(W * r); cv.height = Math.round(H * r); } ctx.setTransform(r, 0, 0, r, 0, 0); ctx.clearRect(0, 0, W, H); return [W, H]; };
let tiles = [], tilesRound = -1;
const tilesFor = (f) => {
  if (tilesRound !== f.round) {
    tilesRound = f.round; ctx.font = `680 100px ${FONT}`;
    tiles = [...f.text].map((ch, i) => { const seed = hash(i * 53 + f.round * 977 + 5), tall = /[A-Zbdfhijklt?]/.test(ch), adv = ctx.measureText(ch).width / 100; return { adv, tall, g: glyph(seed, adv, tall ? 0.72 : 0.5, tall), ink: INKS[seed % INKS.length] }; });
  }
  return tiles;
};
/* How sealed character i is right now: 0 plain, 1 cipher, -1 not written yet. */
const sealed = (f, i, n) => f.name === "write" ? (i < f.t * (n + 1) ? 0 : -1) : f.name === "protect" ? (i / n < f.t ? 1 : 0) : f.name.startsWith("carry") ? 1 : f.name === "verify" ? (i / n < f.t ? 0 : 1) : 0;
/* The record set as one line of type. mode: undefined = live, 0 = plain, 1 = cipher. align: 0 left, .5 centre, 1 right. */
const record = (f, x, base, size, plainInk, mode, align = 0.5) => {
  const set = tilesFor(f), n = f.text.length, total = set.reduce((sum, t) => sum + t.adv, 0) * size; let cx = x - total * align;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.font = `680 ${size}px ${FONT}`;
  for (let i = 0; i < n; i += 1) {
    const t = set[i], w = t.adv * size;
    if (f.text[i] !== " ") {
      const s = mode === undefined ? sealed(f, i, n) : mode;
      if (s === 0) { ctx.fillStyle = plainInk; ctx.fillText(f.text[i], cx, base); }
      if (s === 1) { const bh = size * (t.tall ? 0.72 : 0.5), pad = w * 0.08; ctx.fillStyle = t.ink; ctx.beginPath(); trace(ctx, t.g, cx + pad, base - bh, w - pad * 2, bh); ctx.fill(); }
    }
    cx += w;
  }
};
let flow; const sync = LicoPhases(() => flow, NOTES);

flow = LicoFlow((f) => {
  sync(f.phase);
  const [W, H] = size(), ax = 12, bx = W - 12, sx = W / 2, ty = 26, e = ease(f.t);
  ctx.strokeStyle = "#3a3566"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(ax, ty); ctx.lineTo(bx, ty); ctx.stroke();
  const at = { write: ax, protect: ax, "carry-in": mix(ax, sx, e), "carry-out": mix(sx, bx, e), verify: bx, "confirm-in": mix(bx, sx, e), "confirm-out": mix(sx, ax, e), rest: ax }[f.name];
  ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.arc(at, ty, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = "#12101f"; ctx.beginPath(); ctx.rect(sx - 22, ty - 24, 44, 48); ctx.fill();
  ctx.fillStyle = "#bba5fb"; ctx.beginPath(); rook(ctx, sx, ty + 18, 26); ctx.fill();
  ctx.fillStyle = "#fff8ea"; for (const x of [ax, bx]) { if (Math.abs(at - x) > 2) { ctx.beginPath(); ctx.arc(x, ty, 7, 0, TAU); ctx.fill(); } }
  ctx.font = `600 15px ${FONT}`; ctx.fillStyle = "#b8b0e0"; ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left"; ctx.fillText("Endpoint A", 0, ty + 52); ctx.textAlign = "center"; ctx.fillText("Station", sx, ty + 52); ctx.textAlign = "right"; ctx.fillText("Endpoint B", W, ty + 52);
  const big = Math.min(W / (f.text.length * 0.6), 68), base = ty + 52 + (H - ty - 52) * 0.6;
  record(f, W / 2, base, big, "#fff8ea");
  if (f.phase === 1) { ctx.font = `560 15px ${FONT}`; ctx.fillStyle = "#b8b0e0"; ctx.textAlign = "center"; ctx.fillText(`The Station sees 1 unit, ${f.bytes} bytes`, W / 2, base + 44); }
  if (f.name.startsWith("confirm") || f.name === "rest") { ctx.font = `560 15px ${FONT}`; ctx.fillStyle = "#f2c14e"; ctx.textAlign = "center"; ctx.fillText(f.name === "rest" ? "Confirmed" : "Confirming", W / 2, base + 44); }
});
})();
