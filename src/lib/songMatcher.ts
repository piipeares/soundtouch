import { Instrument, InstrumentFineType } from "@/types";
import songCount from "@/data/song-count.json";

/**
 * SoundMatch — motor de recomendación musical de SoundTouch.
 *
 * Dado el nombre de una canción, un artista o un estilo, devuelve los 2-3
 * instrumentos del catálogo que más acercan a ese sonido, con el rol que
 * cumple cada uno y una explicación contextual.
 *
 * Diseño:
 * - 100% determinista y offline: no depende de API keys, red ni servicios
 *   externos. Es un sistema experto (knowledge base + scoring) que puede
 *   correr tanto en el servidor como en el cliente.
 * - No toca filesystem: recibe el catálogo como argumento. Así funciona igual
 *   en un VPS, en serverless o en el browser.
 * - Matching en capas: coincidencia de canción (fuzzy) → artista → género
 *   detectado por palabras clave → perfil versátil de fallback.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Tipo fino de instrumento (más específico que la categoría comercial). */
export type FineType = InstrumentFineType;

type Role = Exclude<FineType, "accessory">;

export type GenreKey =
  | "rock"
  | "metal"
  | "blues"
  | "jazz"
  | "funk"
  | "soul"
  | "pop"
  | "indie"
  | "punk"
  | "reggae"
  | "cumbia"
  | "tango"
  | "folklore"
  | "electronica"
  | "hiphop"
  | "clasica"
  | "country"
  | "folk"
  | "flamenco"
  | "bossa"
  | "ska";

export interface SongProfile {
  title: string;
  artist: string;
  year?: number;
  genre: GenreKey;
  roles: Role[];
  tags: string[];
  /** Frase corta que describe el sonido; se usa en el resumen. */
  signature: string;
  /**
   * true cuando el perfil se infiere del género (dataset masivo) en vez de
   * estar curado canción por canción. Baja la confianza y se muestra distinto
   * en la UI.
   */
  estimated?: boolean;
}

/** Entrada compacta del dataset generado: el resto se expande por género. */
export interface GeneratedSong {
  title: string;
  artist: string;
  genre: GenreKey;
}

interface GenreProfile {
  label: string;
  roles: Role[];
  tags: string[];
  signature: string;
}

export interface InstrumentMatch {
  instrument: Instrument;
  /** Afinidad relativa 0-99 para mostrar en la UI. */
  matchScore: number;
  role: string;
  reason: string;
}

export interface RecommendResult {
  query: string;
  matchedSong: {
    title: string;
    artist: string;
    year: number | null;
    genre: string;
    estimated: boolean;
  } | null;
  detectedGenre: string;
  confidence: number;
  summary: string;
  recommendations: InstrumentMatch[];
  /** true cuando no hubo match de canción ni de género. */
  fallback: boolean;
}

// ---------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<Role, string> = {
  electric: "Guitarra principal",
  acoustic: "Guitarra acústica",
  bass: "Bajo y groove",
  keys: "Armonía y teclados",
  drums: "Batería y pulso",
  vocal: "Voz",
  reverb: "Ambiente y espacio",
  fx: "Efectos y color",
  monitoring: "Monitoreo",
};

const ROLE_NOUNS: Record<Role, string> = {
  electric: "una guitarra eléctrica",
  acoustic: "una guitarra acústica",
  bass: "un bajo",
  keys: "teclados",
  drums: "una batería",
  vocal: "un micrófono de voz",
  reverb: "una reverb",
  fx: "un multiefecto",
  monitoring: "auriculares de monitoreo",
};

const GENRE_LABELS: Record<GenreKey, string> = {
  rock: "Rock",
  metal: "Metal",
  blues: "Blues",
  jazz: "Jazz",
  funk: "Funk",
  soul: "Soul / R&B",
  pop: "Pop",
  indie: "Indie / Alternativo",
  punk: "Punk",
  reggae: "Reggae",
  cumbia: "Cumbia",
  tango: "Tango",
  folklore: "Folklore latino",
  electronica: "Electrónica",
  hiphop: "Hip hop / Rap",
  clasica: "Clásica",
  country: "Country / Americana",
  folk: "Folk / Cantautor",
  flamenco: "Flamenco",
  bossa: "Bossa nova",
  ska: "Ska",
};

// ---------------------------------------------------------------------------
// Knowledge base — canciones icónicas
// ---------------------------------------------------------------------------

