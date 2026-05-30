import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const publicDir = resolve(root, "public/myst-content");

// Option 1: Copy from content/<lang>/_build/html/ (per-language build output)
const contentDir = resolve(root, "content");
const langs = readdirSync(contentDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name);

let copied = false;
for (const lang of langs) {
  const src = resolve(contentDir, lang, "_build/html");
  const dest = resolve(publicDir, lang);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`Copied ${lang} MyST content from ${src}`);
    copied = true;
  }
}

// Option 2: Fallback — already migrated via scripts/migrate-build.mjs
if (!copied) {
  console.log("No per-language build output found. Checking for pre-migrated content...");
  const oldBuild = resolve(root, "_build/html");
  if (existsSync(oldBuild)) {
    const { execSync } = await import("child_process");
    execSync("node scripts/migrate-build.mjs", { cwd: root, stdio: "inherit" });
    copied = true;
  }
}

if (!copied) {
  console.log("WARNING: No MyST content found. Run `npm run myst:build` first.");
}

// Post-process: fix internal links in compiled MyST HTML for each language
// The compiled MyST uses BASE_URL=/OpenScience/myst-content/ but content is now
// at /OpenScience/myst-content/<lang>/ — fix all paths to match.
for (const lang of langs) {
  const langDir = resolve(publicDir, lang);
  if (!existsSync(langDir)) continue;
  fixLinks(langDir, lang);
}

function fixLinks(dir, lang) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) {
      fixLinks(fp, lang);
    } else if (entry.isFile() && entry.name === "index.html") {
      let html = readFileSync(fp, "utf-8");
      // If the build was done with BASE_URL=/OpenScience/myst-content/<lang>,
      // paths already have the language prefix — skip replacement.
      const langBase = `/OpenScience/myst-content/${lang}/`;
      const oldBase = "/OpenScience/myst-content/";
      const needsFix = html.includes(oldBase) && !html.includes(langBase);
      if (needsFix) {
        const newBase = `/OpenScience/myst-content/${lang}/`;
        html = html.split(oldBase).join(newBase);
        // Also fix BASE_URL in __remixContext (no trailing slash)
        const oldBaseUrl = `"BASE_URL":"/OpenScience/myst-content"`;
        const newBaseUrl = `"BASE_URL":"/OpenScience/myst-content/${lang}"`;
        if (html.includes(oldBaseUrl)) {
          html = html.split(oldBaseUrl).join(newBaseUrl);
        }
        const shortPath = fp.replace(publicDir, "public/myst-content");
        console.log(`  Fixed links in ${shortPath}`);
      }
      // Inject navigation interceptor: redirect MyST page links to parent SPA
      const navScript = `<script>
(function(){var l='${lang}';document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var h=a.getAttribute('href');if(!h)return;var p='/OpenScience/myst-content/'+l+'/';if(h.startsWith(p)){e.preventDefault();var s=h.slice(p.length).replace(/\\/$/,'');var hash='';var i=s.indexOf('#');if(i>=0){hash=s.slice(i);s=s.slice(0,i)}window.top.location.href='/OpenScience/'+s+hash}})}())
<\/script>`;
      html = html.replace("</body>", navScript + "</body>");
      writeFileSync(fp, html, "utf-8");
    }
  }
}
