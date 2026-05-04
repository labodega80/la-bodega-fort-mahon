import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  amountCents: number;
  status: "requested" | "authorized" | "captured" | "canceled";
  stripeSessionId?: string;
  paymentIntentId?: string;
  refundId?: string;
};

const FILE = path.join(process.cwd(), "data", "bookings.json");

async function load(): Promise<Booking[]> {
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return []; }
}
async function save(bookings: Booking[]) {
  await writeFile(FILE, JSON.stringify(bookings, null, 2), "utf8");
}

function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return false;
  return token === process.env.ADMIN_TOKEN;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!requireAdmin(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Next.js 16: params peut être une Promise → on await
    const params = await (ctx.params as any);
    const idFromParams = params?.id ? String(params.id).trim() : "";

    // fallback URL
    const idFromUrl = req.url.split("/").filter(Boolean).slice(-2, -1)[0] || "";
    const id = (idFromParams || idFromUrl).trim();

    if (!id) return Response.json({ ok: false, error: "Missing id" }, { status: 400 });

    const bookings = await load();
    const b = bookings.find((x) => x.id === id);
    if (!b) return Response.json({ ok: false, error: "Booking not found", id }, { status: 404 });

    // déjà capturé → idempotent
    if (b.status === "captured") {
      return Response.json({ ok: true, id, stripeStatus: "already_captured" });
    }

    // il faut une empreinte
    if (!b.paymentIntentId && b.stripeSessionId) {
      try {
        const s = await stripe.checkout.sessions.retrieve(b.stripeSessionId);
        b.paymentIntentId = String(s.payment_intent || "");
      } catch {}
    }

    if (!b.paymentIntentId) {
      return Response.json({ ok: false, error: "No paymentIntentId (not authorized yet)", id }, { status: 409 });
    }

    // ✅ Stripe: si PI déjà canceled → renvoyer 409 propre
    const pi = await stripe.paymentIntents.retrieve(b.paymentIntentId);

    if (pi.status === "canceled") {
      // si ça a été rejeté / annulé, on met la réservation en canceled localement aussi
      b.status = "canceled";
      await save(bookings);

      return Response.json(
        { ok: false, error: "PaymentIntent canceled (cannot accept)", id, paymentIntentId: b.paymentIntentId, stripeStatus: pi.status },
        { status: 409 }
      );
    }

    // déjà succeeded → on marque captured
    if (pi.status === "succeeded") {
      b.status = "captured";
      await save(bookings);
      return Response.json({ ok: true, id, paymentIntentId: b.paymentIntentId, stripeStatus: "already_captured" });
    }

    if (pi.status !== "requires_capture") {
      return Response.json(
        { ok: false, error: "PaymentIntent not capturable", id, paymentIntentId: b.paymentIntentId, stripeStatus: pi.status },
        { status: 409 }
      );
    }

    // capture
    const captured = await stripe.paymentIntents.capture(b.paymentIntentId);

    b.status = "captured";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      paymentIntentId: b.paymentIntentId,
      stripeStatus: captured.status,
    });
  } catch (err: any) {
    console.error("ADMIN ACCEPT ERROR:", err);
    return Response.json({ ok: false, error: "Server error", details: err?.message || String(err) }, { status: 500 });
  }
}