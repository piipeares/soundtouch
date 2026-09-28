"use client";

import { useEffect } from "react";
import { trackRecentlyViewed } from "@/lib/recentlyViewed";

/**
 * Registra la vista de un producto en "vistos recientemente" (localStorage).
 * Isla client invisible: se monta dentro de la página server de detalle y
 * trackea en useEffect, sin tocar cookies ni romper el ISR (design D5).
 */
export default function TrackView({ instrumentId }: { instrumentId: string }) {
  useEffect(() => {
    trackRecentlyViewed(instrumentId);
  }, [instrumentId]);

  return null;
}