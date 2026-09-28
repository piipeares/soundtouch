import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { getCustomerSession } from "@/lib/auth";
import { readInstruments } from "@/lib/store/instruments";

export const metadata: Metadata = {
  title: "Mi perfil",
  description:
    "Tus instrumentos guardados y los que estuviste viendo recientemente en SoundTouch Instrumentos.",
};

/**
 * /favoritos = pantalla de perfil de cliente (server page, dinámica por
 * cookies()): si no hay sesión customer redirige a /login; si hay, pasa el
 * catálogo al ProfileScreen client que compone favoritos + vistos recientes.
 * Arregla el 404 post-login (AuthForm default returnTo = /favoritos).
 */
export default async function FavoritosPage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/login");
  }

  const instruments = readInstruments();

  return <ProfileScreen instruments={instruments} />;
}