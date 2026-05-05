import { sendEmail } from "@/lib/email";
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
  email?: string;
  name?: string;
  date?: string;
  time?: string;
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
  const u = new URL(req.url);
  const parts = u.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("bookings");
  return idx >= 0 ? parts[idx + 1] : "";
}

export async function POST(req: Request) {
  try {
    const id = extractIdFromUrl(req);

    const bookings = await load();
    const b = bookings.find((x) => String(x.id) === id);

    if (!id || !b) {
      return Response.json(
        { ok: false, error: "Booking not found", id: id },
        { status: 404 }
      );
    }

    if (b.status !== "authorized") {
      return Response.json(
        { ok: false, error: "Booking must be authorized (current: " + b.status + ")" },
        { status: 400 }
      );
    }

    if (!b.paymentIntentId) {
      return Response.json(
        { ok: false, error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY manquante");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const pi = await stripe.paymentIntents.capture(b.paymentIntentId);

    b.status = "captured";
    await save(bookings);

    if (b.email) {
      await sendEmail(
        b.email,
        "Réservation acceptée",
        "Bonjour " + (b.name || "") +
        "\n\nVotre réservation du " + (b.date || "") +
        " à " + (b.time || "") +
        " est acceptée.\n\nNous avons hâte de vous accueillir.\n\n— La Bodega"
      );
    }

    return Response.json({
      ok: true,
      id: b.id,
      stripeStatus: pi.status
    });

  } catch (e) {
    console.error("ACCEPT ERROR:", e);
    return Response.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
