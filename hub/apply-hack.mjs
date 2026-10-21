#!/usr/bin/env node
// Idempotent codemod: patches engine's source to make the Studio multi-project
// when HF_WORKSPACE is set, inject a floating project-switcher into the SPA, and
// keep the file-watcher from reacting to the engine/hub folders that now live
// inside the workspace.
// Pattern-based (not line-based) so it survives upstream edits. Re-running is a no-op.
// Idempotent PER FILE: each target is patched independently, so a target already
// patched is skipped while a fresh one still gets patched.
//
// Exit codes: 0 = applied or already-applied; 1 = target patterns not found.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.HF_ENGINE_DIR || resolve(HERE, "..", "engine"); // override: check-updates.mjs runs this on a throwaway clone
const STUDIO_SERVER = join(REPO, "packages/cli/src/server/studioServer.ts");
const FILE_WATCHER = join(REPO, "packages/core/src/projectFolders.ts"); // upstream moved the watcher ignore-set here (was cli/.../fileWatcher.ts WATCHER_EXCLUDED_DIRS)
const INSPECTOR_BUILD = join(REPO, "packages/inspector/build.mjs");
const MARKER = "// [HF-MULTIPROJECT]";

const fail = (file, msg) => {
  console.error(`✗ apply-hack falhou em ${file}: ${msg}`);
  console.error("  O upstream provavelmente mudou. Abra o arquivo e ajuste os padrões.");
  process.exit(1);
};

// ───────────────────────── studioServer.ts (multi-projeto + switcher) ─────────────────────────
function patchStudioServer() {
  let src = readFileSync(STUDIO_SERVER, "utf8");
  if (src.includes(MARKER)) {
    console.log("✓ studioServer.ts já patchado. Pulando.");
    return;
  }
  const failHere = (msg) => fail("studioServer.ts", msg);

// ── O seletor de projetos (vanilla JS, injetado na SPA) ──
// Sem backticks nem ${} aqui — embutido com JSON.stringify, então é seguro.
// Posiciona o <select> DENTRO da barra superior do Studio, antes do botão Undo
// (acha o botão por aria-label="Undo" e insere como primeiro irmão do grupo).
// Resiliente a re-render do React: setInterval re-insere se sumir e mantém o
// valor sincronizado com o projeto atual (#hash ou primeiro da lista).
const switcherJs =
  "(function(){var PROJECTS=[];" +
  // O Studio roteia por hash no formato #project/<id>?<query>. Lê o id de lá; cai no 1o projeto.
  "function curId(){var m=(location.hash||'').match(/^#?project\\/([^?\\/]+)/);" +
  "var id=m?decodeURIComponent(m[1]):'';" +
  "if(id&&PROJECTS.some(function(p){return p.id===id;}))return id;" +
  "return PROJECTS.length?PROJECTS[0].id:'';}" +
  // Troca preservando a query atual (tab/time/etc); o Studio reexpande defaults se faltar.
  "function go(id){var q=(location.hash.split('?')[1]||'');location.hash='project/'+id+(q?('?'+q):'');}" +
  "function makeSelect(){var s=document.createElement('select');s.title='Projeto';" +
  "s.style.cssText='background:#1a1a1a;color:#fff;border:1px solid #3a3a3a;border-radius:7px;padding:4px 8px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer;outline:none;max-width:170px';" +
  "PROJECTS.forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.title||p.id;s.appendChild(o);});" +
  "s.value=curId();" +
  "s.addEventListener('change',function(){go(s.value);});return s;}" +
  "function sync(){var w=document.getElementById('hf-mp-switcher');var s=w&&w.querySelector('select');" +
  "if(s){var c=curId();if(s.value!==c)s.value=c;}}" +
  "function ensure(){if(!PROJECTS.length)return;" +
  "var w=document.getElementById('hf-mp-switcher');if(w&&w.isConnected){sync();return;}" +
  // Âncora pelo botão "Export" (topo direito do header global) em vez de "Undo":
  // o Undo saiu do header global no redesign do Studio e sobrou só dentro do
  // painel de Timeline — ancorar nele colocava o seletor escondido lá embaixo.
  "var exp=Array.prototype.find.call(document.querySelectorAll('button'),function(b){return b.textContent.trim()==='Export';});" +
  "if(!exp)return;var anchor=exp.closest('span.contents')||exp;if(!anchor.parentElement)return;if(w)w.remove();" +
  "var wrap=document.createElement('div');wrap.id='hf-mp-switcher';" +
  "wrap.style.cssText='display:flex;align-items:center;margin-right:8px';" +
  "wrap.appendChild(makeSelect());anchor.parentElement.insertBefore(wrap,anchor);}" +
  "function start(){fetch('/api/projects').then(function(r){return r.json();}).then(function(d){" +
  "PROJECTS=(d&&d.projects)||[];if(!PROJECTS.length)return;" +
  "ensure();setInterval(ensure,800);window.addEventListener('hashchange',sync);}).catch(function(){});}" +
  "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();})();";
const switcherTag = "<script>" + switcherJs + "</script>";

// 1) Garantir readdirSync no import de node:fs
const fsImportRe = /import \{ ([^}]*) \} from "node:fs";/;
const fsImport = src.match(fsImportRe);
if (!fsImport) failHere('não achei o import de "node:fs"');
if (!fsImport[1].includes("readdirSync")) {
  src = src.replace(fsImportRe, `import { ${fsImport[1].trim()}, readdirSync } from "node:fs";`);
}

