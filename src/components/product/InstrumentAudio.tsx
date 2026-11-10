"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface InstrumentAudioProps {
  /** Ruta local del sample (por ejemplo /audio/instruments/bass.ogg). */
  src?: string;
  /** Texto corto que acompaña al reproductor. */
  label?: string;
  /** Nombre del instrumento, usado para el aria-label. */
  title: string;
  /** Variante visual: `card` para tarjetas, `detail` para la ficha. */
  variant?: "card" | "detail";
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/**
 * Reproductor compacto de la muestra de audio de un instrumento.
 *
 * Usa un `<audio>` nativo como fuente y dibuja controles propios para integrarse
 * con la estética del catálogo. Si el archivo no existe o el navegador no puede
 * decodificarlo, el componente desaparece en vez de dejar un control roto.
 */
export default function InstrumentAudio({
  src,
  label = "Escuchá cómo suena",
  title,
  variant = "card",
}: InstrumentAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [available, setAvailable] = useState(Boolean(src));
  const [loadedSrc, setLoadedSrc] = useState(src);

  // Reset defensivo cuando cambia la fuente (React recomienda ajustar estado
  // durante el render en vez de encadenar renders desde un efecto).
  if (src !== loadedSrc) {
    setLoadedSrc(src);
    setAvailable(Boolean(src));
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  if (!available || !src) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => setAvailable(false));
  };

  const percent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
  const isDetail = variant === "detail";

  return (
    <div
      className={
        isDetail
          ? "rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          : "rounded-xl border border-white/10 bg-white/[0.03] p-3"
      }
    >
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onError={() => setAvailable(false)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pausar muestra de ${title}` : `Reproducir muestra de ${title}`}
          aria-pressed={playing}
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep text-brand-black transition-opacity hover:opacity-90 ${
            isDetail ? "h-11 w-11" : "h-9 w-9"
          }`}
        >
          {playing ? (
            <Pause size={isDetail ? 18 : 15} aria-hidden="true" />
          ) : (
            <Play size={isDetail ? 18 : 15} aria-hidden="true" className="ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate font-medium text-zinc-300 ${
                isDetail ? "text-sm" : "text-[11px]"
              }`}
            >
              {label}
            </p>
            <span className="shrink-0 text-[10px] tabular-nums text-zinc-500">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>

          <div
            className="mt-2 flex items-end gap-[3px]"
            aria-hidden="true"
            style={{ height: isDetail ? 22 : 16 }}
          >
            {Array.from({ length: isDetail ? 32 : 22 }).map((_, index) => {
              const height = 20 + ((index * 37) % 80);
              const reached = percent > 0 && (index / (isDetail ? 32 : 22)) * 100 <= percent;
              return (
                <span
                  key={index}
                  className={`flex-1 rounded-full transition-colors ${
                    reached ? "bg-brand-accent" : "bg-white/15"
                  } ${playing && reached ? "animate-eq" : ""}`}
                  style={{
                    height: `${height}%`,
                    animationDelay: `${(index % 7) * 0.08}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
