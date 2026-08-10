/*!
 * Charter quote request - embeddable multistep form.
 * Host this file, then add a mount div and one script tag to a
 * Webflow Code Embed. Config lives on the div's data attributes.
 */
(function () {
  "use strict";

  var CSS = "\n  /* ============================================================\n     THEME TOKENS\n     Everything visual derives from this block.\n     ============================================================ */\n  .cq {\n    --bg:        #265ABE;   /* brand blue — the tint, and the solid discs on the track */\n    --bg-deep:   #1B4593;   /* dropdowns and recessed surfaces — stays opaque, for legibility */\n\n    /* The frosted panel. Declared twice on purpose: browsers without\n       color-mix() keep the literal rgba and still get a sane panel. */\n    --panel:     rgba(38, 90, 190, .58);\n    --panel:     color-mix(in srgb, var(--bg) 58%, transparent);\n    --blur:      18px;\n\n    --on-bg:     #FFFFFF;   /* primary text */\n    --on-bg-mid: rgba(255,255,255,.85);  /* labels, helper copy */\n    --on-bg-low: rgba(255,255,255,.50);  /* placeholders */\n    --line:      rgba(255,255,255,.26);  /* field borders, rules */\n    --line-soft: rgba(255,255,255,.14);\n    --fill:      rgba(255,255,255,.08);  /* field interiors */\n    --fill-hi:   rgba(255,255,255,.16);  /* hover */\n    --signal:    #FFB627;   /* avionics amber — progress, live route */\n    --alert:     #FFC9C2;\n\n    --font-sans: inherit;   /* inherits the page font — set data-font to override */\n    --font-code: var(--font-sans);   /* point at a mono face if you prefer */\n\n    --radius: 5px;          /* fields, buttons, small surfaces */\n    --panel-radius: 12px;   /* the panel's own corners — set data-radius to change */\n    --max: 100%;            /* full width — set data-max-width to cap it */\n  }\n\n  .cq, .cq *, .cq *::before, .cq *::after { box-sizing: border-box; }\n\n  /* Standalone preview only — the build strips this rule entirely. The\n     gradient exists so the frosted panel has something to frost while you\n     iterate; on Webflow it's the page behind the embed that shows through. */\n  .cq {\n    background: var(--bg);\n    color: var(--on-bg);\n    -webkit-font-smoothing: antialiased;\n  }\n\n  .cq {\n    max-width: var(--max);\n    margin: 0 auto;\n    padding: 30px 22px 34px;\n    font-size: 15px;\n    line-height: 1.5;\n\n    /* Frosted glass. Height stays content-driven — never set one here, the\n       panel has to grow as legs are added and shrink on the success screen. */\n    background: var(--panel);\n    -webkit-backdrop-filter: blur(var(--blur)) saturate(150%);\n    backdrop-filter: blur(var(--blur)) saturate(150%);\n    border: 1px solid var(--line-soft);\n    border-radius: var(--panel-radius);\n  }\n\n  /* No backdrop-filter means nothing gets frosted and the panel would just\n     read as washed out. Fall back to the solid brand blue instead. */\n  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n    .cq { background: var(--bg); }\n  }\n\n  /* ============================================================\n     THE STEPPER — a flight path, not a progress bar.\n     The aircraft advances along the route as steps complete.\n     ============================================================ */\n  .cq-track { position: relative; padding: 0 0 34px; margin-bottom: 26px; }\n\n  .cq-track-line {\n    position: relative;\n    height: 2px;\n    background: var(--line-soft);\n    margin: 0 6%;\n  }\n  .cq-track-fill {\n    position: absolute; inset: 0 auto 0 0;\n    background: var(--signal);\n    width: 0%;\n    transition: width .55s cubic-bezier(.3,.9,.25,1);\n  }\n\n  .cq-track-plane {\n    position: absolute;\n    top: 50%;\n    left: 0;\n    width: 26px; height: 26px;\n    margin: -13px 0 0 -13px;\n    color: var(--signal);\n    background: var(--bg);\n    padding: 4px;\n    border-radius: 50%;\n    transition: left .55s cubic-bezier(.3,.9,.25,1);\n  }\n  .cq-track-plane svg { width: 100%; height: 100%; display: block; transform: rotate(90deg); }\n\n  .cq-track-nodes {\n    position: absolute;\n    left: 6%; right: 6%;\n    top: 0;\n    display: flex;\n    justify-content: space-between;\n  }\n  .cq-node {\n    position: relative;\n    width: 0;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n  }\n  .cq-node::before {\n    content: \"\";\n    width: 8px; height: 8px;\n    border-radius: 50%;\n    background: var(--bg);\n    border: 2px solid var(--line);\n    margin-top: -3px;\n    transition: border-color .3s, background .3s;\n  }\n  .cq-node.is-done::before { border-color: var(--signal); background: var(--signal); }\n  .cq-node.is-now::before  { border-color: var(--signal); background: var(--bg); }\n  .cq-node span {\n    position: absolute;\n    top: 16px;\n    white-space: nowrap;\n    font-size: 10.5px;\n    letter-spacing: .1em;\n    text-transform: uppercase;\n    color: var(--on-bg-low);\n    transition: color .3s;\n  }\n  .cq-node.is-now span, .cq-node.is-done span { color: var(--on-bg-mid); }\n  .cq-node:first-child span { left: -2px; }\n  .cq-node:last-child span  { right: -2px; }\n\n  /* ============================================================\n     STEP PANELS\n     ============================================================ */\n  .cq-step { display: none; animation: cq-slide .32s cubic-bezier(.2,.8,.2,1) both; }\n  .cq-step.is-active { display: block; }\n  @keyframes cq-slide { from { opacity: 0; transform: translateX(14px); } }\n  .cq.is-back .cq-step.is-active { animation-name: cq-slide-back; }\n  @keyframes cq-slide-back { from { opacity: 0; transform: translateX(-14px); } }\n\n  .cq-h {\n    font-size: 21px;\n    font-weight: 600;\n    letter-spacing: -.01em;\n    margin: 0 0 4px;\n  }\n  .cq-sub { color: var(--on-bg-mid); font-size: 13.5px; margin: 0 0 22px; }\n\n  /* ---------- Segmented control ---------- */\n  .cq-seg {\n    display: inline-flex;\n    border: 1px solid var(--line);\n    border-radius: var(--radius);\n    overflow: hidden;\n  }\n  .cq-seg button {\n    appearance: none; border: 0; border-left: 1px solid var(--line);\n    background: transparent; color: var(--on-bg-mid);\n    font-family: var(--font-sans); font-size: 13.5px;\n    padding: 9px 17px; cursor: pointer;\n    transition: background .15s, color .15s;\n  }\n  .cq-seg button:first-child { border-left: 0; }\n  .cq-seg button:hover { background: var(--fill); }\n  .cq-seg button[aria-pressed=\"true\"] { background: var(--on-bg); color: var(--bg); font-weight: 600; }\n\n  /* ---------- Route strip ---------- */\n  .cq-legs { margin-top: 18px; display: flex; flex-direction: column; gap: 12px; }\n\n  .cq-leg {\n    position: relative;\n    background: var(--fill);\n    border: 1px solid var(--line-soft);\n    border-radius: var(--radius);\n    padding: 15px 17px 17px;\n    animation: cq-in .28s ease both;\n  }\n  @keyframes cq-in { from { opacity: 0; transform: translateY(-6px); } }\n\n  .cq-leg-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }\n  .cq-leg-no { font-family: var(--font-code); font-size: 10.5px; letter-spacing: .14em; color: var(--on-bg-low); text-transform: uppercase; }\n  .cq-leg-drop {\n    appearance: none; background: none; border: 0; color: var(--on-bg-low);\n    font-family: var(--font-sans); font-size: 12px; cursor: pointer;\n    padding: 3px 6px; border-radius: var(--radius);\n  }\n  .cq-leg-drop:hover { color: var(--on-bg); background: var(--fill-hi); }\n\n  .cq-route { display: grid; grid-template-columns: 1fr 74px 1fr; align-items: start; gap: 4px; }\n  .cq-port { position: relative; min-width: 0; }\n  .cq-port.is-to { text-align: right; }\n\n  .cq-port input {\n    width: 100%; border: 0; border-bottom: 1.5px solid var(--line);\n    background: transparent; padding: 2px 0 6px;\n    font-family: var(--font-code); font-size: 27px; font-weight: 600;\n    letter-spacing: .06em; color: var(--on-bg); text-transform: uppercase;\n    outline: none; transition: border-color .15s;\n  }\n  .cq-port.is-to input { text-align: right; }\n  .cq-port input::placeholder { color: rgba(255,255,255,.32); font-weight: 500; }\n  .cq-port input:focus { border-bottom-color: var(--signal); }\n  .cq-port.has-error input { border-bottom-color: var(--alert); }\n\n  .cq-port-name {\n    font-size: 11.5px; color: var(--on-bg-mid); margin-top: 6px; min-height: 16px;\n    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n  }\n\n  .cq-path { position: relative; height: 40px; display: flex; align-items: center; justify-content: center; }\n  .cq-path::before {\n    content: \"\"; position: absolute; left: 2px; right: 2px; top: 50%;\n    height: 1px; background: var(--line);\n    transform: scaleX(.25); transform-origin: left center;\n    transition: transform .5s cubic-bezier(.2,.8,.2,1), background .3s;\n  }\n  .cq-leg.is-routed .cq-path::before { transform: scaleX(1); background: var(--signal); }\n  .cq-path svg {\n    position: relative; width: 15px; height: 15px;\n    color: var(--line); padding: 0 6px;\n    transition: color .3s, transform .5s cubic-bezier(.2,.8,.2,1);\n    transform: translateX(-14px);\n  }\n  .cq-leg.is-routed .cq-path svg { color: var(--signal); transform: translateX(0); }\n\n  /* ---------- Fields ---------- */\n  .cq-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }\n  .cq-field { flex: 1 1 180px; min-width: 0; }\n  .cq-field.is-narrow { flex: 0 1 132px; }\n  .cq-field.is-full { flex-basis: 100%; }\n\n  .cq-label { display: block; font-size: 11.5px; letter-spacing: .04em; color: var(--on-bg-mid); margin-bottom: 5px; }\n\n  .cq-input, .cq-select, .cq-area {\n    width: 100%;\n    font-family: var(--font-sans); font-size: 14.5px;\n    color: var(--on-bg); background: var(--fill);\n    border: 1px solid var(--line); border-radius: var(--radius);\n    padding: 10px 12px; outline: none;\n    transition: border-color .15s, box-shadow .15s, background .15s;\n  }\n  .cq-input::placeholder, .cq-area::placeholder { color: var(--on-bg-low); }\n  .cq-area { resize: vertical; min-height: 78px; }\n  .cq-input:hover, .cq-select:hover, .cq-area:hover { background: var(--fill-hi); }\n\n  .cq-select {\n    appearance: none; padding-right: 32px;\n    background-image: url(\"data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4.5L6 8.5L10 4.5' stroke='%23ffffff' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\");\n    background-repeat: no-repeat; background-position: right 11px center; background-size: 12px;\n  }\n  .cq-select option { background: var(--bg-deep); color: #fff; }\n\n  /* date/time pickers need coaxing to show light on a dark field */\n  .cq-input[type=\"date\"], .cq-input[type=\"time\"] { color-scheme: dark; }\n\n  .cq-input:focus, .cq-select:focus, .cq-area:focus {\n    border-color: var(--signal);\n    box-shadow: 0 0 0 3px rgba(255,182,39,.28);\n  }\n  .has-error .cq-input, .has-error .cq-select { border-color: var(--alert); }\n  .cq-err { display: none; color: var(--alert); font-size: 11.5px; margin-top: 4px; }\n  .has-error .cq-err { display: block; }\n\n  /* Passenger stepper */\n  .cq-count { display: flex; align-items: stretch; border: 1px solid var(--line); border-radius: var(--radius); background: var(--fill); }\n  .cq-count button {\n    appearance: none; border: 0; background: none; width: 40px;\n    font-size: 18px; color: var(--on-bg-mid); cursor: pointer; line-height: 1;\n  }\n  .cq-count button:hover:not(:disabled) { color: var(--on-bg); background: var(--fill-hi); }\n  .cq-count button:disabled { opacity: .28; cursor: default; }\n  .cq-count output { flex: 1; text-align: center; align-self: center; font-family: var(--font-code); font-size: 15.5px; font-weight: 600; padding: 10px 0; }\n\n  /* Checkboxes */\n  .cq-checks { display: flex; flex-wrap: wrap; gap: 11px 22px; margin-top: 18px; }\n  .cq-check { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; cursor: pointer; color: var(--on-bg-mid); }\n  .cq-check:hover { color: var(--on-bg); }\n  .cq-check input { margin: 2px 0 0; accent-color: var(--signal); width: 15px; height: 15px; flex: none; }\n  .cq-consent { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line-soft); }\n  .cq-consent .cq-check { font-size: 12px; line-height: 1.45; }\n\n  /* ---------- Airport suggestions ---------- */\n  .cq-sugg {\n    position: absolute; z-index: 40; top: calc(100% + 4px); left: 0; right: 0;\n    background: var(--bg-deep);\n    border: 1px solid var(--line);\n    border-radius: var(--radius);\n    box-shadow: 0 16px 40px -14px rgba(0,0,0,.5);\n    max-height: 244px; overflow-y: auto; display: none; text-align: left;\n  }\n  .cq-sugg.is-open { display: block; }\n  .cq-sugg ul { margin: 0; padding: 0; }\n  .cq-sugg li {\n    list-style: none; padding: 9px 12px;\n    display: flex; align-items: baseline; gap: 10px;\n    cursor: pointer; border-bottom: 1px solid var(--line-soft);\n  }\n  .cq-sugg li:last-child { border-bottom: 0; }\n  .cq-sugg li[aria-selected=\"true\"], .cq-sugg li:hover { background: rgba(255,255,255,.12); }\n  .cq-sugg .code { font-family: var(--font-code); font-size: 13px; font-weight: 700; letter-spacing: .04em; flex: none; width: 44px; }\n  .cq-sugg .place { font-size: 13px; color: var(--on-bg-mid); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .cq-sugg .iata { font-family: var(--font-code); font-size: 10.5px; color: var(--on-bg-low); margin-left: auto; flex: none; }\n  .cq-sugg .cq-empty { padding: 13px; font-size: 13px; color: var(--on-bg-mid); }\n\n  /* ---------- Review step ---------- */\n  .cq-review { border: 1px solid var(--line-soft); border-radius: var(--radius); overflow: hidden; }\n  .cq-review-block { padding: 15px 17px; border-bottom: 1px solid var(--line-soft); }\n  .cq-review-block:last-child { border-bottom: 0; }\n  .cq-review-title { font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--on-bg-low); margin: 0 0 10px; }\n  .cq-review-leg { display: flex; align-items: baseline; gap: 12px; padding: 6px 0; }\n  .cq-review-leg .rt {\n    font-family: var(--font-code); font-size: 17px; font-weight: 600; letter-spacing: .05em;\n    white-space: nowrap; flex: none;\n  }\n  .cq-review-leg .rt em { font-style: normal; color: var(--signal); padding: 0 6px; }\n  .cq-review-leg .rw { font-size: 12.5px; color: var(--on-bg-mid); text-align: right; margin-left: auto; }\n  .cq-review-pairs { display: flex; flex-wrap: wrap; gap: 8px 28px; font-size: 13.5px; }\n  .cq-review-pairs div { color: var(--on-bg-mid); }\n  .cq-review-pairs b { color: var(--on-bg); font-weight: 600; }\n\n  .cq-edit {\n    appearance: none; background: none; border: 0; padding: 0;\n    color: var(--signal); font-family: var(--font-sans); font-size: 12px;\n    cursor: pointer; text-decoration: underline; text-underline-offset: 3px;\n  }\n  .cq-review-head { display: flex; justify-content: space-between; align-items: baseline; }\n\n  /* ---------- Actions ---------- */\n  .cq-add {\n    appearance: none; background: none;\n    border: 1px dashed var(--line); border-radius: var(--radius);\n    color: var(--on-bg-mid); font-family: var(--font-sans); font-size: 13px;\n    padding: 11px; width: 100%; cursor: pointer; margin-top: 12px;\n    transition: border-color .15s, color .15s, background .15s;\n  }\n  .cq-add:hover { border-color: var(--signal); color: var(--signal); background: var(--fill); }\n  .cq-add[hidden] { display: none; }\n\n  .cq-nav { display: flex; gap: 12px; align-items: center; margin-top: 28px; }\n  .cq-back {\n    appearance: none; background: none; border: 1px solid var(--line);\n    border-radius: var(--radius); color: var(--on-bg-mid);\n    font-family: var(--font-sans); font-size: 14.5px; padding: 14px 22px; cursor: pointer;\n    transition: background .15s, color .15s;\n  }\n  .cq-back:hover { background: var(--fill-hi); color: var(--on-bg); }\n  .cq-back[hidden] { display: none; }\n\n  .cq-next {\n    appearance: none; flex: 1; border: 0; border-radius: var(--radius);\n    background: var(--on-bg); color: var(--bg);\n    font-family: var(--font-sans); font-size: 15px; font-weight: 600;\n    padding: 15px; cursor: pointer;\n    transition: background .18s, color .18s, opacity .18s;\n  }\n  .cq-next:hover:not(:disabled) { background: var(--signal); color: var(--bg-deep); }\n  .cq-next:disabled { opacity: .5; cursor: default; }\n\n  .cq-foot { margin-top: 13px; font-size: 11.5px; color: var(--on-bg-low); text-align: center; }\n\n  .cq-formerr {\n    display: none; margin-top: 16px; padding: 11px 14px;\n    border-left: 2px solid var(--alert); background: rgba(0,0,0,.16);\n    font-size: 13px; color: var(--alert);\n  }\n  .cq-formerr.is-open { display: block; }\n\n  /* ---------- Success ---------- */\n  .cq-done { display: none; padding: 40px 0; text-align: center; }\n  .cq-done.is-open { display: block; }\n  .cq-done-mark { width: 44px; height: 44px; margin: 0 auto 20px; color: var(--signal); }\n  .cq-done-mark svg { width: 100%; height: 100%; }\n  .cq-done h2 { font-size: 21px; font-weight: 600; margin: 0 0 10px; }\n  .cq-done p { color: var(--on-bg-mid); font-size: 14px; max-width: 400px; margin: 0 auto 8px; }\n  .cq-ref { font-family: var(--font-code); font-size: 13px; letter-spacing: .08em; color: var(--on-bg); margin-top: 22px; }\n  .cq-debug {\n    text-align: left; margin-top: 26px; font-family: ui-monospace, Menlo, Consolas, monospace;\n    font-size: 11px; background: rgba(0,0,0,.22); padding: 15px; border-radius: var(--radius);\n    max-height: 260px; overflow: auto; white-space: pre-wrap; word-break: break-word; color: var(--on-bg-mid);\n  }\n\n  /* ---------- Access + responsive ---------- */\n  .cq :focus-visible { outline: 2px solid var(--signal); outline-offset: 2px; }\n  .cq-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }\n\n  @media (max-width: 560px) {\n    .cq { padding: 24px 16px 28px; }\n    .cq-route { grid-template-columns: 1fr; gap: 0; }\n    .cq-port.is-to, .cq-port.is-to input { text-align: left; }\n    .cq-port input { font-size: 24px; }\n    .cq-path { height: 34px; justify-content: flex-start; padding-left: 9px; }\n    .cq-path::before {\n      left: 11px; right: auto; top: 0; bottom: 0; height: auto; width: 1px;\n      transform: scaleY(.25); transform-origin: top center;\n    }\n    .cq-leg.is-routed .cq-path::before { transform: scaleY(1); }\n    .cq-path svg, .cq-leg.is-routed .cq-path svg { transform: rotate(90deg); padding: 6px 0; }\n    .cq-node span { font-size: 9.5px; letter-spacing: .06em; }\n    .cq-review-leg { flex-wrap: wrap; }\n    .cq-review-leg .rw { margin-left: 0; text-align: left; width: 100%; }\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .cq, .cq * { animation-duration: .01ms !important; transition-duration: .01ms !important; }\n  }\n";
  var MARKUP = "<div class=\"cq\" id=\"cqRoot\">\n\n  <!-- The stepper: a route line the aircraft advances along -->\n  <div class=\"cq-track\" role=\"group\" aria-label=\"Progress\">\n    <div class=\"cq-track-line\">\n      <div class=\"cq-track-fill\" id=\"cqFill\"></div>\n      <div class=\"cq-track-plane\" id=\"cqPlane\" aria-hidden=\"true\"></div>\n    </div>\n    <div class=\"cq-track-nodes\" id=\"cqNodes\">\n      <div class=\"cq-node\"><span>Trip</span></div>\n      <div class=\"cq-node\"><span>Aircraft</span></div>\n      <div class=\"cq-node\"><span>Contact</span></div>\n      <div class=\"cq-node\"><span>Review</span></div>\n    </div>\n  </div>\n\n  <form id=\"cqForm\" novalidate>\n\n    <!-- ===== STEP 1 — TRIP ===== -->\n    <section class=\"cq-step is-active\" data-step=\"0\">\n      <h2 class=\"cq-h\">Where are you flying?</h2>\n      <p class=\"cq-sub\">Enter an airport code, or search by city.</p>\n\n      <div class=\"cq-seg\" role=\"group\" aria-label=\"Trip type\">\n        <button type=\"button\" data-trip=\"oneway\" aria-pressed=\"true\">One way</button>\n        <button type=\"button\" data-trip=\"return\" aria-pressed=\"false\">Round trip</button>\n        <button type=\"button\" data-trip=\"multi\"  aria-pressed=\"false\">Multi-city</button>\n      </div>\n\n      <div class=\"cq-legs\" id=\"cqLegs\"></div>\n      <button type=\"button\" class=\"cq-add\" id=\"cqAdd\" hidden>Add another leg</button>\n\n      <div class=\"cq-checks\">\n        <label class=\"cq-check\"><input type=\"checkbox\" id=\"cqFlex\"> My dates are flexible</label>\n      </div>\n    </section>\n\n    <!-- ===== STEP 2 — AIRCRAFT ===== -->\n    <section class=\"cq-step\" data-step=\"1\">\n      <h2 class=\"cq-h\">Who and what is on board?</h2>\n      <p class=\"cq-sub\">This shapes which aircraft we quote. Nothing here is binding.</p>\n\n      <div class=\"cq-row\">\n        <div class=\"cq-field is-narrow\">\n          <label class=\"cq-label\" for=\"cqPaxDec\">Passengers</label>\n          <div class=\"cq-count\">\n            <button type=\"button\" id=\"cqPaxDec\" aria-label=\"One fewer passenger\">&minus;</button>\n            <output id=\"cqPax\" aria-live=\"polite\">2</output>\n            <button type=\"button\" id=\"cqPaxInc\" aria-label=\"One more passenger\">+</button>\n          </div>\n        </div>\n        <div class=\"cq-field\">\n          <label class=\"cq-label\" for=\"cqCat\">Aircraft preference</label>\n          <select class=\"cq-select\" id=\"cqCat\">\n            <option value=\"\">No preference — recommend one</option>\n            <option>Turboprop</option>\n            <option>Light jet</option>\n            <option>Midsize jet</option>\n            <option>Super-midsize jet</option>\n            <option>Heavy jet</option>\n            <option>Ultra-long-range</option>\n            <option>Airliner</option>\n          </select>\n        </div>\n        <div class=\"cq-field\">\n          <label class=\"cq-label\" for=\"cqBags\">Baggage</label>\n          <select class=\"cq-select\" id=\"cqBags\">\n            <option value=\"\">Standard carry-on and checked</option>\n            <option>Golf clubs</option>\n            <option>Ski or snowboard equipment</option>\n            <option>Oversized or unusual items</option>\n          </select>\n        </div>\n      </div>\n\n      <div class=\"cq-checks\">\n        <label class=\"cq-check\"><input type=\"checkbox\" id=\"cqPets\"> Travelling with pets</label>\n        <label class=\"cq-check\"><input type=\"checkbox\" id=\"cqCater\"> I'd like catering arranged</label>\n        <label class=\"cq-check\"><input type=\"checkbox\" id=\"cqGround\"> I need ground transport at both ends</label>\n      </div>\n    </section>\n\n    <!-- ===== STEP 3 — CONTACT ===== -->\n    <section class=\"cq-step\" data-step=\"2\">\n      <h2 class=\"cq-h\">Where should we send the quote?</h2>\n      <p class=\"cq-sub\">Quotes move quickly, so we'll reach out by whichever route is fastest.</p>\n\n      <div class=\"cq-row\">\n        <div class=\"cq-field\" data-wrap=\"name\">\n          <label class=\"cq-label\" for=\"cqName\">Full name</label>\n          <input class=\"cq-input\" id=\"cqName\" autocomplete=\"name\">\n          <p class=\"cq-err\">Enter your name.</p>\n        </div>\n        <div class=\"cq-field\" data-wrap=\"email\">\n          <label class=\"cq-label\" for=\"cqEmail\">Email</label>\n          <input class=\"cq-input\" id=\"cqEmail\" type=\"email\" autocomplete=\"email\" inputmode=\"email\">\n          <p class=\"cq-err\">Enter an email we can reply to.</p>\n        </div>\n      </div>\n\n      <div class=\"cq-row\">\n        <div class=\"cq-field\" data-wrap=\"phone\">\n          <label class=\"cq-label\" for=\"cqPhone\">Phone</label>\n          <input class=\"cq-input\" id=\"cqPhone\" type=\"tel\" autocomplete=\"tel\" inputmode=\"tel\">\n          <p class=\"cq-err\">Enter a phone number — we may need to call about availability.</p>\n        </div>\n        <div class=\"cq-field\">\n          <label class=\"cq-label\" for=\"cqBehalf\">Booking for</label>\n          <select class=\"cq-select\" id=\"cqBehalf\">\n            <option>Myself</option>\n            <option>My company</option>\n            <option>A client (travel agent or concierge)</option>\n          </select>\n        </div>\n      </div>\n\n      <div class=\"cq-row\">\n        <div class=\"cq-field is-full\">\n          <label class=\"cq-label\" for=\"cqNotes\">Anything else we should know</label>\n          <textarea class=\"cq-area\" id=\"cqNotes\" placeholder=\"Preferred operator, arrival window, accessibility needs, onboard requests.\"></textarea>\n        </div>\n      </div>\n\n      <div class=\"cq-consent\">\n        <label class=\"cq-check\">\n          <input type=\"checkbox\" id=\"cqSms\">\n          Text me about this request. Message and data rates may apply; reply STOP to opt out.\n        </label>\n      </div>\n\n      <div class=\"cq-hp\" aria-hidden=\"true\">\n        <label>Leave this empty<input type=\"text\" id=\"cqHp\" tabindex=\"-1\" autocomplete=\"off\"></label>\n      </div>\n    </section>\n\n    <!-- ===== STEP 4 — REVIEW ===== -->\n    <section class=\"cq-step\" data-step=\"3\">\n      <h2 class=\"cq-h\">Does this look right?</h2>\n      <p class=\"cq-sub\">Check the itinerary before we price it.</p>\n      <div class=\"cq-review\" id=\"cqReview\"></div>\n    </section>\n\n    <div class=\"cq-formerr\" id=\"cqFormErr\" role=\"alert\"></div>\n\n    <div class=\"cq-nav\">\n      <button type=\"button\" class=\"cq-back\" id=\"cqBack\" hidden>Back</button>\n      <button type=\"submit\" class=\"cq-next\" id=\"cqNext\">Continue</button>\n    </div>\n    <p class=\"cq-foot\" id=\"cqFoot\">Most requests are answered within the hour.</p>\n  </form>\n\n  <!-- ===== SUCCESS ===== -->\n  <div class=\"cq-done\" id=\"cqDone\">\n    <div class=\"cq-done-mark\">\n      <svg viewBox=\"0 0 48 48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n        <circle cx=\"24\" cy=\"24\" r=\"21\" opacity=\".35\"/><path d=\"M15 24.5l6.5 6.5L34 18\"/>\n      </svg>\n    </div>\n    <h2>Request received</h2>\n    <p>A charter specialist is pricing your itinerary now and will be in touch shortly with aircraft options.</p>\n    <p class=\"cq-ref\" id=\"cqRef\"></p>\n    <pre class=\"cq-debug\" id=\"cqDebug\" hidden></pre>\n  </div>\n</div>";
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
    if (D.radius)   root.style.setProperty("--panel-radius", D.radius);
    if (D.blur)     root.style.setProperty("--blur", D.blur);

    (function () {
(function () {
  "use strict";

  /* ============================================================
     CONFIG — the only block you need to edit.
     ============================================================ */
  var D = el.dataset || {};
  var CONFIG = {
    // Where submissions go. Paste a Make or Zapier webhook URL here.
    // Leave empty for preview mode: the payload is shown on screen
    // instead of sent, so you can check its shape before wiring it up.
    webhookUrl: D.webhook || "",

    // Show the raw outcome of a submission on screen. Diagnostic only —
    // set data-debug="true" on the mount div while working out why a
    // submission is failing, and take it off before handing over.
    debug: !!D.debug,

    // Native Webflow form bridge — an alternative to webhookUrl that
    // needs no third-party automation. Name a hidden Webflow form on
    // the page and the widget fills it in and submits it, so entries
    // land in Webflow's own Form Submissions panel and trigger its
    // notification email. Takes precedence over webhookUrl.
    webflowForm: D.webflowForm || "",

    // Gilroy is not a system font and this widget runs in its own
    // document, so the face has to be loaded here too. Paste the
    // stylesheet URL that serves it — an Adobe Fonts kit, the
    // client's self-hosted @font-face CSS, or a Webflow-hosted file.
    // Leave empty and it falls back through the system stack.
    fontUrl: D.fontUrl || "",

    maxLegs: +(D.maxLegs || 6),
    defaultPax: +(D.pax || 2),
    maxPax: 19,
    refPrefix: D.refPrefix || "CQ"
  };

  if (CONFIG.fontUrl) {
    var fl = document.createElement("link");
    fl.rel = "stylesheet";
    fl.href = CONFIG.fontUrl;
    document.head.appendChild(fl);
  }

  /* ============================================================
     AIRPORTS — ICAO|IATA|Name|City, region|Country
     Replace with the full OurAirports set (public domain) in this
     same shape if the client flies outside this list.
     ============================================================ */
  var AIRPORT_DATA = [
    // --- US Northeast ---
    "KTEB|TEB|Teterboro|Teterboro, NJ|US","KHPN|HPN|Westchester County|White Plains, NY|US",
    "KJFK|JFK|John F Kennedy Intl|New York, NY|US","KLGA|LGA|LaGuardia|New York, NY|US",
    "KEWR|EWR|Newark Liberty Intl|Newark, NJ|US","KMMU|MMU|Morristown Municipal|Morristown, NJ|US",
    "KFRG|FRG|Republic|Farmingdale, NY|US","KISP|ISP|Long Island MacArthur|Islip, NY|US",
    "KBDR|BDR|Sikorsky Memorial|Bridgeport, CT|US","KHVN|HVN|Tweed New Haven|New Haven, CT|US",
    "KOXC|OXC|Waterbury-Oxford|Oxford, CT|US","KBDL|BDL|Bradley Intl|Hartford, CT|US",
    "KDXR|DXR|Danbury Municipal|Danbury, CT|US","KGON|GON|Groton-New London|Groton, CT|US",
    "KACK|ACK|Nantucket Memorial|Nantucket, MA|US","KMVY|MVY|Martha's Vineyard|Vineyard Haven, MA|US",
    "KHYA|HYA|Barnstable Municipal|Hyannis, MA|US","KBOS|BOS|Logan Intl|Boston, MA|US",
    "KBED|BED|Hanscom Field|Bedford, MA|US","KOWD|OWD|Norwood Memorial|Norwood, MA|US",
    "KPVD|PVD|T F Green|Providence, RI|US","KALB|ALB|Albany Intl|Albany, NY|US",
    "KSWF|SWF|New York Stewart Intl|Newburgh, NY|US","KPOU|POU|Hudson Valley Regional|Poughkeepsie, NY|US",
    "KPWM|PWM|Portland Intl Jetport|Portland, ME|US","KBGR|BGR|Bangor Intl|Bangor, ME|US",
    "KRKD|RKD|Knox County Regional|Rockland, ME|US","KMHT|MHT|Manchester-Boston|Manchester, NH|US",
    "KLEB|LEB|Lebanon Municipal|Lebanon, NH|US","KBTV|BTV|Burlington Intl|Burlington, VT|US",
    "KPHL|PHL|Philadelphia Intl|Philadelphia, PA|US","KPNE|PNE|Northeast Philadelphia|Philadelphia, PA|US",
    "KILG|ILG|Wilmington|Wilmington, DE|US","KACY|ACY|Atlantic City Intl|Atlantic City, NJ|US",
    "KTTN|TTN|Trenton-Mercer|Trenton, NJ|US","KPIT|PIT|Pittsburgh Intl|Pittsburgh, PA|US",
    "KAGC|AGC|Allegheny County|Pittsburgh, PA|US",
    // --- US Mid-Atlantic ---
    "KIAD|IAD|Washington Dulles|Washington, DC|US","KDCA|DCA|Reagan National|Washington, DC|US",
    "KBWI|BWI|Baltimore/Washington|Baltimore, MD|US","KHEF|MNZ|Manassas Regional|Manassas, VA|US",
    "KJYO|JYO|Leesburg Executive|Leesburg, VA|US","KGAI|GAI|Montgomery County|Gaithersburg, MD|US",
    "KRIC|RIC|Richmond Intl|Richmond, VA|US","KORF|ORF|Norfolk Intl|Norfolk, VA|US",
    // --- US Southeast / Florida ---
    "KPBI|PBI|Palm Beach Intl|West Palm Beach, FL|US","KBCT|BCT|Boca Raton|Boca Raton, FL|US",
    "KFXE|FXE|Fort Lauderdale Executive|Fort Lauderdale, FL|US","KFLL|FLL|Fort Lauderdale-Hollywood|Fort Lauderdale, FL|US",
    "KOPF|OPF|Miami-Opa Locka Executive|Miami, FL|US","KMIA|MIA|Miami Intl|Miami, FL|US",
    "KTMB|TMB|Miami Executive|Miami, FL|US","KAPF|APF|Naples Municipal|Naples, FL|US",
    "KRSW|RSW|Southwest Florida Intl|Fort Myers, FL|US","KSRQ|SRQ|Sarasota-Bradenton|Sarasota, FL|US",
    "KTPA|TPA|Tampa Intl|Tampa, FL|US","KPIE|PIE|St Pete-Clearwater|Clearwater, FL|US",
    "KMCO|MCO|Orlando Intl|Orlando, FL|US","KORL|ORL|Orlando Executive|Orlando, FL|US",
    "KISM|ISM|Kissimmee Gateway|Kissimmee, FL|US","KSFB|SFB|Orlando Sanford|Sanford, FL|US",
    "KDAB|DAB|Daytona Beach Intl|Daytona Beach, FL|US","KJAX|JAX|Jacksonville Intl|Jacksonville, FL|US",
    "KSGJ|UST|Northeast Florida Regional|St Augustine, FL|US","KVRB|VRB|Vero Beach Regional|Vero Beach, FL|US",
    "KSUA|SUA|Witham Field|Stuart, FL|US","KFPR|FPR|St Lucie County|Fort Pierce, FL|US",
    "KEYW|EYW|Key West Intl|Key West, FL|US","KMTH|MTH|Florida Keys Marathon|Marathon, FL|US",
    "KTLH|TLH|Tallahassee Intl|Tallahassee, FL|US","KPNS|PNS|Pensacola Intl|Pensacola, FL|US",
    "KVPS|VPS|Destin-Fort Walton Beach|Destin, FL|US","KECP|ECP|Northwest Florida Beaches|Panama City, FL|US",
    // --- US South ---
    "KSAV|SAV|Savannah/Hilton Head|Savannah, GA|US","KHXD|HHH|Hilton Head|Hilton Head, SC|US",
    "KCHS|CHS|Charleston Intl|Charleston, SC|US","KJZI|JZI|Charleston Executive|Charleston, SC|US",
    "KMYR|MYR|Myrtle Beach Intl|Myrtle Beach, SC|US","KGSP|GSP|Greenville-Spartanburg|Greer, SC|US",
    "KCAE|CAE|Columbia Metropolitan|Columbia, SC|US","KILM|ILM|Wilmington Intl|Wilmington, NC|US",
    "KRDU|RDU|Raleigh-Durham|Raleigh, NC|US","KCLT|CLT|Charlotte Douglas|Charlotte, NC|US",
    "KJQF|USA|Concord-Padgett|Concord, NC|US","KGSO|GSO|Piedmont Triad|Greensboro, NC|US",
    "KAVL|AVL|Asheville Regional|Asheville, NC|US","KATL|ATL|Hartsfield-Jackson|Atlanta, GA|US",
    "KPDK|PDK|DeKalb-Peachtree|Atlanta, GA|US","KFTY|FTY|Fulton County Executive|Atlanta, GA|US",
    "KRYY|RYY|Cobb County Intl|Kennesaw, GA|US","KBHM|BHM|Birmingham-Shuttlesworth|Birmingham, AL|US",
    "KHSV|HSV|Huntsville Intl|Huntsville, AL|US","KBNA|BNA|Nashville Intl|Nashville, TN|US",
    "KMQY|MQY|Smyrna|Smyrna, TN|US","KMEM|MEM|Memphis Intl|Memphis, TN|US",
    "KTYS|TYS|McGhee Tyson|Knoxville, TN|US","KLEX|LEX|Blue Grass|Lexington, KY|US",
    "KSDF|SDF|Louisville Muhammad Ali|Louisville, KY|US","KMSY|MSY|Louis Armstrong|New Orleans, LA|US",
    "KNEW|NEW|Lakefront|New Orleans, LA|US","KBTR|BTR|Baton Rouge Metro|Baton Rouge, LA|US",
    "KJAN|JAN|Jackson-Medgar Evers|Jackson, MS|US","KLIT|LIT|Bill and Hillary Clinton|Little Rock, AR|US",
    // --- US Midwest ---
    "KORD|ORD|O'Hare Intl|Chicago, IL|US","KMDW|MDW|Midway Intl|Chicago, IL|US",
    "KPWK|PWK|Chicago Executive|Wheeling, IL|US","KDPA|DPA|DuPage|West Chicago, IL|US",
    "KUGN|UGN|Waukegan National|Waukegan, IL|US","KARR|ARR|Aurora Municipal|Aurora, IL|US",
    "KMKE|MKE|Milwaukee Mitchell|Milwaukee, WI|US","KMSN|MSN|Dane County Regional|Madison, WI|US",
    "KMSP|MSP|Minneapolis-St Paul|Minneapolis, MN|US","KFCM|FCM|Flying Cloud|Eden Prairie, MN|US",
    "KSTP|STP|St Paul Downtown|St Paul, MN|US","KANE|ANE|Anoka County-Blaine|Minneapolis, MN|US",
    "KDSM|DSM|Des Moines Intl|Des Moines, IA|US","KOMA|OMA|Eppley Airfield|Omaha, NE|US",
    "KMCI|MCI|Kansas City Intl|Kansas City, MO|US","KMKC|MKC|Charles B Wheeler Downtown|Kansas City, MO|US",
    "KOJC|OJC|Johnson County Executive|Olathe, KS|US","KSTL|STL|St Louis Lambert|St Louis, MO|US",
    "KSUS|SUS|Spirit of St Louis|Chesterfield, MO|US","KIND|IND|Indianapolis Intl|Indianapolis, IN|US",
    "KEYE|EYE|Eagle Creek|Indianapolis, IN|US","KDTW|DTW|Detroit Metro|Detroit, MI|US",
    "KPTK|PTK|Oakland County Intl|Pontiac, MI|US","KDET|DET|Coleman A Young|Detroit, MI|US",
    "KYIP|YIP|Willow Run|Detroit, MI|US","KGRR|GRR|Gerald R Ford Intl|Grand Rapids, MI|US",
    "KTVC|TVC|Cherry Capital|Traverse City, MI|US","KCLE|CLE|Cleveland Hopkins|Cleveland, OH|US",
    "KCGF|CGF|Cuyahoga County|Cleveland, OH|US","KCMH|CMH|John Glenn Columbus|Columbus, OH|US",
    "KOSU|OSU|Ohio State University|Columbus, OH|US","KLCK|LCK|Rickenbacker Intl|Columbus, OH|US",
    "KDAY|DAY|Dayton Intl|Dayton, OH|US","KCVG|CVG|Cincinnati/Northern Kentucky|Cincinnati, OH|US",
    "KLUK|LUK|Cincinnati Municipal-Lunken|Cincinnati, OH|US",
    // --- US Mountain West ---
    "KDEN|DEN|Denver Intl|Denver, CO|US","KAPA|APA|Centennial|Englewood, CO|US",
    "KBJC|BJC|Rocky Mountain Metropolitan|Broomfield, CO|US","KEGE|EGE|Eagle County Regional|Vail, CO|US",
    "KASE|ASE|Aspen-Pitkin County|Aspen, CO|US","KSBS|SBS|Steamboat Springs|Steamboat Springs, CO|US",
    "KHDN|HDN|Yampa Valley|Hayden, CO|US","KGUC|GUC|Gunnison-Crested Butte|Gunnison, CO|US",
    "KMTJ|MTJ|Montrose Regional|Montrose, CO|US","KRIL|RIL|Garfield County Regional|Rifle, CO|US",
    "KDRO|DRO|Durango-La Plata|Durango, CO|US","KCOS|COS|Colorado Springs|Colorado Springs, CO|US",
    "KJAC|JAC|Jackson Hole|Jackson, WY|US","KBZN|BZN|Bozeman Yellowstone|Bozeman, MT|US",
    "KMSO|MSO|Missoula Montana|Missoula, MT|US","KSUN|SUN|Friedman Memorial|Hailey, ID|US",
    "KBOI|BOI|Boise Air Terminal|Boise, ID|US","KSLC|SLC|Salt Lake City Intl|Salt Lake City, UT|US",
    "KPVU|PVU|Provo Municipal|Provo, UT|US","KSGU|SGU|St George Regional|St George, UT|US",
    "KHII|HII|Lake Havasu City|Lake Havasu, AZ|US",
    // --- US Southwest ---
    "KLAS|LAS|Harry Reid Intl|Las Vegas, NV|US","KVGT|VGT|North Las Vegas|Las Vegas, NV|US",
    "KHND|HSH|Henderson Executive|Henderson, NV|US","KPHX|PHX|Phoenix Sky Harbor|Phoenix, AZ|US",
    "KSDL|SCF|Scottsdale|Scottsdale, AZ|US","KDVT|DVT|Phoenix Deer Valley|Phoenix, AZ|US",
    "KTUS|TUS|Tucson Intl|Tucson, AZ|US","KSAF|SAF|Santa Fe Regional|Santa Fe, NM|US",
    "KABQ|ABQ|Albuquerque Intl Sunport|Albuquerque, NM|US","KELP|ELP|El Paso Intl|El Paso, TX|US",
    // --- US Texas ---
    "KDFW|DFW|Dallas/Fort Worth|Dallas, TX|US","KDAL|DAL|Dallas Love Field|Dallas, TX|US",
    "KADS|ADS|Addison|Addison, TX|US","KDTO|DTO|Denton Enterprise|Denton, TX|US",
    "KFTW|FTW|Fort Worth Meacham|Fort Worth, TX|US","KAFW|AFW|Fort Worth Alliance|Fort Worth, TX|US",
    "KHOU|HOU|William P Hobby|Houston, TX|US","KIAH|IAH|George Bush Intercontinental|Houston, TX|US",
    "KSGR|SGR|Sugar Land Regional|Houston, TX|US","KEFD|EFD|Ellington Field|Houston, TX|US",
    "KCXO|CXO|Conroe-North Houston|Conroe, TX|US","KAUS|AUS|Austin-Bergstrom|Austin, TX|US",
    "KEDC|EDC|Austin Executive|Austin, TX|US","KSAT|SAT|San Antonio Intl|San Antonio, TX|US",
    "KMAF|MAF|Midland Intl|Midland, TX|US","KCRP|CRP|Corpus Christi Intl|Corpus Christi, TX|US",
    // --- US West Coast ---
    "KLAX|LAX|Los Angeles Intl|Los Angeles, CA|US","KVNY|VNY|Van Nuys|Los Angeles, CA|US",
    "KBUR|BUR|Hollywood Burbank|Burbank, CA|US","KSMO|SMO|Santa Monica Municipal|Santa Monica, CA|US",
    "KLGB|LGB|Long Beach|Long Beach, CA|US","KSNA|SNA|John Wayne|Santa Ana, CA|US",
    "KTOA|TOA|Zamperini Field|Torrance, CA|US","KCMA|CMA|Camarillo|Camarillo, CA|US",
    "KOXR|OXR|Oxnard|Oxnard, CA|US","KSBA|SBA|Santa Barbara Municipal|Santa Barbara, CA|US",
    "KSBP|SBP|San Luis Obispo County|San Luis Obispo, CA|US","KMRY|MRY|Monterey Regional|Monterey, CA|US",
    "KSJC|SJC|Norman Y Mineta San Jose|San Jose, CA|US","KSFO|SFO|San Francisco Intl|San Francisco, CA|US",
    "KOAK|OAK|Oakland Intl|Oakland, CA|US","KHWD|HWD|Hayward Executive|Hayward, CA|US",
    "KPAO|PAO|Palo Alto|Palo Alto, CA|US","KSQL|SQL|San Carlos|San Carlos, CA|US",
    "KCCR|CCR|Buchanan Field|Concord, CA|US","KSTS|STS|Charles M Schulz Sonoma|Santa Rosa, CA|US",
    "KAPC|APC|Napa County|Napa, CA|US","KTVL|TVL|Lake Tahoe|South Lake Tahoe, CA|US",
    "KTRK|TKF|Truckee Tahoe|Truckee, CA|US","KRNO|RNO|Reno-Tahoe Intl|Reno, NV|US",
    "KSMF|SMF|Sacramento Intl|Sacramento, CA|US","KSAC|SAC|Sacramento Executive|Sacramento, CA|US",
    "KFAT|FAT|Fresno Yosemite|Fresno, CA|US","KBFL|BFL|Meadows Field|Bakersfield, CA|US",
    "KPSP|PSP|Palm Springs Intl|Palm Springs, CA|US","KTRM|TRM|Jacqueline Cochran Regional|Thermal, CA|US",
    "KSAN|SAN|San Diego Intl|San Diego, CA|US","KMYF|MYF|Montgomery-Gibbs|San Diego, CA|US",
    "KCRQ|CLD|McClellan-Palomar|Carlsbad, CA|US","KSEE|SEE|Gillespie Field|El Cajon, CA|US",
    "KPDX|PDX|Portland Intl|Portland, OR|US","KHIO|HIO|Portland-Hillsboro|Hillsboro, OR|US",
    "KEUG|EUG|Eugene Airport|Eugene, OR|US","KSEA|SEA|Seattle-Tacoma Intl|Seattle, WA|US",
    "KBFI|BFI|Boeing Field|Seattle, WA|US","KPAE|PAE|Paine Field|Everett, WA|US",
    "KGEG|GEG|Spokane Intl|Spokane, WA|US","PANC|ANC|Ted Stevens Anchorage|Anchorage, AK|US",
    "PHNL|HNL|Daniel K Inouye|Honolulu, HI|US","PHOG|OGG|Kahului|Maui, HI|US",
    "PHKO|KOA|Ellison Onizuka Kona|Kailua-Kona, HI|US","PHLI|LIH|Lihue|Kauai, HI|US",
    // --- Canada ---
    "CYYZ|YYZ|Toronto Pearson|Toronto, ON|CA","CYTZ|YTZ|Billy Bishop Toronto City|Toronto, ON|CA",
    "CYKZ|YKZ|Toronto Buttonville|Toronto, ON|CA","CYUL|YUL|Montreal-Trudeau|Montreal, QC|CA",
    "CYVR|YVR|Vancouver Intl|Vancouver, BC|CA","CYYC|YYC|Calgary Intl|Calgary, AB|CA",
    "CYOW|YOW|Ottawa Macdonald-Cartier|Ottawa, ON|CA","CYEG|YEG|Edmonton Intl|Edmonton, AB|CA",
    "CYQB|YQB|Quebec City Jean Lesage|Quebec City, QC|CA","CYHZ|YHZ|Halifax Stanfield|Halifax, NS|CA",
    "CYLW|YLW|Kelowna Intl|Kelowna, BC|CA","CYYJ|YYJ|Victoria Intl|Victoria, BC|CA",
    // --- Mexico, Caribbean, Latin America ---
    "MMMX|MEX|Mexico City Intl|Mexico City|MX","MMTO|TLC|Toluca Intl|Toluca|MX",
    "MMSD|SJD|Los Cabos Intl|San Jose del Cabo|MX","MMPR|PVR|Puerto Vallarta|Puerto Vallarta|MX",
    "MMUN|CUN|Cancun Intl|Cancun|MX","MMCZ|CZM|Cozumel Intl|Cozumel|MX",
    "MMMY|MTY|Monterrey Intl|Monterrey|MX","MMGL|GDL|Guadalajara Intl|Guadalajara|MX",
    "MYNN|NAS|Lynden Pindling Intl|Nassau|BS","MYEF|GGT|Exuma Intl|Great Exuma|BS",
    "MYAT|TCB|Treasure Cay|Abaco|BS","MYGF|FPO|Grand Bahama Intl|Freeport|BS",
    "MBPV|PLS|Providenciales|Turks and Caicos|TC","MDPC|PUJ|Punta Cana Intl|Punta Cana|DO",
    "MDSD|SDQ|Las Americas Intl|Santo Domingo|DO","MDLR|LRM|La Romana Intl|La Romana|DO",
    "TJSJ|SJU|Luis Munoz Marin|San Juan|PR","TIST|STT|Cyril E King|St Thomas|VI",
    "TISX|STX|Henry E Rohlsen|St Croix|VI","TNCM|SXM|Princess Juliana|St Maarten|SX",
    "TFFJ|SBH|Gustaf III|St Barthelemy|BL","TAPA|ANU|V C Bird Intl|Antigua|AG",
    "TBPB|BGI|Grantley Adams|Barbados|BB","TGPY|GND|Maurice Bishop|Grenada|GD",
    "TNCA|AUA|Queen Beatrix|Aruba|AW","TNCC|CUR|Curacao Intl|Curacao|CW",
    "MKJS|MBJ|Sangster Intl|Montego Bay|JM","MKJP|KIN|Norman Manley|Kingston|JM",
    "MWCR|GCM|Owen Roberts|Grand Cayman|KY","MROC|SJO|Juan Santamaria|San Jose|CR",
    "MRLB|LIR|Daniel Oduber|Liberia|CR","MPTO|PTY|Tocumen Intl|Panama City|PA",
    "SKBO|BOG|El Dorado Intl|Bogota|CO","SPJC|LIM|Jorge Chavez|Lima|PE",
    "SBGL|GIG|Rio de Janeiro-Galeao|Rio de Janeiro|BR","SBSP|CGH|Congonhas|Sao Paulo|BR",
    "SBGR|GRU|Guarulhos Intl|Sao Paulo|BR","SAEZ|EZE|Ministro Pistarini|Buenos Aires|AR",
    "SABE|AEP|Aeroparque Jorge Newbery|Buenos Aires|AR","SCEL|SCL|Arturo Merino Benitez|Santiago|CL",
    // --- UK & Ireland ---
    "EGLL|LHR|Heathrow|London|GB","EGKB|BQH|Biggin Hill|London|GB",
    "EGGW|LTN|Luton|London|GB","EGLF|FAB|Farnborough|London|GB",
    "EGLC|LCY|London City|London|GB","EGSS|STN|Stansted|London|GB",
    "EGKK|LGW|Gatwick|London|GB","EGNX|EMA|East Midlands|Nottingham|GB",
    "EGCC|MAN|Manchester|Manchester|GB","EGPH|EDI|Edinburgh|Edinburgh|GB",
    "EGPF|GLA|Glasgow|Glasgow|GB","EGGD|BRS|Bristol|Bristol|GB",
    "EGJJ|JER|Jersey|Jersey|JE","EGGP|LPL|Liverpool John Lennon|Liverpool|GB",
    "EIDW|DUB|Dublin|Dublin|IE","EINN|SNN|Shannon|Shannon|IE",
    // --- France, Monaco, Switzerland ---
    "LFPB|LBG|Paris-Le Bourget|Paris|FR","LFPG|CDG|Charles de Gaulle|Paris|FR",
    "LFPO|ORY|Paris-Orly|Paris|FR","LFMN|NCE|Nice Cote d'Azur|Nice|FR",
    "LFMD|CEQ|Cannes-Mandelieu|Cannes|FR","LFTZ|LTT|La Mole|Saint-Tropez|FR",
    "LFKJ|AJA|Ajaccio Napoleon Bonaparte|Ajaccio|FR","LFKB|BIA|Bastia-Poretta|Bastia|FR",
    "LFLL|LYS|Lyon-Saint Exupery|Lyon|FR","LFML|MRS|Marseille Provence|Marseille|FR",
    "LFBD|BOD|Bordeaux-Merignac|Bordeaux|FR","LFBO|TLS|Toulouse-Blagnac|Toulouse|FR",
    "LFLB|CMF|Chambery-Savoie|Chambery|FR","LFSB|BSL|EuroAirport Basel-Mulhouse|Basel|CH",
    "LSGG|GVA|Geneva|Geneva|CH","LSZH|ZRH|Zurich|Zurich|CH",
    "LSZS|SMV|Samedan|St Moritz|CH","LSGS|SIR|Sion|Sion|CH",
    "LSZA|LUG|Lugano|Lugano|CH","LSZB|BRN|Bern-Belp|Bern|CH",
    // --- Central & Northern Europe ---
    "LOWW|VIE|Vienna Intl|Vienna|AT","LOWI|INN|Innsbruck|Innsbruck|AT",
    "LOWS|SZG|Salzburg|Salzburg|AT","EDDM|MUC|Munich|Munich|DE",
    "EDDF|FRA|Frankfurt|Frankfurt|DE","EDDB|BER|Berlin Brandenburg|Berlin|DE",
    "EDDL|DUS|Dusseldorf|Dusseldorf|DE","EDDH|HAM|Hamburg|Hamburg|DE",
    "EDDS|STR|Stuttgart|Stuttgart|DE","EDDK|CGN|Cologne Bonn|Cologne|DE",
    "EHAM|AMS|Amsterdam Schiphol|Amsterdam|NL","EHRD|RTM|Rotterdam The Hague|Rotterdam|NL",
    "EBBR|BRU|Brussels|Brussels|BE","EBAW|ANR|Antwerp Intl|Antwerp|BE",
    "ELLX|LUX|Luxembourg|Luxembourg|LU","EKCH|CPH|Copenhagen|Copenhagen|DK",
    "ESSA|ARN|Stockholm Arlanda|Stockholm|SE","ESSB|BMA|Stockholm Bromma|Stockholm|SE",
    "ENGM|OSL|Oslo Gardermoen|Oslo|NO","EFHK|HEL|Helsinki-Vantaa|Helsinki|FI",
    "EPWA|WAW|Warsaw Chopin|Warsaw|PL","LKPR|PRG|Vaclav Havel Prague|Prague|CZ",
    "LHBP|BUD|Budapest Ferenc Liszt|Budapest|HU","LZIB|BTS|Bratislava|Bratislava|SK",
    "BIKF|KEF|Keflavik|Reykjavik|IS","LJLJ|LJU|Ljubljana|Ljubljana|SI",
    "LDZA|ZAG|Zagreb|Zagreb|HR","LDDU|DBV|Dubrovnik|Dubrovnik|HR",
    "LDSP|SPU|Split|Split|HR",
    // --- Italy, Iberia, Greece, Turkey ---
    "LIML|LIN|Milan Linate|Milan|IT","LIMC|MXP|Milan Malpensa|Milan|IT",
    "LIRA|CIA|Rome Ciampino|Rome|IT","LIRF|FCO|Rome Fiumicino|Rome|IT",
    "LIPZ|VCE|Venice Marco Polo|Venice|IT","LIPX|VRN|Verona Villafranca|Verona|IT",
    "LIEO|OLB|Olbia Costa Smeralda|Olbia|IT","LICJ|PMO|Palermo|Palermo|IT",
    "LICC|CTA|Catania Fontanarossa|Catania|IT","LIRN|NAP|Naples Intl|Naples|IT",
    "LIBD|BRI|Bari Karol Wojtyla|Bari|IT","LIEE|CAG|Cagliari Elmas|Cagliari|IT",
    "LIRQ|FLR|Florence Peretola|Florence|IT","LEMD|MAD|Madrid Barajas|Madrid|ES",
    "LEBL|BCN|Barcelona El Prat|Barcelona|ES","LEPA|PMI|Palma de Mallorca|Mallorca|ES",
    "LEIB|IBZ|Ibiza|Ibiza|ES","LEMG|AGP|Malaga-Costa del Sol|Malaga|ES",
    "LEMH|MAH|Menorca|Menorca|ES","LEZL|SVQ|Seville|Seville|ES",
    "GCLP|LPA|Gran Canaria|Las Palmas|ES","GCTS|TFS|Tenerife South|Tenerife|ES",
    "LPPT|LIS|Lisbon Humberto Delgado|Lisbon|PT","LPFR|FAO|Faro|Faro|PT",
    "LPPR|OPO|Porto|Porto|PT","LPMA|FNC|Madeira|Funchal|PT",
    "LGAV|ATH|Athens Eleftherios Venizelos|Athens|GR","LGMK|JMK|Mykonos|Mykonos|GR",
    "LGSR|JTR|Santorini|Santorini|GR","LGKO|KGS|Kos|Kos|GR",
    "LGRP|RHO|Rhodes Diagoras|Rhodes|GR","LGKR|CFU|Corfu Ioannis Kapodistrias|Corfu|GR",
    "LTFM|IST|Istanbul|Istanbul|TR","LTBA|ISL|Istanbul Ataturk|Istanbul|TR",
    "LTAI|AYT|Antalya|Antalya|TR","LTBJ|ADB|Izmir Adnan Menderes|Izmir|TR",
    "LTFE|BJV|Milas-Bodrum|Bodrum|TR",
    // --- Middle East & Africa ---
    "OMDB|DXB|Dubai Intl|Dubai|AE","OMDW|DWC|Al Maktoum Intl|Dubai|AE",
    "OMAA|AUH|Zayed Intl|Abu Dhabi|AE","OMSJ|SHJ|Sharjah Intl|Sharjah|AE",
    "OTHH|DOH|Hamad Intl|Doha|QA","OTBD|XJD|Doha Old Airport|Doha|QA",
    "OBBI|BAH|Bahrain Intl|Manama|BH","OKKK|KWI|Kuwait Intl|Kuwait City|KW",
    "OEJN|JED|King Abdulaziz Intl|Jeddah|SA","OERK|RUH|King Khalid Intl|Riyadh|SA",
    "OEDF|DMM|King Fahd Intl|Dammam|SA","OOMS|MCT|Muscat Intl|Muscat|OM",
    "LLBG|TLV|Ben Gurion|Tel Aviv|IL","OJAI|AMM|Queen Alia Intl|Amman|JO",
    "OLBA|BEY|Beirut-Rafic Hariri|Beirut|LB","HECA|CAI|Cairo Intl|Cairo|EG",
    "HESH|SSH|Sharm El Sheikh|Sharm El Sheikh|EG","HEGN|HRG|Hurghada Intl|Hurghada|EG",
    "GMMN|CMN|Mohammed V Intl|Casablanca|MA","GMMX|RAK|Marrakesh Menara|Marrakesh|MA",
    "GMTT|TNG|Tangier Ibn Battouta|Tangier|MA","DTTA|TUN|Tunis-Carthage|Tunis|TN",
    "HKJK|NBO|Jomo Kenyatta|Nairobi|KE","HTKJ|JRO|Kilimanjaro Intl|Kilimanjaro|TZ",
    "FAOR|JNB|OR Tambo|Johannesburg|ZA","FALA|HLA|Lanseria Intl|Johannesburg|ZA",
    "FACT|CPT|Cape Town Intl|Cape Town|ZA","FSIA|SEZ|Seychelles Intl|Mahe|SC",
    "FIMP|MRU|Sir Seewoosagur Ramgoolam|Mauritius|MU","DNMM|LOS|Murtala Muhammed|Lagos|NG",
    "DIAP|ABJ|Felix Houphouet-Boigny|Abidjan|CI",
    // --- Asia & Pacific ---
    "VRMM|MLE|Velana Intl|Male|MV","VABB|BOM|Chhatrapati Shivaji|Mumbai|IN",
    "VIDP|DEL|Indira Gandhi Intl|Delhi|IN","VOBL|BLR|Kempegowda Intl|Bengaluru|IN",
    "VOMM|MAA|Chennai Intl|Chennai|IN","VTBS|BKK|Suvarnabhumi|Bangkok|TH",
    "VTBD|DMK|Don Mueang|Bangkok|TH","VTSP|HKT|Phuket Intl|Phuket|TH",
    "WSSS|SIN|Singapore Changi|Singapore|SG","WSSL|XSP|Seletar|Singapore|SG",
    "WMKK|KUL|Kuala Lumpur Intl|Kuala Lumpur|MY","WIII|CGK|Soekarno-Hatta|Jakarta|ID",
    "WADD|DPS|Ngurah Rai|Bali|ID","VHHH|HKG|Hong Kong Intl|Hong Kong|HK",
    "ZBAA|PEK|Beijing Capital|Beijing|CN","ZBAD|PKX|Beijing Daxing|Beijing|CN",
    "ZSSS|SHA|Shanghai Hongqiao|Shanghai|CN","ZSPD|PVG|Shanghai Pudong|Shanghai|CN",
    "ZGGG|CAN|Guangzhou Baiyun|Guangzhou|CN","ZGSZ|SZX|Shenzhen Bao'an|Shenzhen|CN",
    "RJTT|HND|Tokyo Haneda|Tokyo|JP","RJAA|NRT|Narita Intl|Tokyo|JP",
    "RJBB|KIX|Kansai Intl|Osaka|JP","RJOO|ITM|Osaka Itami|Osaka|JP",
    "RKSI|ICN|Incheon Intl|Seoul|KR","RKSS|GMP|Gimpo Intl|Seoul|KR",
    "RCTP|TPE|Taoyuan Intl|Taipei|TW","RPLL|MNL|Ninoy Aquino Intl|Manila|PH",
    "YSSY|SYD|Sydney Kingsford Smith|Sydney|AU","YMML|MEL|Melbourne|Melbourne|AU",
    "YBBN|BNE|Brisbane|Brisbane|AU","YPPH|PER|Perth|Perth|AU",
    "YSCB|CBR|Canberra|Canberra|AU","YBCS|CNS|Cairns|Cairns|AU",
    "NZAA|AKL|Auckland|Auckland|NZ","NZQN|ZQN|Queenstown|Queenstown|NZ",
    "NZCH|CHC|Christchurch|Christchurch|NZ","NFFN|NAN|Nadi Intl|Nadi|FJ"
  ];

  var AIRPORTS = AIRPORT_DATA.map(function (row) {
    var p = row.split("|");
    return { icao: p[0], iata: p[1], name: p[2], city: p[3], country: p[4] };
  });

  /* ============================================================
     STATE
     ============================================================ */
  var STEPS = 4;
  var state = { step: 0, tripType: "oneway", legs: [], pax: CONFIG.defaultPax };
  var legSeq = 0;

  function newLeg(from, to) {
    legSeq++;
    return { uid: "L" + legSeq, from: from || null, to: to || null, date: "", time: "" };
  }

  var $ = function (id) { return root.querySelector('[id="' + id + '"]'); };
  var legsEl  = $("cqLegs");
  var addBtn  = $("cqAdd");
  var formEl  = $("cqForm");
  var formErr = $("cqFormErr");
  var nextBtn = $("cqNext");
  var backBtn = $("cqBack");
  var footEl  = $("cqFoot");

  var PLANE =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M21 15.5v-2l-8-5V3.2a1.2 1.2 0 0 0-2.4 0V8.5l-8 5v2l8-2.4v4.6l-2.2 1.6v1.5l3.4-1 3.4 1v-1.5L13 17.7v-4.6l8 2.4z"/></svg>';

  $("cqPlane").innerHTML = PLANE;

  /* ============================================================
     STEP NAVIGATION
     ============================================================ */
  function safeScroll(el, block) {
    if (!el || typeof el.scrollIntoView !== "function") return;
    try { el.scrollIntoView({ behavior: "smooth", block: block }); }
    catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
  }

  function goTo(n, backwards, noScroll) {
    n = Math.max(0, Math.min(STEPS - 1, n));
    state.step = n;
    root.classList.toggle("is-back", !!backwards);

    root.querySelectorAll(".cq-step").forEach(function (s) {
      s.classList.toggle("is-active", +s.dataset.step === n);
    });

    // stepper
    var pct = (n / (STEPS - 1)) * 100;
    $("cqFill").style.width = pct + "%";
    $("cqPlane").style.left = pct + "%";
    root.querySelectorAll(".cq-node").forEach(function (node, i) {
      node.classList.toggle("is-done", i < n);
      node.classList.toggle("is-now", i === n);
    });

    backBtn.hidden = n === 0;
    var last = n === STEPS - 1;
    nextBtn.textContent = last ? "Request a quote" : "Continue";
    footEl.textContent = last
      ? "Most requests are answered within the hour."
      : "Step " + (n + 1) + " of " + STEPS;

    if (last) paintReview();
    formErr.classList.remove("is-open");
    if (!noScroll) safeScroll(root, "start");
    reportHeight();
  }

  backBtn.addEventListener("click", function () { goTo(state.step - 1, true); });

  /* ============================================================
     AIRPORT SEARCH
     ============================================================ */
  function searchAirports(q) {
    q = q.trim().toUpperCase();
    if (!q) return [];
    var exact = [], codePrefix = [], placePrefix = [], contains = [];
    for (var i = 0; i < AIRPORTS.length; i++) {
      var a = AIRPORTS[i];
      if (a.icao === q || a.iata === q) { exact.push(a); continue; }
      if (a.icao.indexOf(q) === 0 || a.iata.indexOf(q) === 0) { codePrefix.push(a); continue; }
      var city = a.city.toUpperCase(), name = a.name.toUpperCase();
      if (city.indexOf(q) === 0 || name.indexOf(q) === 0) { placePrefix.push(a); continue; }
      if ((name + " " + city).indexOf(q) !== -1) contains.push(a);
      if (exact.length + codePrefix.length + placePrefix.length + contains.length > 60) break;
    }
    return exact.concat(codePrefix, placePrefix, contains).slice(0, 8);
  }

  function labelFor(a) { return a.city + " — " + a.name; }

  /* ============================================================
     LEG RENDERING
     ============================================================ */
  function render() {
    legsEl.innerHTML = "";
    state.legs.forEach(function (leg, i) { legsEl.appendChild(buildLeg(leg, i)); });
    addBtn.hidden = !(state.tripType === "multi" && state.legs.length < CONFIG.maxLegs);
    reportHeight();
  }

  function buildLeg(leg, i) {
    var el = document.createElement("div");
    el.className = "cq-leg";
    el.dataset.uid = leg.uid;
    if (leg.from && leg.to) el.classList.add("is-routed");

    var canDrop = state.tripType === "multi" && state.legs.length > 1;

    el.innerHTML =
      '<div class="cq-leg-head">' +
        '<span class="cq-leg-no">Leg ' + String(i + 1).padStart(2, "0") + '</span>' +
        (canDrop ? '<button type="button" class="cq-leg-drop" data-drop>Remove</button>' : '') +
      '</div>' +
      '<div class="cq-route">' + port("from", leg) +
        '<div class="cq-path">' + PLANE + '</div>' + port("to", leg) +
      '</div>' +
      '<div class="cq-row">' +
        '<div class="cq-field" data-wrap="date">' +
          '<label class="cq-label">Departure date</label>' +
          '<input class="cq-input" type="date" data-fld="date" value="' + leg.date + '">' +
          '<p class="cq-err">Pick a date.</p>' +
        '</div>' +
        '<div class="cq-field">' +
          '<label class="cq-label">Preferred time</label>' +
          '<input class="cq-input" type="time" data-fld="time" value="' + leg.time + '">' +
        '</div>' +
      '</div>';
    return el;
  }

  function port(which, leg) {
    var a = leg[which], isTo = which === "to";
    return '<div class="cq-port' + (isTo ? ' is-to' : '') + '" data-port="' + which + '">' +
      '<input type="text" data-airport="' + which + '" role="combobox" aria-expanded="false" ' +
        'aria-autocomplete="list" autocomplete="off" spellcheck="false" maxlength="4" ' +
        'aria-label="' + (isTo ? 'Arrival' : 'Departure') + ' airport" ' +
        'placeholder="' + (isTo ? 'TO' : 'FROM') + '" value="' + (a ? a.icao : "") + '">' +
      '<div class="cq-port-name">' + (a ? labelFor(a) : "") + '</div>' +
      '<div class="cq-sugg" role="listbox"><ul></ul></div></div>';
  }

  /* ============================================================
     LEG INTERACTIONS
     ============================================================ */
  var activeBox = null;

  legsEl.addEventListener("input", function (e) {
    var t = e.target, legEl = t.closest(".cq-leg");
    if (!legEl) return;
    var leg = legById(legEl.dataset.uid);
    if (!leg) return;

    if (t.dataset.fld) {
      leg[t.dataset.fld] = t.value;
      clearErr(t.closest(".cq-field"));
      if (t.dataset.fld === "date") syncReturnDate();
      return;
    }
    if (t.dataset.airport) {
      t.value = t.value.toUpperCase();
      openBox(t, leg, t.dataset.airport);
    }
  });

  legsEl.addEventListener("keydown", function (e) {
    if (!activeBox || e.target !== activeBox.input) return;
    var n = activeBox.results.length;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!n) return;
      e.preventDefault();
      activeBox.index += (e.key === "ArrowDown" ? 1 : -1);
      if (activeBox.index < 0) activeBox.index = n - 1;
      if (activeBox.index >= n) activeBox.index = 0;
      highlight();
    } else if (e.key === "Enter") {
      e.preventDefault();                       // never let the combobox submit the step
      if (n) choose(activeBox.results[Math.max(activeBox.index, 0)]);
    } else if (e.key === "Escape") {
      closeBox();
    } else if (e.key === "Tab") {
      if (n && activeBox.index >= 0) choose(activeBox.results[activeBox.index]);
      else closeBox();
    }
  });

  legsEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-drop]")) {
      var legEl = e.target.closest(".cq-leg");
      state.legs = state.legs.filter(function (l) { return l.uid !== legEl.dataset.uid; });
      render();
      return;
    }
    var li = e.target.closest(".cq-sugg li[data-idx]");
    if (li && activeBox) choose(activeBox.results[+li.dataset.idx]);
  });

  legsEl.addEventListener("focusin", function (e) {
    if (e.target.dataset && e.target.dataset.airport) {
      var legEl = e.target.closest(".cq-leg");
      e.target.select();
      openBox(e.target, legById(legEl.dataset.uid), e.target.dataset.airport);
    }
  });

  document.addEventListener("click", function (e) {
    if (activeBox && !e.target.closest(".cq-port")) closeBox();
  });

  function legById(uid) {
    for (var i = 0; i < state.legs.length; i++) if (state.legs[i].uid === uid) return state.legs[i];
    return null;
  }

  function openBox(input, leg, which) {
    var portEl = input.closest(".cq-port");
    var sugg = portEl.querySelector(".cq-sugg");
    var results = searchAirports(input.value);
    activeBox = { input: input, sugg: sugg, results: results, index: -1, portEl: portEl, leg: leg, which: which };

    if (!input.value.trim()) { closeBox(); return; }

    var ul = sugg.querySelector("ul");
    if (!results.length) {
      ul.innerHTML = '<li class="cq-empty">No airport matches that. Try an ICAO code, IATA code, or city.</li>';
    } else {
      ul.innerHTML = results.map(function (a, i) {
        return '<li role="option" data-idx="' + i + '" aria-selected="false">' +
          '<span class="code">' + a.icao + '</span>' +
          '<span class="place">' + a.city + ' — ' + a.name + '</span>' +
          '<span class="iata">' + (a.iata || "") + '</span></li>';
      }).join("");
    }
    sugg.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
    reportHeight();
  }

  function highlight() {
    var items = activeBox.sugg.querySelectorAll("li[data-idx]");
    items.forEach(function (li, i) { li.setAttribute("aria-selected", i === activeBox.index ? "true" : "false"); });
    if (items[activeBox.index]) items[activeBox.index].scrollIntoView({ block: "nearest" });
  }

  function choose(airport) {
    if (!airport || !activeBox) return;
    var b = activeBox;
    b.leg[b.which] = airport;
    b.input.value = airport.icao;
    b.portEl.querySelector(".cq-port-name").textContent = labelFor(airport);
    b.portEl.classList.remove("has-error");
    var legEl = b.input.closest(".cq-leg");
    if (b.leg.from && b.leg.to) legEl.classList.add("is-routed");
    closeBox();

    if (state.tripType === "return" && b.leg === state.legs[0] && state.legs[1]) {
      state.legs[1].from = state.legs[0].to;
      state.legs[1].to = state.legs[0].from;
      render();
      return;
    }
    if (state.tripType === "multi" && b.which === "to") {
      var idx = state.legs.indexOf(b.leg), next = state.legs[idx + 1];
      if (next && !next.from) { next.from = airport; render(); return; }
    }
    if (b.which === "from") {
      var toInput = legEl.querySelector('[data-airport="to"]');
      if (toInput && !b.leg.to) toInput.focus();
    }
  }

  function closeBox() {
    if (!activeBox) return;
    activeBox.sugg.classList.remove("is-open");
    activeBox.input.setAttribute("aria-expanded", "false");
    activeBox = null;
    reportHeight();
  }

  function syncReturnDate() {
    if (state.tripType !== "return") return;
    var out = state.legs[0], back = state.legs[1];
    if (!out || !back || !out.date) return;
    if (!back.date || back.date < out.date) {
      back.date = out.date;
      var el = legsEl.querySelector('[data-uid="' + back.uid + '"] [data-fld="date"]');
      if (el) el.value = back.date;
    }
  }

  /* ============================================================
     TRIP TYPE + PASSENGERS
     ============================================================ */
  root.querySelectorAll("[data-trip]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var type = btn.dataset.trip;
      if (type === state.tripType) return;
      state.tripType = type;
      root.querySelectorAll("[data-trip]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var first = state.legs[0] || newLeg();
      if (type === "oneway") state.legs = [first];
      else if (type === "return") state.legs = [first, newLeg(first.to, first.from)];
      else if (state.legs.length < 2) state.legs = [first, newLeg(first.to, null)];
      render();
    });
  });

  addBtn.addEventListener("click", function () {
    if (state.legs.length >= CONFIG.maxLegs) return;
    var last = state.legs[state.legs.length - 1];
    state.legs.push(newLeg(last ? last.to : null, null));
    render();
    var els = legsEl.querySelectorAll(".cq-leg"), lastEl = els[els.length - 1];
    var target = lastEl.querySelector('[data-airport="' + (last && last.to ? "to" : "from") + '"]');
    if (target) target.focus();
  });

  function paintPax() {
    $("cqPax").textContent = state.pax;
    $("cqPaxDec").disabled = state.pax <= 1;
    $("cqPaxInc").disabled = state.pax >= CONFIG.maxPax;
  }
  $("cqPaxDec").addEventListener("click", function () { if (state.pax > 1) { state.pax--; paintPax(); } });
  $("cqPaxInc").addEventListener("click", function () { if (state.pax < CONFIG.maxPax) { state.pax++; paintPax(); } });

  /* ============================================================
     REVIEW
     ============================================================ */
  function fmtDate(iso) {
    if (!iso) return "";
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function paintReview() {
    var legsHtml = state.legs.map(function (l) {
      return '<div class="cq-review-leg">' +
        '<span class="rt">' + esc(l.from ? l.from.icao : "—") + '<em>&rarr;</em>' + esc(l.to ? l.to.icao : "—") + '</span>' +
        '<span class="rw">' + esc(fmtDate(l.date)) + (l.time ? " &middot; " + esc(l.time) : "") + '</span>' +
      '</div>';
    }).join("");

    var extras = [];
    if ($("cqFlex").checked)   extras.push("Flexible dates");
    if ($("cqPets").checked)   extras.push("Pets");
    if ($("cqCater").checked)  extras.push("Catering");
    if ($("cqGround").checked) extras.push("Ground transport");

    var notes = $("cqNotes").value.trim();

    $("cqReview").innerHTML =
      '<div class="cq-review-block">' +
        '<div class="cq-review-head"><p class="cq-review-title">Itinerary</p>' +
        '<button type="button" class="cq-edit" data-goto="0">Edit</button></div>' + legsHtml +
      '</div>' +
      '<div class="cq-review-block">' +
        '<div class="cq-review-head"><p class="cq-review-title">Aircraft</p>' +
        '<button type="button" class="cq-edit" data-goto="1">Edit</button></div>' +
        '<div class="cq-review-pairs">' +
          '<div>Passengers <b>' + state.pax + '</b></div>' +
          '<div>Preference <b>' + esc($("cqCat").value || "No preference") + '</b></div>' +
          '<div>Baggage <b>' + esc($("cqBags").value || "Standard") + '</b></div>' +
          (extras.length ? '<div>Also <b>' + esc(extras.join(", ")) + '</b></div>' : "") +
        '</div>' +
      '</div>' +
      '<div class="cq-review-block">' +
        '<div class="cq-review-head"><p class="cq-review-title">Contact</p>' +
        '<button type="button" class="cq-edit" data-goto="2">Edit</button></div>' +
        '<div class="cq-review-pairs">' +
          '<div><b>' + esc($("cqName").value.trim()) + '</b></div>' +
          '<div>' + esc($("cqEmail").value.trim()) + '</div>' +
          '<div>' + esc($("cqPhone").value.trim()) + '</div>' +
          '<div>Booking for <b>' + esc($("cqBehalf").value) + '</b></div>' +
        '</div>' +
        (notes ? '<div class="cq-review-pairs" style="margin-top:10px"><div>' + esc(notes) + '</div></div>' : "") +
      '</div>';
  }

  $("cqReview").addEventListener("click", function (e) {
    var b = e.target.closest("[data-goto]");
    if (b) goTo(+b.dataset.goto, true);
  });

  /* ============================================================
     VALIDATION
     ============================================================ */
  function clearErr(w) { if (w) w.classList.remove("has-error"); }
  function markErr(w) { if (w) w.classList.add("has-error"); }

  function validateStep(n) {
    var problems = [];
    root.querySelectorAll(".has-error").forEach(function (el) { el.classList.remove("has-error"); });

    if (n === 0) {
      state.legs.forEach(function (leg, i) {
        var legEl = legsEl.querySelector('[data-uid="' + leg.uid + '"]');
        if (!leg.from) { markErr(legEl.querySelector('[data-port="from"]')); problems.push("Leg " + (i + 1) + " needs a departure airport."); }
        if (!leg.to)   { markErr(legEl.querySelector('[data-port="to"]'));   problems.push("Leg " + (i + 1) + " needs an arrival airport."); }
        if (leg.from && leg.to && leg.from.icao === leg.to.icao) problems.push("Leg " + (i + 1) + " departs and arrives at the same airport.");
        if (!leg.date) { markErr(legEl.querySelector('[data-wrap="date"]')); problems.push("Leg " + (i + 1) + " needs a departure date."); }
      });
    }

    if (n === 2) {
      var name = $("cqName").value.trim();
      var email = $("cqEmail").value.trim();
      var phone = $("cqPhone").value.trim();
      if (!name) { markErr($("cqName").closest("[data-wrap]")); problems.push("Your name is missing."); }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { markErr($("cqEmail").closest("[data-wrap]")); problems.push("That email doesn't look right."); }
      if (phone.replace(/\D/g, "").length < 7) { markErr($("cqPhone").closest("[data-wrap]")); problems.push("A phone number is missing."); }
    }

    return problems;
  }

  function showProblems(problems) {
    formErr.textContent = problems[0] + (problems.length > 1 ? "  (" + problems.length + " fields need attention.)" : "");
    formErr.classList.add("is-open");
    var firstBad = root.querySelector(".cq-step.is-active .has-error");
    safeScroll(firstBad, "center");
    reportHeight();
  }

  /* ============================================================
     PAYLOAD + SUBMIT
     ============================================================ */
  function makeRef() {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    return CONFIG.refPrefix + "-" + stamp + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function buildPayload() {
    return {
      submittedAt: new Date().toISOString(),
      reference: makeRef(),
      trip: {
        type: state.tripType,
        datesFlexible: $("cqFlex").checked,
        legs: state.legs.map(function (l, i) {
          return {
            sequence: i + 1,
            fromIcao: l.from ? l.from.icao : null, fromIata: l.from ? l.from.iata : null,
            fromName: l.from ? l.from.name : null, fromCity: l.from ? l.from.city : null,
            toIcao: l.to ? l.to.icao : null, toIata: l.to ? l.to.iata : null,
            toName: l.to ? l.to.name : null, toCity: l.to ? l.to.city : null,
            date: l.date, time: l.time || null
          };
        })
      },
      passengers: state.pax,
      aircraftPreference: $("cqCat").value || "No preference",
      baggage: $("cqBags").value || "Standard",
      pets: $("cqPets").checked,
      cateringRequested: $("cqCater").checked,
      groundTransportRequested: $("cqGround").checked,
      contact: {
        name: $("cqName").value.trim(),
        email: $("cqEmail").value.trim(),
        phone: $("cqPhone").value.trim(),
        bookingFor: $("cqBehalf").value,
        smsConsent: $("cqSms").checked
      },
      notes: $("cqNotes").value.trim(),
      source: {
        pageUrl: (function () { try { return document.referrer || location.href; } catch (e) { return location.href; } })(),
        userAgent: navigator.userAgent
      }
    };
  }

  /* ============================================================
     NATIVE WEBFLOW FORM BRIDGE
     Fills a hidden Webflow form on the host page and submits it, so
     entries land in Webflow's Form Submissions panel and set off its
     notification email. No webhook, no automation platform.
     ============================================================ */
  function findWebflowForm(name) {
    var f = document.querySelector('form[data-name="' + name + '"]') ||
            document.querySelector('form[name="' + name + '"]');
    if (f) return f;
    var byId = document.getElementById(name);
    if (!byId) return null;
    return byId.tagName === "FORM" ? byId : byId.querySelector("form");
  }

  /* legs are variable-length; a native form is flat, so flatten them */
  function itineraryText(payload) {
    return payload.trip.legs.map(function (l) {
      var route = (l.fromIcao || "?") + " -> " + (l.toIcao || "?");
      var when = [l.date, l.time].filter(Boolean).join(" ");
      var where = [l.fromCity, l.toCity].filter(Boolean).join(" to ");
      return l.sequence + ". " + route + "  " + when + (where ? "  (" + where + ")" : "");
    }).join("\n");
  }

  /* Webflow rejects over-long field values — a 774-character one was enough
     to fail the whole submission. Everything written to the native form is
     capped, so a chatty customer can't sink their own quote request. */
  var WF_FIELD_MAX = 500;

  /* Fields the widget fills only if the Designer form actually has them. */
  var WF_OPTIONAL = { "Payload": 1 };

  /* A machine-readable backstop, trimmed to what the named fields don't
     already carry. Dropped entirely rather than risk a rejection. */
  function compactJson(payload) {
    var out = JSON.stringify({
      ref: payload.reference,
      at: payload.submittedAt,
      type: payload.trip.type,
      flex: payload.trip.datesFlexible,
      legs: payload.trip.legs.map(function (l) {
        return { n: l.sequence, from: l.fromIcao, to: l.toIcao, date: l.date, time: l.time };
      }),
      pax: payload.passengers,
      aircraft: payload.aircraftPreference,
      bags: payload.baggage,
      pets: payload.pets,
      catering: payload.cateringRequested,
      ground: payload.groundTransportRequested,
      contact: payload.contact
    });
    return out.length <= WF_FIELD_MAX ? out : "";
  }

  function webflowFields(payload) {
    var c = payload.contact;
    var fields = {
      "Reference":        payload.reference,
      "Trip-Type":        payload.trip.type,
      "Itinerary":        itineraryText(payload),
      "Dates-Flexible":   payload.trip.datesFlexible ? "Yes" : "No",
      "Passengers":       String(payload.passengers),
      "Aircraft":         payload.aircraftPreference,
      "Baggage":          payload.baggage,
      "Pets":             payload.pets ? "Yes" : "No",
      "Catering":         payload.cateringRequested ? "Yes" : "No",
      "Ground-Transport": payload.groundTransportRequested ? "Yes" : "No",
      "Name":             c.name,
      "Email":            c.email,
      "Phone":            c.phone,
      "Booking-For":      c.bookingFor,
      "SMS-Consent":      c.smsConsent ? "Yes" : "No",
      "Notes":            payload.notes,
      "Page-URL":         payload.source.pageUrl
    };
    var json = compactJson(payload);
    if (json) fields["Payload"] = json;
    return fields;
  }

  /* Webflow reveals these by setting an inline display, which we can read
     even when the whole form block is hidden — offsetParent can't. */
  function wfShown(node) {
    if (!node) return false;
    if (node.style && (node.style.display === "block" || node.style.display === "flex")) return true;
    return node.offsetParent !== null;
  }

  /* Designer fields aren't always plain text inputs. A select whose options
     don't include our value silently keeps "", and a checkbox ignores .value
     outright — both then fail validation on a form nobody can see. */
  function setWebflowField(field, value) {
    var type = (field.type || "").toLowerCase();

    if (type === "checkbox") { field.checked = /^(yes|true|1)$/i.test(value); return; }

    if (field.tagName === "SELECT") {
      var found = false, i;
      for (i = 0; i < field.options.length; i++) {
        if (field.options[i].value === value) { found = true; break; }
      }
      if (!found) {
        var opt = document.createElement("option");
        opt.value = value;
        opt.text = value;
        field.appendChild(opt);
      }
      field.value = value;
      return;
    }

    field.value = value;
  }

  /* Webflow's success and error divs are a guess at what happened. The
     request itself knows. This observes Webflow's own XHR — it never alters
     it — and puts the originals back the moment the submission resolves. */
  function watchWebflowRequest(onResult) {
    var XHR = window.XMLHttpRequest;
    if (!XHR || !XHR.prototype || !XHR.prototype.send) return function () {};

    var openOrig = XHR.prototype.open;
    var sendOrig = XHR.prototype.send;
    var spent = false;

    function restore() {
      XHR.prototype.open = openOrig;
      XHR.prototype.send = sendOrig;
    }

    XHR.prototype.open = function (method, url) {
      try { this.__cqUrl = String(url || ""); } catch (e) {}
      return openOrig.apply(this, arguments);
    };

    XHR.prototype.send = function () {
      var xhr = this;
      if (/\/api\/v\d+\/form/i.test(xhr.__cqUrl || "")) {
        xhr.addEventListener("loadend", function () {
          if (spent) return;
          spent = true;
          restore();
          onResult(xhr.status, (xhr.responseText || "").slice(0, 400));
        });
      }
      return sendOrig.apply(this, arguments);
    };

    return function () { if (!spent) { spent = true; restore(); } };
  }

  /* Webflow guards forms with Cloudflare Turnstile. It solves an invisible
     challenge in the background and drops a token into a hidden input; submit
     before that lands and Webflow answers 422 — which is why a submission
     could fail on the first try and succeed on a slower second one. Nothing
     here forces or fakes the check. It waits for the token the page was
     already going to produce, then submits. */
  var SPAM_TOKEN_WAIT = 4000;

  function spamToken() {
    var el = document.querySelector('input[name="cf-turnstile-response"], input[name*="turnstile" i], input[name*="captcha" i]');
    if (el && el.value) return el.value;
    try {
      if (window.turnstile && typeof window.turnstile.getResponse === "function") {
        return window.turnstile.getResponse() || "";
      }
    } catch (e) {}
    return "";
  }

  function spamCheckPresent() {
    return !!(window.turnstile || window.grecaptcha ||
      document.querySelector('input[name="cf-turnstile-response"], input[name*="turnstile" i]'));
  }

  /* Don't call turnstile.execute() to hurry this along. Cloudflare's widget
     is meant to be visible, and executing it renders the challenge — which
     on a bridged form means Webflow's hidden plumbing appears on the page.
     If the token isn't ready in time, the answer is to turn Webflow's spam
     protection off, not to poke at it from here. */
  function whenSpamTokenReady(cb) {
    if (!spamCheckPresent() || spamToken()) { cb(); return; }
    var waited = 0;
    var tick = setInterval(function () {
      waited += 150;
      if (spamToken()) { clearInterval(tick); cb(); return; }
      if (waited >= SPAM_TOKEN_WAIT) {
        clearInterval(tick);
        if (window.console && console.warn) {
          console.warn("[charter-quote] The page's spam check produced no token after " +
            (SPAM_TOKEN_WAIT / 1000) + "s. Submitting without one — Webflow may answer 422.");
        }
        cb();
      }
    }, 150);
  }

  /* We drive this form, so nobody should ever see it — not the fields, not
     Webflow's own "thank you", not a challenge widget it decides to render.
     Hiding the Form Block in the Designer covers the fields; this covers the
     rest, including anything injected into the block after page load. */
  function hideWebflowPlumbing(form) {
    var node = form, hops = 0;
    while (node && hops < 4) {
      if (node.className && String(node.className).indexOf("w-form") !== -1) break;
      node = node.parentNode;
      hops++;
    }
    var block = node && node.style ? node : form;
    if (block.style.display !== "none") block.style.display = "none";
    return block;
  }

  /* Do it at mount too — waiting until submit leaves a window in which the
     block can surface on the page. */
  if (CONFIG.webflowForm) {
    var bridgedForm = findWebflowForm(CONFIG.webflowForm);
    if (bridgedForm) hideWebflowPlumbing(bridgedForm);
  }

  function submitViaWebflow(payload, onFail) {
    var form = findWebflowForm(CONFIG.webflowForm);
    if (!form) { onFail("This form isn't connected yet. Please call us and we'll take the details over the phone."); return; }

    hideWebflowPlumbing(form);

    var values = webflowFields(payload);
    var missing = [];
    for (var key in values) {
      if (!Object.prototype.hasOwnProperty.call(values, key)) continue;
      var field = form.querySelector('[name="' + key + '"]');
      if (!field) { if (!WF_OPTIONAL[key]) missing.push(key); continue; }
      var value = values[key];
      if (value.length > WF_FIELD_MAX) {
        value = value.slice(0, WF_FIELD_MAX - 4) + " […]";
        if (window.console && console.warn) {
          console.warn("[charter-quote] " + key + " was truncated to " + WF_FIELD_MAX + " characters for Webflow.");
        }
      }
      /* Constraints on a hidden form can only ever fail invisibly — the
         browser refuses to submit and can't focus the field to say why.
         The widget has already validated everything the customer typed. */
      if (field.required) field.required = false;
      if (field.getAttribute("pattern")) field.removeAttribute("pattern");

      setWebflowField(field, value);
    }
    if (missing.length && window.console && console.warn) {
      console.warn("[charter-quote] Webflow form has no field named: " + missing.join(", "));
    }

    /* If it still won't validate, say which field and why, rather than
       letting the browser drop the submission without a word. */
    if (typeof form.checkValidity === "function" && !form.checkValidity()) {
      var bad = [], all = form.querySelectorAll("[name]"), n;
      for (n = 0; n < all.length; n++) {
        if (all[n].willValidate && !all[n].checkValidity()) bad.push(all[n].name || all[n].tagName);
      }
      if (window.console && console.warn) {
        console.warn("[charter-quote] The Webflow form won't validate, so the browser will refuse to send it. Offending fields: " + bad.join(", "));
      }
    }

    var wrap = form.parentNode;
    var done = wrap ? wrap.querySelector(".w-form-done") : null;
    var fail = wrap ? wrap.querySelector(".w-form-fail") : null;

    /* The Designer publishes whichever form state was left showing, so either
       of these can already be visible before anything is submitted. */
    if ((wfShown(done) || wfShown(fail)) && window.console && console.warn) {
      console.warn("[charter-quote] Webflow's " + (wfShown(done) ? "success" : "error") +
        " message is already visible before submitting. Set the form back to its normal state in the Designer — until then the widget can't reliably tell whether a submission worked.");
    }

    var attempts = 0;

    function attempt() {
      attempts++;

      /* Re-read each time: a rejected attempt leaves Webflow's error message
         showing, and on a retry that's old news rather than a fresh verdict. */
      var doneWas = wfShown(done);
      var failWas = wfShown(fail);
      var settled = false, poll = null, stopWatching = null, sawRequest = false;

      function settle(ok, message, detail) {
        if (settled) return;
        settled = true;
        if (poll) clearInterval(poll);
        if (stopWatching) stopWatching();
        if (ok) { finish(payload, false); return; }

        /* 422 is Webflow's answer when the spam check had no token yet. One
           retry, once a token exists, is all it has ever needed. */
        if (detail && detail.indexOf("HTTP 422") !== -1 && attempts < 2) {
          if (window.console && console.warn) {
            console.warn("[charter-quote] " + detail + " — waiting for the spam-check token, then trying once more.");
          }
          whenSpamTokenReady(attempt);
          return;
        }

        if (detail && window.console && console.warn) console.warn("[charter-quote] " + detail);
        onFail(CONFIG.debug && detail ? detail : message);
      }

      stopWatching = watchWebflowRequest(function (status, body) {
        sawRequest = true;
        if (status >= 200 && status < 300) { settle(true); return; }
        settle(false,
          status === 429
            ? "We're getting a lot of requests right now. Please try again in a moment, or call us and we'll take the details over the phone."
            : "That didn't send. Please try again, or call us and we'll take the details over the phone.",
          "Webflow answered HTTP " + status + (body ? " — " + body : " with an empty body"));
      });

      var btn = form.querySelector('input[type="submit"], button[type="submit"]');
      if (btn) btn.click();
      else if (window.jQuery) window.jQuery(form).trigger("submit");
      else { settle(false, "This form isn't connected yet. Please call us and we'll take the details over the phone.", "The Webflow form has no submit button."); return; }

      /* Fallback for the case where Webflow stops using XHR. The request, when
         we can see it, always wins — these divs only decide if none appeared. */
      var waited = 0;
      poll = setInterval(function () {
        waited += 200;
        if (sawRequest) return;
        if (!doneWas && wfShown(done)) { settle(true); return; }
        if (!failWas && wfShown(fail)) {
          settle(false, "That didn't send. Please try again, or call us and we'll take the details over the phone.",
            "Webflow showed its error message, but no form request was seen leaving the page.");
          return;
        }
        if (waited >= 12000) {
          settle(false, "That took too long to send. Please try again, or call us and we'll take the details over the phone.",
            "No response after 12s. No form request was seen leaving the page — the browser most likely refused to send it.");
        }
      }, 200);
    }

    whenSpamTokenReady(attempt);
  }

  formEl.addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("cqHp").value) return;

    var problems = validateStep(state.step);
    if (problems.length) { showProblems(problems); return; }
    formErr.classList.remove("is-open");

    if (state.step < STEPS - 1) { goTo(state.step + 1, false); return; }

    // Final step — re-check everything before sending.
    var all = validateStep(0).concat(validateStep(2));
    if (all.length) {
      formErr.textContent = all[0] + "  Use Edit above to fix it.";
      formErr.classList.add("is-open");
      reportHeight();
      return;
    }

    var payload = buildPayload();
    nextBtn.disabled = true;
    nextBtn.textContent = "Sending your request…";

    function failSend(message) {
      nextBtn.disabled = false;
      nextBtn.textContent = "Request a quote";
      formErr.textContent = message;
      formErr.classList.add("is-open");
      reportHeight();
    }

    if (CONFIG.webflowForm) { submitViaWebflow(payload, failSend); return; }

    if (!CONFIG.webhookUrl) { finish(payload, true); return; }

    fetch(CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error("Status " + r.status); finish(payload, false); })
      .catch(function () {
        failSend("That didn't send. Check your connection and try again, or call us and we'll take the details over the phone.");
      });
  });

  function finish(payload, preview) {
    formEl.style.display = "none";
    root.querySelector(".cq-track").style.display = "none";
    $("cqDone").classList.add("is-open");
    $("cqRef").textContent = "Reference " + payload.reference;
    if (preview) {
      var dbg = $("cqDebug");
      dbg.hidden = false;
      dbg.textContent = "PREVIEW MODE — nothing was sent.\nAdd a webhook URL to CONFIG to go live.\n\n" +
        JSON.stringify(payload, null, 2);
    }
    reportHeight();
    var detail = { reference: payload.reference, payload: payload };
    try { window.dispatchEvent(new CustomEvent("charterQuote:submitted", { detail: detail })); } catch (e) {}
    if (IN_FRAME) { try { window.parent.postMessage({ type: "charterQuote:submitted", reference: payload.reference }, "*"); } catch (e) {} }
  }

  /* ============================================================
     IFRAME AUTO-HEIGHT
     ============================================================ */
  var IN_FRAME = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  var lastH = 0;
  function reportHeight() {
    if (!IN_FRAME) return;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      try { window.parent.postMessage({ type: "charterQuote:height", height: h }, "*"); } catch (e) {}
    });
  }
  if (IN_FRAME) {
    window.addEventListener("resize", reportHeight);
    if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);
  }

  /* ============================================================
     BOOT
     ============================================================ */
  state.legs = [newLeg()];
  paintPax();
  render();
  goTo(0, false, true);

  ["cqName", "cqEmail", "cqPhone"].forEach(function (id) {
    $(id).addEventListener("input", function () { clearErr(this.closest("[data-wrap]")); });
  });
})();
})();
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
