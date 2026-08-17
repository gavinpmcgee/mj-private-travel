# CLAUDE.md

Instructions for Claude Code working in this repo.

## What this is

An embeddable multistep quote-request form for a private jet charter client,
built by Monocle Creative Studio. It gets embedded into the client's **Webflow**
site and is served to Webflow from **GitHub via the jsDelivr CDN**.

It exists as a hosted script rather than pasted-in code because Webflow's Code
Embed element caps at 50,000 characters and the bundle is ~71 KB. The Webflow
embed is a ~200-character loader; everything else lives here.

Gavin (the user) is a designer-developer, comfortable with HTML/CSS/JS and
Webflow, less interested in build tooling. Explain Webflow and Git steps
concretely. Don't over-explain JavaScript.

---

## Critical rules

**1. `charter-quote.js` is a generated artifact. Never edit it directly.**
Every change goes into `charter-quote-multistep.html`, then you run the build.
Edits made straight to the bundle are silently destroyed on the next build.
If you catch yourself opening `charter-quote.js` to make a change, stop.

**2. Always run the test before committing.** `node test-widget.js`. The build
does regex transforms on the source; a change to the source can quietly stop a
transform from matching. The build asserts and throws in that case, but the test
catches the subtler breakages.

**3. Never commit a real webhook URL.** The webhook is configured on the Webflow
side via a `data-webhook` attribute. Keeping it out of the repo is deliberate —
this repo is public so jsDelivr can serve from it.

**4. Pin the jsDelivr version tag.** Never point Webflow at `@main`. jsDelivr
caches that aggressively and edits won't appear for hours.

---

## Files

| File | Role |
|---|---|
| `charter-quote-multistep.html` | **Source of truth.** Edit this. Opens directly in a browser for iteration. |
| `build-embed.js` | Build. Turns the HTML into the self-mounting bundle. |
| `charter-quote.js` | **Generated.** The hosted bundle. Committed so jsDelivr can serve it. |
| `test-widget.js` | Smoke test. Mounts the bundle in jsdom, walks all four steps. |
| `README.md` | Setup docs written for a human. |
| `CLAUDE.md` | This file. |

---

## How it works

### The widget

Four steps: Trip → Aircraft → Contact → Review. State lives in a single `state`
object (`step`, `tripType`, `legs[]`, `pax`). Legs are objects with
`{uid, from, to, date, time}` where `from`/`to` are airport records.

An `AIRPORT_DATA` array holds 454 business-aviation airports as pipe-delimited
strings: `ICAO|IATA|Name|City, region|Country`. Search is client-side and tiered:
exact code match, then code prefix, then city/name prefix, then substring.

Validation is per-step. `validateStep(n)` returns an array of problem strings and
marks fields with `.has-error`. Step 0 checks legs, step 2 checks contact fields,
steps 1 and 3 require nothing. The final submit re-runs steps 0 and 2 before
sending.

Submission has three modes, checked in this order:

1. **Native Webflow form** (`CONFIG.webflowForm`, from `data-webflow-form`).
   Finds a Webflow form on the host page by `data-name`, fills its fields by
   `name`, and clicks its submit button so Webflow's own jQuery handler picks it
   up. Entries land in Webflow's Form Submissions panel — no webhook, no Make.
   Field names are fixed in `webflowFields()`; `trip.legs` is flattened to text
   by `itineraryText()` since a native form can't hold an array, and the whole
   JSON payload also goes into a `Payload` field as a backstop.

   It waits for Webflow's `.w-form-done` before calling `finish()`, so a
   rejected submission surfaces an error instead of a false success. Detection
   reads the **inline** `display` Webflow sets, not `offsetParent` — the form
   block is hidden on the page, so `offsetParent` is null even on success.

2. **Webhook** (`CONFIG.webhookUrl`). POSTs the JSON payload.
3. **Preview mode** (neither set). Shows the payload on screen instead of
   sending. This is the default and is how you test without either configured.

### The build

`build-embed.js` splits the HTML into CSS, markup, and JS, then applies targeted
transforms so the widget can live inside someone else's page:

- **CSS scoping.** `:root` becomes `.cq`; the `* { box-sizing }` reset,
  `:focus-visible`, and the reduced-motion block get namespaced under `.cq`; the
  `html, body` rule becomes a `.cq` panel rule. Without this the widget's reset
  and blue background would apply to the entire Webflow page.
