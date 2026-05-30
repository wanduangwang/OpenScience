import { execSync } from "child_process";
import { cpSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const contentDir = join(rootDir, "..", "content");
const imagesDir = join(rootDir, "..", "images");

const langs = readdirSync(contentDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name);

for (const lang of langs) {
  const cwd = join(contentDir, lang);
  if (!existsSync(join(cwd, "myst.yml"))) {
    console.log(`Skipping ${lang}: no myst.yml`);
    continue;
  }
  // Copy images/ into content/<lang>/ so that ../images/Figure-1.png resolves correctly
  const langImages = join(cwd, "images");
  const contentImages = join(contentDir, "images");
  if (existsSync(imagesDir) && !existsSync(contentImages)) {
    mkdirSync(contentImages, { recursive: true });
    cpSync(imagesDir, contentImages, { recursive: true, force: true });
    console.log(`  Copied images/ to content/images/`);
  }
  console.log(`Building MyST content for: ${lang}`);
  execSync("npx mystmd build --html --execute", {
    cwd,
    stdio: "inherit",
    env: { ...process.env, BASE_URL: `/OpenScience/myst-content/${lang}` },
  });
}
