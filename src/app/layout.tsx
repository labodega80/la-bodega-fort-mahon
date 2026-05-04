import "./globals.css";

export const metadata = {
  title: "La Bodega — Fort-Mahon",
  description: "Réservation et vente à emporter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
