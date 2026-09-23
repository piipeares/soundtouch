import type { MetadataRoute } from "next";
import { business } from "@/config/business";

/**
 * Robots (task 6.2): permite crawleo completo. Referencia al sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${business.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}