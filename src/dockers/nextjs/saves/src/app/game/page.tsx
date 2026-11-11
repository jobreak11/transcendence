"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import enDictionary from "../../dictionaries/en.json";
import thDictionary from "../../dictionaries/th.json";
import type { GameLanguage } from "./components/ActionButtons";
import HandInfo from "./components/handInfo";
import GameTable from "./components/GameTable";
import type { PokerActionType, PublicGameState } from "./types";
import { useGameSocket } from "../(protected)/_context/useGameSocket";
import { PokerEvent } from "../../websocket-events/game/poker/poker-events";
import { GameEvent } from "../../websocket-events/game/game-events";
import { GetLobbyPublicDto, JoinLobbyDto, LobbyDto, LobbyUserCreateDto } from "../../types/dto";

interface PokerActionEvent {
  playerId: string;
  actionType: "FOLD" | "CHECK" | "CALL" | "RAISE";
  amount: number;
}


function isPublicGameState(value: unknown): value is PublicGameState {
  if (
    typeof value !== "object"
    || value === null
    || !("tableSessionId" in value)
    || typeof value.tableSessionId !== "string"
    || !("handId" in value)
    || typeof value.handId !== "string"
    || !("round" in value)
    || typeof value.round !== "string"
    || !("pot" in value)
    || typeof value.pot !== "number"
    || !("poolCards" in value)
    || !Array.isArray(value.poolCards)
    || !value.poolCards.every((card: unknown) => typeof card === "string")
    || !("players" in value)
    || !Array.isArray(value.players)
  ) {
    return false;
  }

  const playersAreValid = value.players.every((player: unknown) =>
    typeof player === "object"
    && player !== null
    && "playerId" in player
    && typeof player.playerId === "string"
    && "stack" in player
    && typeof player.stack === "number"
    && "folded" in player
    && typeof player.folded === "boolean"
    && "allIn" in player
    && typeof player.allIn === "boolean"
    && (!("seatNumber" in player) || typeof player.seatNumber === "number")
    && (!("roundContribution" in player) || typeof player.roundContribution === "number")
  );
  const optionalFieldsAreValid =
    (!("ante" in value) || typeof value.ante === "number")
    && (!("currentBet" in value) || typeof value.currentBet === "number")
    && (
      !("currentPlayerId" in value)
      || typeof value.currentPlayerId === "string"
      || value.currentPlayerId === null
    )
    && (!("settled" in value) || typeof value.settled === "boolean")
    && (!("cycleComplete" in value) || typeof value.cycleComplete === "boolean")
    && (!("matchComplete" in value) || typeof value.matchComplete === "boolean")
    && (!("totalHandsPlayed" in value) || typeof value.totalHandsPlayed === "number")
    && (!("matchStartedAt" in value) || typeof value.matchStartedAt === "string")
    && (!("matchEndedAt" in value) || typeof value.matchEndedAt === "string")
    && (
      !("playerNames" in value)
      || (
        typeof value.playerNames === "object"
        && value.playerNames !== null
        && !Array.isArray(value.playerNames)
        && Object.values(value.playerNames).every((name: unknown) =>
          typeof name === "string"
        )
      )
    )
    && (
      !("playerPlaces" in value)
      || (
        typeof value.playerPlaces === "object"
        && value.playerPlaces !== null
        && !Array.isArray(value.playerPlaces)
        && Object.values(value.playerPlaces).every((place: unknown) =>
          typeof place === "number"
          && Number.isSafeInteger(place)
          && place > 0
        )
      )
    )
    && (
      !("winners" in value)
      || (
        Array.isArray(value.winners)
        && value.winners.every((winner: unknown) =>
          typeof winner === "object"
          && winner !== null
          && "playerId" in winner
          && typeof winner.playerId === "string"
          && "amount" in winner
          && typeof winner.amount === "number"
          && (
            !("hand" in winner)
            || winner.hand === undefined
            || typeof winner.hand === "string"
          )
        )
      )
    )
    && (
      !("revealedCards" in value)
      || value.revealedCards === undefined
      || (
        typeof value.revealedCards === "object"
        && value.revealedCards !== null
        && Object.values(value.revealedCards).every((cards: unknown) =>
          Array.isArray(cards)
          && cards.every((card: unknown) => typeof card === "string")
        )
      )
    );

  return playersAreValid && optionalFieldsAreValid;
}

