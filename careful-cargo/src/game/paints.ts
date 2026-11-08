import type { TextKey } from "../i18n";

export interface Paint {
  id: string;
  name: TextKey;
  /** null = the vehicle's own color */
  color: string | null;
  price: number;
}

export const PAINTS: Paint[] = [
  { id: "original", name: "paint.original", color: null, price: 0 },
  { id: "sun", name: "paint.sun", color: "#FFC93C", price: 60 },
  { id: "ocean", name: "paint.ocean", color: "#3D8BFF", price: 60 },
  { id: "mint", name: "paint.mint", color: "#3BCEAC", price: 60 },
  { id: "grape", name: "paint.grape", color: "#9B5DE5", price: 90 },
  { id: "bubble", name: "paint.bubble", color: "#FF7EB6", price: 90 },
  { id: "lime", name: "paint.lime", color: "#9BE34D", price: 90 },
];

export function getPaint(id: string | undefined): Paint {
  return PAINTS.find((p) => p.id === id) ?? PAINTS[0];
}
