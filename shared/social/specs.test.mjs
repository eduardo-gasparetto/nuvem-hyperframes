// Validates shared/social/specs.json: required fields, enums, dates, safe zones inside the canvas,
// px/% consistency, and that the universal 9:16 box covers every 9:16 placement.
// Usage: node shared/social/specs.test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { specs } = JSON.parse(readFileSync(join(here, "specs.json"), "utf8"));
const STATUS = ["official", "press", "third-party", "internal"];
const errors = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);

const ids = new Set();
for (const s of specs) {
  if (ids.has(s.id)) fail(s.id, "duplicate id");
  ids.add(s.id);
  for (const k of ["id", "platform", "placement", "canvas", "verified_at"]) if (!s[k]) fail(s.id, `missing ${k}`);
  if (!(Date.parse(s.verified_at) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(s.verified_at)) fail(s.id, "verified_at not YYYY-MM-DD");

  const { canvas: c, safe_zone: z } = s;
  if (!(c.width > 0 && c.height > 0)) fail(s.id, "canvas size invalid");
  const [rw, rh] = c.ratio.split(":").map(Number);
  if (Math.abs(c.width / c.height - rw / rh) > 0.005) fail(s.id, `canvas ${c.width}x${c.height} does not match ratio ${c.ratio}`);
  if (c.recommended && Math.abs(c.recommended.width / c.recommended.height - rw / rh) > 0.005) fail(s.id, "recommended size breaks ratio");

  for (const key of ["canvas", "safe_zone", "video", "carousel"]) {
    const sec = s[key];
    if (!sec) continue;
    if (key === "carousel") {
      for (const sub of [sec.ad, sec.organic]) {
        if (!sub) continue;
        if (!STATUS.includes(sub.status)) fail(s.id, "carousel status invalid");
        if (!(sub.min_items <= sub.max_items) && sub.min_items != null) fail(s.id, "carousel min > max");
      }
      continue;
    }
    if (!STATUS.includes(sec.status)) fail(s.id, `${key}.status invalid`);
    if (sec.status !== "internal" && !sec.source) fail(s.id, `${key} non-internal without source`);
  }

  if (z) {
    const { top_px: t, bottom_px: b, left_px: l, right_px: r } = z;
    if (t + b >= c.height) fail(s.id, "safe zone vertical margins consume the canvas");
    if (l + r >= c.width) fail(s.id, "safe zone horizontal margins consume the canvas");
    for (const [name, px, pct, total] of [["top", t, z.top_pct, c.height], ["bottom", b, z.bottom_pct, c.height], ["left", l, z.left_pct, c.width], ["right", r, z.right_pct, c.width]]) {
      if (px < 0) fail(s.id, `${name} negative`);
      if (Math.abs((px / total) * 100 - pct) > 0.1) fail(s.id, `${name} px/% mismatch (${px}px vs ${pct}%)`);
    }
  }

  const v = s.video;
  if (v && v.duration_s && v.duration_s.min != null && v.duration_s.max != null && v.duration_s.min > v.duration_s.max) fail(s.id, "duration min > max");
}

const uni = specs.find((s) => s.id === "universal_9x16");
if (!uni) fail("universal_9x16", "missing");
else {
  for (const s of specs) {
    if (s.id === uni.id || s.canvas.ratio !== "9:16" || !s.safe_zone) continue;
    for (const side of ["top", "bottom", "left", "right"]) {
      if (uni.safe_zone[`${side}_px`] < s.safe_zone[`${side}_px`]) fail(s.id, `universal ${side} (${uni.safe_zone[`${side}_px`]}) < placement ${side} (${s.safe_zone[`${side}_px`]})`);
    }
  }
}

if (errors.length) {
  console.error(`FAIL (${errors.length})\n` + errors.map((e) => "  " + e).join("\n"));
  process.exit(1);
}
console.log(`OK: ${specs.length} records valid`);
