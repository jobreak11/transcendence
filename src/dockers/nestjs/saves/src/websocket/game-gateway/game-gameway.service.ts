import { Inject, Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import { REDIS_CLIENT, type RedisClient } from '../../redis/redis.provider.js';
import { redis_lobby_game_settings, redis_lobby_general_settings, redis_lobby_global_details_lobby_lists, redis_lobby_player_member_list } from '../../redis/lobby-redis/namespaces/lobby.namespace.js';
import { shuffleDeck } from '../../game/tools/shuffle.js';
import { room_main_private_user } from '../main-gateway/rooms/user.room.js';
type BettingRound = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER';
type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE';

interface MatchProgress {
  cycleNumber: number;
  handNumber: number;
  cyclePlayerIds: string[];
  bigBlindPlayerIds: string[];
  cycleComplete: boolean;
}

export interface PlayerActionInput {
  playerId: string;
  tableSessionId: string;
  actionType: ActionType;
  amount?: number;
  timedOut?: boolean;
}

interface PokerPlayer {
  playerId: string;
  seatNumber: number;
  stack: number;
  roundContribution: number;
  totalContribution: number;
  holeCards: string[];
  folded: boolean;
  allIn: boolean;
}

interface PokerState {
  handId: string;
  tableSessionId: string;
  cycleNumber: number;
  handNumber: number;
  round: BettingRound;
  deck: string[];
  poolCards: string[];
  players: PokerPlayer[];
  buttonIndex: number;
  currentPlayerId: string | null;
  currentBet: number;
  lastRaiseSize: number;
  ante: number;
  smallBlind: number;
  bigBlind: number;
  pot: number;
  pendingPlayerIds: string[];
  startedAt: string;
  actionDeadlineAt: string;
}

interface HandRank {
  score: number[];
  label: string;
}

interface HandPayout {
  player: PokerPlayer;
  amount: number;
}

const ACTIVE_HAND_TTL_SECONDS = 24 * 60 * 60;
const PLAYER_ACTION_TIMEOUT_MS = 10_000;
const LOCK_TTL_MS = 15_000;
const ROUND_ORDER: BettingRound[] = [
  'PREFLOP',
  'FLOP',
  'TURN',
  'RIVER',
];
const HAND_LABELS = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];

function isMatchProgress(value: unknown): value is MatchProgress {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const progress = value as Record<string, unknown>;
  return typeof progress.cycleNumber === 'number'
    && Number.isSafeInteger(progress.cycleNumber)
    && progress.cycleNumber >= 1
    && typeof progress.handNumber === 'number'
    && Number.isSafeInteger(progress.handNumber)
    && progress.handNumber >= 0
    && Array.isArray(progress.cyclePlayerIds)
    && progress.cyclePlayerIds.every((id: unknown) => typeof id === 'string')
    && Array.isArray(progress.bigBlindPlayerIds)
    && progress.bigBlindPlayerIds.every((id: unknown) => typeof id === 'string')
    && typeof progress.cycleComplete === 'boolean';
}

