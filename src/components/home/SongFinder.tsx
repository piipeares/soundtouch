"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  MotionConfig,
} from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Database,
  MessageCircle,
  Music,
  Radar,
  Search,
  Sparkles,
} from "lucide-react";
import InstrumentImage from "@/components/product/InstrumentImage";
import { useCurrency } from "@/context/CurrencyContext";
import { generateWhatsAppLink } from "@/config/business";
import { formatPrice } from "@/lib/utils";
import {
  EXAMPLE_QUERIES,
  SOUNDMATCH_STATS,
  recommendInstruments,
  type InstrumentMatch,
  type RecommendResult,
} from "@/lib/songMatcher";
import type { Instrument } from "@/types";

interface SongFinderProps {
  instruments: Instrument[];
}

type Phase = "idle" | "analyzing" | "done" | "error";

const ANALYSIS_STEPS = [
  { label: "Leyendo la canción", icon: Music },
  { label: "Detectando género e instrumentación", icon: Radar },
  { label: "Cruzando con el catálogo SoundTouch", icon: Database },
  { label: "Armando tu combinación", icon: Sparkles },
] as const;

const MIN_ANALYSIS_MS = 2200;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * SoundMatch (client island): la herramienta diferencial de SoundTouch.
 *
 * Flujo: el usuario escribe una canción/artista/estilo → se dispara un
 * análisis con pasos animados → se muestra la combinación de 2-3 instrumentos
 * con rol, afinidad y explicación. El análisis corre en /api/recommend y, si
 * la red falla, cae al mismo motor en el cliente (puro, sin dependencias).
 */