export const CURATED_SONGS: SongProfile[] = [
  // ------------------------------- Rock -------------------------------
  {
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    year: 1971,
    genre: "rock",
    roles: ["acoustic", "electric", "reverb"],
    tags: ["folk", "fingerpicking", "humbucker", "sustain", "ambient"],
    signature: "Arranca en acústico íntimo y escala hasta un solo eléctrico monumental.",
  },
  {
    title: "Whole Lotta Love",
    artist: "Led Zeppelin",
    year: 1969,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock", "punchy"],
    signature: "Riff de humbuckers, bajo que empuja y batería detrás del groove.",
  },
  {
    title: "Back in Black",
    artist: "AC/DC",
    year: 1980,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock", "punchy"],
    signature: "El manual del riff: humbuckers secos, bajo sólido y batería metronómica.",
  },
  {
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    year: 1987,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "sustain", "rock", "vintage"],
    signature: "Intro de guitarra limpia y un solo que se sostiene en el aire.",
  },
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    year: 1975,
    genre: "rock",
    roles: ["keys", "electric", "bass"],
    tags: ["piano", "vintage", "sustain", "rock"],
    signature: "Piano teatral, coros y una eléctrica que aparece en el momento justo.",
  },
  {
    title: "Comfortably Numb",
    artist: "Pink Floyd",
    year: 1979,
    genre: "rock",
    roles: ["electric", "bass", "reverb", "drums"],
    tags: ["sustain", "ambient", "space", "blues"],
    signature: "Dos solos que flotan: sustain, delay y espacio infinito.",
  },
  {
    title: "Smoke on the Water",
    artist: "Deep Purple",
    year: 1972,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock"],
    signature: "El riff más reconocible del rock duro, con humbuckers al frente.",
  },
  {
    title: "Paranoid",
    artist: "Black Sabbath",
    year: 1970,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "rock"],
    signature: "Riff oscuro, tempo alto y una base rítmica que no perdona.",
  },
  {
    title: "Highway to Hell",
    artist: "AC/DC",
    year: 1979,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock"],
    signature: "Rock de estadio: acordes abiertos, bajo redondo y batería simple y efectiva.",
  },
  {
    title: "Thunderstruck",
    artist: "AC/DC",
    year: 1990,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "clean", "rock", "twang"],
    signature: "El arpegio limpio que se vuelve himno, con una Les Paul bien al frente.",
  },
  {
    title: "While My Guitar Gently Weeps",
    artist: "The Beatles",
    year: 1968,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "sustain", "blues", "vintage"],
    signature: "Solo de blues y sustain sobre una balada beatle.",
  },
  {
    title: "Come Together",
    artist: "The Beatles",
    year: 1969,
    genre: "rock",
    roles: ["bass", "electric", "drums"],
    tags: ["punchy", "groove", "vintage"],
    signature: "El bajo camina y marca la canción; la guitarra colorea.",
  },
  {
    title: "Paint It Black",
    artist: "The Rolling Stones",
    year: 1966,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["twang", "fuzz", "rock"],
    signature: "Riff oscuro y misterioso: la guitarra es el gancho.",
  },
  {
    title: "Satisfaction",
    artist: "The Rolling Stones",
    year: 1965,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["fuzz", "crunch", "rock"],
    signature: "El fuzz más famoso de la historia sobre un riff simple y pegadizo.",
  },
  {
    title: "Free Bird",
    artist: "Lynyrd Skynyrd",
    year: 1973,
    genre: "rock",
    roles: ["acoustic", "electric", "bass"],
    tags: ["folk", "humbucker", "sustain", "rock"],
    signature: "Balada acústica que termina en un solo eléctrico interminable.",
  },
  {
    title: "Hotel California",
    artist: "Eagles",
    year: 1976,
    genre: "rock",
    roles: ["acoustic", "electric", "bass"],
    tags: ["fingerpicking", "clean", "warm", "country"],
    signature: "Dos guitarras que se responden: acústica cálida y eléctrica limpia.",
  },
  {
    title: "Wish You Were Here",
    artist: "Pink Floyd",
    year: 1975,
    genre: "rock",
    roles: ["acoustic", "electric", "keys"],
    tags: ["fingerpicking", "warm", "ambient", "folk"],
    signature: "Acústica íntima, slide y sintetizadores que aparecen como humo.",
  },
  {
    title: "Enter Sandman",
    artist: "Metallica",
    year: 1991,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "metal", "punchy"],
    signature: "Riff de humbuckers afinados graves y batería que entra como una topadora.",
  },
  {
    title: "Master of Puppets",
    artist: "Metallica",
    year: 1986,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "shred", "metal"],
    signature: "Downpicking brutal, solos veloces y una base rítmica de hierro.",
  },
  {
    title: "Nothing Else Matters",
    artist: "Metallica",
    year: 1991,
    genre: "metal",
    roles: ["acoustic", "electric", "bass"],
    tags: ["fingerpicking", "clean", "sustain", "metal"],
    signature: "Arpegio acústico limpio y una eléctrica que entra con peso.",
  },
  {
    title: "The Trooper",
    artist: "Iron Maiden",
    year: 1983,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "high-gain", "shred", "metal"],
    signature: "Guitarras gemelas, galope de bajo y batería sin respiro.",
  },
  {
    title: "Chop Suey!",
    artist: "System of a Down",
    year: 2001,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "shred", "metal"],
    signature: "Dinámica bipolar: gritos, silencios y una guitarra que corta.",
  },
  {
    title: "Killing in the Name",
    artist: "Rage Against the Machine",
    year: 1992,
    genre: "metal",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "fuzz", "high-gain", "funk"],
    signature: "Riff de fuzz, bajo con groove y una explosión final inolvidable.",
  },
  {
    title: "Song 2",
    artist: "Blur",
    year: 1997,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "fuzz", "crunch", "indie"],
    signature: "Dos minutos de distorsión efervescente y batería punk.",
  },
  {
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    year: 1991,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "fuzz", "crunch", "punk"],
    signature: "El riff de una generación: distorsión simple, bajo melódico y batería enorme.",
  },
  {
    title: "Everlong",
    artist: "Foo Fighters",
    year: 1997,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock", "punk"],
    signature: "Riff de apertura y una batería que sostiene todo el vuelo.",
  },
  {
    title: "Do I Wanna Know?",
    artist: "Arctic Monkeys",
    year: 2013,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "fuzz", "groove", "indie"],
    signature: "Riff hipnótico de humbuckers y un groove que se arrastra.",
  },
  {
    title: "Seven Nation Army",
    artist: "The White Stripes",
    year: 2003,
    genre: "rock",
    roles: ["electric", "drums", "bass"],
    tags: ["humbucker", "fuzz", "crunch"],
    signature: "Un riff de guitarra con octava que se volvió canto de estadio.",
  },
  {
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    year: 1999,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["clean", "single-coil", "funk", "rock"],
    signature: "Guitarra limpia, bajo funk y batería que respira.",
  },
  {
    title: "Under the Bridge",
    artist: "Red Hot Chili Peppers",
    year: 1991,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["clean", "single-coil", "funk", "soul"],
    signature: "Arpegios limpios y un bajo que canta tanto como la voz.",
  },
  {
    title: "Purple Haze",
    artist: "Jimi Hendrix",
    year: 1967,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "fuzz", "blues", "vintage"],
    signature: "Fuzz y single-coils al límite de la retroalimentación.",
  },
  {
    title: "Little Wing",
    artist: "Jimi Hendrix",
    year: 1967,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "clean", "blues", "vintage"],
    signature: "Limpio, cálido y lleno de matices: la eléctrica como voz.",
  },
  {
    title: "Voodoo Child (Slight Return)",
    artist: "Jimi Hendrix",
    year: 1968,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "fuzz", "blues", "groove"],
    signature: "Groove pantanoso y una guitarra que habla.",
  },
  {
    title: "Layla",
    artist: "Derek and the Dominos",
    year: 1970,
    genre: "rock",
    roles: ["electric", "keys", "drums"],
    tags: ["humbucker", "sustain", "blues", "piano"],
    signature: "Dos guitarras entrelazadas y un piano que empuja el final.",
  },
  {
    title: "Sunshine of Your Love",
    artist: "Cream",
    year: 1967,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "blues", "vintage"],
    signature: "Riff pesado con blues en la sangre.",
  },

  // ------------------------------- Blues -------------------------------
  {
    title: "Pride and Joy",
    artist: "Stevie Ray Vaughan",
    year: 1983,
    genre: "blues",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "blues", "clean", "twang"],
    signature: "Shuffle de Texas: single-coils con mordida y un bajo que camina.",
  },
  {
    title: "The Thrill Is Gone",
    artist: "B.B. King",
    year: 1969,
    genre: "blues",
    roles: ["electric", "keys", "bass"],
    tags: ["humbucker", "sustain", "blues", "soul"],
    signature: "Bendings que lloran y un sustain que no se apura.",
  },
  {
    title: "Sweet Home Chicago",
    artist: "Robert Johnson",
    year: 1936,
    genre: "blues",
    roles: ["acoustic", "electric", "bass"],
    tags: ["fingerpicking", "blues", "vintage", "warm"],
    signature: "Blues de raíz: acústica, voz y un pulso que viene del delta.",
  },
  {
    title: "Hoochie Coochie Man",
    artist: "Muddy Waters",
    year: 1954,
    genre: "blues",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "blues", "groove"],
    signature: "Blues eléctrico de Chicago: riff simple, groove pesado.",
  },
  {
    title: "Crossroads",
    artist: "Cream",
    year: 1968,
    genre: "blues",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "blues", "rock"],
    signature: "Blues llevado al rock: solos veloces y base potente.",
  },

  // -------------------------------- Jazz --------------------------------
  {
    title: "So What",
    artist: "Miles Davis",
    year: 1959,
    genre: "jazz",
    roles: ["bass", "drums", "keys"],
    tags: ["jazz", "clean", "piano"],
    signature: "Modal y espacioso: el bajo camina y la batería susurra.",
  },
  {
    title: "Take Five",
    artist: "Dave Brubeck",
    year: 1959,
    genre: "jazz",
    roles: ["keys", "drums", "bass"],
    tags: ["jazz", "piano", "clean", "groove"],
    signature: "Un 5/4 inconfundible: piano protagonista y batería juguetona.",
  },
  {
    title: "Giant Steps",
    artist: "John Coltrane",
    year: 1960,
    genre: "jazz",
    roles: ["keys", "bass", "drums"],
    tags: ["jazz", "piano", "fast"],
    signature: "Armonía vertiginosa; la base rítmica corre al mismo ritmo.",
  },
  {
    title: "Autumn Leaves",
    artist: "Bill Evans",
    year: 1959,
    genre: "jazz",
    roles: ["keys", "bass", "drums"],
    tags: ["jazz", "piano", "warm"],
    signature: "Balada de jazz: piano íntimo, bajo cálido y escobillas.",
  },
  {
    title: "Round Midnight",
    artist: "Thelonious Monk",
    year: 1947,
    genre: "jazz",
    roles: ["keys", "bass", "drums"],
    tags: ["jazz", "piano", "blues"],
    signature: "Armonía de madrugada: piano con carácter y ritmo que respira.",
  },

  // ---------------------------- Funk / Soul ----------------------------
  {
    title: "Superstition",
    artist: "Stevie Wonder",
    year: 1972,
    genre: "funk",
    roles: ["keys", "bass", "drums"],
    tags: ["funk", "piano", "groove", "punchy"],
    signature: "Clavinet picante, bajo sincopado y batería que no deja de moverse.",
  },
  {
    title: "Sex Machine",
    artist: "James Brown",
    year: 1970,
    genre: "funk",
    roles: ["bass", "drums", "electric"],
    tags: ["funk", "groove", "punchy", "clean"],
    signature: "El uno del funk: bajo y batería encerrados, guitarra al servicio del groove.",
  },
  {
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    year: 2014,
    genre: "funk",
    roles: ["bass", "electric", "drums"],
    tags: ["funk", "slap", "groove", "pop"],
    signature: "Funk moderno: bajo slap, guitarra rítmica y batería seca.",
  },
  {
    title: "Another One Bites the Dust",
    artist: "Queen",
    year: 1980,
    genre: "funk",
    roles: ["bass", "electric", "drums"],
    tags: ["funk", "slap", "groove", "punchy"],
    signature: "Bajo icónico, groove disco y una guitarra que corta.",
  },
  {
    title: "Beat It",
    artist: "Michael Jackson",
    year: 1982,
    genre: "pop",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "rock", "pop"],
    signature: "El solo de guitarra sobre un beat pop: humbuckers al rojo.",
  },
  {
    title: "Billie Jean",
    artist: "Michael Jackson",
    year: 1982,
    genre: "pop",
    roles: ["bass", "keys", "drums"],
    tags: ["pop", "groove", "synth", "punchy"],
    signature: "Bajo y batería construyen el misterio; los sintetizadores lo visten.",
  },
  {
    title: "Purple Rain",
    artist: "Prince",
    year: 1984,
    genre: "pop",
    roles: ["electric", "keys", "drums"],
    tags: ["single-coil", "sustain", "soul", "pop"],
    signature: "Balada soul con un solo de guitarra que se lleva todo.",
  },
  {
    title: "Let's Stay Together",
    artist: "Al Green",
    year: 1971,
    genre: "soul",
    roles: ["keys", "bass", "drums"],
    tags: ["soul", "organ", "warm", "groove"],
    signature: "Órgano cálido, bajo redondo y una batería que balancea.",
  },
  {
    title: "Respect",
    artist: "Aretha Franklin",
    year: 1967,
    genre: "soul",
    roles: ["keys", "bass", "drums", "vocal"],
    tags: ["soul", "piano", "groove", "punchy"],
    signature: "Voz al frente, piano y una base que empuja.",
  },
  {
    title: "Ain't No Sunshine",
    artist: "Bill Withers",
    year: 1971,
    genre: "soul",
    roles: ["keys", "bass", "drums"],
    tags: ["soul", "piano", "warm"],
    signature: "Casi silencio: piano, bajo y espacio para la voz.",
  },

  // -------------------------------- Pop --------------------------------
  {
    title: "Shape of You",
    artist: "Ed Sheeran",
    year: 2017,
    genre: "pop",
    roles: ["acoustic", "bass", "drums"],
    tags: ["pop", "acoustic", "groove", "warm"],
    signature: "Loop acústico, bajo y percusión: pop que se sostiene en la guitarra.",
  },
  {
    title: "Someone Like You",
    artist: "Adele",
    year: 2011,
    genre: "pop",
    roles: ["keys", "vocal"],
    tags: ["piano", "warm", "pop"],
    signature: "Piano y voz, nada más: la canción no necesita otra cosa.",
  },
  {
    title: "Hello",
    artist: "Adele",
    year: 2015,
    genre: "pop",
    roles: ["keys", "drums", "bass"],
    tags: ["piano", "pop", "soul"],
    signature: "Piano cinematográfico y una batería que entra tarde para emocionar.",
  },
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    year: 2019,
    genre: "electronica",
    roles: ["keys", "bass", "drums"],
    tags: ["synth", "electronic", "pop", "groove"],
    signature: "Sintetizadores ochentosos, batería electrónica y bajo pulsante.",
  },
  {
    title: "Save Your Tears",
    artist: "The Weeknd",
    year: 2020,
    genre: "electronica",
    roles: ["keys", "bass", "drums"],
    tags: ["synth", "electronic", "pop", "groove"],
    signature: "Synth-pop melancólico: teclados brillantes y base seca.",
  },
  {
    title: "Rolling in the Deep",
    artist: "Adele",
    year: 2010,
    genre: "soul",
    roles: ["vocal", "acoustic", "drums"],
    tags: ["soul", "blues", "punchy", "pop"],
    signature: "Voz y palmas; la acústica y la batería construyen el golpe.",
  },
  {
    title: "bad guy",
    artist: "Billie Eilish",
    year: 2019,
    genre: "pop",
    roles: ["bass", "keys", "drums"],
    tags: ["bass", "synth", "electronic", "clean"],
    signature: "Bajo al frente, sintetizadores mínimos y un beat que susurra.",
  },

  // -------------------------- Indie / Alternative --------------------------
  {
    title: "Creep",
    artist: "Radiohead",
    year: 1992,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["clean", "single-coil", "crunch", "indie"],
    signature: "Tres acordes que explotan: limpio al principio, distorsión al final.",
  },
  {
    title: "Wonderwall",
    artist: "Oasis",
    year: 1995,
    genre: "indie",
    roles: ["acoustic", "bass", "drums"],
    tags: ["acoustic", "folk", "warm", "indie"],
    signature: "Acústica con capo y una banda que la levanta.",
  },
  {
    title: "Don't Look Back in Anger",
    artist: "Oasis",
    year: 1995,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "clean", "rock", "indie"],
    signature: "Piano y guitarras que se abrazan en un himno de estadio.",
  },
  {
    title: "Mr. Brightside",
    artist: "The Killers",
    year: 2004,
    genre: "indie",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "indie", "rock"],
    signature: "Riff de dos notas que no para y una batería que corre.",
  },

  // -------------------------------- Punk --------------------------------
  {
    title: "Blitzkrieg Bop",
    artist: "Ramones",
    year: 1976,
    genre: "punk",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "punk"],
    signature: "Tres acordes, velocidad y cero adornos.",
  },
  {
    title: "American Idiot",
    artist: "Green Day",
    year: 2004,
    genre: "punk",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "punk", "rock"],
    signature: "Punk de estadio: riff filoso y batería al galope.",
  },
  {
    title: "Anarchy in the U.K.",
    artist: "Sex Pistols",
    year: 1976,
    genre: "punk",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "fuzz", "punk"],
    signature: "Caos controlado: distorsión, actitud y ritmo urgente.",
  },

  // ------------------------------- Reggae -------------------------------
  {
    title: "No Woman No Cry",
    artist: "Bob Marley",
    year: 1974,
    genre: "reggae",
    roles: ["electric", "bass", "drums"],
    tags: ["clean", "single-coil", "reggae", "groove"],
    signature: "Guitarra en el offbeat, bajo profundo y batería relajada.",
  },
  {
    title: "Three Little Birds",
    artist: "Bob Marley",
    year: 1977,
    genre: "reggae",
    roles: ["acoustic", "bass", "drums"],
    tags: ["acoustic", "reggae", "warm", "groove"],
    signature: "Acústica simple, bajo cálido y un pulso que invita a bailar.",
  },
  {
    title: "Redemption Song",
    artist: "Bob Marley",
    year: 1980,
    genre: "reggae",
    roles: ["acoustic", "vocal"],
    tags: ["acoustic", "folk", "fingerpicking", "warm"],
    signature: "Solo guitarra y voz: la canción en su forma más desnuda.",
  },

  // ------------------------------ Latino -------------------------------
  {
    title: "De Música Ligera",
    artist: "Soda Stereo",
    year: 1990,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "clean", "rock", "groove"],
    signature: "Riff limpio y pegadizo, bajo melódico y batería bailable.",
  },
  {
    title: "Persiana Americana",
    artist: "Soda Stereo",
    year: 1986,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "clean", "groove", "rock"],
    signature: "New wave argentino: guitarras limpias, bajo saltarín y batería seca.",
  },
  {
    title: "Cuando Pase el Temblor",
    artist: "Soda Stereo",
    year: 1986,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["single-coil", "clean", "groove", "reggae"],
    signature: "Pulso reggae, guitarra limpia y una melodía que se pega.",
  },
  {
    title: "Ji Ji Ji",
    artist: "Patricio Rey y sus Redonditos de Ricota",
    year: 1988,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock"],
    signature: "Riff sucio, banda cruda y un final catártico.",
  },
  {
    title: "La Bestia Pop",
    artist: "Patricio Rey y sus Redonditos de Ricota",
    year: 1986,
    genre: "rock",
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock"],
    signature: "Rock de garaje con una guitarra que muerde.",
  },
  {
    title: "Crimen",
    artist: "Gustavo Cerati",
    year: 2006,
    genre: "pop",
    roles: ["electric", "bass", "drums"],
    tags: ["clean", "single-coil", "pop", "ambient"],
    signature: "Elegancia pop: guitarras limpias, bajo redondo y batería precisa.",
  },
  {
    title: "Los Dinosaurios",
    artist: "Charly García",
    year: 1983,
    genre: "pop",
    roles: ["keys", "acoustic", "bass"],
    tags: ["piano", "pop", "warm", "vintage"],
    signature: "Piano y acústica para una canción que duele sin gritar.",
  },
  {
    title: "Seminare",
    artist: "Serú Girán",
    year: 1978,
    genre: "rock",
    roles: ["keys", "bass", "drums"],
    tags: ["piano", "groove", "jazz", "rock"],
    signature: "Piano eléctrico, bajo virtuoso y batería con swing.",
  },
  {
    title: "El Amor Después del Amor",
    artist: "Fito Páez",
    year: 1992,
    genre: "pop",
    roles: ["keys", "acoustic", "bass"],
    tags: ["piano", "pop", "warm"],
    signature: "Piano y acústica para un clásico del pop argentino.",
  },
  {
    title: "Mal Bicho",
    artist: "Los Fabulosos Cadillacs",
    year: 1995,
    genre: "ska",
    roles: ["bass", "electric", "drums"],
    tags: ["groove", "punchy", "ska", "funk"],
    signature: "Ska con metales imaginarios: bajo y batería llevan el groove.",
  },
  {
    title: "La Bamba",
    artist: "Ritchie Valens",
    year: 1958,
    genre: "folklore",
    roles: ["acoustic", "bass", "drums"],
    tags: ["acoustic", "warm", "folk", "groove"],
    signature: "Ritmo de son jarocho: acústica, bajo y percusión.",
  },
  {
    title: "Oye Como Va",
    artist: "Santana",
    year: 1970,
    genre: "folklore",
    roles: ["electric", "keys", "drums"],
    tags: ["piano", "single-coil", "groove", "funk"],
    signature: "Órgano y guitarra latina sobre un groove que no se detiene.",
  },
  {
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    year: 2017,
    genre: "pop",
    roles: ["acoustic", "bass", "drums"],
    tags: ["acoustic", "pop", "groove", "warm"],
    signature: "Acústica, bajo y ritmo latino: pop global.",
  },
  {
    title: "La Bicicleta",
    artist: "Carlos Vives & Shakira",
    year: 2016,
    genre: "folklore",
    roles: ["acoustic", "bass", "drums"],
    tags: ["acoustic", "folk", "groove", "warm"],
    signature: "Acústica festiva y percusión colombiana.",
  },
  {
    title: "Libertango",
    artist: "Astor Piazzolla",
    year: 1974,
    genre: "tango",
    roles: ["keys", "bass", "drums"],
    tags: ["piano", "tango", "dramatic", "jazz"],
    signature: "Tango nuevo: bandoneón y piano en tensión constante.",
  },
  {
    title: "Por Una Cabeza",
    artist: "Carlos Gardel",
    year: 1935,
    genre: "tango",
    roles: ["keys", "acoustic"],
    tags: ["tango", "piano", "vintage", "warm"],
    signature: "Tango clásico: piano, violines y una melodía eterna.",
  },

  // ------------------------ Electrónica / Hip hop ------------------------
  {
    title: "Lose Yourself",
    artist: "Eminem",
    year: 2002,
    genre: "hiphop",
    roles: ["keys", "bass", "drums"],
    tags: ["hiphop", "punchy", "piano", "dramatic"],
    signature: "Beat de piano tenso, bajo grave y batería seca.",
  },
  {
    title: "HUMBLE.",
    artist: "Kendrick Lamar",
    year: 2017,
    genre: "hiphop",
    roles: ["keys", "bass", "drums"],
    tags: ["hiphop", "punchy", "piano", "minimal"],
    signature: "Beat minimalista con piano filoso y 808 al frente.",
  },
  {
    title: "Sicko Mode",
    artist: "Travis Scott",
    year: 2018,
    genre: "hiphop",
    roles: ["keys", "bass", "drums"],
    tags: ["hiphop", "synth", "bass", "trap"],
    signature: "Trap por capas: sintetizadores oscuros y 808 profundos.",
  },
  {
    title: "Get Lucky",
    artist: "Daft Punk",
    year: 2013,
    genre: "electronica",
    roles: ["electric", "bass", "drums"],
    tags: ["funk", "clean", "groove", "electronic"],
    signature: "Guitarra funk limpia, bajo disco y batería humana.",
  },
  {
    title: "Around the World",
    artist: "Daft Punk",
    year: 1997,
    genre: "electronica",
    roles: ["keys", "bass", "drums"],
    tags: ["electronic", "groove", "synth", "bass"],
    signature: "House francés: sintetizadores hipnóticos y un bajo que insiste.",
  },
  {
    title: "Enjoy the Silence",
    artist: "Depeche Mode",
    year: 1990,
    genre: "electronica",
    roles: ["keys", "bass", "drums"],
    tags: ["synth", "electronic", "pop", "ambient"],
    signature: "Synth-pop oscuro: teclados envolventes y una base precisa.",
  },

  // --------------------------- Country / Folk ---------------------------
  {
    title: "Hurt",
    artist: "Johnny Cash",
    year: 2002,
    genre: "country",
    roles: ["acoustic", "vocal"],
    tags: ["acoustic", "folk", "warm"],
    signature: "Acústica desnuda y una voz que dice todo.",
  },
  {
    title: "Folsom Prison Blues",
    artist: "Johnny Cash",
    year: 1955,
    genre: "country",
    roles: ["electric", "bass", "drums"],
    tags: ["twang", "clean", "country", "rock"],
    signature: "Twang de Telecaster y un ritmo de tren.",
  },
  {
    title: "Jolene",
    artist: "Dolly Parton",
    year: 1973,
    genre: "country",
    roles: ["acoustic", "vocal", "bass"],
    tags: ["acoustic", "country", "fingerpicking", "warm"],
    signature: "Acústica y voz con una urgencia que no se olvida.",
  },
  {
    title: "The Sound of Silence",
    artist: "Simon & Garfunkel",
    year: 1964,
    genre: "folk",
    roles: ["acoustic", "vocal"],
    tags: ["acoustic", "fingerpicking", "folk", "warm"],
    signature: "Dos voces y una acústica: folk en estado puro.",
  },
  {
    title: "Blowin' in the Wind",
    artist: "Bob Dylan",
    year: 1963,
    genre: "folk",
    roles: ["acoustic", "vocal"],
    tags: ["acoustic", "folk", "fingerpicking", "warm"],
    signature: "Acústica, armónica y voz: protesta en tres acordes.",
  },
  {
    title: "Landslide",
    artist: "Fleetwood Mac",
    year: 1975,
    genre: "folk",
    roles: ["acoustic", "vocal"],
    tags: ["acoustic", "fingerpicking", "warm", "pop"],
    signature: "Acústica íntima y una voz que crece.",
  },
];

