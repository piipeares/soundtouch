import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Auth del admin: cookie de sesión firmada HMAC-SHA256 (design D5).
//
// Formato de la cookie `admin_session`:
//   `${base64url(payload)}.${hexHmacSha256(base64url(payload))}`
// con payload { sub: email, exp: epoch-ms }. La firma es HMAC-SHA256 con
// SESSION_SECRET; verify() rechaza firmas inválidas (timingSafeEqual) y
// sesiones vencidas. La cookie es httpOnly + sameSite strict + secure en
// producción → el cliente jamás la lee y no se puede forjar sin el secreto.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 horas (segundos)

// Credenciales y secreto SOLO desde env, nunca en source. Fail-fast en
// module load: si faltan, el server no arranca con un admin roto.
function readEnv(): {
  adminEmail: string;
  adminPassword: string;
  sessionSecret: string;
} {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminEmail || !adminPassword || !sessionSecret) {
    throw new Error(
      "Auth no configurada: definí ADMIN_EMAIL, ADMIN_PASSWORD y SESSION_SECRET " +
        "en .env.local (ver .env.example)."
    );
  }
  return { adminEmail, adminPassword, sessionSecret };
}

const { adminEmail, adminPassword, sessionSecret } = readEnv();

interface SessionPayload {
  /** subject: email del admin */
  sub: string;
  /** expiración en epoch ms */
  exp: number;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", sessionSecret).update(encodedPayload).digest("hex");
}

/** Comparación en tiempo constante (longitud fija de hex SHA-256 = 64). */
function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Comparación en tiempo constante de strings de longitud variable (credenciales). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Firma una sesión de 24h para el email dado. */
export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    sub: email,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifica firma + expiración de un token. Devuelve el email (sub) si es
 * válido, o null si la firma no cuadra, el formato es inválido o expiró.
 */
export function verifySessionToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqualHex(signature, sign(encoded))) return null; // forjada/temperada

  let payload: SessionPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
  } catch {
    return null; // payload ilegible
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.exp <= Date.now()) return null; // vencida
  return payload.sub;
}

/**
 * Valida credenciales contra ADMIN_EMAIL/ADMIN_PASSWORD de env con
 * comparación en tiempo constante (no filtra cuál campo falló).
 */
export function verifyCredentials(email: string, password: string): boolean {
  return (
    safeEqual(email, adminEmail) && safeEqual(password, adminPassword)
  );
}

/** Lee la cookie y devuelve la sesión actual (email) o null. */
export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const email = verifySessionToken(token);
  return email ? { email } : null;
}

/**
 * Guard para API routes: si no hay sesión válida devuelve una NextResponse
 * 401 lista para retornar; si hay sesión devuelve null (seguir).
 */
export async function requireSession(): Promise<NextResponse | null> {
  const session = await getSession();
  if (session) return null;
  return NextResponse.json(
    { error: "No autorizado", authenticated: false },
    { status: 401 }
  );
}