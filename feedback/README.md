# Yamazaki Feedback App

Separate QR-based table feedback app for Yamazaki Hospitality Fleet.

## Pages

- `feedback/index.html` - guest-facing feedback form
- `feedback/manage.html` - manager inbox and export view
- `feedback/qr-cards.html` - printable QR generator for tables

## Live behavior

- Stores submissions in Supabase Postgres
- Exports responses as CSV
- Generates per-table QR codes with `?venue=` and `?table=` query params
- Loads venture defaults for all Yamazaki brands

## Seeded ventures

- Tokii
- Maharaja Dhaba
- Brickhaus
- Spice Theory
- Yamazaki
- Yamazaki Catering
- Yamazaki Xpress

## Next production steps

1. Add manager login and role-based access
2. Add low-rating alerts and issue-resolution workflow
3. Add exact table master counts per venue if operations team wants fixed control

For the current rollout, each seeded venture starts with `1` table by default so QR deployment can begin before final table counts are confirmed.
