/* The block cipher alphabet drawn for the record-flow renderer. The alphabet is
   the shared LicoLand identity; this file is this site's own implementation for
   the transport-ciphertext cells used by record.js. */
(() => {
  "use strict";
  const TWO_PI = Math.PI * 2;
  const INKS = ["#fff8ea", "#bba5fb", "#5b82ff", "#f2c14e"];

  /* 32-bit avalanche mixer: every seed becomes an even field of bits. */
  const hash = (n) => {
    let x = (n | 0) + 0x9e3779b9 | 0;
    x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
    return (x ^ (x >>> 16)) >>> 0;
  };

  /* One primitive per cell. Each painter adds a closed subpath inside the box
     (left, top, w, h) to the caller's current path. */
  const corner = (c, cx, cy, w, h, start) => {
    c.moveTo(cx, cy); c.ellipse(cx, cy, w, h, 0, start, start + Math.PI / 2); c.closePath();
  };
  const CELL = [
    (c, l, t, w, h) => corner(c, l + w, t + h, w, h, Math.PI),          // disc quarter, opening to top-left
    (c, l, t, w, h) => corner(c, l, t + h, w, h, Math.PI * 1.5),        // to top-right
    (c, l, t, w, h) => corner(c, l + w, t, w, h, Math.PI / 2),          // to bottom-left
    (c, l, t, w, h) => corner(c, l, t, w, h, 0),                        // to bottom-right
    (c, l, t, w, h) => { c.moveTo(l, t + h); c.ellipse(l + w / 2, t + h, w / 2, h, 0, Math.PI, TWO_PI); c.closePath(); }, // dome on the floor
    (c, l, t, w, h) => { c.moveTo(l, t); c.ellipse(l + w / 2, t, w / 2, h, 0, 0, Math.PI); c.closePath(); },               // bowl from the ceiling
    (c, l, t, w, h) => { c.moveTo(l + w, t + h / 2); c.ellipse(l + w / 2, t + h / 2, w / 2, h / 2, 0, 0, TWO_PI); },       // full disc
    (c, l, t, w, h) => c.rect(l, t, w, h),                              // block
  ];

  /* Cell vocabularies. Short glyphs take one primitive; tall glyphs stack a
     complementary pair so the column reads as one shape. */
  const SHORT = [0, 1, 2, 3, 4, 5, 6, 6, 7];
  const STACK = [[4, 7], [7, 5], [4, 5], [5, 4], [6, 6], [0, 2], [1, 3], [0, 3], [6, 7], [7, 6], [4, 6], [6, 5]];
  const pick = (seed, bag) => bag[seed % bag.length];

  /* A glyph for a box w by h: one or two rows of square-ish cells. */
  const glyph = (seed, w, h, tall) => {
    const rows = tall ? 2 : 1;
    const cols = Math.max(1, Math.round(w / (h / rows)));
    const ids = new Array(rows * cols);
    for (let col = 0; col < cols; col += 1) {
      const s = hash(seed + col * 149);
      const stack = tall ? pick(s, STACK) : [pick(s, SHORT)];
      for (let row = 0; row < rows; row += 1) ids[row * cols + col] = stack[row];
    }
    return { rows, cols, ids };
  };

  /* Paint every cell of the glyph inside the box (x, y, w, h). */
  const trace = (c, g, x, y, w, h) => {
    const cw = w / g.cols, ch = h / g.rows;
    for (let row = 0; row < g.rows; row += 1)
      for (let col = 0; col < g.cols; col += 1)
        CELL[g.ids[row * g.cols + col]](c, x + col * cw, y + row * ch, cw, ch);
  };

  window.LicoTiles = { hash, glyph, trace, INKS };
})();
