/**
 * merge-builds.js
 * Copies MyST EN + ZH build outputs into Next.js public/ directory
 * Served at /guide/en/* and /guide/zh/* during both dev and production
 */
const fs = require('fs');
const path = require('path');

// GitHub Pages serves this project at /OpenScience/. MyST books are built with
// BASE_URL=/guide/en (no repo prefix) so local dev previews work at the root.
// At deploy time we prepend /OpenScience to every Guide link/asset in the
// generated HTML. ADD_BASE_PATH=1 is set only in deploy.yml (CI), never in dev.
const BASE = process.env.ADD_BASE_PATH ? '/OpenScience' : '';

const GUIDE_DIR = path.join(__dirname, '..', 'guide');
const SITE_PUBLIC_GUIDE = path.join(__dirname, '..', 'site', 'public', 'guide');

function copyDirOverwrite(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirOverwrite(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

function mergeBook(lang) {
  const buildDir = path.join(GUIDE_DIR, lang, '_build', 'html');
  if (!fs.existsSync(buildDir)) {
    console.warn(`  ⚠ ${lang} build not found at:`, buildDir);
    return false;
  }
  // Copy into a language-specific subdirectory (e.g., public/guide/en/)
  const destDir = path.join(SITE_PUBLIC_GUIDE, lang);
  copyDirOverwrite(buildDir, destDir);
  console.log(`  ✓ ${lang} merged (${fs.readdirSync(destDir).length} items)`);
  return true;
}

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`  ✓ ${label}`);
  }
}

/**
 * Inject floating control panel into every MyST page.
 *
 * Instead of placing HTML inside MyST's parts.footer (which causes Remix
 * hydration errors #418/#423), we inject via a <script> tag that runs
 * AFTER hydration is complete. The script uses setTimeout(0) to ensure
 * it executes after React's hydrateRoot().
 */
/**
 * Suppress React hydration errors from MyST's internal components.
 *
 * MyST's book-theme template triggers React hydration errors (#418, #423)
 * due to internal components (theme toggle, etc.) that render differently
 * on server vs client. These are NOT caused by our code.
 *
 * This script patches console.error to silently absorb these known benign
 * errors without affecting other console output.
 */
/**
 * Remove the project title from the sidebar TOC.
 *
 * MyST auto-adds the project's index.md as the first TOC entry, which
 * appears as "Open Science - Guide (EN/ZH)" in the sidebar linking to
 * /guide/en/. Users want this gone.
 *
 * We strip the first entry from the __remixContext JSON toc array.
 */
function removeProjectTocEntry() {
  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return;

      // Remove the first TOC entry {"file":"index.md"},
      content = content.replace(/"toc":\[\{"file":"index\.md"\},/g, '"toc":[');

      // Remove the rendered sidebar project title link:
      //   <a title="Open Science" class="block...font-bold" href="/">Open Science</a>
      content = content.replace(
        /<a title="Open Science" class="block break-words[^"]*font-bold"[^>]*href="\/"[^>]*>Open Science<\/a>/g,
        ''
      );

      // Also set project title to empty in JSON to prevent Remix re-render
      content = content.replace(/"title":"Open Science"/g, '"title":""');

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (e) {}
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Removing project title from TOC...');
  walkDir(SITE_PUBLIC_GUIDE);
}

function suppressHydrationErrors() {
  const suppressionScript = '<script>'
    + '(function(){'
    + 'var orig=console.error;'
    + 'console.error=function(){'
    + 'var m=(arguments[0]&&arguments[0].toString())||"";'
    + 'if(m.indexOf("Minified React error #418")!==-1'
    + '||m.indexOf("Minified React error #423")!==-1'
    + '||m.indexOf("Text content did not match")!==-1'
    + '||m.indexOf("did not expect this element")!==-1'
    + '||m.indexOf("hydrateRoot")!==-1&&m.indexOf("418")!==-1'
    + ')return;'
    + 'return orig.apply(console,arguments);'
    + '};'
    + '})();'
    + '</script>';

  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return;
      if (content.indexOf('os-hydration-fix') !== -1) return;
      content = content.replace('<title>', suppressionScript + '\n<title>');
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (e) {}
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Suppressing hydration errors...');
  walkDir(SITE_PUBLIC_GUIDE);
}

