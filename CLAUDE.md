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
   by `itineraryText()` since a native form can't hold an array.

   **Webflow rejects the entire submission if one field value is too long**,
   with only its generic error to show for it — a 774-character value did it in
   production. Everything written is therefore capped at `WF_FIELD_MAX` (500)
   and marked with ` […]`. The `Payload` field is listed in `WF_OPTIONAL`: it
   carries a trimmed JSON copy from `compactJson()`, is dropped rather than
   truncated when it won't fit, and produces no warning when the Designer form
   omits it. Don't reintroduce the full payload here.

   The outcome is decided by the **HTTP status** of Webflow's own form request,
   which `watchWebflowRequest()` observes without altering. `.w-form-done` and
   `.w-form-fail` are only a fallback for the case where Webflow stops using
   XHR; detection there reads the **inline** `display` Webflow sets, and
   baselines whichever state was already visible when the page was published.

   **The Webflow form must stay rendered.** `parkWebflowPlumbing()` moves the
   whole `.w-form` block to `<body>` and parks it off-screen with `!important`,
   rather than hiding it. Turnstile will not run inside a `display:none`
   subtree. Don't go back to `display:none`, and don't call
   `turnstile.execute()` to hurry it along — executing it renders the
   challenge, which is exactly what must stay unseen.

   **Submit first; don't wait for a spam-check token.** Measured on the live
   site with the browser: Webflow does not render Turnstile on page load at
   all — there is no widget and no token 90 seconds in. It renders the
   challenge *in response to a submit*. So a pre-submit wait can only run out
   the clock on a token nothing has asked for yet. `attempt()` fires straight
   away; `whenSpamTokenReady()` is only used **after** a 422, to wait for the
   token that the rejected attempt provoked. Reversing this is what made
   v1.5.x take 8s per attempt and still fail. `MAX_ATTEMPTS` is 3.

   **Measure waits with the clock, not by counting ticks.** Every timeout uses
   `since(t0)` against `Date.now()`. A background tab clamps `setInterval` to
   ~1/second, so the old `waited += 150` turned an 8s wait into nearly a
   minute for anyone who switched tabs mid-form. `SUBMIT_DEADLINE` (45s) is a
   backstop so the button can never spin forever if an attempt neither answers
   nor times out.

2. **Webhook** (`CONFIG.webhookUrl`). POSTs the JSON payload.
3. **Preview mode** (neither set). Shows the payload on screen instead of
   sending. This is the default and is how you test without either configured.

### The build

`build-embed.js` splits the HTML into CSS, markup, and JS, then applies targeted
transforms so the widget can live inside someone else's page:

- **Panel surface.** The build injects its own `.cq { background: var(--bg) }`
  in place of the `html, body` rule. The source's `.cq` panel rule comes later
  and overrides it with `var(--panel)` — the frosted translucent surface. If
  you ever reorder these, the panel silently goes back to solid blue; the test
  asserts the frosted declaration still wins.
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
| Webflow bridge: "That didn't send" every time | Webflow returned an error. Set `data-debug="true"` on the mount div to put the status on screen. **HTTP 422 `"Could not process the form submission. Please contact the site owner"` almost always means the site plan's form submission limit is used up** — the free Starter plan allows 50 lifetime submissions and never resets. Confirmed on this site in Aug 2026 after ~50 test submissions: the endpoint took 63s to answer and returned 422 with no spam-check widget involved at all. Check Site Settings → Forms first. Only then look at spam protection or an over-long field value (`WF_FIELD_MAX`). |
| Webflow bridge: some fields arrive blank | Designer field name doesn't match `webflowFields()`. The console logs exactly which names it couldn't find. |
| Two widgets on one page conflict | Not supported. The markup uses ids. One instance per page. |

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
