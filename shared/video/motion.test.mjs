// Equivalence test for motion.js.
// Runs each hand-written script of the source project (projects/cubo-nuvem-ads-rmx) and its preset-based
// rewrite against a mock GSAP + DOM, records every tween/set, and checks both produce the same tweens.
// Compared as multisets: insertion order is not checked (it only matters for same-property tweens at the same time).
// Usage: node shared/video/motion.test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const project = join(here, "../../projects/cubo-nuvem-ads-rmx");
const motionSrc = readFileSync(join(here, "motion.js"), "utf8");

// Element counts for querySelectorAll in the source compositions.
const COUNTS = {
  "#title-1 .w": 6,
  "#title-2 .w": 5,
  "#title-3 .w": 4,
  "#block-a .w": 3,
  "#block-b .line": 2,
  "#block-b .line[0] .w": 4,
  "#block-b .line[1] .w": 4,
};

function round(v) {
  if (typeof v === "number") return Math.round(v * 1e6) / 1e6 + 0;
  if (Array.isArray(v)) return v.map(round);
  if (v && typeof v === "object") {
    if (v.__id) return v.__id;
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = round(v[k]);
    return out;
  }
  return v;
}

function makeContext() {
  const log = [];
  const els = new Map();
  let created = 0;
  function el(id) {
    if (els.has(id)) return els.get(id);
    const e = {
      __id: id,
      querySelector: (sel) => el(`${id} ${sel}`),
      querySelectorAll: (sel) => list(`${id} ${sel}`),
      setAttribute: (k, v) => log.push(JSON.stringify(["attr", id, k, v])),
      appendChild: (child) => log.push(JSON.stringify(["append", id, child.__id])),
    };
    els.set(id, e);
    return e;
  }
  function list(sel) {
    const n = COUNTS[sel];
    if (n === undefined) throw new Error(`no count for selector "${sel}"`);
    return Array.from({ length: n }, (_, i) => el(`${sel}[${i}]`));
  }
  const key = (t) => (typeof t === "string" ? t : t.__id);
  const targets = (t) => (Array.isArray(t) ? t : t && t.length !== undefined && typeof t !== "string" ? Array.from(t) : [t]);
  function record(method, target, ...rest) {
    for (const t of targets(target)) log.push(JSON.stringify([method, key(t), ...round(rest)]));
  }
  function timeline() {
    const tl = {
      fromTo: (t, from, to, at) => (record("fromTo", t, from, to, at), tl),
      to: (t, to, at) => (record("to", t, to, at), tl),
      set: (t, vars, at) => (record("tl.set", t, vars, at), tl),
      seek: () => tl,
    };
    return tl;
  }
  const document = {
    getElementById: (id) => el(`#${id}`),
    querySelector: (sel) => el(sel),
    querySelectorAll: (sel) => list(sel),
    createElementNS: () => el(`created-${created++}`),
  };
  const gsap = { timeline, set: (t, vars) => record("set", t, vars) };
  const ctx = { document, gsap };
  ctx.window = ctx;
  ctx.window.__timelines = {};
  vm.createContext(ctx);
  return { ctx, log };
}

function run(code, withMotion) {
  const { ctx, log } = makeContext();
  if (withMotion) vm.runInContext(motionSrc, ctx);
  vm.runInContext(code, ctx);
  return log.sort();
}

function inlineScripts(file) {
  const html = readFileSync(join(project, file), "utf8");
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
}

