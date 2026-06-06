# Soheads

## Context
**Was:** Sorare fantasy football squad builder — 5-a-side Squads bauen und als Bild exportieren
**Für wen:** Sorare-Spieler
**Ziel:** Aktives Produkt
**Typ:** Eigenes Projekt
**Domain:** soheads.com (Spaceship)

## Stack
Next.js + Supabase + TanStack Query + Base UI + shadcn + Tailwind

## Run locally
```sh
npm run dev
```
Requires `.env.local`

## Notes
`html-to-image` für Squad-Export als PNG
Seed Squads mit Sorare-Slugs → `SQUADS.md`
Haupt-Routes: `/build`, `/squad/[id]`
