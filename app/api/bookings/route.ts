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

function calcHoldCents(guests: number) {
  return Math.min(guests * 1000, 6000);
}

export async function GET() {
  return Response.json(await load());
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    const raw = await req.text();

    console.log("BOOKINGS content-type:", ct);
    console.log("BOOKINGS raw body (first 200):", raw.slice(0, 200));

    if (!ct.includes("application/json")) {
      return Response.json(
        { error: "Content-Type invalide", contentType: ct, raw: raw.slice(0, 200) },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch (e: any) {
      return Response.json(
        {
          error: "JSON invalide envoyé à /api/bookings",
          raw: raw.slice(0, 200),
          details: e?.message,
        },
        { status: 400 }
      );
    }

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const guests = Number(body.guests);

    if (
      !name ||
      !phone ||
      !email ||
      !date ||
      !time ||
      !Number.isFinite(guests) ||
      guests < 1 ||
      guests > 20
    ) {
      return Response.json({ error: "Données invalides.", received: body }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const id = Math.random().toString(36).slice(2);
    const amountCents = calcHoldCents(guests);

    const bookings = await load();
    const booking: Booking = {
      id,
      name,
      phone,
      email,
      date,
      time,
      guests,
      amountCents,
      status: "requested",
    };
    bookings.push(booking);
    await save(bookings);

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    console.log("BOOKINGS: creating checkout session...");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      payment_intent_data: {
        capture_method: "manual",
        metadata: { bookingId: id, type: "booking_hold" },
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Empreinte réservation (${guests} pers.)` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],

      // IMPORTANT: metadata au niveau de la session aussi
      metadata: { type: "booking_hold", bookingId: id },

      success_url: `${appUrl}/reserver/success`,
      cancel_url: `${appUrl}/reserver/cancel`,
    });

    console.log("BOOKINGS: created checkout session", {
      bookingId: id,
      sessionId: session.id,
      metadata: session.metadata,
      url: session.url,
    });

    booking.stripeSessionId = session.id;
    await save(bookings);

    return Response.json({
      ok: true,
      checkoutUrl: session.url,
      bookingId: id,
      sessionId: session.id,
      amountCents,
    });
  } catch (err: any) {
    console.error("BOOKINGS API ERROR:", err);
    return Response.json(
      { error: "Erreur serveur /api/bookings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}