import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth";
import { removeFavorite } from "@/lib/store/favorites";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const clean = id.trim();
  if (clean === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const favorites = await removeFavorite(session.email, clean);
  revalidatePath("/favoritos");
  revalidatePath("/");

  return NextResponse.json({ ok: true, favorites });
}