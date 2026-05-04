export const dynamic = "force-dynamic";

type MenuPhoto = { src: string; alt: string };

export default function MenuPage() {
  // 6 blocs portrait
  const photos: MenuPhoto[] = [
    { src: "/images/menu-1.jpg", alt: "Menu 1" },
    { src: "/images/menu-2.jpg", alt: "Menu 2" },
    { src: "/images/menu-3.jpg", alt: "Menu 3" },
    { src: "/images/menu-4.jpg", alt: "Menu 4" },
    { src: "/images/menu-5.jpg", alt: "Menu 5" },
    { src: "/images/menu-6.jpg", alt: "Menu 6" },
  ];

  return (
    <main className="page">
      <style>{css}</style>

      <div className="sheet printOnePage">
        <header className="header">
          <div className="brand">
            <div className="mark">🍷</div>
            <div>
              <h1 className="h1">Menu</h1>
              <div className="h2">La Bodega — Fort-Mahon-Plage</div>
              <div className="meta">1175 avenue de la Plage • 80120 Fort-Mahon-Plage</div>
            </div>
          </div>

          <nav className="actions" aria-label="Navigation">
            <a className="btn btnPrimary" href="/reserver">
              Réserver
            </a>
            <a className="btn" href="/">
              Accueil
            </a>
            <a
              className="btn"
              href="https://www.google.com/search?q=La+Bodega+Fort-Mahon-Plage+avis"
              target="_blank"
              rel="noreferrer"
            >
              ★ Avis Google
            </a>
          </nav>
        </header>

        <div className="notice">
          <div className="noticeTitle">Format A4</div>
          <div className="noticeText">
            6 blocs <b>portrait</b> (2 colonnes × 3 lignes). À l’impression, si ça dépasse :{" "}
            <b>“Ajuster à la page”</b> (ou 95–100%).
          </div>
        </div>

        <section className="grid" aria-label="Photos du menu">
          {photos.map((p) => (
            <figure key={p.src} className="woodCard">
              <div className="woodInner">
                <img className="img" src={p.src} alt={p.alt} />
              </div>
              <figcaption className="cap">{p.alt}</figcaption>
            </figure>
          ))}
        </section>

        <footer className="footer">
          <span>📞 06 68 26 82 78 • 06 14 32 16 58</span>
          <span>✉️ la_bodega@fort-mahon.com</span>
        </footer>
      </div>
    </main>
  );
}

const css = `
/* Feuille centrale */
.sheet{
  max-width: 980px;
  margin: 0 auto;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255,255,255,0.60);
  border: 1px solid rgba(23,20,18,0.14);
  box-shadow: 0 30px 90px rgba(0,0,0,0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Header */
.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:14px;
  flex-wrap:wrap;
  padding-bottom:12px;
  border-bottom:1px solid rgba(23,20,18,0.10);
  margin-bottom:12px;
}
.brand{ display:flex; gap:12px; align-items:center; }
.mark{
  width:44px;height:44px;border-radius:14px;
  display:grid;place-items:center;
  background: linear-gradient(180deg, rgba(23,20,18,0.08), rgba(23,20,18,0.02));
  border:1px solid rgba(23,20,18,0.12);
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  font-size:22px;
}
.h1{ margin:0; font-size:30px; letter-spacing:-0.6px; line-height:1.05; }
.h2{ margin-top:2px; font-size:14px; opacity:0.85; font-weight:800; }
.meta{ margin-top:6px; font-size:12px; opacity:0.75; }

.actions{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid rgba(23,20,18,0.14);
  text-decoration:none;
  color:#171412;
  background: rgba(255,255,255,0.72);
  box-shadow: 0 10px 24px rgba(0,0,0,0.08);
  font-weight:900;
  font-size:14px;
}
.btnPrimary{
  background: linear-gradient(180deg, #171412, #0e0c0b);
  color:#fff;
  border:1px solid rgba(0,0,0,0.35);
  box-shadow: 0 18px 40px rgba(0,0,0,0.18);
}

/* Notice */
.notice{
  border-radius:18px;
  padding:12px 14px;
  background: rgba(255,255,255,0.72);
  border:1px solid rgba(23,20,18,0.12);
  box-shadow: 0 14px 34px rgba(0,0,0,0.08);
  margin-bottom:14px;
}
.noticeTitle{
  font-size:12px;
  font-weight:900;
  letter-spacing:0.8px;
  text-transform:uppercase;
  opacity:0.75;
}
.noticeText{ margin-top:6px; font-size:13px; line-height:1.45; opacity:0.92; }

/* Grid 2x3 */
.grid{
  display:grid;
  gap:12px;
  grid-template-columns: repeat(2, 1fr);
}

/* Cadre bois */
.woodCard{
  margin:0;
  border-radius:20px;
  overflow:hidden;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05)),
    repeating-linear-gradient(
      90deg,
      rgba(120,90,55,0.60) 0px,
      rgba(120,90,55,0.60) 8px,
      rgba(135,100,60,0.60) 8px,
      rgba(135,100,60,0.60) 16px
    );
  border: 1px solid rgba(60,40,25,0.35);
  box-shadow:
    0 22px 50px rgba(0,0,0,0.14),
    inset 0 1px 0 rgba(255,255,255,0.25);
  position: relative;
}
.woodCard::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(120px 80px at 20% 15%, rgba(0,0,0,0.10), transparent 60%),
    radial-gradient(140px 90px at 85% 30%, rgba(0,0,0,0.08), transparent 60%),
    radial-gradient(110px 70px at 60% 85%, rgba(0,0,0,0.10), transparent 60%),
    repeating-linear-gradient(
      0deg,
      rgba(0,0,0,0.06) 0px,
      rgba(0,0,0,0.06) 1px,
      transparent 1px,
      transparent 10px
    );
  mix-blend-mode: multiply;
  opacity: 0.45;
  pointer-events:none;
}

.woodInner{ padding: 10px; position: relative; }
.woodInner::after{
  content:"";
  position:absolute;
  inset: 10px;
  border-radius: 14px;
  box-shadow:
    inset 0 0 0 10px rgba(255,255,255,0.62),
    inset 0 0 0 11px rgba(23,20,18,0.12);
  pointer-events:none;
}

/* Portrait */
.img{
  display:block;
  width:100%;
  height: 390px;
  object-fit: cover;
  border-radius: 14px;
  border:1px solid rgba(23,20,18,0.20);
  background:#fff;
}
.cap{
  padding: 10px 12px;
  font-size: 12px;
  opacity: 0.88;
  border-top: 1px solid rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.25);
}

/* Footer */
.footer{
  margin-top:14px;
  padding-top:10px;
  border-top:1px solid rgba(23,20,18,0.10);
  font-size:12px;
  opacity:0.88;
  display:flex;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}

/* Responsive */
@media (max-width: 680px){
  .grid{ grid-template-columns: 1fr; }
  .img{ height: 320px; }
}

/* PRINT A4 (1 page) */
@page{ size:A4; margin:10mm; }
@media print{
  html, body { height:auto; background:#fff !important; }
  .page { background:#fff !important; padding:0 !important; }
  .sheet{
    max-width:none;
    margin:0;
    padding:0;
    border:none;
    box-shadow:none;
    background:#fff !important;
    backdrop-filter:none;
    -webkit-backdrop-filter:none;
  }
  .printOnePage{ break-inside: avoid; page-break-inside: avoid; }
  .grid{ gap: 8px; }
  .img{ height: 250px !important; } /* si ça dépasse: 240 / 230 */
  *{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;