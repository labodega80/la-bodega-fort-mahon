import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  stripeSessionId?: string;
  paymentIntentId?: string;
  status?: string;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const FILE = path.join(process.cwd(), "data", "bookings.json");

async function load(): Promise<any[]> {
  try { return JSON.parse(await readFile(FILE, "utf8")); } catch { return []; }
}
async function save(bookings: any[]) {
  await writeFile(FILE, JSON.stringify(bookings, null, 2), "utf8");
}

export async function POST() {
  const bookings = await load();

  const updated: any[] = [];
  const skipped: any[] = [];
  const errors: any[] = [];

  for (const b of bookings as Booking[]) {
    if (!b.stripeSessionId) {
      skipped.push({ id: b.id, reason: "no stripeSessionId" });
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(b.stripeSessionId);

      if (session.payment_status === "paid") {
        b.status = "authorized";
        b.paymentIntentId = String(session.payment_intent || "");
        updated.push({ id: b.id, stripeSessionId: b.stripeSessionId, paymentIntentId: b.paymentIntentId });
      } else {
        skipped.push({ id: b.id, stripeSessionId: b.stripeSessionId, payment_status: session.payment_status });
      }
    } catch (e: any) {
      errors.push({ id: b.id, stripeSessionId: b.stripeSessionId, error: e?.message || String(e) });
    }
  }

  await save(bookings);
  return Response.json({ ok: true, updated, skipped, errors });
}
