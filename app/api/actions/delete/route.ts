import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // 🌟 Importazione fondamentale per svuotare la cache

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (id) {
    await prisma.appointment.delete({ where: { id } });
    revalidatePath("/dashboard"); // 🚀 Forza il server a rigenerare l'agenda senza dati vecchi!
  }
  
  return NextResponse.json({ success: true });
}