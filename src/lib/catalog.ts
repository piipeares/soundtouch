import { Condition, Instrument, InstrumentCategory } from "@/types";

// Helpers puros del catálogo: no tocan filesystem ni estado. Operan sobre el
// array que reciben (el store lee de data/instruments.json; el seed siembra).

const CATEGORY_VALUES: InstrumentCategory[] = [
  "guitarra-electrica",
  "guitarra-acustica",
  "guitarra-clasica",
  "bajo-electrico",
  "bajo-acustico",
  "otro-instrumento",
  "pedal",
  "accesorio",
  "parte",
];

const CONDITION_VALUES: Condition[] = [
  "nuevo",
  "usado",
  "usado-casi-nuevo",
  "reacondicionado",
];

/** Categorías presentes en la lista (solo las que tienen ≥1 instrumento). */
export function activeCategories(list: Instrument[]): InstrumentCategory[] {
  return CATEGORY_VALUES.filter((category) =>
    list.some((item) => item.category === category)
  );
}

/** Búsqueda full-text liviana sobre nombre/marca/modelo/descripción/categoría. */
export function searchInstruments(
  list: Instrument[],
  query: string
): Instrument[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) =>
    [item.name, item.brand, item.model ?? "", item.description, item.category]
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Busca por id dentro de una lista dada. */
export function findInstrumentById(
  list: Instrument[],
  id: string
): Instrument | undefined {
  return list.find((item) => item.id === id);
}

type ValidationResult =
  | { ok: true; instrument: Omit<Instrument, "id"> }
  | { ok: false; errors: string[] };

/**
 * Valida un payload de alta/edición. Reglas (spec catalog-admin):
 * - obligatorios: name, brand, model, price (> 0) y category en la lista
 * - offerPrice opcional, pero si va, debe ser < price
 * - condition opcional (default "nuevo"); si va, debe ser un valor válido
 * - discountPercentage opcional (0-100); description/image opcionales (string)
 */
export function validateInstrument(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["El payload debe ser un objeto JSON"] };
  }
  const body = input as Record<string, unknown>;

  const name = stringField(body, "name", errors);
  const brand = stringField(body, "brand", errors);
  const model = stringField(body, "model", errors);

  const price = positiveNumber(body, "price", errors);
  const offerPrice = optionalPositiveNumber(body, "offerPrice", errors);
  if (price !== undefined && offerPrice !== undefined && offerPrice >= price) {
    errors.push("offerPrice debe ser menor que price");
  }

  const category = body.category;
  if (
    typeof category !== "string" ||
    !CATEGORY_VALUES.includes(category as InstrumentCategory)
  ) {
    errors.push(`category debe ser una de: ${CATEGORY_VALUES.join(", ")}`);
  }

  let condition: Condition = "nuevo";
  if (body.condition !== undefined) {
    if (
      typeof body.condition === "string" &&
      CONDITION_VALUES.includes(body.condition as Condition)
    ) {
      condition = body.condition as Condition;
    } else {
      errors.push(`condition debe ser una de: ${CONDITION_VALUES.join(", ")}`);
    }
  }

  const discountPercentage = optionalNumber(body, "discountPercentage", errors);
  if (
    discountPercentage !== undefined &&
    (discountPercentage < 0 || discountPercentage > 100)
  ) {
    errors.push("discountPercentage debe estar entre 0 y 100");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    instrument: {
      name,
      brand,
      model,
      // price es number positivo (validado arriba); si no, ya volvimos con errores.
      price: price as number,
      category: category as InstrumentCategory,
      condition,
      description: typeof body.description === "string" ? body.description : "",
      image: typeof body.image === "string" ? body.image : "",
      featured: body.featured === true,
      ...(offerPrice !== undefined && { offerPrice }),
      ...(discountPercentage !== undefined && { discountPercentage }),
    },
  };
}

function stringField(
  body: Record<string, unknown>,
  key: string,
  errors: string[]
): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${key} es obligatorio`);
    return "";
  }
  return value.trim();
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function positiveNumber(
  body: Record<string, unknown>,
  key: string,
  errors: string[]
): number | undefined {
  const value = coerceNumber(body[key]);
  if (value === undefined || value <= 0) {
    errors.push(`${key} debe ser un número mayor que 0`);
    return undefined;
  }
  return value;
}

function optionalPositiveNumber(
  body: Record<string, unknown>,
  key: string,
  errors: string[]
): number | undefined {
  if (body[key] === undefined || body[key] === null || body[key] === "") {
    return undefined;
  }
  const value = coerceNumber(body[key]);
  if (value === undefined || value <= 0) {
    errors.push(`${key} debe ser un número mayor que 0`);
    return undefined;
  }
  return value;
}

function optionalNumber(
  body: Record<string, unknown>,
  key: string,
  errors: string[]
): number | undefined {
  if (body[key] === undefined || body[key] === null || body[key] === "") {
    return undefined;
  }
  const value = coerceNumber(body[key]);
  if (value === undefined) {
    errors.push(`${key} debe ser un número`);
    return undefined;
  }
  return value;
}