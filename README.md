# Charter quote form — Webflow setup

`charter-quote.js` is ~70 KB, which is over Webflow's 50,000-character Code Embed
limit. It isn't meant to go *in* the embed — host the file and reference it. The
embed block ends up at about 200 characters.

## 1. Host the file

Any of these work. Pick one:

| Host | Good for | Notes |
|---|---|---|
| **GitHub + jsDelivr** | Most projects | Free, versioned, global CDN, no account beyond GitHub |
| **Cloudflare Pages / Netlify** | If you already use one | Free tier, drag-and-drop deploy |
| **Client's own domain** | Agencies who want no third-party dependency | Needs somewhere to put a static file |
| **Webflow Cloud** | Keeping everything in Webflow | Newer, GitHub-connected |

Webflow's own Asset manager won't take a `.js` file, so it can't host this.

### GitHub + jsDelivr (recommended)

1. Create a public repo, e.g. `charter-widget`.
2. Commit `charter-quote.js` to it.
3. Tag a release, e.g. `v1.0.0`.
4. Your URL is:

```
https://cdn.jsdelivr.net/gh/YOUR-USER/charter-widget@v1.0.0/charter-quote.js
```

**Pin the version tag.** Using `@main` means jsDelivr caches aggressively and
your edits may not appear for hours. Tag a new release and bump the URL when you
change the widget — that also gives the client a rollback path.

## 2. Add the Code Embed in Webflow

Drop a Code Embed element where the form should appear and paste:

```html
<div id="charter-quote"
     data-webhook="https://hook.us1.make.com/YOUR-WEBHOOK-ID"></div>
<script src="https://cdn.jsdelivr.net/gh/YOUR-USER/charter-widget@v1.0.0/charter-quote.js" defer></script>
```

That's it. No iframe, no height messaging.

Leave `data-webhook` off entirely to run in preview mode — the widget shows the
JSON payload on screen instead of sending it, so you can check the shape before
wiring up Make.

## 3. Where submissions go

Two options. Pick one.

### Option A — native Webflow form (no webhook, no Make)

Submissions land in Webflow's own **Form Submissions** panel and set off
Webflow's notification email. Nothing else to sign up for.

Add a normal Form Block to the page, name it `Charter Quote`, and give it a
plain text field for each of these — the **field name in Designer must match
exactly**, because that's what the widget looks for:

```
Reference   Trip-Type   Itinerary   Dates-Flexible   Passengers
Aircraft    Baggage     Pets        Catering         Ground-Transport
Name        Email       Phone       Booking-For      SMS-Consent
Notes       Page-URL
```

There's one **optional** extra field, `Payload`, holding a compact JSON copy of
the submission. Add it only if something downstream needs to parse the data —
it's not needed for reading quotes in Webflow, and it's the field most likely
to run into the length limit below.

Then leave the Form Block **visible** in the Designer and point the widget at
it:

```html
<div id="charter-quote" data-webflow-form="Charter Quote"></div>
<script src="https://cdn.jsdelivr.net/gh/YOUR-USER/mj-private-travel@v1.6.0/charter-quote.js" defer></script>
```

The widget takes the form off the page for you: on load it moves the whole Form
Block to the end of `<body>` and parks it far off-screen, so nobody ever sees
it. Then it fills the fields in and submits it, and decides success or failure
from the status Webflow's own request comes back with.

**Don't set the Form Block's display to none yourself.** Webflow protects forms
with Cloudflare Turnstile, and Turnstile refuses to run inside a hidden
element — so a hidden form never gets its spam-check token and Webflow rejects
every submission with a 422. Off-screen works; hidden does not. If some parent
section on the page is hidden, the widget's move to `<body>` gets the form out
of it, but it's cleaner not to nest it in one.

Two more things to get right:

- **Make `Itinerary` and `Notes` textareas**, not single-line inputs.
  Multi-city trips put one leg per line in `Itinerary`.
- **Leave the form in its normal state** when you publish — not showing the
  success or error message. Field-level `required` flags are harmless; the
  widget strips them, having already validated everything the customer typed.

### Webflow's field length limit

Webflow rejects the whole submission if any single field value is too long —
and it gives no useful reason, just its generic error. A 774-character value
was enough to trigger it in testing.

So the widget caps everything it writes at **500 characters**, adding ` […]` to
anything it trims, and logs which field it trimmed to the browser console. A
customer writing an essay in the notes box can no longer sink their own quote
request.

The `Payload` field follows the same rule: it's dropped rather than truncated,
since half a JSON object is worth nothing. On long multi-city trips it will
come through blank by design — `Itinerary` still lists every leg.

Webflow also caps *how many* submissions you can receive, by site plan. Check
that before launch if volume matters.

### Option B — webhook to Make / Zapier

```html
<div id="charter-quote"
     data-webhook="https://hook.us1.make.com/YOUR-WEBHOOK-ID"></div>
```

