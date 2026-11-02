"use client";

import { useState } from "react";
import ActionButtons from "./ActionButtons";
import { CardSlot, PlayerHand, PopUpTop, PopUpUnder, SeatIcon } from "./layout";
import type { PokerActionType, PublicGameState } from "../types";

const SEAT_POSITIONS = [
  { seat: "top-[85%] left-[50%]", hand: "top-[70%] left-[50%]" },
  { seat: "top-[82%] left-[18%]", hand: "top-[67%] left-[25%]" },
  { seat: "top-[50%] left-[7%]", hand: "top-[50%] left-[20%]" },
  { seat: "top-[18%] left-[18%]", hand: "top-[33%] left-[25%]" },
  { seat: "top-[15%] left-[50%]", hand: "top-[30%] left-[50%]" },
  { seat: "top-[18%] left-[82%]", hand: "top-[33%] left-[75%]" },
  { seat: "top-[50%] left-[93%]", hand: "top-[50%] left-[80%]" },
  { seat: "top-[82%] left-[82%]", hand: "top-[67%] left-[75%]" },
];

const SEAT_POSITIONS_BY_PLAYER_COUNT: Record<number, typeof SEAT_POSITIONS> = {
  2: [
    SEAT_POSITIONS[0],
    { seat: "top-[15%] left-[50%]", hand: "top-[30%] left-[50%]" },
  ],
  3: [
    SEAT_POSITIONS[0],
    SEAT_POSITIONS[3],
    SEAT_POSITIONS[5],
  ],
  4: [
    SEAT_POSITIONS[0],
    SEAT_POSITIONS[2],
    SEAT_POSITIONS[4],
    SEAT_POSITIONS[6],
  ],
  5: [
    SEAT_POSITIONS[0],
    SEAT_POSITIONS[1],
    SEAT_POSITIONS[3],
    SEAT_POSITIONS[5],
    SEAT_POSITIONS[7],
  ],
  6: [
    SEAT_POSITIONS[0],
    SEAT_POSITIONS[1],
    SEAT_POSITIONS[3],
    SEAT_POSITIONS[4],
    SEAT_POSITIONS[5],
    SEAT_POSITIONS[7],
  ],
};

interface GameTableProps {
  gameState: PublicGameState | null;
  tableSessionId: string;
  userId: string | null;
  myCards: string[];
  lobbyPlayerCount: number;
  isConnected: boolean;
  isHost: boolean;
  isStartingHand: boolean;
  isHandInProgress: boolean;
  isMyTurn: boolean;
  callAmount: number;
  onStartHand: () => void;
  onAction: (actionType: PokerActionType, amount?: number) => void;
}