@Injectable()
export class GameGatewayService {
  private readonly logger = new Logger(GameGatewayService.name);
  private server: Server | null = null;
  private readonly actionTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async startHand(tableSessionId: string, requesterId: string) {
    return this.withTableLock(tableSessionId, async () => {
      const server = this.requireServer();
      const lobbyExists = await this.redis.sismember(
        redis_lobby_global_details_lobby_lists(),
        tableSessionId,
      );
      if (lobbyExists !== 1) {
        throw new WsException('Table does not exist');
      }

      const [generalSettings, gameSettings, seatedPlayerIds] = await Promise.all([
        this.redis.hgetall(redis_lobby_general_settings(tableSessionId)),
        this.redis.hgetall(redis_lobby_game_settings(tableSessionId)),
        this.redis.zrange(
          redis_lobby_player_member_list(tableSessionId),
          '0',
          '-1',
        ),
      ]);

      if (generalSettings.hostUserId !== requesterId) {
        throw new WsException('Only the table host can start a hand');
      }
      if (await this.redis.get(this.handKey(tableSessionId))) {
        throw new WsException('A hand is already in progress');
      }

      const startingStack = this.getStartingStack(gameSettings);
      const stackKey = this.stackKey(tableSessionId);
      const existingStacks = await this.redis.hgetall(stackKey);
      const players = seatedPlayerIds
        .map((playerId, seatNumber) => ({
          playerId,
          seatNumber,
          stack: this.readStack(existingStacks[playerId], startingStack),
          roundContribution: 0,
          totalContribution: 0,
          holeCards: [],
          folded: false,
          allIn: false,
        }))
        .filter((player) => player.stack > 0);

      if (players.length < 2) {
        throw new WsException('At least two players with chips are required');
      }

      const matchProgress = await this.prepareMatchProgress(
        tableSessionId,
        players.map(({ playerId }) => playerId),
      );
      const bigBlind = this.getBigBlind(gameSettings);
      const ante = this.getAnte(gameSettings, bigBlind);
      const smallBlind = Math.max(1, Math.floor(bigBlind / 2));
      const buttonSequence = await this.redis.incr(
        this.buttonKey(tableSessionId),
      );
      const buttonIndex = (buttonSequence - 1) % players.length;
      const smallBlindIndex = players.length === 2
        ? buttonIndex
        : (buttonIndex + 1) % players.length;
      const bigBlindIndex = (smallBlindIndex + 1) % players.length;

      const state: PokerState = {
        handId: randomUUID(),
        tableSessionId,
        cycleNumber: matchProgress.cycleNumber,
        handNumber: matchProgress.handNumber + 1,
        round: 'PREFLOP',
        deck: shuffleDeck(),
        poolCards: [],
        players,
        buttonIndex,
        currentPlayerId: null,
        currentBet: bigBlind,
        lastRaiseSize: bigBlind,
        ante,
        smallBlind,
        bigBlind,
        pot: 0,
        pendingPlayerIds: [],
        startedAt: new Date().toISOString(),
        actionDeadlineAt: new Date(Date.now() + PLAYER_ACTION_TIMEOUT_MS).toISOString(),
      };

      for (let cardRound = 0; cardRound < 2; cardRound += 1) {
        for (let nextSeat = 0; nextSeat < state.players.length; nextSeat += 1) {
          const playerIndex = (smallBlindIndex + nextSeat) % state.players.length;
          const player = state.players[playerIndex];
          if (!player) {
            throw new WsException('Unable to deal a card to a player');
          }
          player.holeCards.push(state.deck.pop()!);
        }
      }
      matchProgress.handNumber = state.handNumber;
      matchProgress.bigBlindPlayerIds = matchProgress.bigBlindPlayerIds
        .filter((playerId) => playerId !== state.players[bigBlindIndex].playerId);

      if (ante > 0) {
        for (const player of state.players) {
          this.postAnte(state, player, ante);
        }
      }
      this.postBlind(state, smallBlindIndex, smallBlind);
      this.postBlind(state, bigBlindIndex, bigBlind);
      state.currentBet = Math.max(
        ...state.players.map(({ roundContribution }) => roundContribution),
      );
      state.pendingPlayerIds = this.actionablePlayers(state).map(
        (player) => player.playerId,
      );
      state.currentPlayerId = this.nextPendingPlayer(
        state,
        bigBlindIndex,
        true,
      );

      await this.saveState(state);
      await this.saveStacks(state);
      await this.saveMatchProgress(tableSessionId, matchProgress);
      await server.in(state.players.map((player) =>
        room_main_private_user(player.playerId),
      )).socketsJoin(this.tableRoom(tableSessionId));

      for (const player of state.players) {
        server.to(room_main_private_user(player.playerId)).emit(
          'poker:private-cards',
          {
            tableSessionId,
            handId: state.handId,
            cards: player.holeCards,
          },
        );
      }
      while (this.shouldAdvanceRoundWithoutAction(state)) {
        const nextRoundIndex = ROUND_ORDER.indexOf(state.round) + 1;
        if (nextRoundIndex >= ROUND_ORDER.length) {
          return this.finishHand(state, this.settleShowdown(state), true);
        }
        this.dealNextRound(state, ROUND_ORDER[nextRoundIndex]);
        state.pendingPlayerIds = this.actionablePlayers(state).map(
          ({ playerId }) => playerId,
        );
      }
      this.emitState(state);
      return this.publicState(state);
    });
  }