function injectFloatPanel() {
  // Floating panel HTML template
  function panelHtml(lang, label) {
    const activeEn = lang === 'en' ? ' os-float-active' : '';
    const activeZh = lang === 'zh' ? ' os-float-active' : '';
    const checkEn = lang === 'en' ? '&#x2713;' : '';
    const checkZh = lang === 'zh' ? '&#x2713;' : '';
    return '<div class="os-float-panel" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;font-family:system-ui,sans-serif;font-size:0.875rem;">'
      + '<div class="os-float-trigger" style="position:relative;display:flex;align-items:center;gap:0.375rem;padding:0.5rem 0.875rem;border-radius:9999px;border:1px solid rgba(255,255,255,0.3);background:rgba(1,50,67,0.92);backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0,0,0,0.15);color:white;font-weight:500;line-height:1;cursor:default;user-select:none;transition:box-shadow 0.15s,background 0.15s;">'
      + '<span style="font-weight:500">' + label + '</span>'
      + '<span style="opacity:0.6;font-size:0.65rem;line-height:1;">&#x25B4;</span>'
      + '<div class="os-float-body" style="position:absolute;bottom:100%;right:0;margin-bottom:0.625rem;opacity:0;visibility:hidden;transform:translateY(6px) scale(0.96);transition:opacity 0.15s ease,visibility 0.15s ease,transform 0.15s ease;transform-origin:bottom right;">'
      + '<div style="min-width:9rem;background:white;border:1px solid #e5e7eb;border-radius:0.75rem;padding:0.375rem;box-shadow:0 4px 16px rgba(0,0,0,0.12);">'
      + '<a href="' + BASE + '/guide/en/intro-en/" class="os-float-item' + activeEn + '" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;border-radius:0.5rem;color:#374151!important;text-decoration:none;font-size:0.875rem;">EN' + (checkEn ? ' <span style="opacity:0.5;font-size:0.75rem;">&#x2713;</span>' : '') + '</a>'
      + '<a href="' + BASE + '/guide/zh/intro-zh/" class="os-float-item' + activeZh + '" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;border-radius:0.5rem;color:#374151!important;text-decoration:none;font-size:0.875rem;">中文' + (checkZh ? ' <span style="opacity:0.5;font-size:0.75rem;">&#x2713;</span>' : '') + '</a>'
      + '<div style="height:1px;background:#e5e7eb;margin:0.25rem 0.5rem;"></div>'
      + '<button id="os-chat-btn" style="display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.5rem 0.75rem;border-radius:0.5rem;border:none;background:transparent;color:#374151!important;font-size:0.875rem;cursor:pointer;text-align:left;transition:background 0.1s;">'
      + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1rem;height:1rem;color:#2563eb;flex-shrink:0;"><path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z"/><path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.782a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z"/></svg>'
      + (lang === 'zh' ? 'AI 问答' : 'AI Chat')
      + '</button>'
      + '<div style="height:1.75rem;margin:0.25rem 0.5rem;border-radius:0.375rem;border:1px dashed #d1d5db;opacity:0.35;"></div>'
      + '</div></div></div></div>';
  }

  // Chat overlay HTML template (hidden by default)
  function chatOverlayHtml(lang) {
    const t = lang === 'zh'
      ? { title: 'AI 问答', placeholder: '输入你的问题...', welcome: '你好！我是 OpenScience AI 助手，有什么可以帮助你的？', close: '关闭' }
      : { title: 'AI Chat', placeholder: 'Ask me anything...', welcome: 'Hello! I\'m the OpenScience AI assistant. How can I help you today?', close: 'Close' };
    return '<div id="os-chat-overlay" style="display:none;position:fixed;bottom:5.5rem;right:1.5rem;z-index:9998;width:380px;height:520px;max-height:calc(100vh-160px);max-width:calc(100vw-2rem);background:white;border:1px solid #e5e7eb;border-radius:1rem;box-shadow:0 8px 32px rgba(0,0,0,0.15);flex-direction:column;overflow:hidden;font-family:system-ui,sans-serif;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;border-bottom:1px solid #e5e7eb;background:#f9fafb;">'
      + '<span style="font-weight:600;font-size:0.875rem;">' + t.title + '</span>'
      + '<button id="os-chat-close" style="border:none;background:none;cursor:pointer;font-size:1.25rem;line-height:1;color:#9ca3af;">' + '&#x2715;' + '</button>'
      + '</div>'
      + '<div id="os-chat-msgs" style="flex:1;overflow-y:auto;padding:0.75rem 0;">'
      + '<div class="os-chat-msg" style="display:flex;justify-content:flex-start;padding:0.375rem 1rem;">'
      + '<div style="max-width:80%;background:#f3f4f6;color:#1f2937;border-radius:1rem;border-bottom-left-radius:0.25rem;padding:0.5rem 0.75rem;font-size:0.875rem;line-height:1.5;white-space:pre-wrap;">' + t.welcome + '</div>'
      + '</div></div>'
      + '<div style="display:flex;align-items:flex-end;gap:0.5rem;padding:0.75rem;border-top:1px solid #e5e7eb;">'
      + '<textarea id="os-chat-input" rows="1" placeholder="' + t.placeholder + '" style="flex:1;resize:none;border:1px solid #d1d5db;border-radius:0.75rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;font-family:inherit;"></textarea>'
      + '<button id="os-chat-send" style="border:none;background:#2563eb;color:white;width:2.25rem;height:2.25rem;border-radius:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
      + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:1rem;height:1rem;"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"/></svg>'
      + '</button></div></div>';
  }

  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return; // Not a MyST page
      if (content.indexOf('os-float-panel') !== -1) return; // Already injected

      // Determine language from the file path
      const relPath = path.relative(SITE_PUBLIC_GUIDE, filePath);
      const lang = relPath.startsWith('zh') ? 'zh' : 'en';
      const label = lang === 'zh' ? '中文' : 'EN';

      // Inject script before </body>
      // Strategy: after hydration may remove our panel, so we re-inject
      // on a 200ms heartbeat for the first 3 seconds.
      // Also injects the chat overlay (HTML + JS).
      const fpHTML = JSON.stringify(panelHtml(lang, label));
      const chatHTML = JSON.stringify(chatOverlayHtml(lang));

      const script = '<script data-os-float="1">'
        + '(function(){'
        + 'var fp=' + fpHTML + ',ch=' + chatHTML + ';'
        + 'var c=0,m=15;'
        + 'function p(){'
        // Panel
        + 'if(!document.querySelector(".os-float-panel")){'
        + 'var d=document.createElement("div");d.innerHTML=fp;'
        + 'document.body.appendChild(d.firstElementChild);'
        // Wire up AI Chat button
        + 'var btn=document.getElementById("os-chat-btn");'
        + 'if(btn&&!btn._wired){btn._wired=1;btn.onmouseover=function(){this.style.background="#f3f4f6"};btn.onmouseout=function(){this.style.background="transparent"};'
        + 'btn.onclick=function(){var ov=document.getElementById("os-chat-overlay");if(ov)ov.style.display=ov.style.display==="none"?"flex":"none";}}'
        + '}'
        // Chat overlay
        + 'if(!document.getElementById("os-chat-overlay")){'
        + 'var d2=document.createElement("div");d2.innerHTML=ch;'
        + 'document.body.appendChild(d2.firstElementChild);'
        // Wire up chat events
        + 'var inp=document.getElementById("os-chat-input");'
        + 'var send=document.getElementById("os-chat-send");'
        + 'var close=document.getElementById("os-chat-close");'
        + 'if(inp){inp.onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();osChatSend()}}}'
        + 'if(send){send.onclick=function(){osChatSend()}}'
        + 'if(close){close.onclick=function(){document.getElementById("os-chat-overlay").style.display="none"}}'
        + '}'
        + '}'
        // Chat send function (defined once)
        + 'if(!window.osChatSend){'
        + 'window.osChatSend=function(){'
        + 'var inp=document.getElementById("os-chat-input");if(!inp||!inp.value)return;'
        + 'var txt=inp.value.trim();if(!txt)return;inp.value="";'
        + 'var msgs=document.getElementById("os-chat-msgs");if(!msgs)return;'
        // User msg
        + 'var u=document.createElement("div");u.style.cssText="display:flex;justify-content:flex-end;padding:0.375rem 1rem;";'
        + 'u.innerHTML="<div style=\\"max-width:80%;background:#2563eb;color:white;border-radius:1rem;border-bottom-right-radius:0.25rem;padding:0.5rem 0.75rem;font-size:0.875rem;line-height:1.5;white-space:pre-wrap;\\">"+txt.replace(/</g,"&lt;")+"</div>";'
        + 'msgs.appendChild(u);msgs.scrollTop=msgs.scrollHeight;'
        // Thinking dots
        + 'var ti=document.createElement("div");ti.id="os-think";ti.style.cssText="display:flex;justify-content:flex-start;padding:0.375rem 1rem;";'
        + 'ti.innerHTML="<div style=\\"background:#f3f4f6;border-radius:1rem;border-bottom-left-radius:0.25rem;padding:0.75rem 1rem;\\"><span style=\\"display:inline-block;width:0.375rem;height:0.375rem;background:#9ca3af;border-radius:50%;margin-right:0.25rem;animation:osB 1s infinite;\\"></span><span style=\\"display:inline-block;width:0.375rem;height:0.375rem;background:#9ca3af;border-radius:50%;margin-right:0.25rem;animation:osB 1s 0.15s infinite;\\"></span><span style=\\"display:inline-block;width:0.375rem;height:0.375rem;background:#9ca3af;border-radius:50%;animation:osB 1s 0.3s infinite;\\"></span></div>";'
        + 'msgs.appendChild(ti);msgs.scrollTop=msgs.scrollHeight;'
        // Mock response after delay
        + 'setTimeout(function(){'
        + 'var th=document.getElementById("os-think");if(th)th.remove();'
        + 'var m=txt.toLowerCase().trim();var resp;'
        + 'if(m==="hello"||m==="hi"||m==="hey"){resp="Hello! I\'m the OpenScience AI assistant. How can I help you today?"}'
        + 'else if(m==="help"||m==="?"){resp="I can help you with: Guide navigation, MOF knowledge, Language switch, and Search"}'
        + 'else{resp="That\'s a great question! Here\'s what I can tell you about this topic:\\n\\n**Key points:**\\n1. **Metal-Organic Frameworks (MOFs)** are crystalline porous materials\\n2. They consist of metal ions coordinated to organic ligands\\n3. MOFs have extremely high surface areas (up to 7000 m\\u00B2/g)\\n\\nWould you like me to elaborate on any specific aspect?"}'
        + 'var r=document.createElement("div");r.style.cssText="display:flex;justify-content:flex-start;padding:0.375rem 1rem;";'
        + 'r.innerHTML="<div style=\\"max-width:80%;background:#f3f4f6;color:#1f2937;border-radius:1rem;border-bottom-left-radius:0.25rem;padding:0.5rem 0.75rem;font-size:0.875rem;line-height:1.5;white-space:pre-wrap;\\">"+resp.replace(/</g,"&lt;")+"</div>";'
        + 'msgs.appendChild(r);msgs.scrollTop=msgs.scrollHeight;'
        + '},600+Math.random()*900);'
        + '}'
        + '}'
        // Keyframes
        + 'if(!document.querySelector("#osB-style")){var st=document.createElement("style");st.id="osB-style";st.textContent="@keyframes osB{0%,80%,100%{opacity:0}40%{opacity:1}}";document.head.appendChild(st)}'
        // Retry loop
        + 'function t(){p();if(++c<m){setTimeout(t,200)}}'
        + 'if(document.readyState==="complete"||document.readyState==="interactive"){t()}'
        + 'else{document.addEventListener("DOMContentLoaded",t)}'
        + '})();'
        + '</script>';

      content = content.replace('</body>', script + '\n</body>');
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`    ~ Injected panel: ${path.basename(filePath)}`);
    } catch (e) {
      // Skip errors
    }
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Injecting floating panel...');
  walkDir(SITE_PUBLIC_GUIDE);
  console.log('  ✓ Floating panel injected');
}

