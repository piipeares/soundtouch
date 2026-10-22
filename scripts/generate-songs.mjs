import fs from "node:fs";
import path from "node:path";

/**
 * Genera la base de canciones de SoundMatch a partir del dataset público
 * "Spotify Tracks Dataset" (114k tracks, 114 géneros, popularidad).
 *
 * - Descarga el CSV a data/ (gitignored) si no existe.
 * - Mapea los 114 géneros del dataset a los 21 géneros del motor.
 * - Toma las canciones más populares de cada género, sin duplicados.
 * - Escribe src/data/songs.generated.json (committed) y song-count.json.
 *
 * El runtime NO llama APIs externas: este script corre offline.
 */

const DATASET_URL =
  "https://huggingface.co/datasets/maharshipandya/spotify-tracks-dataset/resolve/main/dataset.csv";
const CACHE_FILE = path.join(process.cwd(), "data", "spotify-tracks.csv");
const OUT_DIR = path.join(process.cwd(), "src", "data");
const OUT_FILE = path.join(OUT_DIR, "songs.generated.json");
const COUNT_FILE = path.join(OUT_DIR, "song-count.json");
const PER_GENRE = 160;

const GENRE_MAP = {
  acoustic: "folk",
  afrobeat: "folklore",
  "alt-rock": "rock",
  alternative: "indie",
  ambient: "electronica",
  anime: "pop",
  "black-metal": "metal",
  bluegrass: "country",
  blues: "blues",
  brazil: "bossa",
  breakbeat: "electronica",
  british: "rock",
  cantopop: "pop",
  "chicago-house": "electronica",
  children: "pop",
  chill: "electronica",
  classical: "clasica",
  club: "electronica",
  comedy: "pop",
  country: "country",
  dance: "electronica",
  dancehall: "reggae",
  "death-metal": "metal",
  "deep-house": "electronica",
  "detroit-techno": "electronica",
  disco: "soul",
  disney: "pop",
  "drum-and-bass": "electronica",
  dub: "reggae",
  dubstep: "electronica",
  edm: "electronica",
  electro: "electronica",
  electronic: "electronica",
  emo: "punk",
  folk: "folk",
  forro: "folklore",
  french: "pop",
  funk: "funk",
  garage: "electronica",
  german: "pop",
  gospel: "soul",
  goth: "indie",
  grindcore: "metal",
  groove: "funk",
  grunge: "rock",
  guitar: "rock",
  happy: "pop",
  "hard-rock": "rock",
  hardcore: "punk",
  hardstyle: "electronica",
  "heavy-metal": "metal",
  "hip-hop": "hiphop",
  "honky-tonk": "country",
  house: "electronica",
  idm: "electronica",
  indian: "folk",
  "indie-pop": "indie",
  indie: "indie",
  industrial: "metal",
  iranian: "folk",
  "j-dance": "electronica",
  "j-idol": "pop",
  "j-pop": "pop",
  "j-rock": "rock",
  jazz: "jazz",
  "k-pop": "pop",
  kids: "pop",
  latin: "folklore",
  latino: "folklore",
  malay: "pop",
  mandopop: "pop",
  metal: "metal",
  metalcore: "metal",
  "minimal-techno": "electronica",
  mpb: "bossa",
  "new-age": "electronica",
  opera: "clasica",
  pagode: "folklore",
  party: "pop",
  piano: "clasica",
  "pop-film": "pop",
  pop: "pop",
  "power-pop": "pop",
  "progressive-house": "electronica",
  "psych-rock": "rock",
  "punk-rock": "punk",
  punk: "punk",
  "r-n-b": "soul",
  reggae: "reggae",
  reggaeton: "hiphop",
  "rock-n-roll": "rock",
  rock: "rock",
  rockabilly: "rock",
  romance: "pop",
  sad: "pop",
  salsa: "folklore",
  samba: "folklore",
  sertanejo: "folklore",
  "show-tunes": "pop",
  "singer-songwriter": "folk",
  ska: "ska",
  sleep: "electronica",
  songwriter: "folk",
  soul: "soul",
  spanish: "pop",
  study: "electronica",
  swedish: "pop",
  "synth-pop": "pop",
  tango: "tango",
  techno: "electronica",
  trance: "electronica",
  "trip-hop": "electronica",
  turkish: "folk",
  "world-music": "folk",
};

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * El mirror mezcla UTF-8 con algunos bytes Windows-1252 (ej. "Blue Öyster
 * Cult"). Decodificamos UTF-8 cuando la secuencia es válida y caemos a
 * Windows-1252 para bytes sueltos, sin romper tildes correctas.
 */
const CP1252_EXTRA = {
  0x80: "€",
  0x82: "‚",
  0x83: "ƒ",
  0x84: "„",
  0x85: "…",
  0x86: "†",
  0x87: "‡",
  0x88: "ˆ",
  0x89: "‰",
  0x8a: "Š",
  0x8b: "‹",
  0x8c: "Œ",
  0x8e: "Ž",
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
  0x98: "˜",
  0x99: "™",
  0x9a: "š",
  0x9b: "›",
  0x9c: "œ",
  0x9e: "ž",
  0x9f: "Ÿ",
};

function decodeMixed(buffer) {
  let out = "";
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    if (byte < 0x80) {
      out += String.fromCharCode(byte);
      continue;
    }

    const length = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 0;
    if (length > 0 && i + length <= buffer.length) {
      const slice = buffer.subarray(i, i + length);
      const decoded = slice.toString("utf8");
      if (!decoded.includes("\uFFFD")) {
        out += decoded;
        i += length - 1;
        continue;
      }
    }

    out += CP1252_EXTRA[byte] ?? String.fromCharCode(byte);
  }
  return out;
}

