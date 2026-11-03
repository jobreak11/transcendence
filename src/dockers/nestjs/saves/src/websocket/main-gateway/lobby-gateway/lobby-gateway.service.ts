import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Server } from "socket.io";
import { LobbyRedisService } from "../../../redis/lobby-redis/lobby-redis.service.js";
import { room_main_lobby_specific } from "../rooms/lobby.room.js";
import { event_main_lobby_member_notify, event_main_lobby_user_ready } from "../events/lobby.event.js";
import { UserReadyToClientDto } from "./dtos/user-ready.dto.js";
import { room_main_private_user } from "../rooms/user.room.js";
import { ModuleRef } from "@nestjs/core";
import { LobbyMemberNofifyType, LobbyMemberNotifyRole, LobbyMemberNotifyToClientDto } from "./dtos/member-notify.dto.js";
import { response } from "express";

@Injectable()
export class LobbyGatewayService implements OnModuleInit {

  private readonly logger = new Logger(LobbyGatewayService.name);
  private server: Server | null = null;

  private lobbyRedisService!: LobbyRedisService;

  setServer(server: Server) {
    this.server = server;
  }

  constructor(
    private readonly moduleRef: ModuleRef,
  ) {
  }

  onModuleInit() {
    this.lobbyRedisService = this.moduleRef.get(LobbyRedisService, {
      strict: false
    });
  }

  async userReady(userId: string, lobbyPinId: string) {
    const res = await this.lobbyRedisService.toggleReady(userId, lobbyPinId);

    const response: UserReadyToClientDto = {
      lobbyPinId: lobbyPinId,
      userId: userId,
      isReady: res,
      createdAt: new Date()
    }
    // emit event corresponse to the response
    this.server?.to(room_main_lobby_specific(lobbyPinId))
      .emit(event_main_lobby_user_ready.to_client(), response);
  }

  private JoinOrLeaveLobbySession(
    isJoin: boolean,
    userId: string,
    lobbyPinId: string,
    role: LobbyMemberNotifyRole
  ) {

    if (isJoin === true) {
      this.server?.in(room_main_private_user(userId)).socketsJoin(
        room_main_lobby_specific(lobbyPinId)
      )

      const response: LobbyMemberNotifyToClientDto = {
        lobbyPinId: lobbyPinId,
        userId: userId,
        role: role,
        status: LobbyMemberNofifyType.MEMBER_JOIN
      }

      this.server?.to(room_main_lobby_specific(lobbyPinId))
        .emit(event_main_lobby_member_notify.to_client(), response);

    }
    else {
      this.server?.in(room_main_private_user(userId)).socketsLeave(
        room_main_lobby_specific(lobbyPinId)
      )

      const response: LobbyMemberNotifyToClientDto = {
        lobbyPinId: lobbyPinId,
        userId: userId,
        role: role,
        status: LobbyMemberNofifyType.MEMBER_LEAVE
      }

      this.server?.to(room_main_lobby_specific(lobbyPinId))
        .emit(event_main_lobby_member_notify.to_client(), response);

    }

  }
  joinLobbySession(userId: string, lobbyPinId: string, role: LobbyMemberNotifyRole) {
    this.JoinOrLeaveLobbySession(true, userId, lobbyPinId, role);
  }
  leaveLobbySession(userId: string, lobbyPinId: string, role: LobbyMemberNotifyRole) {
    this.JoinOrLeaveLobbySession(false, userId, lobbyPinId, role);
  }

  memberNotifyChangeHost(hostUserId: string, lobbyPinId: string, role: LobbyMemberNotifyRole) {
    const response: LobbyMemberNotifyToClientDto = {
      lobbyPinId: lobbyPinId,
      role: role,
      userId: hostUserId,
      status: LobbyMemberNofifyType.MEMBER_CHANGE_HOST
    }

    this.server?.to(room_main_lobby_specific(lobbyPinId))
      .emit(event_main_lobby_member_notify.to_client(), response);
  }

  memberNotifyChangeRole(userId: string, lobbyPinId: string, role: LobbyMemberNotifyRole) {
    const response: LobbyMemberNotifyToClientDto = {
      lobbyPinId: lobbyPinId,
      role: role,
      userId: userId,
      status: LobbyMemberNofifyType.MEMBER_CHANGE_ROLE
    }

    this.server?.to(room_main_lobby_specific(lobbyPinId))
      .emit(event_main_lobby_member_notify.to_client(), response);
  }





}