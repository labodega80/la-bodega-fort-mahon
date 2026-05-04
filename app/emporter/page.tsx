"use client";

import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  desc: string;
  priceCents: number;
  category: "pizza" | "burger" | "boisson" | "fries" | "mussels";
};

const items: Item[] = [
  // PIZZAS
  { id: "pizza-margherita", category: "pizza", name: "Margherita", desc: "Sauce tomate, Mozzarella Fiore di latte, Origan", priceCents: 1200 },
  { id: "pizza-irene", category: "pizza", name: "Irene", desc: "Sauce tomate, Mozzarella, Chiffonade de Jambon blanc, Champignons, Olives", priceCents: 1490 },
  { id: "pizza-4fromages", category: "pizza", name: "4 Fromages", desc: "Crème, Mozzarella, Maroilles, Gorgonzola, Fromage de chèvre", priceCents: 1690 },
  { id: "pizza-piqante", category: "pizza", name: "Piquante", desc: "Sauce tomate, Mozzarella, Chorizo, Piment Jalapenos", priceCents: 1490 },
  { id: "pizza-verde", category: "pizza", name: "Verde", desc: "Sauce tomate, Poivron, Olives, Aubergine grillée, Courgette grillée, Artichaut, Tomates cerise, Roquette", priceCents: 1590 },
  { id: "pizza-quatres-saisons", category: "pizza", name: "Quatre saisons", desc: "Sauce tomate, Mozzarella, Artichaut, Champignons, Chiffonnade de jambon blanc, Olives", priceCents: 1650 },
  { id: "pizza-picarde", category: "pizza", name: "Picarde", desc: "Emincé de champignons cuisinés à la crème, Mozzarella, Chiffonade de jambon blanc, Emmenthal", priceCents: 1550 },
  { id: "pizza-Olé-Olé", category: "pizza", name: "Olé Olé", desc: "Crème, Mozzarella, Fromage de chèvre, Lard grillé, Miel, Tomates cerise, Roquette", priceCents: 1550 },
  { id: "", category: "pizza", name: "Saumon épinard", desc: "Epinards cuisinés à la crème, Chiffonade de Saumon frais, Mozzarella, Citron", priceCents: 1750 },
  { id: "pizza-maroilles", category: "pizza", name: "Maroilles", desc: "Crème, Mozzarella, Maroilles, Lard grillé, Oignon rouge", priceCents: 1850 },
  { id: "pizza-baie de somme", category: "pizza", name: "Baie de Somme", desc: "Sauce Tomate, Mozzarella, Assortiment de fruits de mer sautés à l'ail selon arriveage, Moules,Crevettes, Couteaux, Calamars", priceCents: 1850 },
  { id: "pizza-duo de saumons", category: "pizza", name: "Duo de Saumons", desc: "Crème d'Aneth, Mozzarella, Chiffonade de Saumon frais, Chiffonade de Saumon fumé, Burrata, Citron", priceCents: 1500 },
  { id: "pizza-napolitaine", category: "pizza", name: "Napolitaine", desc: "Tomate, mMzzarella, Anchois, Câpres, Olives", priceCents: 1450 },
  { id: "pizza-des-Iles", category: "pizza", name: "Des Iles", desc: "Crème, Mozzarella, Emincé de poulet halal, Ananas,Poivron, oignon", priceCents: 1650 },
  { id: "pizza-des-alpes", category: "pizza", name: "Des Alpes", desc: "Crème, Mozzarella, Pommes de terre, Lard grillé, Chiffonnade de Jambon de Parme, Chiffonnade de Jambon blanc, Tomates cerise", priceCents: 1950 },
  { id: "pizza-mielleuse", category: "pizza", name: "Mielleuse", desc: "Crème, Mozzarella, Fromage de chèvre, Burrata, Miel, Roquette", priceCents: 1750 },
  { id: "pizza-cheese-burger", category: "pizza", name: "Cheese Burger", desc: "Sauce tomate, Steak Haché, Cheddar, Oignon rouge, Mozzarella, Lard grillé, Sauce  barbecue", priceCents: 1750 },
  { id: "pizza-serrana", category: "pizza", name: "Serrana", desc: "Sauce tomate, Mozzarella, Jambon de Parme, Burrata, Melon, Crème de balsamique, Roquette", priceCents: 1950 },
  { id: "pizza-sud", category: "pizza", name: "Sud", desc: "Sauce tomate, Mozzarella, Merguez, Chorizo, Poivron, Oignon rouge, Piment Jalapenos", priceCents: 1750 },

  // BURGERS
  { id: "burger-chti", category: "burger", name: "Chti Burger", desc: "Steak haché frais grillé à la flamme, Maroilles, Lard grillé, Oignons frits, Mayonnaise maison", priceCents: 1300 },
  { id: "burger-bacon", category: "burger", name: "Bacon Cheese Burger", desc: "Steak haché frais grillé à la flamme, Lard grillé, Tomate, Cornichon en pickle, Cheddar, Smokey sauce, Laitue", priceCents: 1400 },
  { id: "burger-chicken", category: "burger", name: "Chicken Burger", desc: "Poulet croustillant, Tome blanche, Concombre en pickle, Laitue, Sauce blanche", priceCents: 1300 },
  { id: "burger-fish", category: "burger", name: "Fish & Cheese Burger", desc: "Filet de poisson frais en beignet, Cheddar, Laitue, Sauce tartare maison", priceCents: 1500 },
  { id: "burger-veggie", category: "burger", name: "Veggy Burger", desc: "Galette de légumes, Raclette, Tomates confites, Poivron grillé, Laitue, Sauce blanche", priceCents: 1700 },
 
  // FRITES
  { id: "fries-portion", category: "fries", name: "Petite Frites maison", desc: "Portion", priceCents: 390 },
  { id: "fries-large", category: "fries", name: "Grande frites", desc: "À partager", priceCents: 700 },

  // MOULES
  { id: "mussels-mariniere",category: "mussels", name: "Moules marinières", desc: "Vin blanc, oignon, céleri, persil - Prêtes à cuire", priceCents: 1690 },
  { id: "mussels-maroilles", category: "mussels", name: "Moules au Maroilles", desc: "à cuire dans un fondu de Maroilles - Prêtes à cuire", priceCents: 1400 },
  { id: "mussels-roquefort", category: "mussels", name: "Moules au Roquefort", desc: "à cuire dans un fondu de Roquefort - Prêtes à cuire", priceCents: 1500 },
  { id: "mussels-ail", category: "mussels", name: "Moules à l'ail", desc: "Beurre, ail, herbes fraiches - Prêtes à cuire", priceCents: 1400 },
  { id: "mussels-creme", category: "mussels", name: "Moules à la crème", desc: "Crème, échalote, muscade - Prêtes à cuire", priceCents: 1450 },
  { id: "mussels-picardes",category: "mussels", name: "Moules à la picarde", desc: "à cuire dans un fondu de poireau - Prêtes à cuire", priceCents: 1690 },

  // BOISSONS
  { id: "coca", category: "boisson", name: "Coca-Cola", desc: "33cl", priceCents: 350 },
  { id: "coca-zero", category: "boisson", name: "Coca-Cola Zéro", desc: "33cl", priceCents: 350 },
  { id: "eau", category: "boisson", name: "Eau minérale", desc: "50cl", priceCents: 250 },
  { id: "icetea", category: "boisson", name: "Ice Tea", desc: "33cl", priceCents: 350 },
  { id: "orangina", category: "boisson", name: "Orangina", desc: "33cl", priceCents: 350 },
  { id: "limonade", category: "boisson", name: "Limonade", desc: "33cl", priceCents: 300 },
  { id: "perrier", category: "boisson", name: "Perrier", desc: "33cl", priceCents: 300 },
  { id: "sprite", category: "boisson", name: "Sprite", desc: "33cl", priceCents: 350 },
  { id: "fanta", category: "boisson", name: "Fanta", desc: "33cl", priceCents: 350 },
  { id: "oasis", category: "boisson", name: "Oasis", desc: "33cl", priceCents: 350 },
  { id: "jus-orange", category: "boisson", name: "Jus d'orange", desc: "25cl", priceCents: 300 },
  { id: "jus-pomme", category: "boisson", name: "Jus de pomme", desc: "25cl", priceCents: 300 },
  { id: "diabolo", category: "boisson", name: "Diabolo grenadine", desc: "25cl", priceCents: 300 },
  { id: "schweppes", category: "boisson", name: "Schweppes", desc: "33cl", priceCents: 350 },
];