// 2) Injetar helpers + a constante do switcher antes de createStudioServer
const fnAnchor = "export function createStudioServer(";
if (!src.includes(fnAnchor)) failHere("não achei createStudioServer(");
const helpers =
  `${MARKER} multi-project discovery helpers (injected by hf-multiproject/apply-hack.mjs)
function __hfDiscoverProjects(rootDir: string | null, fallback: ResolvedProject): ResolvedProject[] {
  if (!rootDir) return [fallback];
  try {
    const out: ResolvedProject[] = [];
    for (const e of readdirSync(rootDir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const dir = join(rootDir, e.name);
      if (existsSync(join(dir, "index.html")) || existsSync(join(dir, "hyperframes.json"))) {
        out.push({ id: e.name, dir, title: e.name });
      }
    }
    return out.length ? out : [fallback];
  } catch {
    return [fallback];
  }
}
function __hfResolveProject(
  id: string,
  rootDir: string | null,
  projectId: string,
  fallback: ResolvedProject,
): ResolvedProject | null {
  if (!rootDir) return id === projectId ? fallback : null;
  return __hfDiscoverProjects(rootDir, fallback).find((p) => p.id === id) ?? null;
}
const __HF_SWITCHER_SCRIPT = ${JSON.stringify(switcherTag)};

`;
src = src.replace(fnAnchor, helpers + fnAnchor);

// 3) Derivar __hfRoot logo após `const projectId = ...;`
const projectIdRe = /(const projectId = projectName \|\| basename\(projectDir\);)/;
if (!projectIdRe.test(src)) failHere("não achei a definição de projectId");
src = src.replace(
  projectIdRe,
  `$1\n  ${MARKER}\n  const __hfRoot = process.env.HF_WORKSPACE ? resolve(process.env.HF_WORKSPACE) : null;`,
);

// 4) watcher cobre o workspace inteiro
const watcherRe = /const watcher = createProjectWatcher\(projectDir\);/;
if (!watcherRe.test(src)) failHere("não achei createProjectWatcher(projectDir)");
src = src.replace(watcherRe, "const watcher = createProjectWatcher(__hfRoot ?? projectDir);");

// 5) listProjects multi-projeto
const listRe = /listProjects: \(\) => \[project\],/;
if (!listRe.test(src)) failHere("não achei listProjects: () => [project]");
src = src.replace(listRe, "listProjects: () => __hfDiscoverProjects(__hfRoot, project),");

