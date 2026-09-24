import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCustomerSession } from "@/lib/auth";
import { getFavorites, removeFavorite } from "@/lib/store/favorites";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await requireCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const clean = id.trim();
  if (clean === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const favorites = removeFavorite(session.sub, clean);
  revalidatePath("/favoritos");
  revalidatePath("/");

  return NextResponse.json({ ok: true, favorites });
}