/**
 * Add trailing slashes to all Guide internal links.
 *
 * MyST generates links like "/guide/en/intro-en" (no trailing slash).
 * On GitHub Pages with output:'export' + trailingSlash:true, Next.js
 * outputs directory-based files (intro-en/index.html), so trailing
 * slashes are required.
 *
 * This function fixes:
 * 1. __remixContext URLs (e.g. "url":"/guide/en/intro-en")
 * 2. __remixContext locations (e.g. "location":"/guide/en/intro-en.md")
 * 3. Rendered <a href="/guide/en/intro-en"> tags
 *
 * It only targets Guide page links (not external links, file assets, etc.).
 */
function fixTrailingSlashes() {
  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return; // Not a MyST page

      // Fix __remixContext "url":"/guide/en/intro-en" → "/guide/en/intro-en/"
      // Also handles the root book's "/guide/intro" → "/guide/intro/".
      // Match: "url":"/guide/(<lang>/)?<slug>" not ending with /
      content = content.replace(
        /("url":"\/guide\/(?:(en|zh)\/)?([a-z0-9\-]+))(")/g,
        (match, prefix, _lang, slug, quote) => {
          // Skip if already has trailing slash or is a file path (has dot)
          if (slug.endsWith('/')) return match;
          return prefix + '/' + quote;
        }
      );

      // Fix __remixContext "location":"/guide/en/intro-en.md"
      // The .md extension is fine — these are source references, not URLs.
      // The actual URL is already fixed above.

      // Fix rendered <a href="/guide/en/intro-en"> → <a href="/guide/en/intro-en/">
      // Also handles the root book's "/guide/intro" → "/guide/intro/".
      content = content.replace(
        /(href="\/guide\/(?:(en|zh)\/)?([a-z0-9\-]+))(")/g,
        (match, prefix, _lang, slug, quote) => {
          // Skip if already has trailing slash, has file extension, or is a root path
          if (slug.endsWith('/') || slug.indexOf('.') !== -1) return match;
          return prefix + '/' + quote;
        }
      );

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`    ~ Fixed trailing slashes: ${path.basename(filePath)}`);
    } catch (e) {
      // Skip unreadable files
    }
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Adding trailing slashes to Guide links...');
  walkDir(SITE_PUBLIC_GUIDE);
  console.log('  ✓ Trailing slashes fixed');
}