export default function SongFinder({ instruments }: SongFinderProps) {
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stepTimer = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (stepTimer.current !== null) {
        window.clearInterval(stepTimer.current);
        stepTimer.current = null;
      }
    };
  }, []);

  const runAnalysis = useCallback(
    async (rawQuery: string) => {
      const value = rawQuery.trim();

      if (value.length < 2) {
        setError("Escribí al menos 2 caracteres: una canción, un artista o un estilo.");
        setPhase("error");
        return;
      }

      setError(null);
      setResult(null);
      setPhase("analyzing");
      setStep(0);

      if (stepTimer.current !== null) {
        window.clearInterval(stepTimer.current);
      }
      stepTimer.current = window.setInterval(() => {
        setStep((current) => Math.min(current + 1, ANALYSIS_STEPS.length - 1));
      }, 520);

      const startedAt = Date.now();
      let data: RecommendResult | null = null;

      try {
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: value }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        data = (await response.json()) as RecommendResult;
      } catch {
        // Red caída o endpoint indisponible: el motor es puro y corre igual
        // en el cliente con el catálogo que ya recibió la página.
        data = recommendInstruments(value, instruments);
      }

      const remaining = MIN_ANALYSIS_MS - (Date.now() - startedAt);
      if (remaining > 0) await delay(remaining);

      if (stepTimer.current !== null) {
        window.clearInterval(stepTimer.current);
        stepTimer.current = null;
      }

      if (!mounted.current) return;

      if (!data || data.recommendations.length === 0) {
        setError(
          "No pudimos armar una combinación para esa búsqueda. Probá con otra canción o un estilo."
        );
        setPhase("error");
        return;
      }

      setResult(data);
      setPhase("done");

      // En mobile el resultado queda debajo del fold: lo acercamos sin robar
      // el scroll cuando ya está visible (block: "nearest").
      requestAnimationFrame(() => {
        const target = document.getElementById("soundmatch-result");
        if (!target) return;
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "nearest",
        });
      });
    },
    [instruments]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runAnalysis(query);
  };

  const handleChip = (value: string) => {
    setQuery(value);
    void runAnalysis(value);
  };

  const isAnalyzing = phase === "analyzing";
  const progress = ((step + 1) / ANALYSIS_STEPS.length) * 100;

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="asistente"
        className="relative scroll-mt-24 overflow-hidden border-y border-white/5 py-20 md:py-28"
      >
        <div className="absolute inset-0 bg-glow-amber-soft" aria-hidden="true" />
        <div className="absolute inset-0 bg-grid-faint" aria-hidden="true" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Encabezado */}
          <div className="text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent"
            >
              <Sparkles size={14} aria-hidden="true" />
              SoundMatch · Asistente inteligente
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl"
            >
              ¿Qué canción{" "}
              <span className="text-gradient-amber">querés sonar?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg"
            >
              Escribí una canción, un artista o un estilo. SoundMatch analiza su
              sonido y te dice con qué instrumentos del catálogo acercarte, el rol
              de cada uno y por qué.
            </motion.p>
          </div>

          {/* Buscador */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-10 max-w-3xl"
          >
            <div className="rounded-2xl border border-white/10 bg-surface/85 p-2 shadow-lifted backdrop-blur-xl transition-colors focus-within:border-brand-accent/60 md:rounded-full">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 items-center gap-3 px-3 md:px-5">
                  <Search
                    size={20}
                    className="shrink-0 text-zinc-500"
                    aria-hidden="true"
                  />
                  <label htmlFor="soundmatch-query" className="sr-only">
                    Canción, artista o estilo musical
                  </label>
                  <input
                    id="soundmatch-query"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    maxLength={120}
                    disabled={isAnalyzing}
                    placeholder="Ej: Stairway to Heaven, Nirvana, blues…"
                    className="w-full bg-transparent py-3 text-base text-foreground outline-none placeholder:text-zinc-500 disabled:opacity-60 md:text-lg"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-accent to-brand-accent-deep px-7 py-3.5 font-semibold text-brand-black shadow-glow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:rounded-full"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-black/30 border-t-brand-black" />
                      Analizando
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} aria-hidden="true" />
                      Analizar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sugerencias */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Probá con
              </span>
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleChip(example)}
                  disabled={isAnalyzing}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>

            {/* Métricas reales del motor */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              <span>
                <strong className="font-semibold text-brand-accent">
                  {SOUNDMATCH_STATS.songs}
                </strong>{" "}
                canciones analizadas
              </span>
              <span className="hidden text-white/15 sm:inline" aria-hidden="true">
                ·
              </span>
              <span>
                <strong className="font-semibold text-brand-accent">
                  {instruments.length}
                </strong>{" "}
                instrumentos en stock
              </span>
              <span className="hidden text-white/15 sm:inline" aria-hidden="true">
                ·
              </span>
              <span>
                <strong className="font-semibold text-brand-accent">
                  {SOUNDMATCH_STATS.genres}
                </strong>{" "}
                géneros
              </span>
            </div>
          </motion.form>

          {/* Paneles de estado */}
          <div
            id="soundmatch-result"
            aria-live="polite"
            className="mt-10 scroll-mt-24"
          >
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  role="status"
                  className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-surface/80 p-6 shadow-card backdrop-blur-xl md:p-8"
                >
                  <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
                    {/* Ecualizador */}
                    <div className="flex items-end gap-1.5" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                        <span
                          key={bar}
                          className="animate-eq w-1.5 rounded-full bg-gradient-to-t from-brand-accent-deep to-brand-accent-bright"
                          style={{
                            height: `${18 + (bar % 4) * 10}px`,
                            animationDelay: `${bar * 0.11}s`,
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex-1 md:px-6">
                      <p className="text-center font-display text-xl text-foreground md:text-left">
                        Analizando «{query.trim()}»
                      </p>
                      <p className="mt-1 text-center text-sm text-zinc-500 md:text-left">
                        {ANALYSIS_STEPS[step].label}…
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ANALYSIS_STEPS.map((analysisStep, index) => {
                        const Icon = analysisStep.icon;
                        const complete = index < step;
                        const active = index === step;
                        return (
                          <span
                            key={analysisStep.label}
                            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                              complete
                                ? "border-brand-accent/40 bg-brand-accent/15 text-brand-accent"
                                : active
                                ? "border-brand-accent/60 bg-brand-accent/10 text-brand-accent"
                                : "border-white/10 bg-white/[0.02] text-zinc-600"
                            }`}
                          >
                            {complete ? (
                              <Check size={15} aria-hidden="true" />
                            ) : (
                              <Icon size={15} aria-hidden="true" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}

              {phase === "error" && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                  className="mx-auto flex max-w-2xl items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </motion.div>
              )}

              {phase === "done" && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ResultPanel result={result} currency={currency} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

// ---------------------------------------------------------------------------
// Panel de resultado
// ---------------------------------------------------------------------------

function ResultPanel({
  result,
  currency,
}: {
  result: RecommendResult;
  currency: "USD" | "ARS";
}) {
  const { matchedSong, detectedGenre, confidence, summary, recommendations, fallback } =
    result;

  const names = recommendations
    .map((recommendation) => recommendation.instrument.name)
    .join(", ");

  const whatsappMessage = matchedSong
    ? `Hola! Usé SoundMatch con «${matchedSong.title}» de ${matchedSong.artist} y me recomendó: ${names}. ¿Me ayudan a armar esa combinación?`
    : `Hola! Usé SoundMatch buscando "${result.query}" y me recomendó: ${names}. ¿Me ayudan a armar esa combinación?`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Match / resumen */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-accent/20 bg-gradient-to-br from-brand-accent/[0.09] via-white/[0.02] to-transparent p-6 shadow-card md:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">
              {matchedSong
                ? matchedSong.estimated
                  ? "Perfil estimado"
                  : "Canción identificada"
                : "Análisis por perfil"}
            </p>

            <h3 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
              {matchedSong ? `«${matchedSong.title}»` : detectedGenre}
            </h3>

            <p className="mt-1 text-sm text-zinc-400">
              {matchedSong
                ? `${matchedSong.artist}${
                    matchedSong.year ? ` · ${matchedSong.year}` : ""
                  } · ${matchedSong.genre}`
                : fallback
                ? "No es una coincidencia exacta: es la mejor aproximación del catálogo."
                : "Combinación armada a partir del estilo detectado."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1.5 text-xs font-semibold text-brand-accent">
              <Sparkles size={13} aria-hidden="true" />
              {confidence}% de afinidad
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300">
              {detectedGenre}
            </span>
          </div>
        </div>

        <p className="relative mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300 md:text-base">
          {summary}
        </p>
      </div>

      {/* Tarjetas */}
      <div
        className={`mt-6 grid grid-cols-1 gap-5 ${
          recommendations.length === 2
            ? "mx-auto max-w-4xl md:grid-cols-2"
            : "md:grid-cols-3"
        }`}
      >
        {recommendations.map((recommendation, index) => (
          <MatchCard
            key={recommendation.instrument.id}
            recommendation={recommendation}
            index={index}
            currency={currency}
          />
        ))}
      </div>

      {/* CTA final */}
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <a
          href={generateWhatsAppLink(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep px-7 py-3.5 font-semibold text-brand-black shadow-glow transition-opacity hover:opacity-90"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Quiero esta combinación
        </a>
        <p className="text-xs text-zinc-500">
          Te respondemos por WhatsApp y ajustamos la recomendación a tu presupuesto.
        </p>
      </div>
    </div>
  );
}

function MatchCard({
  recommendation,
  index,
  currency,
}: {
  recommendation: InstrumentMatch;
  index: number;
  currency: "USD" | "ARS";
}) {
  const { instrument, matchScore, role, reason } = recommendation;

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.09, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent/40 hover:shadow-lifted"
    >
      {/* Imagen + match */}
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <InstrumentImage
            src={instrument.image}
            alt={instrument.name}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-brand-black shadow-glow">
          {matchScore}% match
        </span>
        <span
          className="absolute right-4 top-2 font-display text-4xl font-bold text-white/15"
          aria-hidden="true"
        >
          0{index + 1}
        </span>

        <div className="absolute inset-x-4 bottom-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
            {role}
          </p>
          <h4 className="mt-0.5 line-clamp-1 font-display text-lg font-semibold text-white">
            {instrument.name}
          </h4>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-zinc-400">{reason}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              {instrument.brand}
            </p>
            <p className="text-xl font-bold text-foreground">
              {formatPrice(
                instrument.offerPrice ?? instrument.price,
                currency
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/producto/${instrument.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
            >
              Ver ficha
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <a
              href={generateWhatsAppLink(
                `Hola! Me interesa el ${instrument.name} que me recomendó SoundMatch. ¿Está disponible?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Consultar por ${instrument.name} por WhatsApp`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-brand-black transition-colors hover:bg-brand-accent-bright"
            >
              <MessageCircle size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
