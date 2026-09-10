This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Persistencia del catálogo (`data/`)

El catálogo se persiste en `data/instruments.json` (gitignored), manejado por
`src/lib/store/instruments.ts`:

- **Seed automático**: en el primer acceso, si el archivo no existe o está
  corrupto (JSON inválido / shape incorrecto), el store se regenera desde
  `src/lib/seed.ts` (reseed controlado; la API nunca crashea por datos
  faltantes).
- **Escrituras**: serializadas con un mutex en memoria (promise chain) para
  evitar write races entre requests concurrentes. Tras cada escritura se
  revalidan `/` y `/producto/[id]` (`revalidatePath`).
- **LÍMITE — single-process**: el store es un archivo local del proceso que
  corre la app. Funciona en dev y en un VPS de instancia única, pero NO en
  serverless multi-instancia (Vercel u otros): ahí el filesystem no es
  compartido entre instancias y cada una tendría su propio archivo. Si algún
  día se escala a multi-instancia, migrar la persistencia a una DB real
  (SQLite/Postgres) dejando la API como está.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