- **Font.** `--font-sans` is rewritten to `inherit` so the widget picks up
  Gilroy from Webflow's own stylesheet. This is why there's no font loading here.
- **DOM scoping.** `document.querySelectorAll` becomes `root.querySelectorAll`
  and `$()` looks up by id within the mount element.
- **Environment guards.** Height postMessage only fires inside an iframe;
  `scrollIntoView` is wrapped; the initial `goTo(0)` doesn't scroll the page.
- **Config.** Reads from the mount element's `dataset` instead of hardcoded
  values.

Every transform goes through a `rep()` helper that **throws if the pattern
didn't match**. This is deliberate. An earlier version used plain `.replace()`
and a whitespace mismatch silently produced a bundle that threw on load. If the
build fails with `no-op replacement -> <label>`, the source changed in a way that
broke that pattern — fix the pattern in `build-embed.js`, don't remove the
assertion.

### Mount and config

The bundle self-mounts into `#charter-quote` or any `[data-charter-quote]`
element on DOMContentLoaded. `mount()` is idempotent. Config comes from data
attributes: `data-webflow-form`, `data-webhook`, `data-bg`, `data-bg-deep`,
`data-accent`, `data-font`, `data-font-url`, `data-pax`, `data-max-legs`,
`data-ref-prefix`.

On success it dispatches `charterQuote:submitted` on `window` with
`{reference, payload}`.

---

## Workflow

```bash
npm install                  # jsdom, for the test
node build-embed.js          # regenerate charter-quote.js
node test-widget.js          # 40 checks, exits non-zero on failure
```

To iterate on design, open `charter-quote-multistep.html` in a browser directly —
it's standalone and needs no build.

Release cycle:

```bash
node build-embed.js && node test-widget.js
git add -A && git commit -m "..."
git tag v1.1.0 && git push origin main --tags
```

Then update the version in the Webflow embed's script URL. **Tell Gavin to do
this** — a new tag does nothing until Webflow points at it.

---

## GitHub setup (first time)

You can do this with the `gh` CLI. Ask Gavin to run `gh auth login` first if it
isn't authenticated.

```bash
gh repo create charter-widget --public --source=. --remote=origin
git add -A
git commit -m "Charter quote widget"
git push -u origin main
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

The repo **must be public** — jsDelivr can't serve from private repos.

Then construct the CDN URL:

```
https://cdn.jsdelivr.net/gh/<github-username>/charter-widget@v1.0.0/charter-quote.js
```

Verify it resolves before handing it over. jsDelivr can take a minute or two
after a release to pick up a new tag:

```bash
curl -sI "https://cdn.jsdelivr.net/gh/USER/charter-widget@v1.0.0/charter-quote.js" | head -1
```

---

## Webflow setup

**You cannot do these steps.** They happen in the Webflow Designer in a browser.
Give Gavin the exact snippet and the click path; don't claim to have done it.

If a Webflow MCP connector is available in this session you may be able to read
site or page structure, but treat publishing and Designer edits as manual.

1. Open the page in the Designer.
2. Drag a **Code Embed** element to where the form should sit.
3. Paste, substituting the real username, tag, and webhook:

```html
<div id="charter-quote"
     data-webhook="https://hook.us1.make.com/REAL-WEBHOOK-ID"></div>