// ---------------------------------------------------------------------------
// Perfiles por género (para búsquedas tipo "quiero tocar blues")
// ---------------------------------------------------------------------------

const GENRE_PROFILES: Record<GenreKey, GenreProfile> = {
  rock: {
    label: GENRE_LABELS.rock,
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "crunch", "rock"],
    signature: "Guitarra eléctrica al frente, bajo y batería sosteniendo el pulso.",
  },
  metal: {
    label: GENRE_LABELS.metal,
    roles: ["electric", "bass", "drums"],
    tags: ["humbucker", "high-gain", "metal"],
    signature: "Humbuckers con ganancia, bajo apretado y batería contundente.",
  },
  blues: {
    label: GENRE_LABELS.blues,
    roles: ["electric", "bass", "drums"],
    tags: ["blues", "single-coil", "clean"],
    signature: "Tono con mordida, dinámica y espacio para que la frase respire.",
  },
  jazz: {
    label: GENRE_LABELS.jazz,
    roles: ["keys", "bass", "drums"],
    tags: ["jazz", "piano", "clean"],
    signature: "Armonía rica, bajo que camina y batería con escobillas.",
  },
  funk: {
    label: GENRE_LABELS.funk,
    roles: ["bass", "electric", "drums"],
    tags: ["funk", "slap", "groove", "punchy"],
    signature: "El groove manda: bajo protagonista, guitarra rítmica y batería seca.",
  },
  soul: {
    label: GENRE_LABELS.soul,
    roles: ["keys", "bass", "drums"],
    tags: ["soul", "organ", "warm"],
    signature: "Órgano o piano cálido, bajo redondo y batería que balancea.",
  },
  pop: {
    label: GENRE_LABELS.pop,
    roles: ["acoustic", "keys", "bass"],
    tags: ["pop", "acoustic", "warm"],
    signature: "Acústica y teclados como base, con bajo y batería al servicio de la canción.",
  },
  indie: {
    label: GENRE_LABELS.indie,
    roles: ["electric", "bass", "drums"],
    tags: ["indie", "clean", "crunch"],
    signature: "Guitarras limpias que se ensucian cuando hace falta, y una banda compacta.",
  },
  punk: {
    label: GENRE_LABELS.punk,
    roles: ["electric", "bass", "drums"],
    tags: ["punk", "crunch", "fast"],
    signature: "Velocidad, distorsión y cero adornos.",
  },
  reggae: {
    label: GENRE_LABELS.reggae,
    roles: ["electric", "bass", "drums"],
    tags: ["reggae", "clean", "groove"],
    signature: "Guitarra en el offbeat, bajo profundo y batería relajada.",
  },
  cumbia: {
    label: GENRE_LABELS.cumbia,
    roles: ["keys", "bass", "drums"],
    tags: ["keys", "groove", "pop"],
    signature: "Teclados melódicos, bajo caminador y ritmo bailable.",
  },
  tango: {
    label: GENRE_LABELS.tango,
    roles: ["keys", "acoustic", "bass"],
    tags: ["tango", "piano", "dramatic"],
    signature: "Piano y cuerdas con dramatismo, y un pulso que respira.",
  },
  folklore: {
    label: GENRE_LABELS.folklore,
    roles: ["acoustic", "bass", "drums"],
    tags: ["folk", "acoustic", "warm", "groove"],
    signature: "Acústica protagonista y percusión que invita a moverse.",
  },
  electronica: {
    label: GENRE_LABELS.electronica,
    roles: ["keys", "bass", "drums"],
    tags: ["electronic", "synth", "groove"],
    signature: "Sintetizadores, bajo pulsante y una batería precisa.",
  },
  hiphop: {
    label: GENRE_LABELS.hiphop,
    roles: ["keys", "bass", "drums"],
    tags: ["hiphop", "punchy", "bass"],
    signature: "Beat sólido: teclados con carácter, graves al frente y batería seca.",
  },
  clasica: {
    label: GENRE_LABELS.clasica,
    roles: ["keys", "acoustic", "bass"],
    tags: ["piano", "clean", "warm"],
    signature: "Piano como centro, cuerdas y dinámica de concierto.",
  },
  country: {
    label: GENRE_LABELS.country,
    roles: ["acoustic", "electric", "bass"],
    tags: ["country", "twang", "acoustic"],
    signature: "Acústica con twang, bajo simple y batería que acompaña.",
  },
  folk: {
    label: GENRE_LABELS.folk,
    roles: ["acoustic", "vocal", "bass"],
    tags: ["acoustic", "folk", "fingerpicking", "warm"],
    signature: "Acústica y voz al centro, con espacio para que la canción respire.",
  },
  flamenco: {
    label: GENRE_LABELS.flamenco,
    roles: ["acoustic", "keys", "bass"],
    tags: ["acoustic", "clean", "warm"],
    signature: "Guitarra con rasgueo y compás; percusión y palmas como color.",
  },
  bossa: {
    label: GENRE_LABELS.bossa,
    roles: ["acoustic", "keys", "bass"],
    tags: ["acoustic", "warm", "clean"],
    signature: "Acústica suave, armonía de jazz y un pulso de arena.",
  },
  ska: {
    label: GENRE_LABELS.ska,
    roles: ["bass", "electric", "drums"],
    tags: ["ska", "groove", "punchy"],
    signature: "Groove saltarín: bajo y batería marcan, la guitarra contesta.",
  },
};

