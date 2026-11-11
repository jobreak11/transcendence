import type { components } from "./api.js";

export type CreateUserDto = components['schemas']['CreateUserDto'];
export type LoginDto = components['schemas']['LoginDto'];
export type LoginSuccessResponseDto = components['schemas']['LoginSuccessResponseDto']
export type RefreshTokenSuccessDto = components['schemas']['RefreshTokenSuccessDto'];

export type ChatRoomDto = components['schemas']['ChatRoomDto'];
export type ChatMessageDto = components['schemas']['ChatMessageDto'];

export type UpdateUserDto = components['schemas']['UpdateUserDto'];

export type LobbyUserCreateDto = components['schemas']['LobbyUserCreateDto'];
export type LobbyDto = components['schemas']['LobbyDto'];
export type JoinLobbyDto = components['schemas']['JoinLobbyDto']
export type GetLobbyPublicDto = components['schemas']['GetLobbyPublicDto'];

export type ChatRoomMemberDto = components['schemas']['ChatRoomMemberDto'];

export type FindAllFriendshipsDto = components['schemas']['FindAllFriendshipsDto'];
export type GetUserProfileDto = components['schemas']['GetUserProfileDto'];

