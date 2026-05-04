import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const FILE = path.join(process.cwd(), "data", "bookings.json");

type Booking = {
  id: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
  amountCents: number;
  status: "requested" | "authorized" | "captured" | "canceled";
  paymentIntentId?: string;
  stripeSessionId?: string;
  refundId?: string;
};

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
  // ✅ IMPORTANT: params est un Promise avec Next 16/Turbopack
  const { id } = await params;

  const bookings = await load();
  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return Response.json(
      { ok: false, error: "Booking not found", id, sampleIds: bookings.slice(-10).map(b => b.id) },
      { status: 404 }
    );
  }

  const hoursLeft = hoursUntil(booking.date, booking.time);

  // ❌ Moins de 3h → arrhes perdues (on ne rembourse pas)
  if (hoursLeft < 3) {
    booking.status = "canceled";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      forfeited: true,
      hoursLeft,
      message: "Annulation tardive (<3h) : arrhes conservées.",
    });
  }

  // ✅ 3h ou plus → on libère l’empreinte si seulement autorisée
  if (!booking.paymentIntentId) {
    booking.status = "canceled";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      forfeited: false,
      hoursLeft,
      message: "Annulation >3h : aucune empreinte à libérer (pas de paymentIntentId).",
    });
  }

  if (booking.status === "authorized") {
    const canceled = await stripe.paymentIntents.cancel(booking.paymentIntentId);
    booking.status = "canceled";
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      forfeited: false,
      hoursLeft,
      action: "payment_intent_cancel",
      stripeStatus: canceled.status,
      message: "Empreinte libérée (annulation >3h).",
    });
  }

  // Si déjà capturé (encaissé), alors annulation >3h = remboursement
  if (booking.status === "captured") {
    const refund = await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
    booking.status = "canceled";
    booking.refundId = refund.id;
    await save(bookings);

    return Response.json({
      ok: true,
      id,
      forfeited: false,
      hoursLeft,
      action: "refund",
      refundId: refund.id,
      stripeStatus: refund.status,
      message: "Paiement déjà encaissé : remboursement effectué (annulation >3h).",
    });
  }

  // requested/canceled
  booking.status = "canceled";
  await save(bookings);

  return Response.json({
    ok: true,
    id,
    forfeited: false,
    hoursLeft,
    action: "mark_canceled",
    message: "Annulation enregistrée.",
  });
}