  async playerTurn(input: PlayerActionInput) {
    return this.withTableLock(input.tableSessionId, async () => {
      const state = await this.loadState(input.tableSessionId);
      const player = state.players.find(({ playerId }) =>
        playerId === input.playerId,
      );
      if (!player || player.folded || player.allIn) {
        throw new WsException('Player is not active in this hand');
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new WsException('It is not this player’s turn');
      }
      if (
        input.timedOut
        && Date.parse(state.actionDeadlineAt) > Date.now()
      ) {
        this.scheduleActionTimeout(state);
        return;
      }

      const action: PlayerActionInput = Date.parse(state.actionDeadlineAt) <= Date.now()
        ? {
            playerId: input.playerId,
            tableSessionId: input.tableSessionId,
            actionType: 'FOLD',
          }
        : input;
      const chipsAdded = this.applyAction(state, player, action);
      const livePlayers = state.players.filter(({ folded }) => !folded);

      if (livePlayers.length === 1) {
        return this.finishHand(
          state,
          [{ player: livePlayers[0], amount: state.pot }],
          false,
        );
      }

      if (action.actionType === 'RAISE' && chipsAdded > 0
        && player.roundContribution > state.currentBet) {
        state.lastRaiseSize = player.roundContribution - state.currentBet;
        state.currentBet = player.roundContribution;
        state.pendingPlayerIds = this.actionablePlayers(state)
          .filter(({ playerId }) => playerId !== player.playerId)
          .map(({ playerId }) => playerId);
      } else {
        state.pendingPlayerIds = state.pendingPlayerIds.filter(
          (playerId) => playerId !== player.playerId,
        );
      }

      let advancedRound = false;
      while (this.shouldAdvanceRoundWithoutAction(state)) {
        const nextRoundIndex = ROUND_ORDER.indexOf(state.round) + 1;
        if (nextRoundIndex >= ROUND_ORDER.length) {
          return this.finishHand(state, this.settleShowdown(state), true);
        }
        this.dealNextRound(state, ROUND_ORDER[nextRoundIndex]);
        state.pendingPlayerIds = this.actionablePlayers(state).map(
          ({ playerId }) => playerId,
        );
        advancedRound = true;
      }

      state.currentPlayerId = this.nextPendingPlayer(
        state,
        advancedRound
          ? state.buttonIndex
          : state.players.findIndex(({ playerId }) =>
            playerId === player.playerId,
          ),
        false,
      );
      state.actionDeadlineAt = new Date(
        Date.now() + PLAYER_ACTION_TIMEOUT_MS,
      ).toISOString();
      await this.saveState(state);
      await this.saveStacks(state);

      const response = {
        action: {
          playerId: player.playerId,
          actionType: action.actionType,
          amount: chipsAdded,
        },
        state: this.publicState(state),
      };
      this.requireServer()
        .to(this.tableRoom(state.tableSessionId))
        .emit('poker:action', response.action);
      this.emitState(state);
      return response;
    });
  }

