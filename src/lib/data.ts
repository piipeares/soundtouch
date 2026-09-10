import { Instrument } from "@/types";

// URLs de imágenes verificadas funcionando
const images = {
  guitar1: "https://images.unsplash.com/photo-1550985543-0708d578d5c3?w=800&q=80",
  guitar2: "https://images.unsplash.com/photo-1556449895-a33c9dfd3092?w=800&q=80",
  guitar3: "https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=800&q=80",
  guitar4: "https://images.unsplash.com/photo-1543810962-38d8d37295b1?w=800&q=80",
  bajo1: "https://images.unsplash.com/photo-1571974599782-87624638275e?w=800&q=80",
  bajo2: "https://images.unsplash.com/photo-1519925610903-3995b0b6a45c?w=800&q=80",
  keys1: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
  keys2: "https://images.unsplash.com/photo-1598653222000-6b7b7a7a9490?w=800&q=80",
  drums1: "https://images.unsplash.com/photo-1461789240004-24df8c55b07e?w=800&q=80",
  drums2: "https://images.unsplash.com/photo-1519892301625-cc8c35a5b3e0?w=800&q=80",
  audio1: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
  audio2: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
  pedal1: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&q=80",
  accesorio1: "https://images.unsplash.com/photo-1519852489851-1199c5663d33?w=800&q=80",
};

