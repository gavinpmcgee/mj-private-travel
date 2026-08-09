/**
 * Smoke test for the charter quote widget.
 *
 *   npm install jsdom
 *   node test-widget.js
 *
 * Mounts the built bundle in a simulated DOM and walks the full four-step
 * flow. Exits non-zero on any failure. Run this after every change to
 * charter-quote-multistep.html and before committing charter-quote.js.
 */

const fs = require("fs");
const { JSDOM } = require("jsdom");

let failures = 0;
function check(label, actual, expected) {
  const ok = expected === undefined ? !!actual : actual === expected;
  console.log((ok ? "  PASS  " : "  FAIL  ") + label +
    (ok ? "" : `\n          expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`));
  if (!ok) failures++;
}

if (!fs.existsSync("charter-quote.js")) {
  console.error("charter-quote.js not found. Run: node build-embed.js");
  process.exit(1);
}

const dom = new JSDOM(
  '<!doctype html><html><head></head><body>' +
  '<div id="charter-quote" data-accent="#FFB627" data-pax="2"></div>' +
  '</body></html>',
  { runScripts: "outside-only", pretendToBeVisual: true }
);

const w = dom.window;
const d = w.document;
w.requestAnimationFrame = (cb) => setTimeout(cb, 0);

const fire  = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const $ = (id) => d.getElementById(id);
const step = () => d.querySelector(".cq-step.is-active").dataset.step;
const submit = () => fire($("cqForm"), "submit");

try {
  w.eval(fs.readFileSync("charter-quote.js", "utf8"));
} catch (e) {
  console.error("Bundle threw on load:", e.message);
  process.exit(1);
}
w.CharterQuote.boot();

console.log("\nMount");
check("widget mounted", !!d.querySelector("#charter-quote .cq"));
check("stylesheet injected", !!$("charter-quote-css"));
check("four steps present", d.querySelectorAll(".cq-step").length, 4);
check("one leg to start", d.querySelectorAll(".cq-leg").length, 1);
check("starts on step 0", step(), "0");
check("back button hidden", $("cqBack").hidden, true);
check("data-accent applied",
  d.querySelector("#charter-quote .cq").style.getPropertyValue("--signal"), "#FFB627");

console.log("\nCSS scoping (must not leak onto the host page)");
const css = $("charter-quote-css").textContent;
check("no :root selector", !css.includes(":root"));
check("no bare * reset", !/(^|\n)\s*\*\s*\{\s*box-sizing/.test(css));
check("no html/body rule", !/(^|\n)\s*html, body/.test(css));
check("no bare :focus-visible", !/(^|\n)\s*:focus-visible \{/.test(css));
check("font inherits from page", /--font-sans:\s*inherit/.test(css));

console.log("\nAirport autocomplete");
const from = d.querySelector('[data-airport="from"]');
from.value = "KTEB"; fire(from, "input");
let sg = d.querySelector(".cq-sugg.is-open li[data-idx]");
check("ICAO lookup finds KTEB", sg && sg.querySelector(".code").textContent, "KTEB");
click(sg);

const to = d.querySelector('[data-airport="to"]');
to.value = "palm beach"; fire(to, "input");
sg = d.querySelector(".cq-sugg.is-open li[data-idx]");
check("city lookup finds KPBI", sg && sg.querySelector(".code").textContent, "KPBI");
click(sg);
check("route line activates", d.querySelector(".cq-leg").classList.contains("is-routed"), true);

console.log("\nStep 1 validation");
submit();
check("blocked without a date", step(), "0");
check("error shown", $("cqFormErr").classList.contains("is-open"), true);

const date = d.querySelector('[data-fld="date"]');
date.value = "2026-09-14"; fire(date, "input");
submit();
check("advances once complete", step(), "1");
check("back button now visible", $("cqBack").hidden, false);
check("progress at one third", $("cqPlane").style.left, "33.33333333333333%");

console.log("\nStep 2");
click($("cqPaxInc")); click($("cqPaxInc"));
check("passenger stepper", $("cqPax").textContent, "4");
submit();
check("step 2 needs nothing required", step(), "2");

console.log("\nStep 3 validation");
submit();
check("blocked on empty contact", step(), "2");

$("cqName").value = "Test User";     fire($("cqName"), "input");
$("cqEmail").value = "not-an-email"; fire($("cqEmail"), "input");
$("cqPhone").value = "2035551234";   fire($("cqPhone"), "input");
submit();
check("bad email caught", step(), "2");
check("email error message", /email/i.test($("cqFormErr").textContent), true);

$("cqEmail").value = "test@example.com"; fire($("cqEmail"), "input");
submit();
check("advances to review", step(), "3");
check("progress complete", $("cqPlane").style.left, "100%");

console.log("\nReview");
check("itinerary rendered",
  d.querySelector(".cq-review-leg .rt").textContent.replace(/\s+/g, ""), "KTEB→KPBI");
check("date formatted", /Sep 14, 2026/.test(d.querySelector(".cq-review-leg .rw").textContent), true);
check("passenger count carried", d.querySelector(".cq-review-pairs b").textContent, "4");

click(d.querySelector('[data-goto="0"]'));
check("Edit jumps back to step 0", step(), "0");
submit(); submit(); submit();
check("returns to review", step(), "3");

console.log("\nSubmit (preview mode — no webhook configured)");
let detail = null;
w.addEventListener("charterQuote:submitted", (e) => { detail = e.detail; });
submit();
check("success panel shown", $("cqDone").classList.contains("is-open"), true);
check("reference generated", /^Reference CQ-\d{6}-[A-Z0-9]{4}$/.test($("cqRef").textContent), true);
check("submitted event fired", !!detail);

const p = detail.payload;
check("leg origin", p.trip.legs[0].fromIcao, "KTEB");
check("leg destination", p.trip.legs[0].toIcao, "KPBI");
check("leg date", p.trip.legs[0].date, "2026-09-14");
check("legs is an array", Array.isArray(p.trip.legs), true);
check("passengers", p.passengers, 4);
check("contact email", p.contact.email, "test@example.com");

console.log(failures === 0
  ? "\nAll checks passed.\n"
  : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