  private applyAction(
    state: PokerState,
    player: PokerPlayer,
    input: PlayerActionInput,
  ): number {
    const callAmount = Math.max(0, state.currentBet - player.roundContribution);

    if (input.actionType === 'FOLD') {
      player.folded = true;
      return 0;
    }

    if (input.actionType === 'CHECK') {
      if (callAmount > 0) {
        throw new WsException('Cannot check while facing a bet');
      }
      return 0;
    }

    if (input.actionType === 'CALL') {
      if (callAmount === 0) {
        throw new WsException('Nothing to call; check instead');
      }
      return this.commitChips(state, player, Math.min(callAmount, player.stack));
    }

    const amount = input.amount;
    if (amount === undefined || amount > player.stack) {
      throw new WsException('Raise amount exceeds the player’s stack');
    }

    const resultingBet = player.roundContribution + amount;
    const raiseBy = resultingBet - state.currentBet;
    if (raiseBy < 0) {
      if (amount !== player.stack) {
        throw new WsException('Raise must at least match the current bet');
      }
      return this.commitChips(state, player, amount);
    }
    if (raiseBy === 0) {
      throw new WsException('Raise must increase the current bet');
    }
    if (raiseBy < state.lastRaiseSize && amount < player.stack) {
      throw new WsException('Raise is smaller than the minimum raise');
    }

    return this.commitChips(state, player, amount);
  }

  private commitChips(
    state: PokerState,
    player: PokerPlayer,
    amount: number,
  ): number {
    player.stack -= amount;
    player.roundContribution += amount;
    player.totalContribution += amount;
    state.pot += amount;
    player.allIn = player.stack === 0;
    return amount;
  }

  private postBlind(state: PokerState, playerIndex: number, blind: number) {
    const player = state.players[playerIndex];
    this.commitChips(state, player, Math.min(blind, player.stack));
  }

  private postAnte(state: PokerState, player: PokerPlayer, ante: number) {
    const contribution = Math.min(ante, player.stack);
    player.stack -= contribution;
    player.totalContribution += contribution;
    state.pot += contribution;
    player.allIn = player.stack === 0;
  }

  private dealNextRound(
    state: PokerState,
    round: BettingRound,
  ) {
    state.round = round;
    state.currentBet = 0;
    state.lastRaiseSize = state.bigBlind;
    for (const player of state.players) {
      player.roundContribution = 0;
    }

    if (round === 'FLOP') {
      state.deck.pop();
      state.poolCards.push(
        state.deck.pop()!,
        state.deck.pop()!,
        state.deck.pop()!,
      );
    } else {
      state.deck.pop();
      state.poolCards.push(state.deck.pop()!);
    }

    state.currentPlayerId = this.nextPendingPlayer(
      state,
      state.buttonIndex,
      false,
    );
  }

  private async finishHand(
    state: PokerState,
    payouts: HandPayout[],
    revealCards: boolean,
  ) {
    this.clearActionTimer(state.tableSessionId);
    for (const payout of payouts) {
      payout.player.stack += payout.amount;
    }

    await this.saveStacks(state);
    const matchProgress = await this.loadMatchProgress(state.tableSessionId);
    const [seatedPlayerIds, stacks] = await Promise.all([
      this.redis.zrange(
        redis_lobby_player_member_list(state.tableSessionId),
        '0',
        '-1',
      ),
      this.redis.hgetall(this.stackKey(state.tableSessionId)),
    ]);
    const activePlayerIds = new Set(
      seatedPlayerIds.filter((playerId) =>
        this.readStack(stacks[playerId], 0) > 0,
      ),
    );
    matchProgress.cyclePlayerIds = matchProgress.cyclePlayerIds.filter(
      (playerId) => activePlayerIds.has(playerId),
    );
    matchProgress.bigBlindPlayerIds = matchProgress.bigBlindPlayerIds.filter(
      (playerId) => activePlayerIds.has(playerId),
    );
    matchProgress.cycleComplete = matchProgress.bigBlindPlayerIds.length === 0;
    await this.saveMatchProgress(state.tableSessionId, matchProgress);
    await this.redis.del(this.handKey(state.tableSessionId));

    const winningPayouts = payouts.filter(({ amount }) => amount > 0);
    const result = {
      settled: true,
      handId: state.handId,
      tableSessionId: state.tableSessionId,
      matchId: state.tableSessionId,
      cycleNumber: state.cycleNumber,
      handNumber: state.handNumber,
      round: 'SHOWDOWN' as const,
      roundNumber: 5,
      cycleComplete: matchProgress.cycleComplete,
      poolCards: state.poolCards,
      pot: state.pot,
      ante: state.ante,
      winners: winningPayouts.map(({ player, amount }) => ({
        playerId: player.playerId,
        amount,
        hand: revealCards
          ? this.bestHand(player.holeCards, state.poolCards).label
          : undefined,
      })),
      revealedCards: revealCards
        ? Object.fromEntries(
          state.players
            .filter(({ folded }) => !folded)
            .map(({ playerId, holeCards }) => [playerId, holeCards]),
        )
        : undefined,
      players: state.players.map(({ playerId, stack, folded, allIn }) => ({
        playerId,
        stack,
        folded,
        allIn,
      })),
    };

    this.requireServer()
      .to(this.tableRoom(state.tableSessionId))
      .emit('poker:state', result);
    this.logger.log(`Hand ${state.handId} settled for table ${state.tableSessionId}`);
    return result;
  }

