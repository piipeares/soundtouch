import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  getCustomerSession,
  hashPassword,
  isSessionConfigured,
  verifyPassword,
} from "@/lib/auth";
import {
  createUser,
  ensureDemoUser,
  getUserByEmail,
  normalizeEmail,
  updateUserName,
} from "@/lib/store/users";

// Cookie customer_session: httpOnly + sameSite strict + secure en prod,
// 24h (SESSION_MAX_AGE) — mismo estándar que la admin_session del V2.
const CUSTOMER_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_MAX_AGE,
  path: "/",
};

// 401 GENÉRICO (D6): idéntico para email inexistente y password incorrecta.
// No filtra cuál campo falló ni si la cuenta existe (anti-enumeración).
const GENERIC_LOGIN_ERROR = "Email o contraseña incorrectos";

// Hash dummy con params scrypt válidos: cuando el email no existe se verifica
// contra este hash para que el costo de scrypt sea el MISMO que con un email
// existente — un atacante no puede distinguir existencia por timing.
const DUMMY_HASH = [
  "scrypt",
  16384,
  8,
  1,
  "A".repeat(22), // salt 16B base64url
  "A".repeat(86), // key 64B base64url
].join("$");

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

/**
 * GET /api/auth/customer — verifica la sesión customer.
 * 200 {authenticated:true, email, name} con cookie customer_session válida;
 * 401 {authenticated:false} sin ella o vencida (spec: sesión expirada →
 * el cliente redirige a /login).
 */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const user = getUserByEmail(session.email);
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    name: user?.name ?? null,
  });
}

/**
 * POST /api/auth/customer — registro o login según `body.intent`.
 *
 * register: valida email + password ≥ 8 (400), duplicado case-insensitive
 * (409, sin re-hashear nada), crea el usuario con hash scrypt y AUTOLOGUEA
 * setteando customer_session (201).
 *
 * login: verifica el hash con scrypt en tiempo constante; 401 genérico
 * idéntico si el email no existe o la password no cuadra. 400 si el body
 * es inválido.
 *
 * Las respuestas NUNCA exponen passwordHash ni datos de otros usuarios.
 */
export async function POST(request: NextRequest) {
  // Sin SESSION_SECRET no se puede firmar la cookie: cortamos ANTES de crear
  // el usuario para no dejar una cuenta registrada sin sesión.
  if (!isSessionConfigured()) {
    return NextResponse.json(
      {
        error:
          "Auth no configurada en el servidor. Falta SESSION_SECRET.",
      },
      { status: 503 }
    );
  }

  // El demo user (WU1/1.2) se siembra en dev desde el primer POST — si
  // DEMO_USER_PASSWORD está en env, existe para probar sin registrarse.
  await ensureDemoUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido en el body" },
      { status: 400 }
    );
  }

  const { intent, email, password } = (body ?? {}) as Record<string, unknown>;
  if (intent !== "register" && intent !== "login") {
    return NextResponse.json({ error: "intent inválido" }, { status: 400 });
  }
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const normalizedEmail = normalizeEmail(email);

  if (intent === "register") {
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }
    // Duplicado case-insensitive ANTES de hashear: no se re-hashea nada.
    // getUserByEmail normaliza (trim + lowercase), "A@x.com" === "a@x.com".
    if (getUserByEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(normalizedEmail, passwordHash);

    const cookieStore = await cookies();
    cookieStore.set(
      CUSTOMER_SESSION_COOKIE,
      createSessionToken(user.email, "customer"),
      CUSTOMER_SESSION_COOKIE_OPTIONS
    );

    return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
  }

  // intent === "login"
  const user = getUserByEmail(normalizedEmail);
  // Timing consistente: si el email no existe se verifica contra el DUMMY_HASH
  // (mismo costo scrypt) — la respuesta es SIEMPRE el mismo 401 genérico.
  const passwordMatches = await verifyPassword(
    user?.passwordHash ?? DUMMY_HASH,
    password
  );
  if (!user || !passwordMatches) {
    return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    CUSTOMER_SESSION_COOKIE,
    createSessionToken(user.email, "customer"),
    CUSTOMER_SESSION_COOKIE_OPTIONS
  );

  return NextResponse.json({ ok: true, email: user.email });
}

/**
 * DELETE /api/auth/customer — logout idempotente: borra la cookie
 * customer_session. Responde 200 siempre (aunque no haya sesión).
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/auth/customer — actualiza el nombre de perfil de la sesión.
 * Requiere sesión customer (401 si no). Body { name: string } — trim + máx
 * 60 chars; 400 si falta o es vacío. Devuelve { ok, email, name }.
 */
export async function PATCH(request: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "No autorizado", authenticated: false },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido en el body" },
      { status: 400 }
    );
  }

  const { name } = (body ?? {}) as Record<string, unknown>;
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "El nombre no puede estar vacío" },
      { status: 400 }
    );
  }

  const user = await updateUserName(session.email, name);
  if (!user) {
    return NextResponse.json(
      { error: "Cuenta no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, email: user.email, name: user.name });
}