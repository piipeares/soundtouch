import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Auth de sesiones firmadas HMAC-SHA256 (design D1 del change favoritos).
//
// Formato de las cookies `admin_session` / `customer_session`:
//   `${base64url(payload)}.${hexHmacSha256(base64url(payload))}`
// con payload { sub: email, role: "admin" | "customer", exp: epoch-ms }.
// La firma es HMAC-SHA256 con SESSION_SECRET; verify() rechaza firmas
// inválidas (timingSafeEqual) y sesiones vencidas. Las cookies son httpOnly
// + sameSite strict + secure en producción → el cliente jamás las lee y no
// se puede forjar una sesión sin el secreto.
//
// BACK-COMPAT (D1): un token sin claim `role` (sesiones admin del V2)
// se interpreta como role:"admin" — el admin existente no necesita re-login.

export const SESSION_COOKIE = "admin_session";
export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 horas (segundos)

export type SessionRole = "admin" | "customer";

export interface SessionPayload {
  /** subject: email del usuario */
  sub: string;
  /** role de la sesión */
  role: SessionRole;
  /** expiración en epoch ms */
  exp: number;
}

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

/**
 * Firma una sesión de 24h para el email dado. El role por defecto es "admin"
 * (firma histórica: los callers existentes no cambian de comportamiento).
 */
export function createSessionToken(email: string, role: SessionRole = "admin"): string {
  const payload: SessionPayload = {
    sub: email,
    role,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${encoded}.${sign(encoded)}`;
}

/**
 * Verifica firma + expiración de un token. Devuelve el payload si es válido,
 * o null si la firma no cuadra, el formato es inválido o expiró.
 * Back-compat: payload sin `role` (tokens legacy del V2) → role "admin";
 * cualquier role distinto de "customer" se normaliza a "admin".
 */
export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqualHex(signature, sign(encoded))) return null; // forjada/temperada

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as Record<string, unknown>;
  } catch {
    return null; // payload ilegible
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.exp <= Date.now()) return null; // vencida
  return {
    sub: payload.sub,
    role: payload.role === "customer" ? "customer" : "admin",
    exp: payload.exp,
  };
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

async function readSessionCookie(cookieName: string): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Lee la cookie admin_session y devuelve la sesión ({ email, role }) o null. */
export async function getSession(): Promise<{ email: string; role: SessionRole } | null> {
  const payload = await readSessionCookie(SESSION_COOKIE);
  if (!payload) return null;
  return { email: payload.sub, role: payload.role };
}

/** Lee la cookie customer_session y devuelve la sesión customer o null. */
export async function getCustomerSession(): Promise<{ email: string; role: SessionRole } | null> {
  const payload = await readSessionCookie(CUSTOMER_SESSION_COOKIE);
  if (!payload) return null;
  if (payload.role !== "customer") return null;
  return { email: payload.sub, role: payload.role };
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "No autorizado", authenticated: false },
    { status: 401 }
  );
}

/**
 * Guard para API routes de ADMIN: si no hay sesión admin válida (cookie
 * admin_session con role "admin") devuelve una NextResponse 401 lista para
 * retornar; si hay sesión devuelve null (seguir).
 */
export async function requireSession(): Promise<NextResponse | null> {
  const session = await getSession();
  if (session && session.role === "admin") return null;
  return unauthorized();
}

/**
 * Guard para API routes de CUSTOMER: si no hay sesión customer válida
 * (cookie customer_session con role "customer") devuelve una NextResponse
 * 401 lista para retornar; si hay sesión devuelve null (seguir).
 */
export async function requireCustomerSession(): Promise<NextResponse | null> {
  const session = await getCustomerSession();
  if (session && session.role === "customer") return null;
  return unauthorized();
}

// ---------------------------------------------------------------------------
// Passwords con scrypt (design D2)
// ---------------------------------------------------------------------------
// Hash autodescriptivo (formato PHC simplificado):
//   `scrypt$N$r$p$saltBase64Url$hashBase64Url`
// El salt (16B aleatorios por usuario) viaja embebido en el hash: no hace
// falta exponer un campo aparte. scrypt SIEMPRE async — nunca scryptSync en
// request path (bloquea el event loop a ~16MB por verificación).

const SCRYPT_SALT_BYTES = 16;
const SCRYPT_DEFAULT_N = 16384;
const SCRYPT_DEFAULT_R = 8;
const SCRYPT_DEFAULT_P = 1;
const SCRYPT_KEYLEN = 64;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Hashea una password con scrypt (salt aleatorio de 16B por llamada). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_BYTES);
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_DEFAULT_N,
    r: SCRYPT_DEFAULT_R,
    p: SCRYPT_DEFAULT_P,
  });
  return [
    "scrypt",
    SCRYPT_DEFAULT_N,
    SCRYPT_DEFAULT_R,
    SCRYPT_DEFAULT_P,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");
}

/**
 * Verifica una password contra un hash PHC scrypt. Comparación en tiempo
 * constante (timingSafeEqual, guard de longitud). Devuelve false ante
 * cualquier formato inválido o params imposibles (nunca lanza).
 */
export async function verifyPassword(
  storedHash: string,
  password: string
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }
  if (n <= 0 || r <= 0 || p <= 0) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scryptAsync(password, salt, expected.length, { N: n, r, p });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}