  private settleShowdown(state: PokerState): HandPayout[] {
    const contributionLevels = [...new Set(
      state.players
        .map(({ totalContribution }) => totalContribution)
        .filter((amount) => amount > 0),
    )].sort((left, right) => left - right);
    const payouts = new Map<string, HandPayout>();
    let previousLevel = 0;

    for (const level of contributionLevels) {
      const contributors = state.players.filter(
        ({ totalContribution }) => totalContribution >= level,
      );
      const alivePlayers = contributors.filter(({ folded }) => !folded);
      const layerAmount = (level - previousLevel) * contributors.length;
      previousLevel = level;
      if (alivePlayers.length === 0) {
        throw new WsException('Cannot settle a pot layer without an alive player');
      }

      const winners = this.bestPlayers(alivePlayers, state.poolCards);
      const orderedWinners = [...winners].sort(
        (left, right) => left.seatNumber - right.seatNumber,
      );
      const share = Math.floor(layerAmount / orderedWinners.length);
      let remainder = layerAmount % orderedWinners.length;
      for (const player of orderedWinners) {
        const payout = payouts.get(player.playerId) ?? { player, amount: 0 };
        payout.amount += share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder -= 1;
        payouts.set(player.playerId, payout);
      }
    }
    return [...payouts.values()];
  }

  private bestPlayers(players: PokerPlayer[], board: string[]): PokerPlayer[] {
    let bestScore: number[] | null = null;
    const winners: PokerPlayer[] = [];
    for (const player of players) {
      const hand = this.bestHand(player.holeCards, board);
      const comparison = bestScore === null
        ? 1
        : this.compareScores(hand.score, bestScore);
      if (comparison > 0) {
        bestScore = hand.score;
        winners.splice(0, winners.length, player);
      } else if (comparison === 0) {
        winners.push(player);
      }
    }
    return winners;
  }

  private bestHand(cards: string[], board: string[]): HandRank {
    const allCards = [...cards, ...board];
    let best: HandRank | null = null;
    for (let a = 0; a < allCards.length - 4; a += 1) {
      for (let b = a + 1; b < allCards.length - 3; b += 1) {
        for (let c = b + 1; c < allCards.length - 2; c += 1) {
          for (let d = c + 1; d < allCards.length - 1; d += 1) {
            for (let e = d + 1; e < allCards.length; e += 1) {
              const candidate = this.rankFive([
                allCards[a],
                allCards[b],
                allCards[c],
                allCards[d],
                allCards[e],
              ]);
              if (!best || this.compareScores(candidate.score, best.score) > 0) {
                best = candidate;
              }
            }
          }
        }
      }
    }
    if (!best) {
      throw new WsException('Cannot evaluate a hand before the river');
    }
    return best;
  }

