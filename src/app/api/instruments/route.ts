import { NextRequest, NextResponse } from "next/server";
import { instruments } from "@/lib/data";
import { Instrument, Condition, InstrumentCategory } from "@/types";

// In-memory storage (use database in production)
let instrumentsStore: Instrument[] = [...instruments];

export async function GET() {
  return NextResponse.json(instrumentsStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newInstrument: Instrument = {
      id: String(Date.now()),
      name: body.name,
      description: body.description,
      price: Number(body.price),
      image: body.image,
      category: body.category as InstrumentCategory,
      brand: body.brand,
      model: body.model,
      featured: body.featured || false,
      condition: (body.condition as Condition) || "nuevo",
      offerPrice: body.offerPrice ? Number(body.offerPrice) : undefined,
      discountPercentage: body.discountPercentage ? Number(body.discountPercentage) : undefined,
    };

    instrumentsStore.push(newInstrument);
    
    return NextResponse.json(newInstrument, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear instrumento" },
      { status: 500 }
    );
  }
}