/** Keywords (ya normalizadas, sin acentos) para detectar un género. */
const GENRE_KEYWORDS: Array<[GenreKey, string[]]> = [
  ["metal", ["metal", "heavy metal", "thrash", "shred", "hardcore", "metalcore"]],
  ["punk", ["punk", "hardcore punk"]],
  ["blues", ["blues", "blus", "delta blues", "chicago blues"]],
  ["jazz", ["jazz", "bebop", "swing", "fusion"]],
  ["funk", ["funk", "funk rock", "groove"]],
  ["soul", ["soul", "motown", "rnb", "r b", "rhythm and blues"]],
  ["reggae", ["reggae", "roots reggae", "dub"]],
  ["ska", ["ska"]],
  ["tango", ["tango", "milonga"]],
  ["cumbia", ["cumbia", "cuarteto"]],
  ["folklore", ["folklore", "folclore", "chacarera", "zamba", "carnavalito"]],
  ["flamenco", ["flamenco", "rumba", "sevillana"]],
  ["bossa", ["bossa", "bossa nova"]],
  ["hiphop", ["hip hop", "hiphop", "rap", "trap"]],
  ["electronica", ["electronica", "edm", "techno", "house", "synthpop", "synth pop"]],
  ["clasica", ["clasica", "orquesta", "barroco", "sinfonica", "opera"]],
  ["country", ["country", "americana", "bluegrass"]],
  ["folk", ["folk", "acustico", "acoustic", "cantautor", "singer songwriter"]],
  ["indie", ["indie", "alternativo", "alternative", "shoegaze"]],
  ["rock", ["rock", "rocanrol", "hard rock", "rock nacional", "grunge"]],
  ["pop", ["pop", "pop latino", "balada", "comercial"]],
];