// Preset rewrites of each source script. Lines that are not motion patterns (tl.set resets, layout sets) stay raw.
const CASES = {
  "compositions/titles-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    M.wordsIn(tl, document.querySelectorAll("#title-1 .w"), 0.067);
    M.wordsIn(tl, document.querySelectorAll("#title-2 .w"), 4.03);
    M.textOut(tl, "#title-1", 3.65);
    tl.set("#title-2", { opacity: 0 }, 6.6);
    M.wordsIn(tl, document.querySelectorAll("#title-3 .w"), 10.797, { stagger: M.STAGGER.headline1 });
    M.textOut(tl, "#title-3", 13.2);`,
  "compositions/icons-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const ICON_R = 115.9 / 2;
    const AV_R = 74.8 / 2;
    [
      ["google", 1256.3, 481.5, 1340.3, 539.1, 1.914],
      ["tiktok", 143.0, 487.0, 86.0, 512.6, 2.114],
      ["whatsapp", 155.5, 161.4, 99.0, 159.0, 2.314],
      ["instagram", 1215.5, 98.7, 1306.7, 145.9, 2.514],
    ].forEach(([n, iL, iT, aL, aT, t0]) => {
      const from = M.rimOffset([iL + ICON_R, iT + ICON_R], ICON_R, [aL + AV_R, aT + AV_R]);
      M.popIn(tl, document.getElementById(n + "-icon"), t0, { satellite: document.getElementById(n + "-avatar"), from });
    });
    [["instagram", 17.115, 0.33], ["whatsapp", 17.2, 0.36], ["tiktok", 17.267, 0.42], ["google", 17.473, 0.33]].forEach(([n, at, d]) => {
      M.popOut(tl, document.getElementById(n + "-icon"), at, { duration: d, satellite: document.getElementById(n + "-avatar") });
    });`,
  "compositions/stat-scene.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    M.blurIn(tl, document.querySelectorAll("#block-a .w"), [19.415, 19.485, 19.545]);
    const starts = [[19.675, 19.745, 19.805, 19.89], [19.771, 19.833, 19.883, 19.995]];
    Array.from(document.querySelectorAll("#block-b .line")).forEach((line, i) => {
      M.wordsIn(tl, line.querySelectorAll(".w"), starts[i], { slow: true });
    });`,
  "compositions/mockup-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const mockup = document.getElementById("mockup");
    const drift = mockup.querySelector(".drift");
    const jump = mockup.querySelector(".jump");
    M.riseIn(tl, mockup, 5.64, { from: 650, duration: 0.94, setInitial: true });
    M.drift(tl, drift, 6.47, { speed: -77.7 / 3.53, duration: 3.53 });
    M.jump(tl, jump, 7.22, { by: -478, duration: 1.03 });
    tl.set(drift, { y: 0 }, 11.2);
    tl.set(jump, { y: 0 }, 11.2);
    M.drift(tl, drift, 12.0, { speed: -24, duration: 11 });
    M.jump(tl, jump, 13.74, { by: -448, duration: 0.94 });
    M.jump(tl, jump, 17.65, { from: -448, by: -528, duration: 1.04 });
    const floatEl = document.querySelector(".float");
    M.drift(tl, floatEl, 7.6, { speed: -4.6 / 2.55, duration: 2.55 });
    tl.set(floatEl, { y: 0 }, 11.2);
    M.drift(tl, floatEl, 14.6, { speed: -8.6 / 4.08, duration: 4.08 });`,
  "compositions/connectors-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const lines = {
      "line-whatsapp": [268.0, 216.5, 372.0, 240.6, 5.7, 0.173],
      "line-tiktok": [256.0, 539.3, 372.0, 496.0, 5.745, 0.15],
      "line-instagram": [1222.0, 180.1, 1140.0, 219.4, 5.825, 0.114],
      "line-google": [1262.0, 519.8, 1140.0, 473.6, 5.737, 0.163],
    };
    Object.entries(lines).forEach(([id, [x1, y1, x2, y2, start, dur]]) => {
      const el = document.getElementById(id);
      M.lineGrow(tl, el, start, { from: [x1, y1], to: [x2, y2], duration: dur });
      M.lineFall(tl, el, 10.15, { y1, y2 });
      M.lineRise(tl, el, 13.51, { end: "y1", value: y1, depth: "back" });
      M.lineRise(tl, el, 13.61, { end: "y2", value: y2 });
    });
    [["line-instagram", 17.17, 0.1, "none"], ["line-google", 17.2, 0.22], ["line-tiktok", 17.19, 0.22], ["line-whatsapp", 17.22, 0.25]]
      .forEach(([id, start, duration, ease]) => {
        const [x1, y1, x2, y2] = lines[id];
        M.lineRetract(tl, document.getElementById(id), start, { from: [x1, y1], to: [x2, y2], duration, ...(ease ? { ease } : {}) });
      });`,
  "compositions/gpt-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const icon = document.getElementById("gpt-icon");
    const avatar = document.getElementById("gpt-avatar");
    const from = M.rimOffset([1231.05 + 63.35, 275.05 + 63.35], 63.35, [1335.1 + 32.5, 315.3 + 32.5]);
    M.popIn(tl, icon, 14.155, { satellite: avatar, from });
    M.lineGrow(tl, document.getElementById("line-gpt"), 14.5, { from: [1256, 336.4], to: [1140, 340.0], duration: 0.11 });
    M.focus(tl, icon, 16.955, { scale: 1.441, x: -2.1, y: -0.1 });
    M.focus(tl, avatar, 16.955, { scale: 1.441, x: 20.2, y: 34.0 });`,
  "compositions/cursor-scene1.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const cursor = document.getElementById("cursor");
    M.cursorIn(tl, cursor, 15.52);
    M.cursorMove(tl, cursor, 15.85, { x: 554 });
    M.click(tl, cursor, 16.85);`,
  "compositions/pill.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    const pill = document.getElementById("pill");
    gsap.set(pill, { xPercent: -50, yPercent: -50 });
    M.tagBuild(tl, pill, 0);`,
  "compositions/propagation.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    M.rings(tl, document.getElementById("rings-left"), { cx: -372, cy: 335, r: 374 });
    M.rings(tl, document.getElementById("rings-right"), { cx: 1878, cy: 335, r: 374 });
    tl.fromTo("#base-left", { x: -0.8 }, { x: -0.8 + 0.938 * 23, duration: 23, ease: "none" }, 0);
    tl.fromTo("#base-right", { x: -2.6 }, { x: -2.6 - 1.036 * 23, duration: 23, ease: "none" }, 0);`,
  "index.html": `
    const M = NuvemMotion;
    const tl = gsap.timeline({ paused: true });
    M.sceneFall(tl, ["#icons-scene1-layer", "#mockup-scene1-layer"], 10.15);
    M.riseIn(tl, "#mockup-scene1-layer", 13.61);
    M.riseIn(tl, "#icons-scene1-layer", 13.51, { depth: "back" });
    M.sceneFall(tl, ["#mockup-scene1-layer", "#gpt-scene1-layer", "#cursor-scene1-layer"], 18.68);`,
};

// Known, intended differences: the source's first fall is a plain \`to\` from rest; the preset always uses fromTo { y: 0 }.
const ALLOWED = {
  "index.html": {
    onlySource: [
      '["to","#icons-scene1-layer",{"duration":0.88,"ease":"power2.in","immediateRender":false,"y":1440},10.15]',
      '["to","#mockup-scene1-layer",{"duration":0.88,"ease":"power2.in","immediateRender":false,"y":1440},10.15]',
    ],
    onlyPreset: [
      '["fromTo","#icons-scene1-layer",{"y":0},{"duration":0.88,"ease":"power2.in","immediateRender":false,"y":1440},10.15]',
      '["fromTo","#mockup-scene1-layer",{"y":0},{"duration":0.88,"ease":"power2.in","immediateRender":false,"y":1440},10.15]',
    ],
  },
};

function diff(a, b) {
  const count = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
  const ca = count(a);
  const cb = count(b);
  const only = (x, y) => [...x].flatMap(([k, n]) => Array(Math.max(0, n - (y.get(k) || 0))).fill(k));
  return { onlySource: only(ca, cb), onlyPreset: only(cb, ca) };
}

let failed = 0;
for (const [file, presetCode] of Object.entries(CASES)) {
  const source = run(inlineScripts(file), false);
  const preset = run(presetCode, true);
  const d = diff(source, preset);
  const allowed = ALLOWED[file] || { onlySource: [], onlyPreset: [] };
  const ok =
    JSON.stringify(d.onlySource.sort()) === JSON.stringify([...allowed.onlySource].sort()) &&
    JSON.stringify(d.onlyPreset.sort()) === JSON.stringify([...allowed.onlyPreset].sort());
  const note = allowed.onlySource.length ? ` (${allowed.onlySource.length} known to->fromTo differences)` : "";
  console.log(`${ok ? "PASS" : "FAIL"} ${file}: ${source.length} source entries, ${preset.length} preset entries${note}`);
  if (!ok) {
    failed++;
    d.onlySource.forEach((x) => console.log("  - source only:", x));
    d.onlyPreset.forEach((x) => console.log("  + preset only:", x));
  }
}

// setCanvas scales distances.
{
  const { ctx, log } = makeContext();
  vm.runInContext(motionSrc, ctx);
  vm.runInContext(`NuvemMotion.setCanvas(1344); NuvemMotion.sceneFall(gsap.timeline(), "#x", 0); NuvemMotion.setCanvas(672);`, ctx);
  const ok = log.length === 1 && log[0].includes('"y":2880');
  console.log(`${ok ? "PASS" : "FAIL"} setCanvas(1344) doubles the fall distance`);
  if (!ok) failed++, console.log(" ", log);
}

// Defaults (the source always overrides these) and canvas scaling of the other distances.
{
  const { ctx, log } = makeContext();
  vm.runInContext(motionSrc, ctx);
  const checks = [
    ["blurIn stagger 0.065", `M.blurIn(tl, [el("#a"), el("#b")], 1)`, '["fromTo","#b",{"opacity":0},{"duration":0.9,"ease":"power1.out","immediateRender":false,"opacity":1},1.065]'],
    ["focus scale 1.44", `M.focus(tl, el("#a"), 1)`, '"scale":1.44'],
    ["riseIn front 640 / 1.0 s", `M.riseIn(tl, el("#a"), 1)`, '["fromTo","#a",{"y":640},{"duration":1,"ease":"power2.out","immediateRender":false,"y":0},1]'],
    ["popOut 0.33 s", `M.popOut(tl, el("#a"), 1)`, '{"duration":0.33,"ease":"power2.in","immediateRender":false,"scale":0},1]'],
    ["lineGrow 800 px/s", `M.lineGrow(tl, el("#a"), 1, { from: [0, 0], to: [800, 0] })`, '{"attr":{"x2":800,"y2":0},"duration":1,"ease":"none","immediateRender":false},1]'],
    ["array-like list keeps the stagger", `M.wordsIn(tl, { length: 2, 0: el("#a"), 1: el("#b") }, 1)`, '["fromTo","#b",{"y":26},{"duration":0.65,"ease":"power1.out","immediateRender":false,"y":0},1.112]'],
    ["setCanvas: word rise", `M.setCanvas(1344); M.wordsIn(tl, [el("#a")], 1); M.setCanvas(672)`, '["set","#a",{"y":52}]'],
    ["setCanvas: riseIn back", `M.setCanvas(1344); M.riseIn(tl, el("#a"), 1, { depth: "back" }); M.setCanvas(672)`, '{"y":1640}'],
    ["setCanvas: lineFall", `M.setCanvas(1344); M.lineFall(tl, el("#a"), 1, { y1: 0, y2: 10 }); M.setCanvas(672)`, '{"attr":{"y1":2880,"y2":2890}'],
  ];
  for (const [name, code, expected] of checks) {
    log.length = 0;
    vm.runInContext(`{ const M = NuvemMotion; const tl = gsap.timeline(); const el = (id) => document.querySelector(id); ${code}; }`, ctx);
    const ok = log.some((x) => x.includes(expected));
    console.log(`${ok ? "PASS" : "FAIL"} default/scaling: ${name}`);
    if (!ok) failed++, log.forEach((x) => console.log("   ", x));
  }
}

console.log(failed ? `${failed} failing` : "all passing");
process.exit(failed ? 1 : 0);
