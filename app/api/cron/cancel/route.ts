import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: { status: "pending" },
  });

  for (const b of bookings) {
    const bookingDate = new Date(`${b.date}T${b.time}`);
    const limit = new Date(bookingDate.getTime() + 20 * 60 * 1000);

    if (now > limit) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { status: "cancelled" },
      });
    }
  }

  return Response.json({ ok: true });
}
