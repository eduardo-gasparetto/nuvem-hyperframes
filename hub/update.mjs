#!/usr/bin/env node
// Atualiza o HyperFrames mantendo o hack multi-projeto, SEM conflito de merge.
// Estratégia: reverter o patch -> git pull limpo -> reaplicar codemod -> rebuild.
//
//   node update.mjs              # update normal (pull + reaplica + build)
//   node update.mjs --first-time # primeira vez: pula o pull (só aplica + build);
//                                se engine/ não existe, clona o commit fixado em engine.ref
//   node update.mjs --no-build   # aplica/pull sem buildar (dev rápido)

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "engine");
const REF_FILE = join(HERE, "engine.ref");
const args = new Set(process.argv.slice(2));

const run = (cmd, cmdArgs, cwd = REPO) => {
  console.log(`\n$ ${cmd} ${cmdArgs.join(" ")}  (cwd: ${cwd})`);
  execFileSync(cmd, cmdArgs, { cwd, stdio: "inherit" });
};

// engine/ não é versionado no git do hub: só o commit fixado (engine.ref) é.
const readRef = () =>
  Object.fromEntries(
    readFileSync(REF_FILE, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );

try {
  if (!existsSync(join(REPO, ".git"))) {
    const { repo, commit } = readRef();
    console.log(`→ engine/ não existe. Clonando ${repo} @ ${commit.slice(0, 9)} (raso)...`);
    run("git", ["init", "-b", "main", REPO], HERE);
    run("git", ["remote", "add", "origin", repo]);
    run("git", ["fetch", "--depth", "1", "origin", commit]);
    run("git", ["checkout", "-B", "main", "FETCH_HEAD"]);
  }

  if (!args.has("--first-time")) {
    // 1) Limpar TODA a árvore -> pull --ff-only nunca conflita.
    //    Seguro: tudo que muda é regenerável — os patches (studioServer.ts, fileWatcher.ts)
    //    são reaplicados pelo apply-hack logo abaixo, e os artefatos gerados (ex.:
    //    hf-early-stub-inline.ts) saem do rebuild. Por isso reset --hard, não checkout de 1 arquivo.
    console.log("→ Limpando a árvore (reset --hard) para um pull limpo...");
    run("git", ["reset", "--hard"]);
    // 2) Pull
    console.log("→ git pull...");
    run("git", ["pull", "--ff-only", "origin", "main"]);
  } else {
    console.log("→ --first-time: pulando git pull.");
  }

  // 3) Reaplicar o codemod
  console.log("→ Reaplicando o hack...");
  run("node", [join(HERE, "apply-hack.mjs")], HERE);

  // 4) Rebuild
  if (args.has("--no-build")) {
    console.log("→ --no-build: pulando build.");
  } else {
    console.log("→ bun install + build (pode levar alguns minutos)...");
    run("bun", ["install"]);
    run("bun", ["run", "build"]);
    if (!args.has("--first-time")) {
      // Update bem-sucedido (pull + hack + build): fixa o novo commit como o último bom.
      const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO }).toString().trim();
      writeFileSync(REF_FILE, readFileSync(REF_FILE, "utf8").replace(/^commit=.*$/m, `commit=${head}`));
      console.log(`→ engine.ref atualizado para ${head.slice(0, 9)}.`);
    }
  }

  console.log("\n✓ Pronto. Suba o hub com:  node start.mjs");
} catch (err) {
  console.error("\n✗ update.mjs falhou:", err.message);
  process.exit(1);
}
