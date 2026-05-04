import Stripe from "stripe";
import { readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Booking = {
  id: string;
  status: "requested" | "authorized" | "captured" | "canceled";
  amountCents: number;
  stripeSessionId?: string;
  paymentIntentId?: string;
  [k: string]: any;
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

function extractIdFromUrl(req: Request) {
  // /api/bookings/:id/accept
  const u = new URL(req.url);
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("bookings");
  const id = idx >= 0 ? parts[idx + 1] : "";
  return String(id || "").trim();
}

export async function POST(req: Request) {
  const id = extractIdFromUrl(req);

  const bookings = await load();

  console.log("ACCEPT: url =", req.url);
  console.log("ACCEPT: id =", id);
  console.log("ACCEPT: bookings count =", bookings.length);

  const b = bookings.find((x) => String(x.id) === id);

  if (!id || !b) {
    const sample = bookings.slice(-10).map((x) => x.id);
    console.warn("ACCEPT: booking not found", { id, sample });
    return Response.json(
      { ok: false, error: "Booking not found", id, sampleIds: sample },
      { status: 404 }
    );
  }

  if (b.status !== "authorized") {
    await sendEmail(
  b.email,
  "Réservation acceptée",
  `Bonjour ${b.name},\n\nVotre réservation du ${b.date} à ${b.time} est acceptée ✅\n\n— La Bodega`
);return Response.json(
      { ok: false, error: `Booking status must be authorized (current: ${b.status})`, id },
      { status: 400 }
    );
  }

  if (!b.paymentIntentId) {
    return Response.json(
      { ok: false, error: "Missing paymentIntentId on booking", id },
      { status: 400 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const pi = await stripe.paymentIntents.capture(b.paymentIntentId);

  b.status = "captured";
  await save(bookings);

  console.log("ACCEPT: captured", {
    id: b.id,
    paymentIntentId: b.paymentIntentId,
    piStatus: pi.status,
  });

  return Response.json({
    ok: true,
    id: b.id,
    paymentIntentId: b.paymentIntentId,
    stripeStatus: pi.status,
  });
}