/** Consultas sugeridas para los chips de la UI. */
export const EXAMPLE_QUERIES = [
  "Stairway to Heaven",
  "Smells Like Teen Spirit",
  "Superstition",
  "De Música Ligera",
  "Bohemian Rhapsody",
  "Wonderwall",
] as const;

/**
 * Expande las canciones del dataset con el perfil de su género. El JSON
 * generado guarda solo title/artist/genre para mantenerse chico y evitar
 * duplicar roles/tags que ya viven en GENRE_PROFILES.
 */
export function expandGeneratedSongs(songs: GeneratedSong[]): SongProfile[] {
  return songs
    .filter((song) => Boolean(GENRE_PROFILES[song.genre]))
    .map((song) => {
      const profile = GENRE_PROFILES[song.genre];
      return {
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        roles: profile.roles,
        tags: profile.tags,
        signature: profile.signature,
        estimated: true,
      };
    });
}

/** Métricas reales del motor (se muestran en la sección para dar contexto). */
export const SOUNDMATCH_STATS = {
  songs: CURATED_SONGS.length + songCount.generated,
  genres: Object.keys(GENRE_PROFILES).length,
} as const;

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textOf(instrument: Instrument): string {
  return normalize(
    `${instrument.name} ${instrument.brand} ${instrument.model ?? ""} ${
      instrument.description
    }`
  );
}

