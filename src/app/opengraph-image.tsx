import { ImageResponse } from "next/og";

export const alt = "SoundTouch Instrumentos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OpenGraph image (task 6.3): tarjeta social con la paleta noir+amber del
 * sitio. Generada en runtime con ImageResponse (sin assets).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090B",
          color: "#FFFFFF",
          fontFamily: "serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "0.01em",
          }}
        >
          SoundTouch
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 36,
            color: "#FFB74D",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Instrumentos musicales
        </div>
      </div>
    ),
    size
  );
}