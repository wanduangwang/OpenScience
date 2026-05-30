// One-time migration: reorganize old flat _build/html/ into per-language directories
import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "_build/html");
const dst = resolve(root, "public/myst-content");

if (!existsSync(src)) {
  console.log("No old _build/html/ found.");
  process.exit(0);
}

const sharedBuildDir = resolve(src, "build");
if (existsSync(sharedBuildDir)) {
  cpSync(sharedBuildDir, resolve(dst, "build"), { recursive: true, force: true });
  console.log("Copied shared build/ assets");
}
// Root static assets — only copy if target doesn't exist (preserve manual edits)
for (const f of ["favicon.ico"]) {
  const fp = resolve(src, f);
  const dp = resolve(dst, f);
  if (existsSync(fp) && !existsSync(dp)) cpSync(fp, dp, { force: true });
}

const entries = readdirSync(src, { withFileTypes: true });
const sharedFiles = ["favicon.ico", "myst-theme.css"];
const enPages = [];
const zhPages = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const name = entry.name;
  if (name.endsWith("-zh")) {
    zhPages.push({ old: name, new: name.slice(0, -3) });
  } else if (name !== "build") {
    enPages.push({ old: name, new: name });
  }
}

console.log("EN pages:", enPages.map((p) => p.new));
console.log("ZH pages:", zhPages.map((p) => p.new));

// English
const enDir = resolve(dst, "en");
mkdirSync(enDir, { recursive: true });
cpSync(resolve(src, "build"), resolve(enDir, "build"), { recursive: true, force: true });
for (const f of sharedFiles) {
  const fp = resolve(src, f);
  if (existsSync(fp)) cpSync(fp, resolve(enDir, f), { force: true });
}
for (const page of enPages) {
  cpSync(resolve(src, page.old), resolve(enDir, page.new), { recursive: true, force: true });
}

// Chinese
const zhDir = resolve(dst, "zh");
mkdirSync(zhDir, { recursive: true });
cpSync(resolve(src, "build"), resolve(zhDir, "build"), { recursive: true, force: true });
for (const f of sharedFiles) {
  const fp = resolve(src, f);
  if (existsSync(fp)) cpSync(fp, resolve(zhDir, f), { force: true });
}
for (const page of zhPages) {
  cpSync(resolve(src, page.old), resolve(zhDir, page.new), { recursive: true, force: true });
}

console.log("Done! Content organized into public/myst-content/en/ and public/myst-content/zh/");
