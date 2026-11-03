import { PokerPlayer } from "./poker-player.dto.js";

export interface HandPayout {
  player: PokerPlayer;
  amount: number;
}