import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis.provider.js';
import type { RedisClient } from '../redis.provider.js';
import { redis_user_game_client_socket_list, redis_user_game_room_list, redis_user_lobby_list, redis_user_main_client_socket_list } from './namespaces/user.namespace.js';
import { REDIS_USER_GAME_CLIENT_SOCKET_LIMIT, REDIS_USER_GAME_ROOM_LIMIT, REDIS_USER_LOBBY_LIST_LIMIT, REDIS_USER_MAIN_CLIENT_SOCKET_LIMIT } from './user-redis.constants.js';

@Injectable()
export class UserRedisService implements OnModuleInit {

  private readonly logger = new Logger(UserRedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async onModuleInit() {
    
  }

  // might pop the old client socket out for the gateway to use
  addGameClientSocketList(userId: string, clientSocketId: string) {
    return this.redis.sortedSetFIFOWithLimitAdd(
      redis_user_game_client_socket_list(userId),
      clientSocketId,
      REDIS_USER_GAME_CLIENT_SOCKET_LIMIT,
      Date.now()
    )
  }

  // might pop the old client socket out for the gateway to use
  addMainClientSocketList(userId :string, clientSocketId: string) {
    return this.redis.sortedSetFIFOWithLimitAdd(
      redis_user_main_client_socket_list(userId),
      clientSocketId,
      REDIS_USER_MAIN_CLIENT_SOCKET_LIMIT,
      Date.now()
    )
  }

  // return true false whether adding new lobby is successful
  async addNewLobby(userId: string, lobbyPinId: string) {
    const res = await this.redis.setWithLimitAdd(
      redis_user_lobby_list(userId),
      lobbyPinId,
      REDIS_USER_LOBBY_LIST_LIMIT
    )

    if (res === 0) {
      return true;
    }
    return false;
  }

  async addNewGameRoom(userId: string, gameRoomId: string) {
    const res = await this.redis.setWithLimitAdd(
      redis_user_game_room_list(userId),
      gameRoomId,
      REDIS_USER_GAME_ROOM_LIMIT
    )

    if (res === 0) {
      return true;
    }
    return false;
  }

  // get amount of lobby the user is currently in
  getUserLobbyList(userId: string) {
    return this.redis.smembers(redis_user_lobby_list(userId));
  }

  getUserGameRoomList(userId: string) {
    return this.redis.smembers(redis_user_game_room_list(userId));
  }

  getMainClientSocketList(userId: string) {
    return this.redis.zrange(redis_user_main_client_socket_list(userId), 0, "-1");
  }

  getGameClientSocketList(userId: string) {
    return this.redis.zrange(redis_user_game_client_socket_list(userId), 0, "-1");
  }

  // remove target Socket Id from the list
  removeMainClientSocket(userId: string, clientSocketId: string) {
    return this.redis.zrem(redis_user_main_client_socket_list(userId), clientSocketId);
  }

  // remove target Socket Id from the list
  removeGameClientSocket(userId: string, clientSocketId: string) {
    return this.redis.zrem(redis_user_game_client_socket_list(userId), clientSocketId);
  }

  removeUserLobbyList(userId: string, lobbyPinId: string) {
    return this.redis.srem(redis_user_lobby_list(userId), lobbyPinId);
  }

  removeUserGameRoomList(userId: string, gameRoomId: string) {
    return this.redis.srem(redis_user_game_room_list(userId), gameRoomId);
  }

  // check whether user is online or not via client socket list
  async isUserOnline(userId: string) {
    const res = await this.redis.exists(redis_user_main_client_socket_list(userId));

    if (res === 0) {
      return false
    }
    return true;
  }

  async isUserInLobby(userId: string, lobbyPinId: string) {

    const res = await this.redis.sismember(redis_user_lobby_list(userId), lobbyPinId);

    if (res === 0) {
      return false
    }
    return true;
  }

}