function eur(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default function EmporterPage() {
  const WHATSAPP_PHONE = "33668268278";

  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, 0]))
  );

  const [customerName, setCustomerName] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [comments, setComments] = useState("");

  const pizzas = items.filter((i) => i.category === "pizza");
  const burgers = items.filter((i) => i.category === "burger");
  const fries = items.filter((i) => i.category === "fries");
  const mussels = items.filter((i) => i.category === "mussels");
  const drinks = items.filter((i) => i.category === "boisson");

  const orderLines = useMemo(() => {
    const picked = items
      .map((it) => ({ ...it, q: qty[it.id] ?? 0 }))
      .filter((x) => x.q > 0);

    const totalCents = picked.reduce((sum, x) => sum + x.q * x.priceCents, 0);

    return { picked, totalCents };
  }, [qty]);

  const whatsappUrl = useMemo(() => {
    const lines: string[] = [];

    lines.push("Commande La Bodega");
    lines.push("");

    orderLines.picked.forEach((p) => {
      lines.push(`${p.q} x ${p.name} ${eur(p.q * p.priceCents)}`);
    });

    lines.push("");
    lines.push(`TOTAL ${eur(orderLines.totalCents)}`);
    lines.push(`Nom ${customerName}`);
    lines.push(`Heure ${pickupTime}`);
    lines.push(`Commentaires ${comments}`);

    return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
      lines.join("\n")
    )}`;
  }, [orderLines, customerName, pickupTime, comments]);

  function inc(id: string) {
    setQty((q) => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  }

  function dec(id: string) {
    setQty((q) => ({ ...q, [id]: Math.max((q[id] ?? 0) - 1, 0) }));
  }

  function clearAll() {
    setQty(Object.fromEntries(items.map((i) => [i.id, 0])));
    setCustomerName("");
    setPickupTime("");
    setComments("");
  }

  function renderItem(item: Item) {
    return (
      <div
        key={item.id}
        style={{
          padding: "10px 12px",
          borderTop: "1px solid #eee",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            flexWrap: "nowrap",
          }}
        >
          <div
            style={{
            flex: 1,
            minWidth: 0,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: item.category === "fries" ? "#c1121f" : "#000"
          }}
        >
            {item.name}
          </div>

          <div
            style={{
              width: 80,
              textAlign: "right",
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {eur(item.priceCents)}
          </div>

          <div
            style={{
              width: 90,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <button onClick={() => dec(item.id)} type="button">
              −
            </button>

            <div style={{ width: 24, textAlign: "center" }}>{qty[item.id]}</div>

            <button onClick={() => inc(item.id)} type="button">
              +
            </button>
          </div>
        </div>

        <div style={{ fontSize: 13, opacity: 0.7 }}>{item.desc}</div>
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 20,
        background: "linear-gradient(180deg,#f3b45b 0%,#e87a2f 45%,#ffe6c9 100%)",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#8b1e2d", fontSize: 38, marginBottom: 20 }}>
        Commande à emporter
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <section
          style={{
            background:"#ffe6c9",
            borderRadius: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              padding: 14,
              margin: 0,
              background:"#e87a2f",
              color:"#fff"
            }}
          >
            🍕 Pizzas
          </h2>
          {pizzas.map(renderItem)}
        </section>

        <section
          style={{
            background:"#ffe6c9",
            borderRadius: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              padding: 14,
              margin: 0,
              background:"#b73446",
              color:"#fff"
            }}
          >
            🍔 Burgers / Frites / Moules
          </h2>
          {burgers.map(renderItem)}
          {fries.map(renderItem)}
          {mussels.map(renderItem)}
        </section>

        <section
          style={{
            background:"#ffe6c9",
            borderRadius: 18,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <h2
            style={{
              padding: 14,
              margin: 0,
              background:"#8b1e2d",
              color:"#fff"
            }}
          >
            🥤 Boissons
          </h2>
          {drinks.map(renderItem)}
        </section>
      </div>

      <section
        style={{
          marginTop: 36,
          padding: 28,
          background:"linear-gradient(135deg,#ffe6c9,#fff3db)",
          borderRadius: 24,
          border:"2px solid #e87a2f",
          boxShadow: "0 16px 40px rgba(139,30,45,0.10)",
         }}
       >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.4fr",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background:"linear-gradient(135deg,#b73446,#e87a2f)",
              color: "#fff",
              borderRadius: 20,
              padding: 24,
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  opacity: 0.9,
                  marginBottom: 10,
                  letterSpacing: 0.3,
                }}
              >
                TOTAL COMMANDE
              </div>

              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  lineHeight: 1,
                  marginBottom: 14,
                }}
              >
                {eur(orderLines.totalCents)}
              </div>

              <div style={{ fontSize: 14, opacity: 0.92 }}>
                {orderLines.picked.length
                  ? `${orderLines.picked.length} article(s) sélectionné(s)`
                  : "Ajoute des articles pour préparer ta commande"}
              </div>
            </div>

            <button
              onClick={clearAll}
              type="button"
              style={{
                marginTop: 18,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Vider la commande
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <input
              placeholder="Nom"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid #e5c7ba",
                fontSize: 15,
                background: "#fff",
              }}
            />

            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid #e5c7ba",
                fontSize: 15,
                background: "#fff",
              }}
            />

            <textarea
              placeholder="Commentaires"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={6}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid #e5c7ba",
                fontSize: 15,
                background: "#fff",
                resize: "vertical",
                minHeight: 140,
                fontFamily: "inherit",
              }}
            />

            <a
              href={orderLines.picked.length ? whatsappUrl : undefined}
              style={{
                padding: "18px 20px",
                background: orderLines.picked.length
                  ? "linear-gradient(135deg, #8b1e2d, #d13a52)"
                  : "#c9c9c9",
                color: "#fff",
                textAlign: "center",
                borderRadius: 16,
                fontWeight: 900,
                fontSize: 18,
                textDecoration: "none",
                boxShadow: orderLines.picked.length
                  ? "0 12px 26px rgba(139,30,45,0.22)"
                  : "none",
                pointerEvents: orderLines.picked.length ? "auto" : "none",
              }}
            >
              Commander WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