function merge() {
  console.log('Merging MyST builds into Next.js...');

  // 1. Merge EN book into guide/en/
  mergeBook('en');

  // 2. Merge ZH book into guide/zh/
  mergeBook('zh');

  // 3. Copy shared assets to guide root level (for asset rewrites)
  //    Both builds generate /build/* assets. Since filenames are content-hashed,
  //    we merge them into one shared /guide/build/ directory
  const sharedAssets = [
    { src: 'en/_build/html/build', dest: 'build' },
  ];
  for (const asset of sharedAssets) {
    const srcDir = path.join(GUIDE_DIR, asset.src);
    if (fs.existsSync(srcDir)) {
      const destDir = path.join(SITE_PUBLIC_GUIDE, asset.dest);
      copyDirOverwrite(srcDir, destDir);
    }
  }
  // Also merge ZH build assets (they have different hashes, safe to merge)
  const zhBuildDir = path.join(GUIDE_DIR, 'zh', '_build', 'html', 'build');
  if (fs.existsSync(zhBuildDir)) {
    const destDir = path.join(SITE_PUBLIC_GUIDE, 'build');
    copyDirOverwrite(zhBuildDir, destDir);
  }

  // 4. Copy global files (myst-theme.css, robots.txt, etc.) to guide root
  //    Always overwrite — these files change between builds (e.g. footer.css updates)
  const globalFiles = ['myst-theme.css', 'robots.txt', 'sitemap.xml', 'objects.inv'];
  for (const file of globalFiles) {
    const srcFile = path.join(GUIDE_DIR, 'en', '_build', 'html', file);
    const destFile = path.join(SITE_PUBLIC_GUIDE, file);
    if (fs.existsSync(srcFile)) {
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      console.log(`  ✓ Global file: ${file}`);
    }
  }

  // 5. Copy original images from guide/ source directory
  const srcImages = path.join(GUIDE_DIR, 'images');
  const destImages = path.join(SITE_PUBLIC_GUIDE, 'images');
  if (copyDirOverwrite(srcImages, destImages)) {
    console.log('  ✓ Source images (guide/images/)');
  }

  // 6. Copy favicon (to guide root for MyST pages AND to site/public root
  //    for the Next.js app shell — Next requests /favicon.ico at the base path)
  const srcFavicon = path.join(GUIDE_DIR, 'favicon.ico');
  const destFavicon = path.join(SITE_PUBLIC_GUIDE, 'favicon.ico');
  const appFavicon = path.join(__dirname, '..', 'site', 'public', 'favicon.ico');
  if (fs.existsSync(srcFavicon)) {
    fs.mkdirSync(path.dirname(destFavicon), { recursive: true });
    fs.copyFileSync(srcFavicon, destFavicon);
    fs.mkdirSync(path.dirname(appFavicon), { recursive: true });
    fs.copyFileSync(srcFavicon, appFavicon);
    console.log('  ✓ Favicon (guide + app root)');
  }

  // 7. Copy design-tokens.css into language dirs and guide root
  //    (myst-theme.css imports it as @import url('./design-tokens.css') which
  //     resolves to /design-tokens.css relative to the CSS file URL)
  const dtSrc = path.join(GUIDE_DIR, 'css', 'design-tokens.css');
  if (fs.existsSync(dtSrc)) {
    const dtDests = [
      path.join(SITE_PUBLIC_GUIDE, 'en', 'design-tokens.css'),
      path.join(SITE_PUBLIC_GUIDE, 'zh', 'design-tokens.css'),
      path.join(SITE_PUBLIC_GUIDE, 'design-tokens.css'),
    ];
    for (const d of dtDests) {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(dtSrc, d);
    }
    console.log('  ✓ design-tokens.css copied (en, zh, ->/guide/)');
  }

  // 8. Copy thebe-core.min.js for Thebe runtime loader
  //    MyST builds it as 1001.thebe-core.min.js but Thebe tries to load /thebe-core.min.js
  for (const lang of ['en', 'zh']) {
    const langDir = path.join(SITE_PUBLIC_GUIDE, lang);
    if (!fs.existsSync(langDir)) continue;
    const files = fs.readdirSync(langDir);
    const thebeFile = files.find(f => f.endsWith('.thebe-core.min.js'));
    if (thebeFile) {
      const src = path.join(langDir, thebeFile);
      // Copy into language dir
      const destLang = path.join(langDir, 'thebe-core.min.js');
      if (!fs.existsSync(destLang)) {
        fs.copyFileSync(src, destLang);
        console.log(`  ✓ thebe-core.min.js copied to ${lang}/`);
      }
      // Copy to guide root (for rewrite /thebe-core.min.js → /guide/thebe-core.min.js)
      const destRoot = path.join(SITE_PUBLIC_GUIDE, 'thebe-core.min.js');
      if (!fs.existsSync(destRoot)) {
        fs.copyFileSync(src, destRoot);
        console.log('  ✓ thebe-core.min.js copied to guide root');
      }
    }
  }

  // 9. Suppress MyST internal React hydration errors
  suppressHydrationErrors();

  // 10. Remove project title from sidebar TOC (the "Open Science - Guide (EN/ZH)" link).
  //     MyST auto-adds index.md to the TOC even when removed from myst.yml.
  //     We strip it from the __remixContext JSON here.
  removeProjectTocEntry();

  // 11. Fix __remixContext URLs in all MyST HTML files.
  //    MyST builds urls as "/intro-en" but we serve at "/guide/en/intro-en".
  //    Without this fix, sidebar TOC links and Remix routing all 404.
  fixRemixContextUrls();

  // 12. Re-run project TOC removal after URL fixes (which may restore titles)
  removeProjectTocEntry();

  // 13. Add trailing slashes to Guide internal links for GH Pages static export.
  //     MyST generates links like "/guide/en/intro-en" (no trailing slash).
  //     With output:'export' and trailingSlash:true, Next.js generates
  //     directory-based output (intro-en/index.html), so /guide/en/intro-en/
  //     works but /guide/en/intro-en 404s. We fix both __remixContext URLs
  //     and rendered <a> tags to include trailing slashes.
  fixTrailingSlashes();

  // 14. Prepend the /OpenScience base path to all Guide links/assets in the
  //     MyST HTML. Required because GitHub Pages serves under /OpenScience/
  //     and basePath (next.config) doesn't touch files copied from public/.
  //     Gated by ADD_BASE_PATH (set only in deploy.yml, not local dev).
  addBasePath();

  // 15. Inject floating control panel (language switcher + reserved slots)
  //     Injected via <script> after hydration to avoid Remix hydration errors.
  //     Its links are BASE-aware (see panelHtml) so they work under /OpenScience/.
  injectFloatPanel();

  console.log('✓ Merge complete.');
}