function isPokerActionEvent(value: unknown): value is PokerActionEvent {
  return typeof value === "object"
    && value !== null
    && "playerId" in value
    && typeof value.playerId === "string"
    && "actionType" in value
    && (value.actionType === "FOLD"
      || value.actionType === "CHECK"
      || value.actionType === "CALL"
      || value.actionType === "RAISE")
    && "amount" in value
    && typeof value.amount === "number";
}

function isSuccessfulPokerSyncResponse(
  value: unknown,
): value is {
  ok: true;
  state: PublicGameState | null;
  cards: string[];
} {
  return typeof value === "object"
    && value !== null
    && "ok" in value
    && value.ok === true
    && "state" in value
    && (value.state === null || isPublicGameState(value.state))
    && "cards" in value
    && Array.isArray(value.cards)
    && value.cards.every((card: unknown) => typeof card === "string");
}

function isPlayersLoadedEvent(
  value: unknown,
): value is GameEvent.players_loaded.to_client.payload {
  return typeof value === "object"
    && value !== null
    && "tableSessionId" in value
    && typeof value.tableSessionId === "string"
    && "readyCount" in value
    && typeof value.readyCount === "number"
    && "playerCount" in value
    && typeof value.playerCount === "number"
    && "allPlayersLoaded" in value
    && typeof value.allPlayersLoaded === "boolean"
    && "shouldAutoStartFirstHand" in value
    && typeof value.shouldAutoStartFirstHand === "boolean";
}

interface PrivateCardsEvent {
  tableSessionId: string;
  handId: string;
  cards: string[];
}

function getUserIdFromToken(token?: string): string | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    if (
      typeof decoded === "object"
      && decoded !== null
      && "sub" in decoded
      && typeof decoded.sub === "string"
    ) {
      return decoded.sub;
    }
  } catch {
    return null;
  }

  return null;
}