// ---------------------------------------------------------------------------
// Clasificación de instrumentos
// ---------------------------------------------------------------------------

function classifyInstrument(instrument: Instrument): FineType {
  if (instrument.fineType) return instrument.fineType;

  switch (instrument.category) {
    case "guitarra-electrica":
      return "electric";
    case "guitarra-acustica":
    case "guitarra-clasica":
      return "acoustic";
    case "bajo-electrico":
    case "bajo-acustico":
      return "bass";
    case "pedal": {
      const text = textOf(instrument);
      return /reverb|bigsky|ambient/.test(text) ? "reverb" : "fx";
    }
    case "accesorio": {
      const text = textOf(instrument);
      if (/microf|shure|sm7|vocal|broadcast/.test(text)) return "vocal";
      if (/auricular|headphone|monitoring|m50|mixing/.test(text)) {
        return "monitoring";
      }
      return "accessory";
    }
    case "otro-instrumento": {
      const text = textOf(instrument);
      if (/bater|drum|roland|pearl|td 17|roadshow|shell|parche/.test(text)) {
        return "drums";
      }
      if (/teclad|piano|synth|nord|yamaha|montage|stage|organo/.test(text)) {
        return "keys";
      }
      return "accessory";
    }
    default:
      return "accessory";
  }
}