/**
 * Fix __remixContext URLs in MyST HTML files.
 *
 * MyST (Remix) embeds __remixContext.url = "/intro-en" and
 * __remixContext.location = "/intro-en.md" in the HTML. We serve
 * these pages at "/guide/en/intro-en" and "/guide/zh/intro-zh",
 * so we must prepend the language prefix to all internal URLs.
 *
 * Only page slugs (no dots, no double slashes) are patched to avoid
 * corrupting asset URLs like "/build/app.css".
 */
function fixRemixContextUrls() {
  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return;

      const relPath = path.relative(SITE_PUBLIC_GUIDE, filePath);
      const langPrefix = relPath.startsWith('zh') ? '/guide/zh' : '/guide/en';

      // Fix __remixContext.page.location (e.g. "/intro-en.md" → "/guide/en/intro-en.md")
      content = content.replace(/"location":"\/([a-z][^"]*)"/g, (match, slug) => {
        // Skip root paths and already-prefixed paths
        if (slug === '' || slug.startsWith('guide/')) return match;
        return `"location":"${langPrefix}/${slug}"`;
      });

      // Fix __remixContext.url — only page slugs (no dots), skip assets
      content = content.replace(/"url":"\/([a-z][^"]*)"/g, (match, slug) => {
        // Skip if: empty, has dot (asset), already has prefix
        if (slug === '' || slug.indexOf('.') !== -1 || slug.startsWith('guide/')) return match;
        return `"url":"${langPrefix}/${slug}"`;
      });

      // Fix sidebar project title link: /guide/en/ → homepage (Next.js app root)
      // At deploy time BASE='/OpenScience' so it points to the app, not github.io root.
      const lang = relPath.startsWith('zh') ? 'zh' : 'en';
      // Fix rendered HTML link (class before href)
      content = content.replace(
        new RegExp(`<a title="Open Science - Guide \\(${lang === 'zh' ? 'ZH' : 'EN'}\\)" class="block break-words[^"]*font-bold" href="/guide/${lang}/">Open Science - Guide \\(${lang === 'zh' ? 'ZH' : 'EN'}\\)`, 'g'),
        `<a title="Open Science" class="block break-words focus:outline outline-blue-200 outline-2 rounded myst-toc-item p-2 my-1 rounded-lg hover:bg-slate-300/30 font-bold" href="${BASE}/">Open Science`
      );
      // Fix __remixContext project title (prevents Remix re-render of old link)
      content = content.replace(/"title":"Open Science - Guide \(EN\)"/g, '"title":"Open Science"');
      content = content.replace(/"title":"Open Science - Guide \(ZH\)"/g, '"title":"Open Science"');

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`    ~ Fixed URLs: ${path.basename(filePath)}`);
    } catch (e) {
      // Skip unreadable files
    }
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Fixing Remix context URLs...');
  walkDir(path.join(SITE_PUBLIC_GUIDE, 'en'));
  walkDir(path.join(SITE_PUBLIC_GUIDE, 'zh'));
  console.log('  ✓ Remix context URLs fixed');
}