function CardImage({
  card,
  alt,
  delay = 0,
}: {
  card: string;
  alt: string;
  delay?: number;
}) {
  return (
    <img
      src={`/theme/standard/${card}.svg`}
      alt={alt}
      className="deal-card h-full w-full object-contain"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function getCardName(card: string) {
  const rankCode = card.slice(0, -1);
  const suitCode = card.slice(-1);
  const ranks: Record<string, string> = {
    A: "Ace",
    J: "Jack",
    Q: "Queen",
    K: "King",
  };
  const suits: Record<string, string> = {
    C: "Clubs",
    D: "Diamonds",
    H: "Hearts",
    S: "Spades",
  };
  const rank = ranks[rankCode] ?? rankCode;
  const suit = suits[suitCode];

  return suit ? `${rank} of ${suit}` : card;
}

export default function GameTable({
  gameState,
  tableSessionId,
  userId,
  myCards,
  lobbyPlayerCount,
  isConnected,
  isHost,
  isStartingHand,
  isHandInProgress,
  isMyTurn,
  callAmount,
  onStartHand,
  onAction,
}: GameTableProps) {
  const [hoveredCard, setHoveredCard] = useState<{
    playerId: string;
    name: string;
  } | null>(null);

  const myPlayer = gameState?.players.find(
    (player) => player.playerId === userId,
  );
  const mySeatNumber = myPlayer
    ? myPlayer.seatNumber ?? gameState?.players.indexOf(myPlayer) ?? 0
    : null;
  const seatPositions = SEAT_POSITIONS_BY_PLAYER_COUNT[gameState?.players.length ?? 0]
    ?? SEAT_POSITIONS;

  const getPlayerName = (playerId: string) => {
    if (playerId === userId) return "You";
    const playerIndex = gameState?.players.findIndex(
      (player) => player.playerId === playerId,
    ) ?? -1;
    const player = gameState?.players[playerIndex];
    return player
      ? `Player ${(player.seatNumber ?? playerIndex) + 1}`
      : "Player";
  };

  return (
    <>
      <div className="relative w-[85vw] max-w-[1100px] aspect-[16/10] flex justify-center items-center">
        <div
          id="table"
          className="relative w-[78%] h-[58%] bg-[#0b6b3a] rounded-[160px] border-[20px] border-[#5c3a21] shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.7)]"
        >
          <div className="absolute left-1/2 top-[34%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Community cards{gameState?.round ? ` · ${gameState.round}` : ""}
            </p>
            <div className="flex h-[10vh] max-h-[76px] min-h-[48px] gap-1.5">
              {[0, 1, 2, 3, 4].map((cardIndex) => {
                const card = gameState?.poolCards[cardIndex];
                return (
                  <div
                    key={cardIndex}
                    className="group relative aspect-[60/85] h-full border-2 border-dashed border-[#64748b] rounded-[10%] cursor-pointer transition-all duration-200 hover:border-[#f87171]"
                  >
                    {card && (
                      <>
                        <CardImage
                          key={`${gameState?.handId}-${card}`}
                          card={card}
                          alt={`Community card ${cardIndex + 1}`}
                          delay={cardIndex * 100}
                        />
                        <PopUpUnder>
                          <p className="text-sm font-semibold">{getCardName(card)}</p>
                        </PopUpUnder>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 text-center">
            <p className="font-bold text-xl">Pot: {gameState?.pot ?? 0}</p>
            <p className="text-sm">Ante: {gameState?.ante ?? 0}</p>
            <p className="text-sm">Current bet: {gameState?.currentBet ?? 0}</p>
          </div>
        </div>

        {gameState?.players.map((player, playerIndex) => {
          const seatNumber = player.seatNumber ?? playerIndex;
          const relativeSeatNumber = mySeatNumber === null
            ? seatNumber
            : (
              (seatNumber - mySeatNumber) % seatPositions.length
              + seatPositions.length
            ) % seatPositions.length;
          const position = seatPositions[relativeSeatNumber];
          if (!position) return null;

          const isMe = player.playerId === userId;
          const cards = gameState.settled
            ? gameState.revealedCards?.[player.playerId] ?? (isMe ? myCards : [])
            : isMe
              ? myCards
              : [];
          const inTurn = gameState.currentPlayerId === player.playerId;
          const displayName = isMe
            ? "You"
            : `Player ${seatNumber + 1}`;

          return (
            <div key={player.playerId}>
              <div
                className={`group absolute h-[11%] aspect-square -translate-x-1/2 -translate-y-1/2 ${hoveredCard?.playerId === player.playerId ? "z-[1000]" : "z-60"} ${position.seat}`}
              >
                {hoveredCard?.playerId === player.playerId && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white bg-black px-3 py-2 text-sm font-semibold text-white shadow-lg"
                  >
                    {hoveredCard.name}
                  </div>
                )}
                <SeatIcon>
                  <span className={inTurn ? "font-extrabold text-yellow-300" : ""}>
                    {displayName}
                  </span>
                  <PopUpTop>
                    <h2 className="font-bold text-sm">{displayName}</h2>
                    <p className="text-xs">Stack: {player.stack}</p>
                    {player.roundContribution !== undefined && (
                      <p className="text-xs">Bet: {player.roundContribution}</p>
                    )}
                    <p className="text-xs">{player.folded ? "Folded" : player.allIn ? "All-in" : inTurn ? "Your turn" : "Waiting"}</p>
                  </PopUpTop>
                </SeatIcon>
                {!isMe && (
                  <div
                    aria-label={`${displayName} chips: ${player.stack}`}
                    className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-300/50 bg-black/85 px-2 py-0.5 text-xs font-bold text-emerald-200 shadow"
                  >
                    {player.stack} chips
                  </div>
                )}
              </div>

              <PlayerHand Position={position.hand}>
                {[0, 1].map((cardIndex) => (
                  <CardSlot key={`${player.playerId}-${cardIndex}`}>
                    <div
                      className="h-full w-full"
                      onMouseEnter={() => {
                        const card = cards[cardIndex];
                        if (card) {
                          setHoveredCard({
                            playerId: player.playerId,
                            name: getCardName(card),
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <CardImage
                        key={`${gameState.handId}-${cards[cardIndex] ?? "Back"}`}
                        card={cards[cardIndex] ?? "Back"}
                        alt={cards[cardIndex]
                          ? `${displayName}'s card ${cardIndex + 1}`
                          : "Face-down card"}
                        delay={(playerIndex * 2 + cardIndex) * 100}
                      />
                    </div>
                  </CardSlot>
                ))}
              </PlayerHand>
            </div>
          );
        })}
      </div>

      {gameState && (
        <div className="fixed bottom-[3vh] left-[3vw] bg-black border-2 border-[#444] rounded-xl px-5 py-3 text-white flex flex-col">
          <span className="text-sm text-[#aaa] uppercase tracking-wide">Your chips</span>
          <span className="text-2xl font-bold text-[#2ecc71] font-mono">
            {myPlayer?.stack ?? 0}
          </span>
        </div>
      )}

      {gameState?.settled && (
        <section
          aria-live="polite"
          className="fixed bottom-[12vh] left-1/2 z-70 w-[min(90vw,34rem)] -translate-x-1/2 rounded-xl border border-amber-300/60 bg-black/90 p-4 text-center shadow-xl"
        >
          {gameState.winners?.length ? (
            <ul className="mt-2 space-y-1">
              {gameState.winners.map((winner) => (
                <li key={winner.playerId}>
                  <span className="font-semibold">{getPlayerName(winner.playerId)}</span>
                  {" won "}
                  <span className="font-bold text-emerald-300">{winner.amount}</span>
                  {winner.hand ? ` with ${winner.hand}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-white/75">
              The hand ended without a showdown.
            </p>
          )}
          {gameState.cycleComplete && (
            <p className="mt-2 text-sm text-amber-100">
              Match cycle complete.
            </p>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={onStartHand}
        disabled={
          !isConnected
          || !tableSessionId
          || !isHost
          || isStartingHand
          || isHandInProgress
          || lobbyPlayerCount < 2
        }
        title={
          !isHost
            ? "Only the lobby host can start a hand."
            : isHandInProgress
              ? "Wait for the current hand to finish."
              : undefined
        }
        className="fixed bottom-[4vh] left-1/2 z-70 -translate-x-1/2 rounded bg-emerald-600 px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isStartingHand
          ? "Dealing cards..."
          : gameState?.settled
            ? "Deal next hand"
            : "Deal cards"}
      </button>

      {isHandInProgress && (
        <ActionButtons
          disabled={!isMyTurn}
          callAmount={callAmount}
          onAction={onAction}
        />
      )}
    </>
  );
}