/** Rasgos sonoros inferidos de marca/modelo/descripción. */
function deriveTraits(instrument: Instrument): Set<string> {
  if (instrument.traits?.length) {
    return new Set(instrument.traits);
  }

  const text = textOf(instrument);
  const traits = new Set<string>();

  const rules: Array<[RegExp, string[]]> = [
    [
      /humbucker|dimarzio|caoba|mahogany|les paul|gibson/,
      ["humbucker", "sustain", "vintage", "rock", "crunch"],
    ],
    [
      /single coil|telecaster|twang/,
      ["single-coil", "twang", "clean", "country", "blues", "funk"],
    ],
    [
      /shred|floyd rose|prestige|high performance/,
      ["shred", "high-gain", "metal", "humbucker"],
    ],
    [
      /martin|spruce|acoustic|acustica|palisandro|rosewood/,
      ["acoustic", "folk", "fingerpicking", "warm"],
    ],
    [
      /precision|p bass|punchy|definido/,
      ["bass", "punchy", "motown", "rock", "soul"],
    ],
    [
      /warwick|active|mec|modern/,
      ["bass", "modern", "active", "funk", "slap"],
    ],
    [
      /nord|piano|hammond|organo/,
      ["keys", "piano", "organ", "vintage", "soul", "jazz"],
    ],
    [
      /montage|synth|awm2|fm x|synthesizer/,
      ["keys", "synth", "electronic", "modern", "pop"],
    ],
    [
      /roland|td 17|mesh|electronica/,
      ["drums", "electronic", "modern", "practice"],
    ],
    [/pearl|roadshow|basswood|shells/, ["drums", "acoustic", "rock", "punk"]],
    [/shure|sm7|broadcast|voz/, ["vocal", "studio", "broadcast", "warm"]],
    [
      /auricular|headphone|monitoring|mixing|drivers/,
      ["monitoring", "detail", "studio", "mix"],
    ],
    [
      /reverb|bigsky|algoritmos/,
      ["reverb", "ambient", "space", "atmosphere"],
    ],
    [
      /multiefecto|eventide|h9|midi|efectos/,
      ["fx", "delay", "modulation", "versatile"],
    ],
    [/fuzz/, ["fuzz"]],
    [/blues/, ["blues", "soul"]],
    [/jazz/, ["jazz", "clean"]],
    [/metal/, ["metal", "high-gain"]],
    [/funk|slap/, ["funk", "slap", "groove"]],
    [/rock/, ["rock"]],
    [/pop/, ["pop"]],
  ];

  for (const [pattern, tags] of rules) {
    if (pattern.test(text)) tags.forEach((tag) => traits.add(tag));
  }

  // Rasgos base por tipo: aseguran que un instrumento nuevo sin keywords
  // igual pueda competir por su rol.
  switch (classifyInstrument(instrument)) {
    case "electric":
      traits.add("electric");
      if (!traits.has("humbucker") && !traits.has("single-coil")) {
        traits.add("humbucker");
      }
      break;
    case "acoustic":
      traits.add("acoustic");
      traits.add("warm");
      break;
    case "bass":
      traits.add("bass");
      break;
    case "keys":
      traits.add("keys");
      break;
    case "drums":
      traits.add("drums");
      break;
    case "vocal":
      traits.add("vocal");
      break;
    case "reverb":
      traits.add("reverb");
      break;
    case "fx":
      traits.add("fx");
      break;
    case "monitoring":
      traits.add("monitoring");
      break;
    default:
      break;
  }

  return traits;
}

// ---------------------------------------------------------------------------
// Matching de canción / género
// ---------------------------------------------------------------------------

interface SongMatch {
  song: SongProfile;
  score: number;
}

function findBestSong(
  query: string,
  songs: SongProfile[]
): SongMatch | null {
  const q = normalize(query);
  if (!q) return null;

  const qTokens = q.split(" ").filter((token) => token.length > 2);
  let best: SongMatch | null = null;

  for (const song of songs) {
    const title = normalize(song.title);
    const artist = normalize(song.artist);
    let score = 0;

    // Artista exacto gana sobre título exacto: "Nirvana" o "Daft Punk" son
    // consultas de banda, no canciones homónimas de otro artista.
    if (artist === q) {
      score = 100;
    } else if (title === q) {
      score = 98;
    } else if (
      title.length > 0 &&
      (title.includes(q) || (q.length >= 6 && q.includes(title)))
    ) {
      score = 90;
    } else {
      // Con miles de canciones, un solo token ("love", "night") generaría
      // matches falsos. Solo usamos coincidencia parcial con 2+ tokens.
      if (qTokens.length >= 2) {
        const haystack = `${title} ${artist}`;
        const hits = qTokens.filter((token) => haystack.includes(token)).length;
        score = Math.round((hits / qTokens.length) * 70);
      }

      if (q.length >= 3) {
        const artistTokens = artist.split(" ");
        if (
          artist.startsWith(`${q} `) ||
          artistTokens.includes(q)
        ) {
          score = Math.max(score, 78);
        }
      }
    }

    if (!best || score > best.score) {
      best = { song, score };
    }
  }

  return best && best.score >= 40 ? best : null;
}

function detectExactGenre(query: string): GenreKey | null {
  const q = normalize(query);
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.includes(q)) return genre;
  }
  return null;
}