export default function Page() {
  const router = useRouter();
  const {
    socket,
    isConnected,
    accessToken,
    connectionError,
  } = useGameSocket();
  const [tableSessionId, setTableSessionId] = useState("");
  const [lobbyStatus, setLobbyStatus] = useState<GetLobbyPublicDto | null>(null);
  const [lobbyStatusError, setLobbyStatusError] = useState("");
  const [lobbyStatusRefresh, setLobbyStatusRefresh] = useState(0);
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [myCards, setMyCards] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("");
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [showHandInfo, setShowHandInfo] = useState(false);
  const [error, setError] = useState("");
  const [tableInput, setTableInput] = useState("");
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [allPlayersLoaded, setAllPlayersLoaded] = useState(false);
  const [isWaitingToStartFirstHand, setIsWaitingToStartFirstHand] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [language, setLanguage] = useState<GameLanguage>("en");
  const userId = getUserIdFromToken(accessToken);
  const isHost = lobbyStatus?.details.hostUserId === userId;
  const dictionary = language === "en" ? enDictionary.game : thDictionary.game;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryTableId = params.get("tableSessionId") ?? params.get("roomPinId") ?? "";
    const savedTableId = window.sessionStorage.getItem("gameTableSessionId") ?? "";
    const initialTableId = queryTableId || savedTableId;
    setTableSessionId(initialTableId);
    setTableInput(initialTableId);
  }, []);

  useEffect(() => {
    if (!socket || !tableSessionId) return;

    const onState = (state: PublicGameState) => {
      if (!isPublicGameState(state)) {
        setError("The server sent an invalid game state.");
        setIsSendingAction(false);
        return;
      }
      if (state.tableSessionId === tableSessionId) {
        setGameState(state);
        setError("");
        setIsSendingAction(false);
        setIsWaitingToStartFirstHand(false);
        if (
          state.matchComplete
          && state.playerPlaces
          && state.totalHandsPlayed !== undefined
          && state.matchStartedAt
          && state.matchEndedAt
          && window.location.pathname !== "/game/history"
        ) {
          window.sessionStorage.setItem(
            "gameMatchHistory",
            JSON.stringify({
              tableSessionId: state.tableSessionId,
              totalHandsPlayed: state.totalHandsPlayed,
              matchStartedAt: state.matchStartedAt,
              matchEndedAt: state.matchEndedAt,
              playerPlaces: state.playerPlaces,
              playerNames: state.playerNames ?? {},
            }),
          );
          router.push("/game/history");
        }
      }
    };
    const onAction = (action: PokerActionEvent) => {
      if (!isPokerActionEvent(action)) {
        setError("The server sent an invalid player action.");
        setIsSendingAction(false);
        return;
      }
      const player = gameState?.players.find(
        ({ playerId }) => playerId === action.playerId,
      );
      const playerName = action.playerId === userId
        ? "You"
        : player
          ? `Player ${(player.seatNumber ?? gameState?.players.indexOf(player) ?? 0) + 1}`
          : "A player";
      const actionLabel = action.actionType.toLowerCase();
      setLastAction(
        `${playerName} ${actionLabel}${action.amount > 0 ? ` ${action.amount}` : ""}`,
      );
    };
    const onPrivateCards = (event: PrivateCardsEvent) => {
      if (event.tableSessionId === tableSessionId) {
        setMyCards(event.cards);
      }
    };
    const onSocketException = (exception: unknown) => {
      const message = typeof exception === "string"
        ? exception
        : typeof exception === "object"
          && exception !== null
          && "message" in exception
          && typeof exception.message === "string"
            ? exception.message
            : "The server rejected the game request.";
      setError(message);
      setIsSendingAction(false);
      setIsWaitingToStartFirstHand(false);
    };
    //socket.on("poker:state", onState);
    //socket.on("poker:action", onAction);
    //socket.on("poker:private-cards", onPrivateCards);
    //socket.on("exception", onSocketException);

    socket.on(PokerEvent.state.to_client.event_name, onState);
    socket.on(PokerEvent.action.to_client.event_name, onAction);
    socket.on(PokerEvent.private_cards.to_client.event_name, onPrivateCards);
    socket.on("exception", onSocketException);

    return () => {
      //socket.off("poker:state", onState);
      //socket.off("poker:action", onAction);
      //socket.off("poker:private-cards", onPrivateCards);
      socket.off(PokerEvent.state.to_client.event_name, onState);
      socket.off(PokerEvent.action.to_client.event_name, onAction);
      socket.off(PokerEvent.private_cards.to_client.event_name, onPrivateCards);
      socket.off("exception", onSocketException);
    };
  }, [gameState?.players, router, socket, tableSessionId, userId]);

  useEffect(() => {
    setAllPlayersLoaded(false);
    setIsWaitingToStartFirstHand(false);
  }, [tableSessionId]);

  useEffect(() => {
    if (!socket || !isConnected || !tableSessionId) return;

    socket.timeout(10_000).emit(
      PokerEvent.sync.to_server.event_name,
      { tableSessionId },
      (timeoutError: Error | null, response: unknown) => {
        if (timeoutError) {
          setError("The server did not respond while loading the current hand.");
          return;
        }

        if (!isSuccessfulPokerSyncResponse(response)) {
          const message = typeof response === "object"
            && response !== null
            && "message" in response
            && typeof response.message === "string"
            ? response.message
            : "The server returned an invalid current-hand response.";
          setError(message);
          return;
        }

        if (response.state && response.state.tableSessionId !== tableSessionId) {
          setError("The server returned a hand for a different table.");
          return;
        }

        setGameState(response.state);
        setMyCards(response.cards);
        setError("");
      },
    );
  }, [isConnected, lobbyStatusRefresh, socket, tableSessionId]);

  useEffect(() => {
    if (!socket || !isConnected || !tableSessionId) return;

    const applyPlayersLoaded = (response: unknown) => {
      if (!isPlayersLoadedEvent(response)) {
        setError("The server sent an invalid player readiness status.");
        return;
      }
      if (response.tableSessionId !== tableSessionId) return;

      setAllPlayersLoaded(response.allPlayersLoaded);
      setIsWaitingToStartFirstHand(response.shouldAutoStartFirstHand);
    };
    const onPlayersLoaded = (response: unknown) => {
      applyPlayersLoaded(response);
    };

    socket.on(GameEvent.players_loaded.to_client.event_name, onPlayersLoaded);
    const reportLoaded = () => {
      socket.emit(
        GameEvent.players_loaded.to_server.event_name,
        { tableSessionId },
        applyPlayersLoaded,
      );
    };
    reportLoaded();
    const intervalId = isHost && !allPlayersLoaded
      ? window.setInterval(reportLoaded, 1_000)
      : null;

    return () => {
      socket.off(GameEvent.players_loaded.to_client.event_name, onPlayersLoaded);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [allPlayersLoaded, isConnected, isHost, socket, tableSessionId]);

  useEffect(() => {
    if (!gameState?.currentPlayerId || !gameState.actionDeadlineAt) return;

    setCurrentTime(Date.now());
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [gameState?.actionDeadlineAt, gameState?.currentPlayerId]);

  useEffect(() => {
    if (!tableSessionId) {
      setLobbyStatus(null);
      setLobbyStatusError("");
      return;
    }

    setLobbyStatus(null);
    setLobbyStatusError("");
    if (!isConnected) return;

    let active = true;
    const checkLobbyStatus = async () => {
      try {
        const response = await fetch(
          `/api/game/lobby?lobbyPinId=${encodeURIComponent(tableSessionId)}`,
          { cache: "no-store" },
        );
        const body: GetLobbyPublicDto = (await response.json()) as GetLobbyPublicDto;
        if (!response.ok) {
          const message = typeof body === "object"
            && body !== null
            && "message" in body
            && typeof body.message === "string"
            ? body.message
            : `Lobby status check failed (${response.status}).`;
          throw new Error(message);
        }

        if (active) {
          setLobbyStatus(body);
          setLobbyStatusError("");
        }
      } catch (statusError) {
        if (active) {
          setLobbyStatusError(
            statusError instanceof Error
              ? statusError.message
              : "Could not check lobby status.",
          );
        }
      }
    };

    void checkLobbyStatus();
    const intervalId = window.setInterval(() => {
      void checkLobbyStatus();
    }, 5_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isConnected, lobbyStatusRefresh, tableSessionId]);

  const myPlayer = gameState?.players.find(
    (player) => player.playerId === userId,
  );
  const isMyTurn = Boolean(
    isConnected
    && myPlayer
    && gameState?.currentPlayerId === userId
    && !isSendingAction,
  );
  const callAmount = Math.max(
    0,
    (gameState?.currentBet ?? 0) - (myPlayer?.roundContribution ?? 0),
  );
  const isHandInProgress = Boolean(gameState && !gameState.settled);
  const actionSecondsLeft = gameState?.actionDeadlineAt
    ? Math.max(
      0,
      Math.ceil((Date.parse(gameState.actionDeadlineAt) - currentTime) / 1000),
    )
    : null;

  const createLobby = async () => {
    setIsCreatingLobby(true);
    setError("");
    setSuccessMessage("");
    try {
      const sendBody: LobbyUserCreateDto = {
        generalSettings: {},
        gameSettings: {}
      }
      const response = await fetch("/api/game/lobby/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sendBody)
      });
      const body: LobbyDto = (await response.json()) as LobbyDto;
      if (!response.ok) {
        const message = typeof body === "object"
          && body !== null
          && "message" in body
          && typeof body.message === "string"
          ? body.message
          : `Lobby creation failed (${response.status}).`;
        throw new Error(message);
      }

      //if (
      //  typeof body !== "object"
      //  || body === null
      //  || !("roomPinId" in body)
      //  || typeof body.roomPinId !== "string"
      //) {
      //  throw new Error("Lobby response did not contain a roomPinId.");
      //}

      const newTableId = body.details.roomPinId;
      setTableInput(newTableId);
      setTableSessionId(newTableId);
      setGameState(null);
      setMyCards([]);
      setLastAction("");
      setIsSendingAction(false);
      window.sessionStorage.setItem("gameTableSessionId", newTableId);
      window.history.replaceState(
        null,
        "",
        `/game?tableSessionId=${encodeURIComponent(newTableId)}`,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Lobby creation failed.",
      );
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const joinLobby = async () => {
    if (!isConnected) {
      setError("Connect to the game server before joining a lobby.");
      return;
    }
    if (!/^\d{6}$/.test(tableSessionId)) {
      setError("Enter a valid six-digit lobby ID first.");
      return;
    }

    setIsJoiningLobby(true);
    setError("");
    setSuccessMessage("");
    try {
      const sendBody: JoinLobbyDto = {
        lobbyPinId: tableSessionId,
        password: joinPassword ? joinPassword : undefined,
        isSpectator: false
      }
      const response = await fetch("/api/game/lobby/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendBody)
      });
      if (!response.ok) {
        const body: unknown = await response.json();
        const message = typeof body === "object"
          && body !== null
          && "message" in body
          && typeof body.message === "string"
          ? body.message
          : `Joining lobby failed (${response.status}).`;
        throw new Error(message);
      }

      setJoinPassword("");
      setSuccessMessage("Joined lobby as a player.");
      setLobbyStatusRefresh((refresh) => refresh + 1);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Joining lobby failed.",
      );
    } finally {
      setIsJoiningLobby(false);
    }
  };

  const sendAction = (
    actionType: PokerActionType,
    amount?: number,
  ) => {
    if (!socket || !tableSessionId || !isMyTurn) return;
    setIsSendingAction(true);
    setError("");
    //socket.emit("poker:action", { tableSessionId, actionType, amount });
    const payload: PokerEvent.action.to_server.payload = {
      tableSessionId: tableSessionId,
      actionType: actionType,
      amount: amount
    }
    socket.emit(PokerEvent.action.to_server.event_name, payload);
  };

  return (
    <main className="min-h-screen w-full bg-radial from-green-900 via-green-950 via-55% to-black flex justify-center items-center relative overflow-hidden text-white">
      <div className="absolute top-4 left-4 z-70 rounded bg-black/70 px-4 py-2 text-sm">
        <form
          className="mb-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const nextTableId = tableInput.trim();
            if (!nextTableId) return;
            window.sessionStorage.setItem("gameTableSessionId", nextTableId);
            setTableSessionId(nextTableId);
            setGameState(null);
            setMyCards([]);
            setLastAction("");
            setIsSendingAction(false);
            setError("");
            window.history.replaceState(
              null,
              "",
              `/game?tableSessionId=${encodeURIComponent(nextTableId)}`,
            );
          }}
        >
          <label className="sr-only" htmlFor="table-session-id">Table ID</label>
          <input
            id="table-session-id"
            value={tableInput}
            onChange={(event) => setTableInput(event.target.value)}
            placeholder="Enter lobby roomPinId"
            className="w-52 rounded border border-white/30 bg-black px-2 py-1 text-white"
          />
          <button
            type="submit"
            disabled={!tableInput.trim()}
            className="rounded bg-sky-700 px-3 py-1 disabled:opacity-50"
          >
            Set table
          </button>
        </form>
        <p>Table: {tableSessionId || "Enter your lobby roomPinId above"}</p>
        {tableSessionId && !gameState && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={joinLobby}
              disabled={!isConnected || isJoiningLobby || !/^\d{6}$/.test(tableSessionId)}
              className="rounded bg-sky-700 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isJoiningLobby ? "Joining..." : "Join as player"}
            </button>
          </div>
        )}
        {tableSessionId && (
          <p aria-live="polite">
            Lobby members:{" "}
            {lobbyStatus
              ? `${lobbyStatus.details.currentPlayerCount 
                  ?? 0}/${lobbyStatus.gameSettings?.maxPlayer 
                  ?? "?"} players · ${lobbyStatus.details.currentSpectatorCount 
                  ?? 0}/${lobbyStatus.gameSettings?.maxSpectator ?? "?"} spectators${lobbyStatus.details.roomStatus ? ` · ${lobbyStatus.details.roomStatus}` : ""}`
              : lobbyStatusError
                ? "Status unavailable"
                : isConnected
                  ? "Checking lobby members..."
                  : "Connect to check lobby members"}
          </p>
        )}
        {tableSessionId && (
          <p aria-live="polite">
            {!allPlayersLoaded
              ? "Waiting for all players to load the game..."
              : isWaitingToStartFirstHand
                ? "All players loaded. Starting the first hand in 5 seconds..."
                : "All players loaded."}
          </p>
        )}
        {lobbyStatusError && (
          <p role="status" className="text-amber-200">{lobbyStatusError}</p>
        )}
        <button
          type="button"
          onClick={createLobby}
          disabled={!isConnected || isCreatingLobby}
          className="mt-2 rounded bg-emerald-700 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreatingLobby ? "Creating lobby..." : "Create lobby"}
        </button>
        <p>
          {!socket
            ? "Preparing connection..."
            : isConnected
              ? "Connected"
              : connectionError
                ? `Connection failed: ${connectionError}`
                : "Connecting..."}
        </p>
        {gameState && (
          <p>
            {gameState.round}
            {gameState.roundNumber && !gameState.settled
              ? ` · Round ${gameState.roundNumber}/4`
              : ""}
            {gameState.cycleNumber
              ? ` · Cycle ${gameState.cycleNumber}, hand ${gameState.handNumber ?? 1}`
              : ""}
          </p>
        )}
        {gameState?.currentPlayerId && actionSecondsLeft !== null && (
          <p aria-live="polite">
            {gameState.currentPlayerId === userId ? "Your action" : "Player action"}
            {" · "}
            {actionSecondsLeft}s remaining
          </p>
        )}
        {lastAction && <p aria-live="polite">Last action: {lastAction}</p>}
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {successMessage && (
          <p role="status" className="text-emerald-300">{successMessage}</p>
        )}
      </div>

      <GameTable
        gameState={gameState}
        userId={userId}
        myCards={myCards}
        isHandInProgress={isHandInProgress}
        isMyTurn={isMyTurn}
        callAmount={callAmount}
        dictionary={dictionary}
        onAction={sendAction}
      />

      <div className="fixed top-[3vh] right-[3vw] flex gap-2">
        <button
          type="button"
          onClick={() => setLanguage((current) => current === "en" ? "th" : "en")}
          aria-label={language === "en"
            ? enDictionary.game.switchToThaiLabel
            : thDictionary.game.switchToEnglishLabel}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black"
        >
          {language === "en"
            ? enDictionary.game.switchToThai
            : thDictionary.game.switchToEnglish}
        </button>
        <button
          type="button"
          onClick={() => setShowHandInfo((visible) => !visible)}
          className="px-[1.2vw] py-[1.2vh] aspect-square text-[1.2vw] bg-sky-500 rounded-full font-bold uppercase text-white cursor-pointer hover:bg-white hover:text-black active:translate-y-0.5"
        >
          ?
        </button>
      </div>
      {showHandInfo && (
        <HandInfo handleHandInfo={() => setShowHandInfo(false)} />
      )}
    </main>
  );
}
