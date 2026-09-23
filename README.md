# SoundTouch Instrumentos

Vidriera de instrumentos musicales premium. Los compradores contactan directo al dueño por WhatsApp o email. Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript strict.

## Stack

- **Framework**: Next.js 16.2.4 (App Router, server-first: la home es Server Component estática/ISR con una isla client para el catálogo)
- **UI**: Tailwind 4 (`@theme` en `globals.css`), Framer Motion, lucide-react
- **Tipografía**: Fraunces (display) + Plus Jakarta Sans (texto), vía `next/font`
- **Diseño**: sistema "noir + amber" — dark en todo el sitio (`#09090B` / `#131316` / acento `#FFB74D`)

## Comandos

```bash
npm run dev     # dev server (http://localhost:3000)
npm run build   # producción
npm run start   # servir build
npm run lint    # ESLint
npx tsc --noEmit # typecheck
```

## Configuración (`.env`)

Copiá `.env.example` a `.env.local` y completá:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Teléfono WhatsApp (formato internacional sin `+`, ej. `5491131736468`) |
| `NEXT_PUBLIC_EMAIL` | Email de contacto |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (SEO: sitemap, canonical, OG) |
| `NEXT_PUBLIC_EXCHANGE_RATE` | Tasa ARS/USD para el toggle de moneda |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del panel admin (`/admin`) |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión HMAC-SHA256 |

Generar secreto: `node -e "console.log(crypto.randomBytes(32).toString('base64url'))"`

## Datos y persistencia

- **Seed**: `src/lib/seed.ts` — 15 instrumentos iniciales.
- **Store**: `src/lib/store/instruments.ts` — lee/escribe `data/instruments.json` (gitignored, auto-seed/reseed la primera vez). API REST en `/api/instruments`.
- **Límite conocido**: el store JSON es single-process. No apto para serverless multi-instancia (Vercel) sin migrar a una BD (Supabase/Postgres es el siguiente paso). La home usa ISR (revalidate 60 s) + `revalidatePath("/")` tras writes.

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Home: server component + secciones (Nosotros, Catálogo, Cómo comprar, Testimonios, Garantía, Contacto)
│   ├── producto/[id]/        # Detalle (server, ISR-able): oferta, moneda, specs, JSON-LD Product
│   ├── admin/                # Panel CRUD (login + dashboard) — sesión por cookie firmada HttpOnly
│   ├── api/instruments/      # CRUD REST (protected: POST/PUT/DELETE requieren sesión)
│   ├── api/auth/             # Login/logout/verificación de sesión
│   ├── sitemap.ts / robots.ts / opengraph-image.tsx
├── components/               # layout/, product/, home/, admin/, ui/
├── context/CurrencyContext.tsx  # Toggle USD/ARS (persistido en localStorage)
├── config/business.ts        # Fuente única de contacto del negocio (env-backable)
├── lib/                      # seed, catalog (helpers puros), store (JSON), utils
└── types/index.ts            # Instrument, categorías, condiciones, labels
```

## SEO

- `metadataBase` + canonical, OpenGraph, sitemap.xml (16 URLs), robots.txt (desindexa /admin y /api), OG image 1200×630.
- JSON-LD: `Store` (home) y `Product` (detalle) con scrub anti-XSS.

## Admin

`/admin` (login con `ADMIN_EMAIL`/`ADMIN_PASSWORD` de `.env.local`). CRUD completo: crear (POST), editar (PUT, no duplica), borrar (DELETE, con confirmación). Los cambios persisten en `data/instruments.json` y el catálogo público los refleja.