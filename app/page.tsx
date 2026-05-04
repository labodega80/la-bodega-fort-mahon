import HeroActions from "./components/HeroActions";
import GalleryLightbox from "./components/GalleryLightbox";

export default function Home() {
  const gallery = [
    { src: "/images/galerie-1.jpg", alt: "La Bodega" },
    { src: "/images/galerie-2.jpg", alt: "La Bodega" },
    { src: "/images/galerie-3.jpg", alt: "La Bodega" },
    { src: "/images/galerie-4.jpg", alt: "La Bodega" },
    { src: "/images/galerie-5.jpg", alt: "La Bodega" },
    { src: "/images/galerie-6.jpg", alt: "La Bodega" },
    { src: "/images/galerie-7.jpg", alt: "La Bodega" },
    { src: "/images/galerie-8.jpg", },
  ];

  const styles: Record<string, React.CSSProperties> = {
    page: {
      maxWidth: 1100,
      margin: "0 auto",
      padding: 20,
      lineHeight: 1.5,
    },

    heroWrap: {
      position: "relative",
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid #e6e6e6",
      minHeight: 420,
    },

    heroImg: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },

    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))",
    },

    heroContent: {
      position: "relative",
      padding: 40,
      color: "white",
      maxWidth: 900,
    },

    heroTitle: {
      margin: 0,
      fontSize: "clamp(42px, 6vw, 72px)",
      fontWeight: 900,
      letterSpacing: -1,
      textShadow: "0 4px 20px rgba(0,0,0,0.45)",
    },

    heroSub: {
      marginTop: 16,
      fontSize: "clamp(18px, 2vw, 22px)",
      lineHeight: 1.4,
      textShadow: "0 2px 10px rgba(0,0,0,0.4)",
    },

    heroLine: {
      display: "block",
    },

    pillRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginTop: 20,
    },

    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.14)",
      border: "1px solid rgba(255,255,255,0.18)",
      fontSize: 14,
      fontWeight: 600,
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    },

    ctaGoogle: {
      display: "inline-block",
      marginTop: 14,
      padding: "10px 16px",
      borderRadius: 12,
      background: "#fff",
      color: "#111",
      textDecoration: "none",
      fontWeight: 800,
    },

    section: {
      marginTop: 40,
    },

    sectionTitle: {
      fontSize: 24,
      marginBottom: 18,
    },

    infoGrid: {
      display: "grid",
      gap: 16,
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    },

    infoCard: {
      border: "1px solid #e6e6e6",
      borderRadius: 14,
      padding: 16,
      background: "white",
    },

    infoLabel: {
      fontWeight: 800,
      display: "block",
      marginBottom: 6,
    },

    mapFrame: {
      width: "100%",
      height: 320,
      border: 0,
      borderRadius: 14,
      marginTop: 12,
    },

    footer: {
      marginTop: 40,
      paddingTop: 18,
      borderTop: "1px solid #eee",
      textAlign: "center",
      fontSize: 14,
      opacity: 0.75,
    },
  };

  return (
    <main style={styles.page}>
      {/* HERO */}
      <header style={styles.heroWrap}>
        <img
          src="/images/galerie-6.jpg"
          alt="La Bodega — Fort-Mahon"
          style={styles.heroImg}
        />
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>La Bodega</h1>

          {/* ✅ IMPORTANT : <p> bien fermé */}
          <p style={styles.heroSub}>
            <span style={styles.heroLine}>
              Cuisine maison généreuse à partir de produits frais
            </span>
            <span style={styles.heroLine}>
              Ambiance conviviale, à deux pas de la plage.
            </span>
          </p>

          <div style={styles.pillRow}>
            <span style={styles.pill}>
              📍 1175 avenue de la Plage — 80120 Fort-Mahon-Plage
            </span>
            <span style={styles.pill}>📞 06 68 26 82 78 • 06 14 32 16 58</span>
            <span style={styles.pill}>✉️ la_bodega@fort-mahon.com</span>
          </div>

          {/* Boutons (client component) */}
          <HeroActions />

          {/* ✅ UN SEUL bouton Avis Google (pas doublé) */}
          
        </div>
      </header>

      {/* INFOS PRATIQUES */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Infos pratiques</h2>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>Adresse</span>
            <div>
              1175 avenue de la Plage
              <br />
              80120 Fort-Mahon-Plage
            </div>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>Contact</span>
            <div>
              06 68 26 82 78
              <br />
              06 14 32 16 58
              <br />
              la_bodega@fort-mahon.com
            </div>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>Horaires</span>
            <div>
              Midi : 11:30 — 14:30
              <br />
              Soir : 18:30 — 21:30
            </div>
          </div>
        </div>
      </section>

      {/* GALERIE */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Galerie</h2>
        <GalleryLightbox items={gallery} />
      </section>

      {/* ACCÈS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Accès</h2>

        <iframe
          title="Carte La Bodega"
          loading="lazy"
          allowFullScreen
          style={styles.mapFrame}
          src="https://www.google.com/maps?q=1175%20avenue%20de%20la%20Plage%2080120%20Fort-Mahon-Plage&output=embed"
        />

        <p style={{ marginTop: 10 }}>
          <a
            href="https://www.google.com/maps/search/?api=1&query=1175%20avenue%20de%20la%20Plage%2080120%20Fort-Mahon-Plage"
            target="_blank"
            rel="noreferrer"
          >
            Ouvrir dans Google Maps
          </a>
        </p>
      </section>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} La Bodega — Fort-Mahon
      </footer>
    </main>
  );
}
