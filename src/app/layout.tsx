import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { business } from "@/config/business";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

// Display serif editorial (design D2): Fraunces variable con eje óptico.
// El peso (600/700) se aplica en el uso vía font-display + font-semibold/bold.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(business.siteUrl),
  title: {
    default: "SoundTouch Instrumentos | Instrumentos Musicales de Alta Gama",
    template: "%s | SoundTouch Instrumentos",
  },
  description:
    "Catálogo de instrumentos musicales premium en Argentina. Guitarras, bajos, pedales y más de las mejores marcas. Contacto directo por WhatsApp.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SoundTouch Instrumentos",
    description:
      "Instrumentos musicales de alta gama. Compra y venta con contacto directo por WhatsApp.",
    type: "website",
    locale: "es_AR",
    siteName: "SoundTouch Instrumentos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CurrencyProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}