import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  email?: string;
  name?: string;
  date?: string;
  time?: string;
  status: "requested" | "authorized" | "captured" | "canceled";
  paymentIntentId?: string;
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

/* ✅ Stripe lazy */
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

export async function POST(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const id = req.url.split("/").filter(Boolean).pop() || "";

    const bookings = await load();
    const b = bookings.find((x) => x.id === id);

    if (!b) {
      return Response.json({ ok: false, error: "Booking not found" }, { status: 404 });
    }

    if (!b.paymentIntentId) {
      return Response.json(
        { ok: false, error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const pi = await stripe.paymentIntents.capture(b.paymentIntentId);

    b.status = "captured";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      stripeStatus: pi.status,
    });

  } catch (err: any) {
    console.error("ADMIN CAPTURE ERROR:", err);
    return Response.json(
      { ok: false, error: "Server error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}