  private rankFive(cards: string[]): HandRank {
    const ranks = cards
      .map((card) => this.cardRank(card))
      .sort((left, right) => right - left);
    const flush = cards.every((card) => card.slice(-1) === cards[0].slice(-1));
    const uniqueRanks = [...new Set(ranks)];
    let straightHigh = 0;
    if (uniqueRanks.length === 5) {
      if (uniqueRanks[0] - uniqueRanks[4] === 4) {
        straightHigh = uniqueRanks[0];
      } else if (uniqueRanks.join(',') === '14,5,4,3,2') {
        straightHigh = 5;
      }
    }
    const counts = [...new Set(ranks)]
      .map((rank) => ({ rank, count: ranks.filter((value) => value === rank).length }))
      .sort((left, right) =>
        right.count - left.count || right.rank - left.rank,
      );

    let score: number[];
    if (flush && straightHigh) {
      score = [8, straightHigh];
    } else if (counts[0].count === 4) {
      score = [7, counts[0].rank, counts[1].rank];
    } else if (counts[0].count === 3 && counts[1].count === 2) {
      score = [6, counts[0].rank, counts[1].rank];
    } else if (flush) {
      score = [5, ...ranks];
    } else if (straightHigh) {
      score = [4, straightHigh];
    } else if (counts[0].count === 3) {
      score = [3, counts[0].rank, ...counts.slice(1).map(({ rank }) => rank)];
    } else if (counts[0].count === 2 && counts[1].count === 2) {
      score = [
        2,
        counts[0].rank,
        counts[1].rank,
        counts[2].rank,
      ];
    } else if (counts[0].count === 2) {
      score = [1, counts[0].rank, ...counts.slice(1).map(({ rank }) => rank)];
    } else {
      score = [0, ...ranks];
    }
    return { score, label: HAND_LABELS[score[0]] };
  }

  private cardRank(card: string): number {
    const value = card.slice(0, -1);
    const namedRanks: Record<string, number> = {
      T: 10,
      J: 11,
      Q: 12,
      K: 13,
      A: 14,
    };
    return namedRanks[value] ?? Number(value);
  }