export const instruments: Instrument[] = [
  // Guitarras Eléctricas
  {
    id: "1",
    name: "Gibson Les Paul Standard '50s",
    description: "Legendaria guitarra eléctrica de tono icónico. Cuerpo de caoba, mástil de arce y diapositiva de palisandro. Sonido clásico ROCK.",
    price: 2499,
    image: images.guitar1,
    category: "guitarra-electrica",
    brand: "Gibson",
    model: "Les Paul Standard '50s",
    condition: "nuevo",
    featured: true,
    offerPrice: 2199,
    discountPercentage: 12,
  },
  {
    id: "2",
    name: "Fender American Pro II Telecaster",
    description: "Guitarra Telecaster versátil y confiable. Mástil de arce roasted, pastillas single-coil de última generación.",
    price: 1899,
    image: images.guitar2,
    category: "guitarra-electrica",
    brand: "Fender",
    model: "American Pro II",
    condition: "nuevo",
  },
  {
    id: "3",
    name: "Ibanez Prestige RG6521",
    description: "Guitarra shred de alta performance. Cuerpo de alder, Floyd Rose original, humbuckers DiMarzio.",
    price: 1599,
    image: images.guitar4,
    category: "guitarra-electrica",
    brand: "Ibanez",
    model: "Prestige RG",
    condition: "nuevo",
  },
  // Guitarras Acústicas
  {
    id: "4",
    name: "Martin D-28 Acoustic",
    description: "Guitarra acoustic flagship. Tapa de spruce Sitka, aros y fondo de palisandro indio. Sonido profundo y resonante.",
    price: 2999,
    image: images.guitar3,
    category: "guitarra-acustica",
    brand: "Martin",
    model: "D-28",
    condition: "nuevo",
    featured: true,
  },
  // Bajos
  {
    id: "5",
    name: "Fender American Professional II Precision Bass",
    description: "Bajo eléctrico insignia. Sonido definido y potente, perfecto para cualquier género musical.",
    price: 1399,
    image: images.bajo1,
    category: "bajo-electrico",
    brand: "Fender",
    model: "American Pro II",
    condition: "nuevo",
    offerPrice: 1199,
    discountPercentage: 14,
  },
  {
    id: "6",
    name: "Warwick RockBass Corvette",
    description: "Bajo alemán de construcción sólida. Cuerpo de nogal americano, electrónica active MEC.",
    price: 1199,
    image: images.bajo2,
    category: "bajo-electrico",
    brand: "Warwick",
    model: "RockBass Corvette",
    condition: "usado-casi-nuevo",
  },
  // Teclados
  {
    id: "7",
    name: "Nord Stage 3 88",
    description: "Teclado profesional stage. Piano Nord, samples de alta calidad, órgano Hammond authentic.",
    price: 3999,
    image: images.keys1,
    category: "otro-instrumento",
    brand: "Nord",
    model: "Stage 3",
    condition: "nuevo",
    featured: true,
  },
  {
    id: "8",
    name: "Yamaha Montage 8",
    description: "Synthesizer flagship de Yamaha. motor AWM2 y FM-X, acciones de peso premium.",
    price: 3499,
    image: images.keys2,
    category: "otro-instrumento",
    brand: "Yamaha",
    model: "Montage 8",
    condition: "usado",
  },
  // Baterías
  {
    id: "9",
    name: "Roland TD-17KVX",
    description: "Batería electrónica performance. Módulo TD-17, pads de mesh premium, soporte dedicado.",
    price: 1699,
    image: images.drums1,
    category: "otro-instrumento",
    brand: "Roland",
    model: "TD-17KVX",
    condition: "nuevo",
  },
  {
    id: "10",
    name: "Pearl Roadshow RS",
    description: "Batería acústica para principiantes. Shells basswood, hardware chrome premium.",
    price: 699,
    image: images.drums2,
    category: "otro-instrumento",
    brand: "Pearl",
    model: "Roadshow RS",
    condition: "nuevo",
    offerPrice: 549,
    discountPercentage: 21,
  },
  // Audio
  {
    id: "11",
    name: "Shure SM7B",
    description: "Micrófono dinámico cardioide. Cancelación de ruido excepcional, ideal para voz y broadcast.",
    price: 399,
    image: images.audio1,
    category: "accesorio",
    brand: "Shure",
    model: "SM7B",
    condition: "nuevo",
    featured: true,
  },
  {
    id: "12",
    name: "Audio-Technica ATH-M50x",
    description: "Auriculares monitoring profesionales. Drivers de 45mm, respuesta plana para mixing preciso.",
    price: 149,
    image: images.audio2,
    category: "accesorio",
    brand: "Audio-Technica",
    model: "ATH-M50x",
    condition: "nuevo",
  },
  // Pedales
  {
    id: "13",
    name: "Strymon BigSky Reverb",
    description: "Reverb de calidad flagship. Múltiples algoritmos, control MIDI, sonido premium.",
    price: 499,
    image: images.pedal1,
    category: "pedal",
    brand: "Strymon",
    model: "BigSky",
    condition: "nuevo",
  },
  {
    id: "14",
    name: "Eventide H9 Max",
    description: "Procesador de efectos multiefectos. Algoritmos de calidad de estudio, control MIDI.",
    price: 799,
    image: images.pedal1,
    category: "pedal",
    brand: "Eventide",
    model: "H9 Max",
    condition: "usado-casi-nuevo",
    offerPrice: 599,
    discountPercentage: 25,
  },
  // Accesorios
  {
    id: "15",
    name: "Hercules Stands GS525B",
    description: "Soporte de pie múltiple para 5 instrumentos. Construcción robusta, altura ajustable.",
    price: 199,
    image: images.accesorio1,
    category: "accesorio",
    brand: "Hercules",
    model: "GS525B",
    condition: "nuevo",
  },
];

export function getInstrumentById(id: string): Instrument | undefined {
  return instruments.find((inst) => inst.id === id);
}

export function getInstrumentsByCategory(category: Instrument["category"]): Instrument[] {
  return instruments.filter((inst) => inst.category === category);
}

export function getFeaturedInstruments(): Instrument[] {
  return instruments.filter((inst) => inst.featured);
}

export function getOnSaleInstruments(): Instrument[] {
  return instruments.filter((inst) => inst.offerPrice && inst.discountPercentage);
}

export function searchInstruments(query: string): Instrument[] {
  const lowerQuery = query.toLowerCase();
  return instruments.filter((inst) => 
    inst.name.toLowerCase().includes(lowerQuery) ||
    inst.brand.toLowerCase().includes(lowerQuery) ||
    inst.model?.toLowerCase().includes(lowerQuery) ||
    inst.description.toLowerCase().includes(lowerQuery) ||
    inst.category.toLowerCase().includes(lowerQuery)
  );
}