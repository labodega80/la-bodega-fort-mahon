const mem: any[] = [];

export async function POST(req: Request) {
  const { name, phone, email, pickupDate, pickupTime, items } = await req.json();

  if (!name || !phone || !email || !pickupDate || !pickupTime || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Données invalides." }, { status: 400 });
  }

  const id = Math.random().toString(36).slice(2);
  mem.push({ id, name, phone, email, pickupDate, pickupTime, items, status: "pending" });

  return Response.json({ ok: true, id });
}

export async function GET() {
  return Response.json(mem);
}
