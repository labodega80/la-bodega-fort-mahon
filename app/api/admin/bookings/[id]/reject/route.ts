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
  const token = req.headers.get("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return false;
  return token === process.env.ADMIN_TOKEN;
}

/* ✅ IMPORTANT : FIX STRIPE */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!requireAdmin(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const params = await (ctx.params as any);
    const idFromParams = params?.id ? String(params.id).trim() : "";

    const idFromUrl = req.url.split("/").filter(Boolean).slice(-2, -1)[0] || "";
    const id = (idFromParams || idFromUrl).trim();

    if (!id) {
      return Response.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const bookings = await load();
    const b = bookings.find((x) => x.id === id);

    if (!b) {
      return Response.json({ ok: false, error: "Booking not found", id }, { status: 404 });
    }

    if (b.status === "captured") {
      return Response.json({ ok: true, id, stripeStatus: "already_captured" });
    }

    const stripe = getStripe();

    if (!b.paymentIntentId && b.stripeSessionId) {
      try {
        const s = await stripe.checkout.sessions.retrieve(b.stripeSessionId);
        b.paymentIntentId = String(s.payment_intent || "");
      } catch {}
    }

    if (!b.paymentIntentId) {
      return Response.json(
        { ok: false, error: "No paymentIntentId", id },
        { status: 409 }
      );
    }

    const pi = await stripe.paymentIntents.retrieve(b.paymentIntentId);

    if (pi.status === "canceled") {
      b.status = "canceled";
      await save(bookings);

      return Response.json(
        { ok: false, error: "PaymentIntent canceled", stripeStatus: pi.status },
        { status: 409 }
      );
    }

    if (pi.status === "succeeded") {
      b.status = "captured";
      await save(bookings);

      return Response.json({ ok: true, id, stripeStatus: "already_captured" });
    }

    if (pi.status !== "requires_capture") {
      return Response.json(
        { ok: false, error: "Not capturable", stripeStatus: pi.status },
        { status: 409 }
      );
    }

    const captured = await stripe.paymentIntents.capture(b.paymentIntentId);

    b.status = "captured";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      stripeStatus: captured.status,
    });

  } catch (err: any) {
    console.error("ADMIN REJECT ERROR:", err);
    return Response.json(
      { ok: false, error: "Server error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}