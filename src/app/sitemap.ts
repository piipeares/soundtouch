import type { MetadataRoute } from "next";
import { business } from "@/config/business";
import { readInstruments } from "@/lib/store/instruments";

/**
 * Sitemap (task 6.1): home + detalle de cada instrumento. Las URLs usan
 * siteUrl de business config (con default localhost hasta que el owner dé el
 * dominio real).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const instruments = readInstruments();
  const base = business.siteUrl.replace(/\/$/, "");

  const productUrls: MetadataRoute.Sitemap = instruments.map((instrument) => ({
    url: `${base}/producto/${instrument.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...productUrls,
  ];
}