<script src="https://cdn.jsdelivr.net/gh/USER/charter-widget@v1.0.0/charter-quote.js" defer></script>
```

4. Save, then **Publish** — Code Embeds don't execute in the Designer canvas or
   in Preview. It only runs on the published site.
5. Test on the published URL.

To test before wiring up Make, omit `data-webhook` entirely. The widget shows the
JSON payload on screen instead of sending.

**Fonts.** The widget inherits the page font, so Gilroy works with no config
provided Gilroy is loaded on the Webflow site and cascades to the embed's
location. If it doesn't, either add `data-font="Gilroy, sans-serif"` to the mount
div, or get the `@font-face` into Webflow's site-wide custom code.

---

## Make webhook setup

Gavin does this in Make's browser UI.

1. New scenario, trigger = **Custom webhook**, copy the generated URL.
2. Paste it into `data-webhook` in the Webflow embed and republish.
3. Submit the live form once so Make can learn the payload structure.
4. Add an **Iterator** on `trip.legs` if the notification should list each leg.
5. Route to whatever the client will actually watch — Slack or SMS beats email
   here, since first responder usually wins the booking.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Nothing renders on the published page | Mount div id isn't `charter-quote`, or the script 404s. Check the CDN URL in the browser's network tab. |
| Works in Designer preview only, or not at all in Designer | Expected. Code Embeds only run on the published site. |
| Old version still loading after a push | jsDelivr cached the tag. Cut a new tag and update the embed URL. Never use `@main`. |
| Widget renders but font is wrong | Gilroy isn't reaching the embed. Add `data-font`, or fix the site-wide font loading. |
| Whole Webflow page turns blue, or layout breaks | CSS scoping regressed. Run `node test-widget.js` — the scoping checks will catch it. |
| Build throws `no-op replacement -> X` | A source edit broke that transform's pattern. Fix the pattern in `build-embed.js`. |
| Form submits but nothing arrives in Make | Preview mode — `data-webhook` is missing or empty on the mount div. |
| Webflow bridge: submit hangs, then times out | A field in the hidden Webflow form is marked **required**, or reCAPTCHA is on it. Browser validation blocks a hidden form and can't show the error. |
| Webflow bridge: some fields arrive blank | Designer field name doesn't match `webflowFields()`. The console logs exactly which names it couldn't find. |
| Two widgets on one page conflict | Not supported. The markup uses ids. One instance per page. |
| Webflow bridge: every submission fails, whatever the widget does | **Submit the site's own untouched Webflow form first.** If that fails too, it is not this code — see below. |

---

## Resolved: Webflow's spam protection broke every form on the site

**Cause and fix, confirmed on the live site in August 2026: Webflow's spam
protection (Cloudflare Turnstile) was enabled and Turnstile would not render.
Turning spam protection off in Site Settings → Forms fixed it outright.**

Before / after, same v1.1.0 bundle, measured in the browser:

```
spam protection ON     no request sent at all; form block stuck on
                       w-form-loading; nothing after 53s
                       (and when a token did once appear: HTTP 422 after 62.9s)

spam protection OFF    HTTP 200 {"msg":"ok","code":200} in 602ms
```

Every form carried `data-turnstile-sitekey="0x4AAAAAAA…"`, Cloudflare's
`api.js` loaded fine, and **zero** Turnstile widgets ever rendered. Rendering
that sitekey by hand into a visible 320×80 box produced a container but no
challenge iframe and no token — the signature of a sitekey not valid for the
hostname. Webflow's handler then waits forever for a token and never sends.

### The lesson worth keeping

**Submit the site's own untouched Webflow form before suspecting this code.**
Clicking the plain "Inquire" form's real submit button reproduced the failure
exactly — no widget involved. That one test separates "the bridge is broken"
from "the site can't submit anything", and it would have saved v1.2.0 through
v1.6.2, all of which were client-side fixes for a site-level fault:

| tag | what it chased |
|---|---|
| v1.2.1 | form states already visible in the Designer |
| v1.3.0 | Designer field constraints on a hidden form |
| v1.4.0 | HTTP status instead of Webflow's DOM state |
| v1.5.0–v1.5.2 | Turnstile token timing; hiding the form block |
| v1.6.0 | parking the form off-screen so Turnstile can render |
| v1.6.1–v1.6.2 | submit-then-wait ordering; wall-clock timeouts |

Those tags are still in the history. Two of the ideas in them are genuinely
right and worth taking back if this bridge is ever rebuilt: deciding the
outcome from the **HTTP status** rather than Webflow's DOM, and measuring
timeouts against `Date.now()` rather than counting interval ticks.

### If spam protection has to go back on

Turnstile cannot run inside a `display:none` subtree, so the Designer
instruction to hide the Form Block and a working Turnstile are incompatible.
v1.6.0's `parkWebflowPlumbing()` — move the block to `<body>`, park it
off-screen with `!important` — is the approach that satisfies both.

---

## Extending

**More airports.** Add lines to `AIRPORT_DATA` in the HTML source in
`ICAO|IATA|Name|City, region|Country` form, then rebuild. For global coverage,
the OurAirports dataset is public domain; filter to fields with a code and a
runway long enough for the client's fleet.

**Instant pricing.** Would need a real pricing API (Aviapages has a flight time
and cost calculator) plus the client's own pricing rules. Don't build this
speculatively — showing a number the client won't honour is worse than showing
none. Confirm with Gavin first.

**More fields.** Add markup in the relevant `<section class="cq-step">`, then add
the field to `buildPayload()`. If it's required, add it to `validateStep()`. If
it should appear on the Review step, add it to `paintReview()`. Then add a case
to `test-widget.js`.
