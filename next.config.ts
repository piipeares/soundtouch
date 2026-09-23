import type { NextConfig } from "next";

// Sin remotePatterns (spec premium-design: imágenes locales únicamente).
// InstrumentImage genera placeholder local si el asset falta; cuando el dueño
// suba fotos reales irán a public/images/ y se referencian con ruta local.
const nextConfig: NextConfig = {};

export default nextConfig;