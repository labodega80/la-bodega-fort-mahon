import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  status: "requested" | "authorized" | "captured" | "canceled";
  stripeSessionId?: string;
  paymentIntentId?: string;
  [k: string]: any;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

async function rawBody(req: Request) {
  const ab = await req.arrayBuffer();
  return Buffer.from(ab);
}

async function authorizeBookingByBookingId(bookingId: string, paymentIntentId: string, sessionId?: string) {
  const bookings = await load();

  const b = bookings.find((x) => x.id === bookingId);
  if (!b) {
    console.warn("WEBHOOK: booking not found (by bookingId)", { bookingId, paymentIntentId, sessionId });
    return;
  }

  // Idempotent: si déjà capturé/cancel, on ne touche pas
  if (b.status === "captured" || b.status === "canceled") {
    console.log("WEBHOOK: booking already final status, skip", { id: b.id, status: b.status });
    return;
  }

  b.status = "authorized";
  b.paymentIntentId = paymentIntentId;
  if (sessionId) b.stripeSessionId = sessionId;

  await save(bookings);

  console.log("WEBHOOK: booking authorized", {
    id: b.id,
    bookingId,
    sessionId: b.stripeSessionId,
    paymentIntentId,
  });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const body = await rawBody(req);

  let event: Stripe.Event;
  try {
    const secret =
      process.env.STRIPE_WEBHOOK_SECRET_KEY ??
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error("WEBHOOK SIGNATURE ERROR:", err?.message || err);
    return new Response("Webhook error: " + (err?.message || String(err)), { status: 400 });
  }

  console.log("WEBHOOK: received", event.type);

  // 1) Le plus fiable pour capture manuelle : “capturable”
  if (event.type === "payment_intent.amount_capturable_updated") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const bookingId = (pi.metadata?.bookingId || "").trim();
    if (!bookingId) {
      console.warn("WEBHOOK: PI capturable but no bookingId in metadata", { pi: pi.id, metadata: pi.metadata });
      return new Response("ok");
    }

    console.log("WEBHOOK: PI capturable", {
      pi: pi.id,
      amount_capturable: pi.amount_capturable,
      status: pi.status,
      bookingId,
    });

    await authorizeBookingByBookingId(bookingId, pi.id);
    return new Response("ok");
  }

  // 2) Checkout completed : utile en secours (mais payment_status peut être trompeur en manual capture)
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const sessionLite = event.data.object as Stripe.Checkout.Session;

    try {
      // On récupère la session complète + metadata
      const session = await stripe.checkout.sessions.retrieve(sessionLite.id);

      const bookingId = (session.metadata?.bookingId || "").trim();
      const paymentIntentId = String(session.payment_intent || "");
      const sessionId = session.id;

      console.log("WEBHOOK: checkout session", {
        sessionId,
        metadata: session.metadata,
        paymentIntent: paymentIntentId,
        paymentStatus: session.payment_status,
      });

      if (bookingId) {
        await authorizeBookingByBookingId(bookingId, paymentIntentId, sessionId);
      } else {
        console.warn("WEBHOOK: session completed but no bookingId in metadata", {
          sessionId,
          metadata: session.metadata,
        });
      }
    } catch (e: any) {
      // Important : si Stripe CLI trigger envoie une session inconnue de TON compte, on ne veut pas 500
      console.warn("WEBHOOK: could not retrieve checkout session (skip)", {
        id: sessionLite?.id,
        message: e?.message || String(e),
      });
    }

    return new Response("ok");
  }

  return new Response("ok");
}

