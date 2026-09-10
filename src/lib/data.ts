// SHIM TEMPORAL (task 2.1 → se elimina en task 2.3):
// data.ts fue renombrado a seed.ts (array) + catalog.ts (helpers puros).
// Este re-export queda solo porque src/app/api/instruments/route.ts todavía
// importa `instruments` de acá; cuando esa route se reescriba contra el store
// (src/lib/store/instruments.ts), este archivo se borra.
export { instruments } from "./seed";