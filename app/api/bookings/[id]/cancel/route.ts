import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  date: string;
  time: string;
  amountCents: number;
  status: "requested" | "authorized" | "captured" | "canceled";
  paymentIntentId?: string;
  stripeSessionId?: string;
  refundId?: string;
};

const FILE = path.join(process.cwd(), "data", "bookings.json");

/* ✅ FIX STRIPE */
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

function hoursUntil(date: string, time: string) {
  const bookingDate = new Date(`${date}T${time}:00`);
  const now = new Date();
  return (bookingDate.getTime() - now.getTime()) / 36e5;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bookings = await load();
    const booking = bookings.find((b) => b.id === id);

    if (!booking) {
      return Response.json(
        { ok: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const hoursLeft = hoursUntil(booking.date, booking.time);

    // ❌ < 3h → arrhes perdues
    if (hoursLeft < 3) {
      booking.status = "canceled";
      await save(bookings);

      return Response.json({
        ok: true,
        id,
        forfeited: true,
        hoursLeft,
      });
    }

    const stripe = getStripe();

    // pas de paiement
    if (!booking.paymentIntentId) {
      booking.status = "canceled";
      await save(bookings);

      return Response.json({
        ok: true,
        id,
        forfeited: false,
        hoursLeft,
      });
    }

    // autorisé → on libère
    if (booking.status === "authorized") {
      const canceled = await stripe.paymentIntents.cancel(booking.paymentIntentId);

      booking.status = "canceled";
      await save(bookings);

      return Response.json({
        ok: true,
        id,
        action: "cancel_intent",
        stripeStatus: canceled.status,
      });
    }

    // capturé → remboursement
    if (booking.status === "captured") {
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentIntentId,
      });

      booking.status = "canceled";
      booking.refundId = refund.id;
      await save(bookings);

      return Response.json({
        ok: true,
        id,
        action: "refund",
        refundId: refund.id,
      });
    }

    booking.status = "canceled";
    await save(bookings);

    return Response.json({ ok: true, id });

  } catch (err: any) {
    console.error("CANCEL ERROR:", err);
    return Response.json(
      { ok: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}