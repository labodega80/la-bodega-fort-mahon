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

    if (b.status === "canceled") {
      return Response.json(
        { ok: false, error: "Booking is canceled", id },
        { status: 409 }
      );
    }

    if (b.status === "captured") {
      return Response.json({
        ok: true,
        id,
        stripeStatus: "already_captured",
      });
    }

    if (b.status !== "authorized") {
      return Response.json(
        { ok: false, error: "Booking must be authorized (current: " + b.status + ")", id },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    if (!b.paymentIntentId && b.stripeSessionId) {
      try {
        const s = await stripe.checkout.sessions.retrieve(b.stripeSessionId);
        b.paymentIntentId = String(s.payment_intent || "");
      } catch (e: any) {
        return Response.json(
          { ok: false, error: "Cannot retrieve payment intent", details: e?.message },
          { status: 400 }
        );
      }
    }

    if (!b.paymentIntentId) {
      return Response.json(
        { ok: false, error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    const pi0 = await stripe.paymentIntents.retrieve(b.paymentIntentId);

    if (pi0.status === "succeeded") {
      b.status = "captured";
      await save(bookings);
      return Response.json({ ok: true, id, stripeStatus: "already_captured" });
    }

    if (pi0.status !== "requires_capture") {
      b.status = "canceled";
      await save(bookings);
      return Response.json(
        { ok: false, error: "Cannot capture (expired/canceled)", stripeStatus: pi0.status },
        { status: 409 }
      );
    }

    const pi = await stripe.paymentIntents.capture(b.paymentIntentId);

    b.status = "captured";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      stripeStatus: pi.status,
    });

  } catch (err: any) {
    console.error("ADMIN ACCEPT ERROR:", err);
    return Response.json(
      { ok: false, error: "Server error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