/**
 * Prepend the GitHub Pages base path (/OpenScience) to every Guide link/asset
 * inside the MyST HTML. basePath in next.config.ts only rewrites Next-rendered
 * output (_next assets, <Link>), NOT the static files copied from public/.
 * So the MyST pages — which live under public/guide/ — must be prefixed here.
 *
 * Only runs when ADD_BASE_PATH=1 (set in deploy.yml). In local dev the site is
 * served at the root, so we leave paths untouched.
 *
 * We replace root-absolute "/guide/" with "/OpenScience/guide/". A negative
 * lookbehind guards against double-prefixing if the content already carries
 * the OpenScience prefix (idempotent + safe across re-runs).
 */
function addBasePath() {
  if (!process.env.ADD_BASE_PATH) return;
  const PREFIX = BASE + '/guide/';

  function processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      if (content.indexOf('__remixContext') === -1) return; // Not a MyST page

      const relPath = path.relative(SITE_PUBLIC_GUIDE, filePath);
      const isRootBook = !relPath.startsWith('en/') && !relPath.startsWith('zh/');

      if (isRootBook) {
        // Root book pages (built by guide/myst.yml with a site-root BASE_URL)
        // are merged under public/guide/ but their HTML references bare root
        // paths: "/about", "/build/...", "/myst-theme.css", "/favicon.ico".
        // Prepend /guide/ (+ trailing slash) to bare slug links so they resolve
        // under /guide/. Asset paths with extensions are handled below.
        content = content.replace(
          /(["'])\/([a-z0-9\-]+(?:\/[a-z0-9\-]+)*)\1/g,
          (m, q, slug) => {
            if (slug.startsWith('guide/') || slug.startsWith('OpenScience') || slug === '') return m;
            return q + '/guide/' + slug + '/' + q;
          }
        );
      }

      // Common: prepend base path to every /guide/ reference (idempotent —
      // guarded against an already-prefixed /OpenScience prefix).
      content = content.replace(/(?<!OpenScience)\/guide\//g, PREFIX);

      // Common: bare shared assets that the root book references at the site
      // root. After merge they live under public/guide/<name>, so under
      // /OpenScience/guide/<name>. These resolve to /OpenScience/guide/build,
      // /OpenScience/guide/myst-theme.css, etc.
      content = content.replace(/(?<![\w/])build\//g, BASE + '/guide/build/');
      content = content.replace(
        /(?<![\w/])(myst-theme\.css|favicon\.ico|design-tokens\.css|robots\.txt|sitemap\.xml|objects\.inv)/g,
        BASE + '/guide/$1'
      );

      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (e) {
      // Skip unreadable files
    }
  }

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.html')) {
        processFile(fullPath);
      }
    }
  }

  console.log('  ~ Prepending /OpenScience base path to Guide links/assets...');
  walkDir(SITE_PUBLIC_GUIDE);
  console.log('  ✓ Base path prepended');
}

merge();
