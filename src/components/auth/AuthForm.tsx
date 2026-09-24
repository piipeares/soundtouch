"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

interface AuthFormProps {
  /** Ruta interna a la que volver tras autenticarse (sanitizada en la page). */
  returnTo?: string;
}

// Fallbacks de error por status: el server ya responde mensajes genéricos
// (sin enumerar cuentas); acá cubrimos los casos en que el body no traiga
// error o la red falle.
const STATUS_FALLBACKS: Record<number, string> = {
  400: "Revisá los datos ingresados",
  401: "Email o contraseña incorrectos",
  409: "Ya existe una cuenta con ese email",
};

function isSafePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://");
}

/**
 * Form de cuenta de cliente: login ↔ registro con toggle.
 * Valida en el cliente (email + password ≥ 8 en registro), llama a
 * /api/auth/customer y redirige a `returnTo` (search param sanitizado) o a
 * /favoritos. Las credenciales las escribe SIEMPRE el usuario — no hay
 * credenciales demo hardcodeadas acá (el demo se documenta en .env.example).
 */
export default function AuthForm({ returnTo }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination =
    returnTo && isSafePath(returnTo) ? returnTo : "/favoritos";

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validación cliente: la password corta se bloquea antes del fetch.
    if (mode === "register" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: mode, email, password }),
      });

      if (res.ok) {
        router.push(destination);
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.error || STATUS_FALLBACKS[res.status] || "Error inesperado");
    } catch {
      setError("Error de conexión, intentá de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-brand-gray rounded-2xl p-8 border border-zinc-800"
      noValidate
    >
      <h2 className="text-xl font-bold text-white mb-1">
        {isRegister ? "Creá tu cuenta" : "Ingresá a tu cuenta"}
      </h2>
      <p className="text-sm text-zinc-400 mb-6">
        {isRegister
          ? "Guardá tus favoritos y volvé a encontrarlos cuando quieras."
          : "Bienvenido de nuevo."}
      </p>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium text-zinc-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="auth-password" className="block text-sm font-medium text-zinc-300 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors"
              placeholder={isRegister ? "Mínimo 8 caracteres" : "••••••••"}
              required
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {isRegister && (
            <p className="mt-2 text-xs text-zinc-500">
              Mínimo 8 caracteres. Se guarda hasheada con scrypt, nunca en claro.
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-orange text-brand-black font-semibold rounded-lg hover:bg-brand-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Procesando..."
            : isRegister
              ? "Crear cuenta"
              : "Iniciar Sesión"}
        </button>
      </div>

      {/* Toggle login ↔ registro */}
      <p className="mt-6 text-center text-sm text-zinc-400">
        {isRegister ? (
          <>
            ¿Ya tenés cuenta?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-brand-orange hover:underline font-medium"
            >
              Ingresá
            </button>
          </>
        ) : (
          <>
            ¿No tenés cuenta?{" "}
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="text-brand-orange hover:underline font-medium"
            >
              Crear una
            </button>
          </>
        )}
      </p>
    </form>
  );
}