More flexible — route to Slack, SMS, a CRM. Costs another subscription and
another thing to maintain.

If both attributes are set, `data-webflow-form` wins.

## 4. Configuration

All config is on the mount div, so you never edit the hosted JS to change a
setting:

| Attribute | Default | What it does |
|---|---|---|
| `data-webflow-form` | *(empty)* | Name of a Webflow form to fill and submit. Takes precedence over `data-webhook`. |
| `data-webhook` | *(empty)* | Where submissions POST. Empty (and no form) = preview mode. |
| `data-bg` | `#265ABE` | Panel tint. The frosted surface is mixed from this. |
| `data-bg-deep` | `#1B4593` | Dropdown and recessed surfaces |
| `data-accent` | `#FFB627` | Progress, active route line, focus rings |
| `data-max-width` | `100%` | Caps the panel width. Leave off for full width. |
| `data-radius` | `12px` | The panel's corner radius |
| `data-blur` | `18px` | Frosted glass blur strength |
| `data-font` | *(inherits)* | Font override. Leave off to inherit the page. |
| `data-font-url` | *(empty)* | Stylesheet URL to load a webfont |
| `data-pax` | `2` | Starting passenger count |
| `data-max-legs` | `6` | Cap on multi-city legs |
| `data-ref-prefix` | `CQ` | Prefix on the reference number |

## The frosted panel

The panel is translucent with a `backdrop-filter` blur, so **it only looks
frosted if there is something behind it to frost.** Put the Code Embed over a
section with a photograph or a gradient. Over a flat colour it just reads as a
slightly lighter block — the effect isn't broken, there's simply nothing to
blur.

It runs full width of whatever container it sits in. For an edge-to-edge panel
the embed needs to be in a full-width section, not inside Webflow's default
`Container`. To cap it instead, use `data-max-width="700px"`.

Height is content-driven and always has been — the panel grows as legs are
added and shrinks on the success screen. Don't set a height on the embed or its
parent.

Browsers without `backdrop-filter` fall back to the solid brand blue rather
than a washed-out translucent panel.

## Fonts

The widget sets `--font-sans: inherit`, so it picks up whatever font Webflow
applies to the page. If Gilroy is loaded on the site, the widget uses Gilroy
with no configuration.

Two cases where you need to intervene:

- Webflow's body font doesn't cascade to where the widget sits →
  `data-font="Gilroy, sans-serif"`
- Gilroy isn't loaded on the page at all → add the `@font-face` or Adobe kit to
  Webflow's site-wide custom code, which is where it belongs anyway

## Reacting to submissions on the page

The widget fires a `charterQuote:submitted` event on `window`:

```html
<script>
window.addEventListener("charterQuote:submitted", function (e) {
  // e.detail.reference — e.g. "CQ-260809-AEF6"
  // e.detail.payload   — the full submission object
  if (window.dataLayer) {
    window.dataLayer.push({ event: "quote_request", reference: e.detail.reference });
  }
});
</script>
```

Useful for GA4 conversions, Meta pixel, or a redirect to a thank-you page.

## Payload shape

```json
{
  "submittedAt": "2026-08-09T18:40:00.000Z",
  "reference": "CQ-260809-AEF6",
  "trip": {
    "type": "oneway",
    "datesFlexible": false,
    "legs": [
      {
        "sequence": 1,
        "fromIcao": "KTEB", "fromIata": "TEB",
        "fromName": "Teterboro", "fromCity": "Teterboro, NJ",
        "toIcao": "KPBI", "toIata": "PBI",
        "toName": "Palm Beach Intl", "toCity": "West Palm Beach, FL",
        "date": "2026-09-14", "time": null
      }
    ]
  },
  "passengers": 4,
  "aircraftPreference": "Midsize jet",
  "baggage": "Golf clubs",
  "pets": false,
  "cateringRequested": true,
  "groundTransportRequested": false,
  "contact": {
    "name": "...", "email": "...", "phone": "...",
    "bookingFor": "Myself", "smsConsent": true
  },
  "notes": "",
  "source": { "pageUrl": "...", "userAgent": "..." }
}
```

`trip.legs` is an array, so multi-city trips don't produce ragged columns. In
Make, parse the JSON once and iterate the legs.

## Rebuilding

`charter-quote-multistep.html` is the source you edit — it opens directly in a
browser for fast iteration. When you're happy with it:

```
node build-embed.js
```

That regenerates `charter-quote.js` — it scopes the CSS so nothing leaks onto
the Webflow page, switches the font to inherit, and wraps everything in a
self-mounting bundle. Every transform asserts, so the build fails loudly rather
than shipping a broken file.

## Adding airports

The list holds 454 business-aviation fields. To extend it, add lines to
`AIRPORT_DATA` in the HTML source in this format and rebuild:

```
ICAO|IATA|Name|City, region|Country
```

For worldwide coverage, the OurAirports dataset is public domain and converts
into this shape with a short script.
