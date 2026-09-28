"use client";

import { usePathname } from "next/navigation";

/**
 * Gate client: oculta su contenido en cualquier ruta /admin.
 *
 * Se usa para la Navbar y el Footer por separado en el layout raíz, así el
 * orden del DOM queda Navbar → main → Footer (body es flex-col; envolver
 * ambos en un mismo componente los hubiera corrido ANTES del main y el footer
 * aparecería arriba). El panel admin y su login son shells independientes con
 * header propio, por eso se oculta el chrome público ahí.
 */
export default function HideOnAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return null;

  return <>{children}</>;
}