// 6) resolveProject multi-projeto
const resolveRe = /resolveProject: \(id: string\) => \(id === projectId \? project : null\),/;
if (!resolveRe.test(src)) failHere("não achei resolveProject: (id: string) => ...");
src = src.replace(
  resolveRe,
  "resolveProject: (id: string) => __hfResolveProject(id, __hfRoot, projectId, project),",
);

// 7) Injetar o seletor no HTML servido (SPA fallback)
const returnRe = /return c\.html\(html, 200, \{ "Cache-Control": "no-cache" \}\);/;
if (!returnRe.test(src)) failHere("não achei o return c.html(html, 200, ...) da SPA fallback");
src = src.replace(
  returnRe,
  `${MARKER} inject project switcher\n    html = html.replace("</body>", __HF_SWITCHER_SCRIPT + "</body>");\n    return c.html(html, 200, { "Cache-Control": "no-cache" });`,
);

  writeFileSync(STUDIO_SERVER, src);
  console.log("✓ studioServer.ts: multi-projeto + seletor injetado.");
}

// ───────────────── fileWatcher.ts (não reagir às pastas engine/ e hub/) ─────────────────
// engine/ e hub/ agora moram DENTRO do workspace (HF_WORKSPACE). O watcher é recursivo,
// então sem isso editar a fonte do engine dispararia reload do preview à toa. Os pesos-pesados
// (node_modules, dist, .git) já são excluídos pelo upstream; aqui só somamos as duas pastas.
function patchFileWatcher() {
  let src = readFileSync(FILE_WATCHER, "utf8");
  if (src.includes(MARKER)) {
    console.log("✓ projectFolders.ts já patchado. Pulando.");
    return;
  }
  const failHere = (msg) => fail("projectFolders.ts", msg);

  const setAnchor = "export const PREVIEW_IGNORED_DIRS: ReadonlySet<string> = new Set([";
  if (!src.includes(setAnchor)) failHere("não achei PREVIEW_IGNORED_DIRS");
  src = src.replace(
    setAnchor,
    `${setAnchor}\n  ${MARKER} ignore the engine/hub folders living inside the workspace\n  "engine",\n  "hub",`,
  );

  writeFileSync(FILE_WATCHER, src);
  console.log("✓ projectFolders.ts: pastas engine/ e hub/ excluídas do watcher.");
}

// ───────── inspector/build.mjs (paths com espaço quebram em macOS "Claude Projects") ─────────
// `new URL(path, import.meta.url).pathname` deixa "%20" no lugar de espaço; num workspace cujo
// path tem espaço (ex.: "Claude Projects"), o readFileSync/esbuild seguinte dá ENOENT. Isso trava
// a cadeia `bun run build` ANTES de chegar no `cli`, que é o pacote que o hub realmente usa.
function patchInspectorBuild() {
  let src = readFileSync(INSPECTOR_BUILD, "utf8");
  if (src.includes(MARKER) || src.includes("fileURLToPath(new URL(path, import.meta.url))")) {
    console.log("✓ inspector/build.mjs já patchado. Pulando.");
    return;
  }
  const failHere = (msg) => fail("inspector/build.mjs", msg);

  const atRe = /const at = \(path\) => new URL\(path, import\.meta\.url\)\.pathname;/;
  if (!atRe.test(src)) failHere("não achei a definição de at()");
  src = src.replace(
    atRe,
    `${MARKER} .pathname deixa %20 em paths com espaço; decodificar via fileURLToPath\nconst at = (path) => fileURLToPath(new URL(path, import.meta.url));`,
  );

  if (!/from "node:url"/.test(src)) {
    const importAnchor = 'import { createRequire } from "node:module";';
    if (!src.includes(importAnchor)) failHere("não achei o import de node:module");
    src = src.replace(importAnchor, `${importAnchor}\nimport { fileURLToPath } from "node:url";`);
  }

  writeFileSync(INSPECTOR_BUILD, src);
  console.log("✓ inspector/build.mjs: path decode fix aplicado.");
}

patchStudioServer();
patchFileWatcher();
patchInspectorBuild();
console.log("✓ Hack aplicado.");