function clean(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

async function ensureDataset() {
  if (fs.existsSync(CACHE_FILE)) {
    const size = fs.statSync(CACHE_FILE).size;
    if (size > 1_000_000) {
      console.log(`[songs] cache: ${CACHE_FILE} (${size} bytes)`);
      return;
    }
  }

  console.log("[songs] descargando dataset...");
  const response = await fetch(DATASET_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`No se pudo descargar el dataset: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, buffer);
  console.log(`[songs] descargado: ${buffer.length} bytes`);
}

await ensureDataset();

const rows = parseCsv(decodeMixed(fs.readFileSync(CACHE_FILE)));
const header = rows[0];
const idx = Object.fromEntries(header.map((name, i) => [name, i]));

if (idx.track_name === undefined || idx.artists === undefined || idx.track_genre === undefined) {
  throw new Error("El CSV no tiene las columnas esperadas.");
}

const byGenre = new Map();
const seen = new Set();

for (let i = 1; i < rows.length; i += 1) {
  const rawGenre = clean(rows[i][idx.track_genre]).toLowerCase();
  const genre = GENRE_MAP[rawGenre];
  if (!genre) continue;

  const title = clean(rows[i][idx.track_name]);
  const artist = clean(rows[i][idx.artists]);
  const popularity = Number(rows[i][idx.popularity]);
  const duration = Number(rows[i][idx.duration_ms]);

  if (!title || !artist || title.length > 120 || artist.length > 120) continue;
  if (!Number.isFinite(popularity)) continue;
  if (!Number.isFinite(duration) || duration < 45_000 || duration > 900_000) continue;

  const primaryArtist = artist.split(";")[0];
  const key = `${normalize(title)}::${normalize(primaryArtist)}`;
  if (seen.has(key)) continue;
  seen.add(key);

  if (!byGenre.has(genre)) byGenre.set(genre, []);
  byGenre.get(genre).push({ title, artist, popularity });
}

const generated = [];

for (const genre of [...byGenre.keys()].sort()) {
  const pool = byGenre.get(genre).sort((a, b) => b.popularity - a.popularity);
  const picked = pool.slice(0, PER_GENRE).map(({ title, artist }) => ({
    title,
    artist,
    genre,
  }));
  generated.push(...picked);
  console.log(`[songs] ${genre}: ${picked.length}`);
}

generated.sort((a, b) => {
  if (a.genre !== b.genre) return a.genre.localeCompare(b.genre);
  return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(generated, null, 0) + "\n", "utf8");
fs.writeFileSync(
  COUNT_FILE,
  JSON.stringify({ generated: generated.length }, null, 2) + "\n",
  "utf8"
);

console.log(`[songs] total generadas: ${generated.length}`);
console.log(`[songs] salida: ${OUT_FILE}`);
