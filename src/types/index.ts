export type InstrumentCategory = 
  | "guitarra-electrica" 
  | "guitarra-acustica" 
  | "guitarra-clasica"
  | "bajo-electrico"
  | "bajo-acustico"
  | "otro-instrumento"
  | "pedal"
  | "accesorio"
  | "parte";

export type Condition = "nuevo" | "usado" | "usado-casi-nuevo" | "reacondicionado";

/**
 * Tipo fino usado por SoundMatch para mapear un instrumento a un rol sonoro.
 * Es independiente de la categoría comercial: una batería electrónica y una
 * acústica comparten `drums`, y un piano y un synth comparten `keys`.
 */
export type InstrumentFineType =
  | "electric"
  | "acoustic"
  | "bass"
  | "keys"
  | "drums"
  | "vocal"
  | "reverb"
  | "fx"
  | "monitoring"
  | "accessory";

export interface Instrument {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: InstrumentCategory;
  brand: string;
  model?: string;
  specs?: string[];
  featured?: boolean;
  condition: Condition;
  offerPrice?: number;
  discountPercentage?: number;
  /** Override explícito para el motor (útil en instrumentos conceptuales). */
  fineType?: InstrumentFineType;
  /** Rasgos sonoros explícitos; si existen, reemplazan la inferencia por texto. */
  traits?: string[];
}

// Utils para categorías
export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  "guitarra-electrica": "Guitarra Eléctrica",
  "guitarra-acustica": "Guitarra Acústica",
  "guitarra-clasica": "Guitarra Clásica",
  "bajo-electrico": "Bajo Eléctrico",
  "bajo-acustico": "Bajo Acústico",
  "otro-instrumento": "Otros Instrumentos",
  "pedal": "Pedales de Efectos",
  "accesorio": "Accesorios",
  "parte": "Partes Originales",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  "nuevo": "Nuevo",
  "usado": "Usado",
  "usado-casi-nuevo": "Usado Casi Nuevo",
  "reacondicionado": "Reacondicionado",
};