import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth";

// Store de usuarios sobre un archivo JSON local: data/users.json.
// Mismo patrón que instruments.ts: seed/reseed automático si el archivo
// falta o está corrupto, y escrituras serializadas con un mutex en memoria
// (promise chain) para evitar write races entre requests concurrentes.
//
// Backend-only: no revalida páginas (los usuarios no afectan páginas
// server-rendered; la sesión se maneja por cookie firmada).
//
// Shape: { users: Array<{ id, email, passwordHash, createdAt, updatedAt }> }
// El passwordHash es un string PHC autodescriptivo scrypt con salt embebido
// (ver src/lib/auth.ts). NUNCA exponer passwordHash fuera de este módulo o
// de auth — las respuestas de API no deben contener hashes ni salts.
//
// LÍMITE (ver README): store de archivo local = single-process. Sirve para
// dev y un VPS de instancia única; en serverless multi-instancia el
// filesystem no es compartido y se necesitaría una DB real.

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface UsersFile {
  users: User[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

// ---------------------------------------------------------------------------
// Mutex: encadena promesas para serializar las escrituras.
// ---------------------------------------------------------------------------
let writeChain: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(action: () => T | Promise<T>): Promise<T> {
  const run = writeChain.then(action);
  // Si falla, la cadena sigue viva para los próximos requests.
  writeChain = run.catch(() => undefined);
  return run;
}

function isUser(value: unknown): value is User {
  if (value === null || typeof value !== "object") return false;
  const user = value as User;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.passwordHash === "string" &&
    typeof user.createdAt === "number" &&
    typeof user.updatedAt === "number"
  );
}

function isUsersFile(value: unknown): value is UsersFile {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray((value as UsersFile).users) &&
    (value as UsersFile).users.every(isUser)
  );
}

/**
 * Siembra (o re-siembra) el archivo con un store VACÍO. El usuario demo se
 * siembra aparte en ensureDemoUser(): requiere hashing scrypt ASYNC, y el
 * seed del archivo es síncrono (patrón instruments.ts).
 */
function seedStore(): UsersFile {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  return { users: [] };
}

function readRaw(): User[] {
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isUsersFile(parsed)) return [...parsed.users];
    // Archivo presente pero con shape inválido → reseed controlado.
    console.warn(
      "[store] data/users.json con formato inesperado; reseed a store vacío"
    );
    return seedStore().users;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      // Primera corrida: el archivo todavía no existe.
      return seedStore().users;
    }
    // JSON corrupto u otro error de lectura → reseed controlado.
    console.warn(
      "[store] no se pudo leer data/users.json; reseed a store vacío:",
      error
    );
    return seedStore().users;
  }
}

function writeRaw(users: User[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify({ users }, null, 2), "utf8");
}

/** Normaliza un email: trim + lowercase (única forma de comparar emails). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Lista completa de usuarios (auto-siembra si falta/corrompe el archivo). */
export function readUsers(): User[] {
  return readRaw();
}

/** Busca un usuario por email normalizado (trim + lowercase). */
export function getUserByEmail(email: string): User | undefined {
  const normalized = normalizeEmail(email);
  return readRaw().find((user) => user.email === normalized);
}

/**
 * Crea un usuario con su password YA HASHADA (nunca en claro). El email se
 * normaliza antes de persistir. Escritura serializada (mutex).
 */
export function createUser(email: string, passwordHash: string): Promise<User> {
  return withWriteLock(() => {
    const users = readRaw();
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      email: normalizeEmail(email),
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    writeRaw([...users, user]);
    return user;
  });
}

// ---------------------------------------------------------------------------
// Demo user (design D3): `demo@soundtouch.local`.
// La password demo NUNCA vive en source — llega por env (`.env.example`
// documenta DEMO_USER_PASSWORD) y se hashea con scrypt en runtime, nunca
// precomputada. Sin env configurado → el demo user no se siembra
// (best-effort; el store de usuarios sigue funcionando).
// ---------------------------------------------------------------------------
const DEMO_USER_EMAIL_DEFAULT = "demo@soundtouch.local";

function readDemoCredentials(): { email: string; password: string } | null {
  const email = process.env.DEMO_USER_EMAIL ?? DEMO_USER_EMAIL_DEFAULT;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) return null;
  return { email, password };
}

/**
 * Siembra el usuario demo si el store está vacío. Idempotente y serializado
 * (mutex): una segunda llamada concurrente no duplica el usuario. Devuelve el
 * usuario creado o null (store no vacío, o demo no configurado en env).
 */
export async function ensureDemoUser(): Promise<User | null> {
  const demo = readDemoCredentials();
  if (!demo) return null;
  return withWriteLock(async () => {
    const users = readRaw();
    if (users.length > 0) return null;
    const passwordHash = await hashPassword(demo.password);
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      email: normalizeEmail(demo.email),
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    writeRaw([user]);
    return user;
  });
}