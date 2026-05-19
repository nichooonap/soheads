// Pitch slot layout for the two supported formations.
// Coordinates are percentages where (0,0) is bottom-left of the pitch (own goal).

export type Slot = {
  index: number;
  position: "GK" | "DF" | "MD" | "FW" | "EX";
  /** horizontal % from left */
  x: number;
  /** vertical % from bottom (own goal) — higher = further up the pitch */
  y: number;
};

// Sorare layout: two rows of cards.
// 5-a-side: bottom row VER · GK(center, dropped) · MF; top row ANG · EX.
export const FORMATION_5: Slot[] = [
  { index: 0, position: "GK", x: 50, y: 18 },
  { index: 1, position: "DF", x: 22, y: 28 },
  { index: 2, position: "MD", x: 78, y: 28 },
  { index: 3, position: "FW", x: 32, y: 70 },
  { index: 4, position: "EX", x: 68, y: 70 },
];

// 7-a-side: bottom row VER · GK(center, dropped) · VER; top row MF · ANG · EX · MF.
export const FORMATION_7: Slot[] = [
  { index: 0, position: "GK", x: 50, y: 18 },
  { index: 1, position: "DF", x: 28, y: 28 },
  { index: 2, position: "DF", x: 72, y: 28 },
  { index: 3, position: "MD", x: 14, y: 70 },
  { index: 4, position: "FW", x: 38, y: 78 },
  { index: 5, position: "EX", x: 62, y: 78 },
  { index: 6, position: "MD", x: 86, y: 70 },
];

export function getFormation(n: 5 | 7): Slot[] {
  return n === 5 ? FORMATION_5 : FORMATION_7;
}
