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

console.log("\nPanel treatment (full width, frosted, rounded)");
const panelRule = css.slice(css.indexOf(".cq {\n    max-width"), css.indexOf("@supports not"));
check("full width", /--max:\s*100%/.test(css));
check("frosted background", /background:\s*var\(--panel\)/.test(panelRule));
check("backdrop blur applied", /\n\s*backdrop-filter:\s*blur/.test(panelRule));
check("webkit prefix present for Safari", /-webkit-backdrop-filter:\s*blur/.test(panelRule));
check("corners rounded", /border-radius:\s*var\(--panel-radius\)/.test(panelRule));
check("fallback when backdrop-filter is unsupported", css.includes("@supports not"));
// the build injects its own `.cq { background: var(--bg) }` — the frosted rule must come after it
check("frosted background beats the build's solid one",
  css.indexOf("background: var(--panel)") > css.indexOf("background: var(--bg);"));
// height must stay content-driven: the panel grows with legs and shrinks on success
check("no fixed height on the panel", !/(^|\n)\s*(min-|max-)?height:/.test(panelRule));

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

/* ============================================================
   NATIVE WEBFLOW FORM BRIDGE
   A second, isolated DOM containing a mock Webflow form block. The
   widget should fill its fields and click its submit button, then wait
   for Webflow's own success div before showing the success panel.
   ============================================================ */

