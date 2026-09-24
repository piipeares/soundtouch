import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import Logo from "@/components/layout/Logo";
import { getCustomerSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ingresar o crear cuenta",
  description:
    "Ingresá a tu cuenta o registrate en SoundTouch Instrumentos para guardar tus instrumentos favoritos.",
};

// Solo admite rutas internas: evita open redirect vía ?returnTo=.
function safeReturnTo(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return undefined;
  }
  return value;
}

/**
 * Página /login (server page, dinámica por cookies()): si ya hay una sesión
 * customer válida redirige a /favoritos (redirect 307); si no, renderiza el
 * AuthForm client con el `returnTo` sanitizado del search param.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getCustomerSession();
  if (session) {
    redirect("/favoritos");
  }

  const { returnTo } = await searchParams;

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold text-white">Tu cuenta</h1>
          <p className="mt-2 text-zinc-400">
            Guardá tus instrumentos favoritos y volvé a encontrarlos.
          </p>
        </div>

        <AuthForm returnTo={safeReturnTo(returnTo)} />

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-brand-orange transition-colors">
            ← Volver al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}