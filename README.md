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
Notes       Page-URL    Payload
```

Then set the Form Block's display to **none** in the Designer, and point the
widget at it:

```html
<div id="charter-quote" data-webflow-form="Charter Quote"></div>
<script src="https://cdn.jsdelivr.net/gh/YOUR-USER/mj-private-travel@v1.10.0/charter-quote.js" defer></script>
```

The widget fills the hidden form in and submits it for you. It waits for
Webflow's own success confirmation before showing the success panel, so a
rejected submission shows an error rather than a false "thank you".

Three things to get right:

- **Don't mark any field required.** The form is hidden, so a browser
  validation error on it can't be seen or dismissed — the submit just dies.
- **Don't add reCAPTCHA** to this form. It can't be solved from a hidden form.
- **Make `Itinerary`, `Notes`, and `Payload` textareas**, not single-line
  inputs. Multi-city trips put one leg per line in `Itinerary`, and `Payload`
  holds the full JSON as a backstop.

Webflow caps form submissions by plan — check the site plan before launch if
volume matters. `Payload` means no submission ever loses detail even if you
skip some of the individual fields.

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
| `data-bg` | `#265ABE` | Panel background |
| `data-bg-deep` | `#1B4593` | Dropdown and recessed surfaces |
| `data-accent` | `#FFB627` | Progress, active route line, focus rings |
| `data-max-width` | `100%` | Caps the panel width. Leave off for full width. |
| `data-pad` | `1.5em` | Panel padding. Scales both axes, keeping the 1:1.33 ratio. |
| `data-pad-x` | *(derived)* | Horizontal padding on its own. Breaks the ratio. |
| `data-pad-y` | *(derived)* | Vertical padding on its own. Breaks the ratio. |
| `data-gap` | `0` | Space *outside* the panel. Off by default — the panel runs flush. |
| `data-font` | *(inherits)* | Font override. Leave off to inherit the page. |
| `data-font-url` | *(empty)* | Stylesheet URL to load a webfont |
| `data-pax` | `2` | Starting passenger count |
| `data-max-legs` | `6` | Cap on multi-city legs |
| `data-ref-prefix` | `CQ` | Prefix on the reference number |

## Panel width and spacing

The widget runs the **full width of whatever container it sits in**, with no
outer margin — it sits flush to its container. For an edge-to-edge panel, put
the Code Embed in a full-width section rather than inside Webflow's default
`Container`, which caps at 940px and will cap the widget with it.

Padding follows **the site's own buttons**, which sit at `1.5em` vertical /
`2em` horizontal — tighter top-to-bottom than side-to-side, a 1 : 1.33 ratio.
At the panel's 15px type that computes to **22.5px vertical, 30px horizontal**.

The ratio lives in the CSS rather than in the numbers:

```css
--pad:   1.5em;                      /* vertical measure */
--pad-y: var(--pad);
--pad-x: calc(var(--pad) * 4 / 3);   /* 2em — the buttons' proportion */
```

So `data-pad` **scales the padding without flattening the ratio**:

```html
<div id="charter-quote" data-pad="2.25em"></div>   <!-- 33.75px / 45px -->
```

Reach for `data-pad-x` / `data-pad-y` only when you want to break the ratio
deliberately.

`data-gap` holds the panel off its container's edges. It's **subtracted from the
width, not added to it**, so raising it can never cause a horizontal scroll.

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
