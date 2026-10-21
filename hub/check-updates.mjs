#!/usr/bin/env node
// Checks whether a newer HyperFrames is safe to adopt. Detects and reports only:
// never touches engine/, never restarts the service. To adopt, run update.mjs afterwards.
//
//   node check-updates.mjs
//
// 1) compares engine/ with npm `latest` and upstream main
// 2) dry-runs apply-hack.mjs on a throwaway shallow clone of upstream
// 3) smoke test with `npx hyperframes@<latest>`: 1080x1350, 2 time-windowed slides -> check, snapshot, render
// Not covered: the engine build (bun run build) — update.mjs still runs it.
// Exit code: 0 = safe to update (or already current), 1 = do not update.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = resolve(HERE, "..", "engine");
const REPO_URL = "https://github.com/heygen-com/hyperframes.git";

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const engineVersion = (dir) => JSON.parse(readFileSync(join(dir, "packages/cli/package.json"), "utf8")).version;

const problems = [];
const step = (msg) => console.log(`\n→ ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  console.log(`  ✗ ${msg}`);
  problems.push(msg);
};

// ── 1) versions ──
step("Versions");
const latest = sh("npm", ["view", "hyperframes", "version"]);
const current = existsSync(ENGINE) ? engineVersion(ENGINE) : "(engine/ missing)";
let behind = "?";
if (existsSync(join(ENGINE, ".git"))) {
  sh("git", ["fetch", "-q", "origin"], { cwd: ENGINE });
  behind = sh("git", ["rev-list", "--count", "HEAD..origin/main"], { cwd: ENGINE });
}
console.log(`  npm latest: ${latest} | engine/: ${current} | commits behind upstream main: ${behind}`);
const upToDate = current === latest && behind === "0";
if (upToDate) console.log("  engine/ is current; still running the checks as a health test.");

// ── 2) codemod dry run on a throwaway clone ──
const tmp = mkdtempSync(join(tmpdir(), "hf-check-"));
try {
  step("Codemod dry run (throwaway clone of upstream main)");
  const clone = join(tmp, "engine");
  sh("git", ["clone", "-q", "--depth", "1", REPO_URL, clone]);
  console.log(`  clone: ${engineVersion(clone)} @ ${sh("git", ["rev-parse", "--short", "HEAD"], { cwd: clone })}`);
  try {
    const out = sh("node", [join(HERE, "apply-hack.mjs")], { env: { ...process.env, HF_ENGINE_DIR: clone } });
    ok(`apply-hack passed:\n${out.split("\n").map((l) => "      " + l).join("\n")}`);
  } catch (e) {
    bad(`apply-hack FAILED on upstream main — ${String(e.stderr || e.message).trim().split("\n").join(" | ")}`);
  }

  // ── 3) smoke test against npm latest ──
  step(`Smoke test with hyperframes@${latest} (1080x1350, 2 slides)`);
  const proj = join(tmp, "smoke");
  mkdirSync(join(proj, "compositions"), { recursive: true });
  const slide = (id, color, n) => `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /></head><body><template>
<style>#root{position:absolute;inset:0;overflow:hidden;background:${color};display:flex;align-items:center;justify-content:center}#root h1{font-family:sans-serif;font-size:120px;color:#fff;text-align:center}</style>
<div id="root" data-composition-id="${id}" data-width="1080" data-height="1350"><h1>SLIDE ${n}</h1></div>
<script>const tl=gsap.timeline({paused:true});tl.fromTo("#root h1",{opacity:0},{opacity:1,duration:0.5},0);window.__timelines["${id}"]=tl;</script>
</template></body></html>
`;
  writeFileSync(join(proj, "compositions/slide1.html"), slide("slide1", "#d7263d", 1));
  writeFileSync(join(proj, "compositions/slide2.html"), slide("slide2", "#1b998b", 2));
  writeFileSync(join(proj, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1350" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;overflow:hidden;background:#000}#root{position:relative;width:100%;height:100%;overflow:hidden}.clip{position:absolute;left:0;top:0;width:1080px;height:1350px}</style></head>
<body><div id="root" data-composition-id="carousel" data-start="0" data-duration="3" data-width="1080" data-height="1350">
<div id="slide1-layer" class="clip" data-composition-id="slide1" data-composition-src="compositions/slide1.html" data-start="0" data-duration="1.5" data-track-index="0" data-width="1080" data-height="1350"></div>
<div id="slide2-layer" class="clip" data-composition-id="slide2" data-composition-src="compositions/slide2.html" data-start="1.5" data-duration="1.5" data-track-index="1" data-width="1080" data-height="1350"></div>
</div><script>const tl=gsap.timeline({paused:true});window.__timelines["carousel"]=tl;</script></body></html>
`);
  const hf = (...a) => sh("npx", ["--yes", `hyperframes@${latest}`, ...a], { cwd: proj, timeout: 300000 });

  try { hf("check"); ok("check passed"); } catch (e) { bad(`check failed — ${String(e.stdout || e.stderr || e.message).trim().slice(-600)}`); }

  try {
    hf("snapshot", "--at", "0.5,2.0", "--no-end", "-o", "snaps");
    const pngs = readdirSync(join(proj, "snaps")).filter((f) => f.endsWith(".png"));
    const dims = pngs.map((f) => { const b = readFileSync(join(proj, "snaps", f)); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; });
    if (pngs.length === 2 && dims.every((d) => d === "1080x1350")) ok(`snapshot: 2 PNGs, ${dims[0]}`);
    else bad(`snapshot unexpected: ${pngs.length} PNG(s), dims ${dims.join(",")}`);
  } catch (e) { bad(`snapshot failed — ${String(e.stderr || e.message).trim().slice(-400)}`); }

  try {
    hf("render", "--quality", "looks", "--output", "smoke.mp4");
    const probe = sh("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,duration", "-of", "default=nw=1", join(proj, "smoke.mp4")]);
    const kv = Object.fromEntries(probe.split("\n").map((l) => l.split("=")));
    const good = kv.codec_name === "h264" && kv.width === "1080" && kv.height === "1350" && kv.r_frame_rate === "30/1" && Math.abs(Number(kv.duration) - 3) < 0.1;
    if (good) ok(`render: ${kv.codec_name} ${kv.width}x${kv.height} ${kv.r_frame_rate} ${Number(kv.duration).toFixed(2)}s`);
    else bad(`render output unexpected: ${probe.replace(/\n/g, " ")}`);
  } catch (e) { bad(`render failed — ${String(e.stderr || e.message).trim().slice(-400)}`); }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── summary ──
console.log("\n──────── Summary ────────");
if (problems.length) {
  console.log(`DO NOT UPDATE: ${problems.length} problem(s) above. Keep engine/ at ${current}.`);
  process.exit(1);
}
console.log(upToDate ? `Up to date (${current}); all checks green.` : `Safe to update ${current} → ${latest}: cd hub && node update.mjs  (then kickstart the LaunchAgent).`);