function detectGenre(query: string): GenreKey | null {
  const q = ` ${normalize(query)} `;
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((keyword) => q.includes(` ${keyword} `) || q.includes(` ${keyword}s `))) {
      return genre;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

interface Scored {
  instrument: Instrument;
  fine: FineType;
  traits: Set<string>;
  score: number;
}

const ROLE_WEIGHTS = [52, 40, 30, 22];

function scoreInstrument(
  instrument: Instrument,
  roles: Role[],
  tags: string[]
): Scored | null {
  const fine = classifyInstrument(instrument);
  if (fine === "accessory") return null;

  const traits = deriveTraits(instrument);
  const roleIndex = roles.indexOf(fine as Role);
  if (roleIndex === -1) return null;

  let score = ROLE_WEIGHTS[roleIndex] ?? 18;

  let tagHits = 0;
  for (const tag of tags) {
    if (traits.has(tag)) tagHits += 1;
  }
  score += Math.min(30, tagHits * 10);

  if (instrument.featured) score += 2;
  if (instrument.offerPrice !== undefined) score += 1;

  return { instrument, fine, traits, score };
}

function buildReason(scored: Scored, context: ReasonContext): string {
  const { fine, traits } = scored;
  const song = context.songTitle ? `«${context.songTitle}»` : null;

  if (fine === "electric") {
    if (traits.has("single-coil")) {
      return song
        ? `${song} se apoya en single-coils definidos. Esta guitarra te da ese tono limpio y con mordida sin vueltas.`
        : "Para este estilo, los single-coils definidos son la vía más directa a ese tono limpio y con mordida.";
    }
    if (traits.has("high-gain")) {
      return song
        ? `Para el empuje y la ganancia de ${song}, esta eléctrica está pensada para responder rápido y sostener notas al rojo.`
        : "Para este estilo, necesitás una eléctrica que responda rápido y sostenga notas con ganancia.";
    }
    return song
      ? `El sonido de ${song} vive en humbuckers con cuerpo. Esta guitarra te da ese empuje y sustain de entrada.`
      : "Para este estilo, los humbuckers con cuerpo son la base del empuje y el sustain.";
  }

  if (fine === "acoustic") {
    return song
      ? `${song} respira a guitarra acústica: cuerdas con cuerpo y definición para acompañar la voz o sostener el tema sola.`
      : "Para este estilo, una acústica con cuerpo y definición es la base para acompañar la voz o sostener el tema.";
  }

  if (fine === "bass") {
    return song
      ? `El bajo es el motor rítmico de ${song}. Este modelo tiene el peso y la definición para hacerlo sentir.`
      : "Para este estilo, el bajo es el motor rítmico: peso, definición y groove.";
  }

  if (fine === "keys") {
    return song
      ? `La armonía de ${song} nace en teclas. Este instrumento trae el color y la textura que la canción pide.`
      : "Para este estilo, los teclados aportan el color y la textura armónica.";
  }

  if (fine === "drums") {
    return song
      ? `La batería marca el pulso de ${song}. Acá tenés el control y la dinámica para llevarlo.`
      : "Para este estilo, la batería marca el pulso: control y dinámica.";
  }

  if (fine === "vocal") {
    return song
      ? "Si la vas a cantar, la voz necesita un micro que la capture sin opacarla."
      : "Si lo vas a cantar, la voz necesita un micro que la capture sin opacarla.";
  }

  if (fine === "reverb") {
    return song
      ? `El aire y la profundidad de ${song} se construyen con reverb de calidad.`
      : "Para este estilo, la reverb construye el aire y la profundidad.";
  }

  if (fine === "fx") {
    return song
      ? `Para los detalles y el movimiento de ${song}, este multiefecto te da margen para experimentar.`
      : "Para este estilo, un multiefecto te da margen para los detalles y el movimiento.";
  }

  if (fine === "monitoring") {
    return song
      ? `Para escuchar (y mezclar) los detalles de ${song} como corresponde.`
      : "Para escuchar y mezclar los detalles de este estilo como corresponde.";
  }

  return "Suma color al sonido que buscás.";
}

interface ReasonContext {
  songTitle: string | null;
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

function emptyResult(query: string): RecommendResult {
  return {
    query,
    matchedSong: null,
    detectedGenre: "—",
    confidence: 0,
    summary:
      "Escribí una canción, un artista o un estilo para empezar. Por ejemplo: “Stairway to Heaven” o “blues”.",
    recommendations: [],
    fallback: false,
  };
}

function buildSummary(
  parts: {
    song: SongProfile | null;
    genreLabel: string;
    roles: Role[];
    signature: string;
    fallback: boolean;
  }
): string {
  const nouns = parts.roles.map((role) => ROLE_NOUNS[role]);
  const list = nouns.length > 1
    ? `${nouns.slice(0, -1).join(", ")} y ${nouns[nouns.length - 1]}`
    : nouns[0] ?? "los instrumentos del catálogo";

  if (parts.fallback) {
    return `No tengo esa canción en mi base todavía, pero con ese perfil sonoro la combinación que más se acerca es ${list}. Si querés afinarla, escribinos y la armamos a medida.`;
  }

  if (parts.song) {
    const year = parts.song.year ? ` (${parts.song.year})` : "";
    const verb = parts.song.estimated ? "se acerca a" : "se construye con";
    return `«${parts.song.title}» de ${parts.song.artist}${year} ${verb} ${list}. ${parts.signature} Esta es la combinación del catálogo que más se le acerca.`;
  }

  return `Para ${parts.genreLabel.toLowerCase()}, la base es ${list}. ${parts.signature} Esta es la combinación del catálogo que mejor se adapta.`;
}

/**
 * Recomienda 2-3 instrumentos del catálogo para acercarse al sonido de una
 * canción, artista o estilo. Función pura y determinista.
 */
export function recommendInstruments(
  query: string,
  instruments: Instrument[],
  songs: SongProfile[] = CURATED_SONGS
): RecommendResult {
  const cleaned = query.trim();
  if (!cleaned || instruments.length === 0) {
    return emptyResult(cleaned);
  }

  // Un género exacto ("punk", "hard rock", "bossa nova") gana siempre.
  // Si no, primero buscamos canción/artista: así "Daft Punk" no se detecta
  // como género punk. Recién después probamos keywords sueltas ("quiero rock").
  const exactGenre = detectExactGenre(cleaned);
  const songMatch = exactGenre ? null : findBestSong(cleaned, songs);
  const genre = exactGenre ?? (songMatch ? songMatch.song.genre : detectGenre(cleaned));
  const genreProfile = genre ? GENRE_PROFILES[genre] : null;

  const roles: Role[] = songMatch
    ? songMatch.song.roles
    : genreProfile
    ? genreProfile.roles
    : ["electric", "bass", "drums"];

  const tags = songMatch
    ? songMatch.song.tags
    : genreProfile
    ? genreProfile.tags
    : ["humbucker", "rock", "punchy"];

  const fallback = !songMatch && !genre;
  const signature = songMatch
    ? songMatch.song.signature
    : genreProfile
    ? genreProfile.signature
    : "Guitarra eléctrica, bajo y batería: la base más versátil para empezar.";

  // 1. Scorar todo el catálogo y quedarnos con el mejor instrumento por tipo.
  const bestByFine = new Map<FineType, Scored>();
  for (const instrument of instruments) {
    const scored = scoreInstrument(instrument, roles, tags);
    if (!scored) continue;
    const previous = bestByFine.get(scored.fine);
    if (!previous || scored.score > previous.score) {
      bestByFine.set(scored.fine, scored);
    }
  }

  // 2. Elegir en orden de importancia del rol (diversidad garantizada: nunca
  //    tres guitarras). Máximo 3, mínimo 2 si el catálogo lo permite.
  const picks: Scored[] = [];
  const chosen = new Set<FineType>();

  for (const role of roles) {
    if (picks.length >= 3) break;
    if (chosen.has(role)) continue;
    const candidate = bestByFine.get(role);
    if (candidate) {
      picks.push(candidate);
      chosen.add(role);
    }
  }

  // 3. Si por alguna razón quedaron menos de 2, completar con los mejores
  //    instrumentos restantes (siempre que no sean accesorios).
  if (picks.length < 2) {
    const rest = [...bestByFine.values()]
      .filter((item) => !chosen.has(item.fine))
      .sort((a, b) => b.score - a.score);
    for (const candidate of rest) {
      if (picks.length >= 2) break;
      picks.push(candidate);
      chosen.add(candidate.fine);
    }
  }

  if (picks.length === 0) {
    return emptyResult(cleaned);
  }

  // 4. Normalizar la afinidad para la UI: el mejor pick siempre queda cerca de
  //    98 y los demás proporcionales. En fallback se muestra más conservador.
  const topScore = picks[0].score;
  const ceiling = fallback ? 84 : songMatch ? 98 : 92;
  const floor = fallback ? 68 : songMatch ? 78 : 74;

  const recommendations: InstrumentMatch[] = picks.map((pick) => {
    const ratio = topScore > 0 ? pick.score / topScore : 1;
    const matchScore = Math.min(
      99,
      Math.round(floor + (ceiling - floor) * ratio)
    );
    return {
      instrument: pick.instrument,
      matchScore,
      role: ROLE_LABELS[pick.fine as Role] ?? "Instrumento",
      reason: buildReason(pick, {
        songTitle: songMatch ? songMatch.song.title : null,
      }),
    };
  });

  const confidence = songMatch
    ? songMatch.song.estimated
      ? songMatch.score >= 85
        ? 88
        : 84
      : songMatch.score >= 85
      ? 97
      : songMatch.score >= 60
      ? 91
      : 85
    : genre
    ? 76
    : 62;

  const genreLabel = genre
    ? GENRE_LABELS[genre]
    : songMatch
    ? GENRE_LABELS[songMatch.song.genre]
    : "Perfil versátil";

  return {
    query: cleaned,
    matchedSong: songMatch
      ? {
          title: songMatch.song.title,
          artist: songMatch.song.artist,
          year: songMatch.song.year ?? null,
          genre: GENRE_LABELS[songMatch.song.genre],
          estimated: songMatch.song.estimated ?? false,
        }
      : null,
    detectedGenre: genreLabel,
    confidence,
    summary: buildSummary({
      song: songMatch ? songMatch.song : null,
      genreLabel,
      roles: picks.map((pick) => pick.fine as Role),
      signature,
      fallback,
    }),
    recommendations,
    fallback,
  };
}
