export type MenuItem = {
  id: string;
  name: string;
  priceCents: number;
};

export const MENU: MenuItem[] = [
  { id: "burger", name: "Burger Maison", priceCents: 1290 },
  { id: "salade", name: "Salade César", priceCents: 1150 },
  { id: "tiramisu", name: "Tiramisu", priceCents: 590 },
];
