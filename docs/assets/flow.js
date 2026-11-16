/* Owned by licoarc.com. One protected exchange, step by step: write, protect, carry in, carry out, verify,
   confirm back, rest. A page draws each frame its own way and may jump to a phase. */
window.LicoFlow = (draw) => {
  "use strict";
  const STEPS = [["write", 1.2, 0], ["protect", 1.2, 0], ["carry-in", 1.3, 1], ["carry-out", 1.3, 1], ["verify", 1.4, 2], ["confirm-in", 0.9, 2], ["confirm-out", 0.9, 2], ["rest", 1.8, 2]];
  const LINES = ["Meet at nine?", "Ship it.", "Draft is ready."];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let step = still ? 3 : 0, since = still ? 0.65 : 0, round = 0, last = 0;
  const emit = (ms) => {
    const [name, length, phase] = STEPS[step], text = LINES[round % LINES.length];
    draw({ step, name, phase, t: Math.min(since / length, 1), text, bytes: new TextEncoder().encode(text).length + 28, round, ms });
  };
  const frame = (ms) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ms - last) / 1000 || 0); last = ms;
    if (!still && document.documentElement.dataset.motion !== "paused") { since += dt; if (since >= STEPS[step][1]) { since = 0; step = (step + 1) % STEPS.length; if (!step) round += 1; } }
    emit(ms);
  };
  requestAnimationFrame(frame);
  return { jump(phase) { step = STEPS.findIndex((item) => item[2] === phase) + (still && phase < 2 ? 1 : 0); since = still ? STEPS[step][1] * 0.6 : 0; } };
};
/* Phase buttons: [data-phase] jumps the flow; the current phase is pressed and its note is shown. */
window.LicoPhases = (flow, notes) => {
  const buttons = [...document.querySelectorAll("[data-phase]")], note = document.getElementById("phase-note");
  let shown = -1;
  buttons.forEach((button) => button.addEventListener("click", () => flow().jump(Number(button.dataset.phase))));
  return (phase) => { if (phase === shown) return; shown = phase; buttons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.phase) === phase))); if (note) note.textContent = notes[phase]; };
};
