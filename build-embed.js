const fs = require("fs");

const html = fs.readFileSync("charter-quote-multistep.html", "utf8");

const css    = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));
const markup = html.slice(html.indexOf("</style>") + 8, html.lastIndexOf("<script>")).trim();
const js     = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

/* every replacement must actually match — a silent no-op ships a broken bundle */
function rep(str, pattern, replacement, label) {
  const out = str.replace(pattern, replacement);
  if (out === str) throw new Error("build: no-op replacement -> " + label);
  return out;
}

/* ---------- scope the CSS so nothing leaks onto the Webflow page ---------- */
let s = css;

s = rep(s, /:root \{/, ".cq {", "css :root -> .cq");

s = rep(s, /\*\s*\{ box-sizing: border-box; \}/,
  ".cq, .cq *, .cq *::before, .cq *::after { box-sizing: border-box; }", "css box-sizing reset");

s = rep(s, /html, body \{[\s\S]*?\n  \}/,
`.cq {
    background: var(--bg);
    color: var(--on-bg);
    -webkit-font-smoothing: antialiased;
  }`, "css html/body -> .cq panel");

/* font inherits from the host page by default — this is how Gilroy gets in */
s = rep(s, /--font-sans: "Gilroy"[^;]*;/,
  "--font-sans: inherit;   /* inherits the page font — set data-font to override */", "css font inherit");

s = rep(s, /\n  :focus-visible \{/, "\n  .cq :focus-visible {", "css focus-visible");

s = rep(s, /@media \(prefers-reduced-motion: reduce\) \{\s*\* \{/,
  "@media (prefers-reduced-motion: reduce) {\n    .cq, .cq * {", "css reduced-motion");

/* ---------- scope the JS lookups to the mount element ---------- */
let j = js;

j = rep(j, /var \$ = function \(id\) \{ return document\.getElementById\(id\); \};/,
  'var $ = function (id) { return root.querySelector(\'[id="\' + id + \'"]\'); };', "js $ scoped");

j = rep(j, /\n\s*var root\s*=\s*\$\("cqRoot"\);/, "", "js remove inner root decl");

if (!/document\.querySelectorAll\(/.test(j)) throw new Error("build: no document.querySelectorAll to scope");
j = j.replace(/document\.querySelectorAll\(/g, "root.querySelectorAll(");

j = rep(j, /document\.querySelector\("\.cq-step\.is-active \.has-error"\)/,
  'root.querySelector(".cq-step.is-active .has-error")', "js first-error lookup");

j = rep(j, /document\.querySelector\("\.cq-track"\)/, 'root.querySelector(".cq-track")', "js track lookup");

/* don't yank the page to the widget on first paint */
j = rep(j, /function goTo\(n, backwards\) \{/,
  `function safeScroll(el, block) {
    if (!el || typeof el.scrollIntoView !== "function") return;
    try { el.scrollIntoView({ behavior: "smooth", block: block }); }
    catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
  }

  function goTo(n, backwards, noScroll) {`, "js goTo signature + safeScroll");
j = rep(j, /root\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);/,
  'if (!noScroll) safeScroll(root, "start");', "js goTo scroll guard");

j = rep(j, /if \(firstBad\) firstBad\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\);/,
  'safeScroll(firstBad, "center");', "js error scroll guard");
j = rep(j, /goTo\(0, false\);/, "goTo(0, false, true);", "js boot noScroll");

/* height messaging only matters inside an iframe */
const HEIGHT_OLD = /var lastH = 0;\n  function reportHeight\(\) \{[\s\S]*?\n  \}\n  window\.addEventListener\("resize", reportHeight\);\n  if \(window\.ResizeObserver\) new ResizeObserver\(reportHeight\)\.observe\(document\.body\);/;
const HEIGHT_NEW = [
  'var IN_FRAME = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();',
  '  var lastH = 0;',
  '  function reportHeight() {',
  '    if (!IN_FRAME) return;',
  '    requestAnimationFrame(function () {',
  '      var h = document.documentElement.scrollHeight;',
  '      if (Math.abs(h - lastH) < 2) return;',
  '      lastH = h;',
  '      try { window.parent.postMessage({ type: "charterQuote:height", height: h }, "*"); } catch (e) {}',
  '    });',
  '  }',
  '  if (IN_FRAME) {',
  '    window.addEventListener("resize", reportHeight);',
  '    if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);',
  '  }'
].join("\n");
j = rep(j, HEIGHT_OLD, HEIGHT_NEW, "js height guard");

/* notify the host page: CustomEvent inline, postMessage when framed */
const SUBMIT_OLD = /try \{ window\.parent\.postMessage\(\{ type: "charterQuote:submitted", reference: payload\.reference \}, "\*"\); \} catch \(e\) \{\}/;
const SUBMIT_NEW = [
  'var detail = { reference: payload.reference, payload: payload };',
  '    try { window.dispatchEvent(new CustomEvent("charterQuote:submitted", { detail: detail })); } catch (e) {}',
  '    if (IN_FRAME) { try { window.parent.postMessage({ type: "charterQuote:submitted", reference: payload.reference }, "*"); } catch (e) {} }'
].join("\n");
j = rep(j, SUBMIT_OLD, SUBMIT_NEW, "js submit notify");

/* config comes off the mount element's data attributes */
j = rep(j, /var CONFIG = \{/, "var D = el.dataset || {};\n  var CONFIG = {", "js CONFIG dataset");
j = rep(j, /webhookUrl: "",/,  'webhookUrl: D.webhook || "",',      "js cfg webhook");
j = rep(j, /webflowForm: "",/, 'webflowForm: D.webflowForm || "",', "js cfg webflowForm");
j = rep(j, /fontUrl: "",/,     'fontUrl: D.fontUrl || "",',         "js cfg fontUrl");
j = rep(j, /refPrefix: "CQ"/,  'refPrefix: D.refPrefix || "CQ"',    "js cfg refPrefix");
j = rep(j, /maxLegs: 6,/,      "maxLegs: +(D.maxLegs || 6),",       "js cfg maxLegs");
j = rep(j, /defaultPax: 2,/,   "defaultPax: +(D.pax || 2),",        "js cfg pax");

/* ---------- emit ---------- */
const out = `/*!
 * Charter quote request - embeddable multistep form.
 * Host this file, then add a mount div and one script tag to a
 * Webflow Code Embed. Config lives on the div's data attributes.
 */
(function () {
  "use strict";

  var CSS = ${JSON.stringify(s)};
  var MARKUP = ${JSON.stringify(markup)};
  var STYLE_ID = "charter-quote-css";

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function mount(el) {
    if (el.dataset.cqMounted) return;
    el.dataset.cqMounted = "1";
    injectCss();
    el.innerHTML = MARKUP;

    var root = el.querySelector(".cq");

    var D = el.dataset || {};
    if (D.bg)       root.style.setProperty("--bg", D.bg);
    if (D.bgDeep)   root.style.setProperty("--bg-deep", D.bgDeep);
    if (D.accent)   root.style.setProperty("--signal", D.accent);
    if (D.font)     root.style.setProperty("--font-sans", D.font);
    if (D.maxWidth) root.style.setProperty("--max", D.maxWidth);

    (function () {${j}})();
  }

  function boot() {
    var nodes = document.querySelectorAll("#charter-quote, [data-charter-quote]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
    window.addEventListener("load", boot);   // safety net if DCL already fired
  } else {
    boot();
  }

  window.CharterQuote = { mount: mount, boot: boot };
})();
`;

fs.writeFileSync("charter-quote.js", out);
console.log("charter-quote.js written:", out.length, "bytes");
