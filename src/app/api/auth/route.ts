import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  getSession,
  verifyCredentials,
} from "@/lib/auth";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_MAX_AGE,
  path: "/",
};

/**
 * GET /api/auth — estado de la sesión (fix del 405 loop: antes la ruta solo
 * respondía POST/DELETE y el check de /admin pegaba 405 infinitamente).
 * 200 {authenticated:true,email} con cookie válida; 401 sin cookie inválida.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
  return NextResponse.json({ authenticated: true, email: session.email });
}

/**
 * POST /api/auth — login. Verifica credenciales contra env (timingSafeEqual,
 * mensaje 401 genérico que no revela cuál campo falló) y setea la cookie
 * firmada admin_session (httpOnly, sameSite strict, secure en prod, 24h).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido en el body" },
      { status: 400 }
    );
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  if (!verifyCredentials(email, password)) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(email), SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ success: true });
}

/** DELETE /api/auth — logout: borra la cookie de sesión. */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}