  private compareScores(left: number[], right: number[]): number {
    for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
      const difference = (left[index] ?? 0) - (right[index] ?? 0);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  private actionablePlayers(state: PokerState): PokerPlayer[] {
    return state.players.filter(
      ({ folded, allIn }) => !folded && !allIn,
    );
  }

  private shouldAdvanceRoundWithoutAction(state: PokerState): boolean {
    if (state.pendingPlayerIds.length === 0) return true;

    const actionablePlayers = this.actionablePlayers(state);
    if (actionablePlayers.length === 0) return true;
    if (actionablePlayers.length !== 1) return false;

    const [onlyPlayer] = actionablePlayers;
    return state.currentBet <= onlyPlayer.roundContribution;
  }

  private nextPendingPlayer(
    state: PokerState,
    fromIndex: number,
    includeStartingIndex: boolean,
  ): string | null {
    const length = state.players.length;
    const firstOffset = includeStartingIndex ? 0 : 1;
    for (let offset = firstOffset; offset <= length; offset += 1) {
      const player = state.players[(fromIndex + offset) % length];
      if (
        player
        && !player.folded
        && !player.allIn
        && state.pendingPlayerIds.includes(player.playerId)
      ) {
        return player.playerId;
      }
    }
    return null;
  }

  private publicState(state: PokerState) {
    return {
      handId: state.handId,
      tableSessionId: state.tableSessionId,
      matchId: state.tableSessionId,
      cycleNumber: state.cycleNumber,
      handNumber: state.handNumber,
      round: state.round,
      roundNumber: ROUND_ORDER.indexOf(state.round) + 1,
      poolCards: state.poolCards,
      pot: state.pot,
      currentBet: state.currentBet,
      ante: state.ante,
      smallBlind: state.smallBlind,
      bigBlind: state.bigBlind,
      currentPlayerId: state.currentPlayerId,
      actionDeadlineAt: state.actionDeadlineAt,
      buttonPlayerId: state.players[state.buttonIndex]?.playerId,
      players: state.players.map(({
        playerId,
        seatNumber,
        stack,
        roundContribution,
        folded,
        allIn,
      }) => ({
        playerId,
        seatNumber,
        stack,
        roundContribution,
        folded,
        allIn,
      })),
      startedAt: state.startedAt,
    };
  }

  private emitState(state: PokerState) {
    this.requireServer()
      .to(this.tableRoom(state.tableSessionId))
      .emit('poker:state', this.publicState(state));
    this.scheduleActionTimeout(state);
  }

  private scheduleActionTimeout(state: PokerState) {
    this.clearActionTimer(state.tableSessionId);
    if (!state.currentPlayerId) return;

    const delay = Math.max(0, Date.parse(state.actionDeadlineAt) - Date.now());
    const timer = setTimeout(() => {
      this.actionTimers.delete(state.tableSessionId);
      void this.playerTurn({
        playerId: state.currentPlayerId!,
        tableSessionId: state.tableSessionId,
        actionType: 'FOLD',
        timedOut: true,
      }).catch((error: unknown) => {
        if (error instanceof WsException) {
          if (error.message === 'Table is processing another game action') {
            const retry = setTimeout(() => {
              this.actionTimers.delete(state.tableSessionId);
              this.scheduleActionTimeout(state);
            }, 250);
            this.actionTimers.set(state.tableSessionId, retry);
            return;
          }
          this.logger.debug(
            `Skipped expired action for table ${state.tableSessionId}: ${error.message}`,
          );
          return;
        }
        this.logger.error(
          `Failed to apply expired action for table ${state.tableSessionId}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, delay);
    this.actionTimers.set(state.tableSessionId, timer);
  }

  private clearActionTimer(tableSessionId: string) {
    const timer = this.actionTimers.get(tableSessionId);
    if (timer) clearTimeout(timer);
    this.actionTimers.delete(tableSessionId);
  }

  private async saveState(state: PokerState) {
    await this.redis.set(
      this.handKey(state.tableSessionId),
      JSON.stringify(state),
      'EX',
      ACTIVE_HAND_TTL_SECONDS,
    );
  }

  private async prepareMatchProgress(
    tableSessionId: string,
    activePlayerIds: string[],
  ): Promise<MatchProgress> {
    const progress = await this.loadMatchProgress(tableSessionId);
    const activeIds = new Set(activePlayerIds);

    if (progress.cycleComplete) {
      progress.cycleNumber += 1;
      progress.handNumber = 0;
      progress.cyclePlayerIds = [];
      progress.bigBlindPlayerIds = [];
      progress.cycleComplete = false;
    }

    if (progress.handNumber === 0) {
      progress.cyclePlayerIds = [...activePlayerIds];
      progress.bigBlindPlayerIds = [...activePlayerIds];
      return progress;
    }

    progress.cyclePlayerIds = progress.cyclePlayerIds.filter(
      (playerId) => activeIds.has(playerId),
    );
    progress.bigBlindPlayerIds = progress.bigBlindPlayerIds.filter(
      (playerId) => activeIds.has(playerId),
    );

    if (progress.bigBlindPlayerIds.length === 0) {
      progress.cycleNumber += 1;
      progress.handNumber = 0;
      progress.cyclePlayerIds = [...activePlayerIds];
      progress.bigBlindPlayerIds = [...activePlayerIds];
      return progress;
    }

    const knownPlayerIds = new Set(progress.cyclePlayerIds);
    for (const playerId of activePlayerIds) {
      if (!knownPlayerIds.has(playerId)) {
        progress.cyclePlayerIds.push(playerId);
        progress.bigBlindPlayerIds.push(playerId);
      }
    }

    return progress;
  }

  private async loadMatchProgress(
    tableSessionId: string,
  ): Promise<MatchProgress> {
    const stored = await this.redis.get(this.matchProgressKey(tableSessionId));
    if (!stored) {
      return {
        cycleNumber: 1,
        handNumber: 0,
        cyclePlayerIds: [],
        bigBlindPlayerIds: [],
        cycleComplete: false,
      };
    }

    const progress: unknown = JSON.parse(stored);
    if (!isMatchProgress(progress)) {
      throw new Error(`Invalid poker match progress for table ${tableSessionId}`);
    }
    return progress;
  }

  private async saveMatchProgress(
    tableSessionId: string,
    progress: MatchProgress,
  ) {
    await this.redis.set(
      this.matchProgressKey(tableSessionId),
      JSON.stringify(progress),
    );
  }

  private async loadState(tableSessionId: string): Promise<PokerState> {
    const stored = await this.redis.get(this.handKey(tableSessionId));
    if (!stored) {
      throw new WsException('No active hand for this table');
    }
    const state = JSON.parse(stored) as PokerState;
    if (!Number.isFinite(Date.parse(state.actionDeadlineAt))) {
      state.actionDeadlineAt = new Date(
        Date.now() + PLAYER_ACTION_TIMEOUT_MS,
      ).toISOString();
      await this.saveState(state);
    }
    return state;
  }

  private async saveStacks(state: PokerState) {
    const values = Object.fromEntries(
      state.players.map(({ playerId, stack }) => [playerId, String(stack)]),
    );
    await this.redis.hset(this.stackKey(state.tableSessionId), values);
  }

  private getStartingStack(settings: Record<string, string>): number {
    const configured = Number(settings.startingChips);
    if (Number.isSafeInteger(configured) && configured > 0) {
      return configured;
    }
    const defaults: Record<string, number> = {
      BEGINNER: 2000,
      PRO: 5000,
      TURBO: 5000,
      CUSTOM: 2000,
    };
    return defaults[settings.format] ?? 2000;
  }

  private getBigBlind(settings: Record<string, string>): number {
    const configured = Number(settings.bigBlind);
    if (Number.isSafeInteger(configured) && configured > 0) {
      return configured;
    }
    const defaults: Record<string, number> = {
      BEGINNER: 10,
      PRO: 50,
      TURBO: 100,
      CUSTOM: 10,
    };
    return defaults[settings.format] ?? 10;
  }

  private getAnte(settings: Record<string, string>, bigBlind: number): number {
    const configured = Number(settings.ante);
    if (
      settings.ante !== undefined
      && settings.ante.trim() !== ''
      && Number.isSafeInteger(configured)
      && configured >= 0
    ) {
      return configured;
    }

    const defaults: Record<string, number> = {
      BEGINNER: 0,
      PRO: 5,
      TURBO: 10,
      CUSTOM: Math.floor(bigBlind / 10),
    };
    return defaults[settings.format] ?? 0;
  }

  private readStack(value: string | undefined, startingStack: number): number {
    if (value === undefined) return startingStack;
    const stack = Number(value);
    return Number.isSafeInteger(stack) && stack >= 0 ? stack : startingStack;
  }

  private async withTableLock<T>(
    tableSessionId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const lockKey = `${this.handKey(tableSessionId)}:lock`;
    const token = randomUUID();
    const acquired = await this.redis.set(
      lockKey,
      token,
      'PX',
      LOCK_TTL_MS,
      'NX',
    );
    if (acquired !== 'OK') {
      throw new WsException('Table is processing another game action');
    }

    try {
      return await operation();
    } finally {
      await this.redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        token,
      );
    }
  }

  private requireServer(): Server {
    if (!this.server) {
      throw new Error('Poker gateway server has not initialized');
    }
    return this.server;
  }

  private handKey(tableSessionId: string) {
    return `poker:table:${tableSessionId}:hand`;
  }

  private matchProgressKey(tableSessionId: string) {
    return `poker:table:${tableSessionId}:match-progress`;
  }

  private stackKey(tableSessionId: string) {
    return `poker:table:${tableSessionId}:stacks`;
  }

  private buttonKey(tableSessionId: string) {
    return `poker:table:${tableSessionId}:button`;
  }

  private tableRoom(tableSessionId: string) {
    return `poker:table:${tableSessionId}`;
  }
}
