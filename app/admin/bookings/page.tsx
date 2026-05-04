"use client";

import { useEffect, useState } from "react";

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

function eur(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [msg, setMsg] = useState("");

  async function refresh() {
    try {
      setMsg("Chargement…");
      const res = await fetch("/api/admin/bookings", {
        headers: { "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "" },
        cache: "no-store",
      });
      const data = await res.json();
      setBookings(data.bookings || []);
      setMsg("");
    } catch (e: any) {
      setMsg("Erreur chargement");
    }
  }

  async function postAction(url: string) {
    try {
      setMsg("Traitement…");
      const res = await fetch(url, {
        method: "POST",
        headers: { "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "" },
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("❌ " + (data.error || "Erreur"));
      } else {
        setMsg("✅ Opération réussie");
      }
      await refresh();
    } catch {
      setMsg("Erreur serveur");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // ==========================
  // 🎨 STYLES TABLEAU
  // ==========================

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fffbe6",
    border: "2px solid #e6c200",
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    border: "1px solid #e6c200",
    background: "#fff3b0",
    textAlign: "left",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    border: "1px solid #e6c200",
    verticalAlign: "top",
  };

  const actionWrap: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  };

  // ==========================

  return (
    <main style={{ maxWidth: 1300, margin: "0 auto", padding: 20 }}>
      <h1>Admin — Réservations</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 15 }}>
        <button onClick={refresh} style={{ padding: "8px 14px" }}>
          Rafraîchir
        </button>
        {msg && <b>{msg}</b>}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Date & heure</th>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Téléphone</th>
              <th style={thStyle}>Pax</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.slice().reverse().map((b) => (
              <tr key={b.id}>
                <td style={tdStyle}>
                  <code>{b.id}</code>
                </td>

                {/* Date sur une seule ligne */}
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  {b.date} — {b.time}
                </td>

                {/* Nom sur 2 lignes */}
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>
                    {b.name.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 13, color: "#555" }}>
                    {b.name.split(" ").slice(1).join(" ")}
                  </div>
                </td>

                <td style={tdStyle}>{b.email}</td>
                <td style={tdStyle}>{b.phone}</td>
                <td style={tdStyle}>{b.guests}</td>
                <td style={tdStyle}>{eur(b.amountCents)}</td>

                <td style={tdStyle}>
                  <b>{b.status}</b>
                </td>

                <td style={tdStyle}>
                  <div style={actionWrap}>
                    {b.status === "requested" && (
                      <button onClick={() => postAction(`/api/admin/bookings/${b.id}/reject`)}>
                        Refuser
                      </button>
                    )}

                    {b.status === "authorized" && (
                      <>
                        <button onClick={() => postAction(`/api/admin/bookings/${b.id}/accept`)}>
                          Accepter
                        </button>
                        <button onClick={() => postAction(`/api/admin/bookings/${b.id}/reject`)}>
                          Refuser
                        </button>
                      </>
                    )}

                    {b.status === "captured" && (
                      <button onClick={() => postAction(`/api/bookings/${b.id}/cancel`)}>
                        Annuler / Rembourser
                      </button>
                    )}

                    {b.status === "canceled" && (
                      <span style={{ fontSize: 13, color: "#666" }}>
                        Annulée {b.refundId ? `(refund ${b.refundId})` : ""}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!bookings.length && (
              <tr>
                <td colSpan={9} style={tdStyle}>
                  Aucune réservation
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}