import { randomInt } from "node:crypto";

const SUITS = ["C", "D", "H", "S"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function shuffleDeck(): string[] {
  const deck: string[] = [];

  for (const suit of SUITS) {
    for (const val of VALUES) {
      deck.push(`${val}${suit}`);
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}