const BUNDLE = fs.readFileSync("charter-quote.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Webflow rejects long field values, so the widget caps everything it writes */
const WF_FIELD_MAX = 500;

const WF_FIELDS = ["Reference", "Trip-Type", "Itinerary", "Dates-Flexible", "Passengers",
  "Aircraft", "Baggage", "Pets", "Catering", "Ground-Transport", "Name", "Email",
  "Phone", "Booking-For", "SMS-Consent", "Notes", "Page-URL"];

function mockWebflowForm(fields) {
  return '<div class="w-form">' +
    '<form id="wf-form-Charter" name="wf-form-Charter" data-name="Charter Quote">' +
    fields.map((n) => `<input name="${n}">`).join("") +
    '<input type="submit" value="Submit">' +
    '</form>' +
    '<div class="w-form-done">Thank you</div>' +
    '<div class="w-form-fail">Oops</div>' +
    '</div>';
}

/* walks the four steps and submits — mirrors the manual flow above */
function driveToSubmit(win, doc, notes) {
  const f = (el, t) => el.dispatchEvent(new win.Event(t, { bubbles: true }));
  const c = (el) => el.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  const id = (x) => doc.getElementById(x);

  const from = doc.querySelector('[data-airport="from"]');
  from.value = "KTEB"; f(from, "input");
  c(doc.querySelector(".cq-sugg.is-open li[data-idx]"));

  const to = doc.querySelector('[data-airport="to"]');
  to.value = "palm beach"; f(to, "input");
  c(doc.querySelector(".cq-sugg.is-open li[data-idx]"));

  const dt = doc.querySelector('[data-fld="date"]');
  dt.value = "2026-09-14"; f(dt, "input");

  const go = () => f(id("cqForm"), "submit");
  go();                                    // -> step 1
  c(id("cqPaxInc")); c(id("cqPaxInc"));    // 4 passengers
  go();                                    // -> step 2
  id("cqName").value = "Test User";        f(id("cqName"), "input");
  id("cqEmail").value = "test@example.com"; f(id("cqEmail"), "input");
  id("cqPhone").value = "2035551234";      f(id("cqPhone"), "input");
  id("cqNotes").value = notes || "Wheels up early"; f(id("cqNotes"), "input");
  go();                                    // -> review
  go();                                    // final submit
}

function bootWidget(bodyHtml) {
  const dm = new JSDOM('<!doctype html><html><head></head><body>' + bodyHtml + '</body></html>',
    { runScripts: "outside-only", pretendToBeVisual: true });
  dm.window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  dm.window.eval(BUNDLE);
  dm.window.CharterQuote.boot();
  return dm;
}

(async function () {
  console.log("\nPanel config via data attributes");
  const dmCfg = bootWidget('<div id="charter-quote" data-max-width="880px" data-radius="24px" data-blur="30px"></div>');
  const panel = dmCfg.window.document.querySelector("#charter-quote .cq");
  check("data-max-width caps the panel", panel.style.getPropertyValue("--max"), "880px");
  check("data-radius overrides corners", panel.style.getPropertyValue("--panel-radius"), "24px");
  check("data-blur overrides frost", panel.style.getPropertyValue("--blur"), "30px");

  const dmDefault = bootWidget('<div id="charter-quote"></div>');
  check("no override leaves the panel full width",
    dmDefault.window.document.querySelector("#charter-quote .cq").style.getPropertyValue("--max"), "");

  console.log("\nWebflow form bridge");

  const dm = bootWidget(mockWebflowForm(WF_FIELDS.concat(["Payload"])) +
    '<div id="charter-quote" data-webflow-form="Charter Quote"></div>');
  const w2 = dm.window, d2 = w2.document;

  const form = d2.querySelector('form[data-name="Charter Quote"]');
  let submitted = 0;
  form.addEventListener("submit", (e) => { e.preventDefault(); submitted++; });

  driveToSubmit(w2, d2);
  await sleep(300);

  const val = (n) => form.querySelector(`[name="${n}"]`).value;
  check("native form submitted", submitted, 1);
  check("reference written", /^CQ-\d{6}-[A-Z0-9]{4}$/.test(val("Reference")), true);
  check("contact name written", val("Name"), "Test User");
  check("contact email written", val("Email"), "test@example.com");
  check("passengers written", val("Passengers"), "4");
  check("notes written", val("Notes"), "Wheels up early");
  check("itinerary flattened", /1\. KTEB -> KPBI\s+2026-09-14/.test(val("Itinerary")), true);
  check("no field left unmapped", WF_FIELDS.every((n) => val(n) !== ""), true);

  // the JSON backstop must stay under Webflow's field limit, or it's dropped
  check("payload backstop attached", JSON.parse(val("Payload")).legs[0].to, "KPBI");
  check("payload within Webflow's limit", val("Payload").length <= WF_FIELD_MAX, true);
  check("every field within Webflow's limit",
    WF_FIELDS.concat(["Payload"]).every((n) => val(n).length <= WF_FIELD_MAX), true);

  // widget must wait for Webflow's confirmation, not assume success
  check("waits for Webflow to confirm", d2.getElementById("cqDone").classList.contains("is-open"), false);

  d2.querySelector(".w-form-done").style.display = "block";
  await sleep(400);
  check("success panel after Webflow confirms",
    d2.getElementById("cqDone").classList.contains("is-open"), true);
  check("no preview payload dumped", d2.getElementById("cqDebug").hidden, true);

  /* Payload is optional — a Designer form without it must still go through.
     This is the shape that broke in production: the field was removed to get
     under Webflow's length limit. */
  console.log("\nWebflow bridge — form without the optional Payload field");
  const dmNoP = bootWidget(mockWebflowForm(WF_FIELDS) +
    '<div id="charter-quote" data-webflow-form="Charter Quote"></div>');
  const fNoP = dmNoP.window.document.querySelector('form[data-name="Charter Quote"]');
  let submittedNoP = 0;
  fNoP.addEventListener("submit", (e) => { e.preventDefault(); submittedNoP++; });
  driveToSubmit(dmNoP.window, dmNoP.window.document);
  await sleep(300);
  check("submits without a Payload field", submittedNoP, 1);
  check("named fields still populated", fNoP.querySelector('[name="Email"]').value, "test@example.com");
  dmNoP.window.document.querySelector(".w-form-done").style.display = "block";
  await sleep(400);
  check("succeeds without a Payload field",
    dmNoP.window.document.getElementById("cqDone").classList.contains("is-open"), true);

  /* An over-long note must be trimmed, not passed through to be rejected */
  console.log("\nWebflow bridge — over-long note");
  const dmLong = bootWidget(mockWebflowForm(WF_FIELDS) +
    '<div id="charter-quote" data-webflow-form="Charter Quote"></div>');
  const fLong = dmLong.window.document.querySelector('form[data-name="Charter Quote"]');
  fLong.addEventListener("submit", (e) => e.preventDefault());
  driveToSubmit(dmLong.window, dmLong.window.document, "N".repeat(3000));
  await sleep(300);
  const noteVal = fLong.querySelector('[name="Notes"]').value;
  check("long note truncated", noteVal.length, WF_FIELD_MAX);
  check("truncation is visible", /\[…\]$/.test(noteVal), true);

  /* Designer forms aren't always plain text inputs, and required flags on a
     hidden form fail invisibly. Neither may block a submission. */
  console.log("\nWebflow bridge — required flags, selects and checkboxes");
  const awkward = '<div class="w-form">' +
    '<form data-name="Charter Quote">' +
    '<input name="Reference" required><input name="Trip-Type" required>' +
    '<textarea name="Itinerary" required></textarea>' +
    '<input name="Passengers" required><input name="Name" required>' +
    '<input name="Email" type="email" required><input name="Phone">' +
    '<select name="Aircraft" required><option value=""></option></select>' +
    '<select name="Ground-Transport" required><option value="Yes"></option><option value="No"></option></select>' +
    '<input name="Pets" type="checkbox"><input name="Catering" type="checkbox">' +
    '<input name="Baggage" required><input name="Dates-Flexible">' +
    '<input name="Booking-For"><input name="SMS-Consent">' +
    '<input name="Notes"><input name="Page-URL">' +
    '<input type="submit"></form>' +
    '<div class="w-form-done"></div><div class="w-form-fail"></div></div>';
  const dmAwk = bootWidget(awkward + '<div id="charter-quote" data-webflow-form="Charter Quote"></div>');
  const dAwk = dmAwk.window.document;
  const fAwk = dAwk.querySelector('form[data-name="Charter Quote"]');
  let awkSubmits = 0;
  fAwk.addEventListener("submit", (e) => { e.preventDefault(); awkSubmits++; });
  driveToSubmit(dmAwk.window, dAwk);
  await sleep(300);
  check("required flags stripped", fAwk.querySelectorAll("[required]").length, 0);
  check("form validates after filling", fAwk.checkValidity(), true);
  check("select without a matching option still takes the value",
    fAwk.querySelector('[name="Aircraft"]').value, "No preference");
  check("select with matching options is unharmed",
    fAwk.querySelector('[name="Ground-Transport"]').value, "No");
  check("no duplicate option injected",
    fAwk.querySelector('[name="Ground-Transport"]').options.length, 2);
  check("checkbox set from Yes/No", fAwk.querySelector('[name="Pets"]').checked, false);
  check("submit reached the form", awkSubmits, 1);

  /* The Designer publishes whichever form state was left showing. An error
     div already visible at load must not be read as a failed submission. */
  console.log("\nWebflow bridge — error state left visible in the Designer");
  const dmStuck = bootWidget(mockWebflowForm(WF_FIELDS) +
    '<div id="charter-quote" data-webflow-form="Charter Quote"></div>');
  const dStuck = dmStuck.window.document;
  dStuck.querySelector(".w-form-fail").style.display = "block";   // as Webflow would publish it
  dStuck.querySelector('form[data-name="Charter Quote"]')
    .addEventListener("submit", (e) => e.preventDefault());
  driveToSubmit(dmStuck.window, dStuck);
  await sleep(600);
  check("pre-existing error div is not read as failure",
    dStuck.getElementById("cqFormErr").classList.contains("is-open"), false);
  dStuck.querySelector(".w-form-done").style.display = "block";
  await sleep(400);
  check("success still detected underneath it",
    dStuck.getElementById("cqDone").classList.contains("is-open"), true);

  // a missing form must surface an error, never a false success
  console.log("\nWebflow bridge — form missing from page");
  const dm2 = bootWidget('<div id="charter-quote" data-webflow-form="Nonexistent"></div>');
  driveToSubmit(dm2.window, dm2.window.document);
  await sleep(300);
  check("no false success", dm2.window.document.getElementById("cqDone").classList.contains("is-open"), false);
  check("error surfaced to the user",
    dm2.window.document.getElementById("cqFormErr").classList.contains("is-open"), true);

  console.log(failures === 0
    ? "\nAll checks passed.\n"
    : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
