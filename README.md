# tapkit — website (waitlist landing page)

Pre-launch waitlist site for tapkit: a bio page built step by step, SuperDM (comment a word → get the DM), short links that count every tap, and products (files, locked content, freebies). Business connect and the agency workspace are teased as coming later. The product itself lives in `../tapkit-app`.

Plain HTML/CSS/JS, no build step. Set in Inter.

## Run

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Files

- `index.html` — home page
- `pricing.html` — plans, comparison table, pricing FAQ
- Product pages, linked from the Product menu: `superdm.html`, `bio-page.html`, `links.html`, `products.html`, `workflows.html`, `business-connect.html` (each: dark header, phone mockup or feature detail, the plan it is in, FAQ, waitlist button)
- `styles.css` — design tokens at the top (`:root`), then components
- `script.js` — nav, hero tabs, hero signup, waitlist + business forms, scroll reveal
- `demo.js` — the live demo in the home page hero (`#demo`): Bio page and Products tabs show the real pages from the tapkit server inside a phone; the SuperDM tab replays a reel/story comment and the DM it triggers, with the same matching rules as the server's `/api/automations/simulate`
- `hero-starfield.js` — the home hero background: a 2D-canvas dot grid in tapkit plum that breathes, with twinkling four-point stars, dots pushed aside by the pointer, and the odd shooting star (written for tapkit, after the idea of the Framer “Starfield Motion” component); one still frame with reduced motion
- `hero-sky.js` — (other pages) Three.js (r128, from cdnjs) shader for the hero: dark night sky, twinkling stars, two layers of drifting clouds lit from below; falls back to a CSS gradient when WebGL is missing or reduced motion is on

## Sections

1. Nav — Product menu (SuperDM · Bio page · Links · Products · Workflows · Business connect) · For agencies · Pricing · FAQ · Log in · Join the waitlist
2. Hero — full-width night sky (hero-sky.js): early-access pill, headline, subhead, inline email/WhatsApp signup on the left; the **live demo** in a phone on the right (Bio page / SuperDM / Products, see “The live demo” below)
3. Four tools, one loop (SuperDM, Bio page, Links, Products)
4. Sell what you already know — files, locked content, freebies; comment → DM → pay → unlock
5. Start at any size
6. How it works
7. Pricing — Free ₹0 / Pro ₹400/mo / Pro Annual ₹3,999/yr, 5% digital-product fee, Business Connect coming soon, founding-creator note
8. Business connect (coming later) — separate “Tell us you're interested” form for businesses
9. Waitlist form — includes “Which tool do you want most?” (demand test)
10. FAQ
11. Footer

## Alternative hero headlines

- Turn your reels into links, replies and sales.
- Everything you share, earning — from one link.

## Getting the responses (Google Sheet)

Signups are sent to a Google Sheet through a small Apps Script. One-time setup, about 3 minutes:

1. Create a new Google Sheet (any name, e.g. `tapkit waitlist`).
2. In the Sheet: **Extensions → Apps Script**. Delete what's there and paste the contents of `waitlist-apps-script.gs`. Save.
3. **Deploy → New deployment →** gear icon **→ Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, approve the permission prompt, and copy the **Web app URL** (ends in `/exec`).
4. Open `script.js`, find `var WAITLIST_ENDPOINT = '';` and paste the URL between the quotes.
5. Test: open the web-app URL in a browser (it should say the endpoint is running), then sign up on the page. A **Waitlist** tab appears in the Sheet with one row per signup.

Columns: submitted_at, updated_at, lead_id, stage, contact, contact_type (email / whatsapp), handle, niche, followers, tool, brand_deals (yes / maybe / no), source (hero / bottom / button / other-page), ref (from `?ref=` invite links), page.

The contact is saved as soon as someone enters it (stage `contact`); when they answer the questions, the same row is filled in and stage becomes `complete`. Filter by stage `contact` to see people who left before answering. If you had already deployed the old script, paste the new one in and redeploy (Deploy → Manage deployments → edit → New version), and delete the old header row.

If you change the Apps Script later, use **Deploy → Manage deployments → Edit → New version** so the same URL keeps working.

To use a form service instead (e.g. Formspree), paste its form URL into `WAITLIST_ENDPOINT`; it is sent as a normal form POST.

## The live demo

The hero demo (`#demo`) loads pages from the tapkit server named in its `data-app` attribute (`http://localhost:4500` for now; change it to the live domain on upload). The three demo creators — `ananya.glows`, `kabir.beats`, `meera.fit` — come from `tapkit-app/server/scripts/seed-demo.js`:

```
cd ../tapkit-app/server && node scripts/seed-demo.js   # with the server running; safe to re-run
```

With the server in test mode the product pages take a labelled test payment and no money moves; each test purchase is recorded as an order on the demo account. If the server can't be reached, the phone shows "The live demo is offline" with a Try again button. If you change the demo creator's SuperDMs in the seed, change `AUTOMATIONS` in `demo.js` to match.

## Not wired up yet

- **The waitlist saves only once `WAITLIST_ENDPOINT` is set** (see above). Until then it works on screen but nothing is stored. The business interest form still has no backend. The `#312` rank is static placeholder copy.
- Privacy / Terms / Contact links point to `#`.
- Mockup numbers (orders, earnings, open rates) are illustrative.
- The waitlist "tool" answers are now `superdm`, `page`, `links`, `products` (before 2026-10-28: `auto-dms` and `videos` instead of `superdm` and `products`).
