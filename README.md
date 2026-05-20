# Yamazaki Privilege OS

Multi-page product app for Yamazaki Hospitality Fleet's loyalty, membership, and QR feedback stack.

## Files

- `index.html` - polished login / entry page
- `overview.html` - executive product overview
- `dashboard.html` - owner dashboard
- `customers.html` - customer CRM
- `rewards.html` - rewards studio
- `campaigns.html` - campaign planning and performance
- `counter.html` - staff billing-side loyalty flow
- `settings.html` - policy, security, and loyalty configuration
- `branches.html` - branch performance
- `feedback/` - separate QR-based guest feedback product
- `server.js` - Express server for static pages and feedback APIs
- `db/schema.sql` - Postgres schema for venues and feedback responses
- `data/venues.js` - seeded venture list for QR feedback rollout
- `src/styles.css` - visual system and responsive layout
- `src/main.js` - small interactive previews

## Run

1. Install packages with `npm install`
2. Set `DATABASE_URL` in your environment
3. Seed the database with `npm run db:setup`
4. Start the app with `npm start`

Open `http://127.0.0.1:4173/` for the membership product, or `http://127.0.0.1:4173/feedback/index.html?venue=tokii&table=TK01` for the guest feedback form.

## Live QR Ventures

- Tokii
- Maharaja Dhaba
- Brickhaus
- Spice Theory
- Yamazaki
- Yamazaki Catering
- Yamazaki Xpress

## Next suggested steps

1. Add manager login and venue-level permissions
2. Add low-rating alerts on WhatsApp, email, or internal staff channels
3. Add table master management if exact per-venue table counts need to be controlled centrally
