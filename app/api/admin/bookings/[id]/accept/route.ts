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
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

async function save(bookings: Booking[]) {
  await writeFile(FILE, JSON.stringify(bookings, null, 2), "utf8");
}

function requireAdmin(req: Request) {
  const token = (req.headers.get("x-admin-token") || "").trim();
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

    // Next peut fournir params comme Promise => on await
    const params = await (ctx.params as any);
    const idFromParams = params?.id ? String(params.id).trim() : "";

    // fallback URL: /api/admin/bookings/:id/accept
    const idFromUrl = req.url.split("/").filter(Boolean).slice(-2, -1)[0] || "";
    const id = (idFromParams || idFromUrl).trim();

    if (!id) return Response.json({ ok: false, error: "Missing id" }, { status: 400 });

    const bookings = await load();
    const b = bookings.find((x) => x.id === id);

    if (!b) return Response.json({ ok: false, error: "Booking not found", id }, { status: 404 });

    // Déjà annulée -> pas d’accept
    if (b.status === "canceled") {
      return Response.json(
        { ok: false, error: "Booking is canceled (cannot accept)", id, status: b.status },
        { status: 409 }
      );
    }

    // Déjà encaissée -> OK idempotent
    if (b.status === "captured") {
      return Response.json({
        ok: true,
        id,
        paymentIntentId: b.paymentIntentId || null,
        stripeStatus: "already_captured",
      });
    }

    // Doit être authorized
    if (b.status !== "authorized") {
      return Response.json(
        { ok: false, error: `Booking status must be authorized (current: ${b.status})`, id },
        { status: 400 }
      );
    }

    // Retrouver PI si absent
    if (!b.paymentIntentId && b.stripeSessionId) {
      try {
        const s = await stripe.checkout.sessions.retrieve(b.stripeSessionId);
        b.paymentIntentId = String(s.payment_intent || "");
      } catch (e: any) {
        return Response.json(
          {
            ok: false,
            error: "Cannot retrieve payment intent from session",
            id,
            details: e?.message || String(e),
          },
          { status: 400 }
        );
      }
    }

    if (!b.paymentIntentId) {
      return Response.json({ ok: false, error: "Missing paymentIntentId on booking", id }, { status: 400 });
    }

    // ✅ Vérifier l'état Stripe AVANT capture (évite les 500 et les captures impossibles)
    const pi0 = await stripe.paymentIntents.retrieve(b.paymentIntentId);

    // Déjà capturé côté Stripe
    if (pi0.status === "succeeded") {
      b.status = "captured";
      await save(bookings);
      return Response.json({
        ok: true,
        id,
        paymentIntentId: b.paymentIntentId,
        stripeStatus: "already_captured",
      });
    }

    // Plus capturable (expired/canceled/etc.)
    if (pi0.status !== "requires_capture") {
      // resync local
      b.status = "canceled";
      await save(bookings);

      return Response.json(
        {
          ok: false,
          error: "Cannot capture: PaymentIntent is not capturable anymore (expired/canceled). Customer must rebook.",
          id,
          paymentIntentId: b.paymentIntentId,
          stripeStatus: pi0.status,
          cancellation_reason: (pi0 as any).cancellation_reason || null,
        },
        { status: 409 }
      );
    }

    // OK => capturer
    try {
      const pi = await stripe.paymentIntents.capture(b.paymentIntentId);
      b.status = "captured";
      await save(bookings);

      return Response.json({ ok: true, id, paymentIntentId: b.paymentIntentId, stripeStatus: pi.status });
    } catch (e: any) {
      const msg = e?.message || String(e);
      return Response.json(
        { ok: false, error: "Stripe capture failed", id, paymentIntentId: b.paymentIntentId, details: msg },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("ADMIN ACCEPT ERROR:", err);
    return Response.json(
      { ok: false, error: "Server error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}