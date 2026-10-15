#!/usr/bin/env node
// Sobe o Studio (CLI buildado) em modo multi-projeto.
//
//   HF_WORKSPACE="/caminho/para/hf-workspace" node start.mjs [--port 4000]
//
// Abre 1 Studio servindo TODOS os projetos do workspace. Alterne com #<subpasta> na URL.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "engine");
const CLI = join(REPO, "packages/cli/dist/cli.js");
// Default: ../projects (sibling de hub/). Override com HF_WORKSPACE se quiser outra pasta.
const DEFAULT_WORKSPACE = resolve(HERE, "..", "projects");

const workspace = process.env.HF_WORKSPACE ? resolve(process.env.HF_WORKSPACE) : DEFAULT_WORKSPACE;
if (!existsSync(workspace)) {
  console.error(`✗ Workspace não existe: ${workspace}`);
  console.error("  Crie a pasta projects/ (1 subpasta por projeto) ou aponte HF_WORKSPACE.");
  process.exit(1);
}
if (!existsSync(CLI)) {
  console.error(`✗ CLI não buildado (${CLI}). Rode antes:  node update.mjs --first-time`);
  process.exit(1);
}

// Descobre os projetos; usa o primeiro como cwd (projectDir de fallback do server).
const projects = readdirSync(workspace, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .filter(
    (e) =>
      existsSync(join(workspace, e.name, "index.html")) ||
      existsSync(join(workspace, e.name, "hyperframes.json")),
  )
  .map((e) => e.name);

if (projects.length === 0) {
  console.error(`✗ Nenhum projeto em ${workspace} (cada subpasta precisa de index.html).`);
  process.exit(1);
}

const cwd = join(workspace, projects[0]);
console.log(`→ Workspace: ${workspace}`);
console.log(`→ Projetos encontrados (${projects.length}): ${projects.join(", ")}`);
console.log(`→ Subindo Studio... alterne entre projetos com #<nome> na URL.\n`);

try {
  execFileSync("node", [CLI, "preview", ...process.argv.slice(2)], {
    cwd,
    stdio: "inherit",
    // PWD precisa bater com cwd: o CLI usa basename(process.env.PWD) pro label do projeto.
    // Sem isso herdaria o PWD do shell pai (hub/) e mostraria "Project hub".
    env: { ...process.env, HF_WORKSPACE: workspace, PWD: cwd },
  });
} catch (err) {
  process.exit(err.status ?? 1);
}
