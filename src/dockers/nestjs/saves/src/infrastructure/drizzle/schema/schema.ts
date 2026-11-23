import { defineRelations } from 'drizzle-orm'
import { chat_messages } from './chat_messages/chat_messages.schema.js'
import { chat_rooms } from './chat_rooms/chat_rooms.schema.js'
import { friendships } from './friendships.schema.js'
import { titles } from './titles.schema.js'
import { user_titles } from './user_titles.schema.js'
import { users } from './users/users.schema.js'
import { user_profiles } from './user_profiles/user_profiles.schema.js'
import { chat_room_members } from './chat_room_members/chat_room_members.schema.js'
import { game_matches } from './game_matches/game_matches.schema.js'
import { user_game_matches } from './user_game_matches/user_game_matches.schema.js'
import { user_game_statistics } from './user_game_statistics/user_game_statistics.schema.js'
import { tournamentGroupPlayers, tournamentGroups, tournamentParticipants, tournamentRounds, tournaments } from './tournaments/tournaments.schema.js'
import { trophies } from './throphies/trophies.schema.js'
import { achievements } from './achievements/achievements.schema.js'
import { user_achievements } from './user_achievements/user_achievements.schema.js'
import { user_trophies } from './user_trophies/user_trophies.schema.js'
import { user_api_keys } from './user_api_keys/user_api_keys.schema.js'
import { optional } from 'zod'

//export * from './users.schema.js'
//export * from './friendships.schema.js'
//export * from "./chat_rooms.schema.js"
//export * from "./chat_room_members.schema.js"
//export * from "./chat_messages.schema.js"
//export * from "./titles.schema.js"
//export * from "./user_titles.schema.js"

export const dbRelations = defineRelations(
  {
    users,
    friendships,
    chat_rooms,
    chat_room_members,
    chat_messages,
    titles,
    user_titles,
    user_profiles,
    trophies,
    achievements,
    user_achievements,
    user_trophies,
    game_matches,
    user_game_matches,
    user_game_statistics,
    tournaments,
    tournamentParticipants,
    tournamentRounds,
    tournamentGroups,
    tournamentGroupPlayers,
    user_api_keys
  },
  (r) => ({
    users: {
      user_titles: r.many.user_titles(),
      chat_messages: r.many.chat_messages(),
      chat_room_members: r.many.chat_room_members(),
      user_game_matches: r.many.user_game_matches(),
      user_trophies: r.many.user_trophies(),
      user_achievements: r.many.user_achievements(),
      user_profile: r.one.user_profiles({
        from: r.users.id,
        to: r.user_profiles.userId,
        optional: false
      }),
      user_game_statistic: r.one.user_game_statistics({
        from: r.users.id,
        to: r.user_game_statistics.userId
      }),
      friendshipsRequested: r.many.friendships({
        alias: "requester"
      }),
      friendshipsReceived: r.many.friendships({
        alias: "addressee"
      }),
      user_api_keys: r.many.user_api_keys()
    },
    
    user_api_keys: {
      user: r.one.users({
        from: r.user_api_keys.userId,
        to: r.users.id,
        optional: false
      })
    },

    user_profiles: {
      user: r.one.users({
        from: r.user_profiles.userId,
        to: r.users.id,
        optional: false
      }),
      active_title: r.one.titles({
        from: r.user_profiles.activeTitleId,
        to: r.titles.id
      })
    },

    user_game_statistics: {
      user: r.one.users({
        from: r.user_game_statistics.userId,
        to: r.users.id,
        optional: false
      })
    },


    chat_messages: {
      user: r.one.users({
        from: r.chat_messages.userId,
        to: r.users.id
      }),

      chat_room: r.one.chat_rooms({
        from: r.chat_messages.chatRoomId,
        to: r.chat_rooms.id
      })
    },

    user_trophies: {
      user: r.one.users({
        from: r.user_trophies.userId,
        to: r.users.id,
        optional: false,
      }),
      trophy: r.one.trophies({
        from: r.user_trophies.trophyId,
        to: r.trophies.id,
        optional: false,
      })
    },

    user_titles: {
      user: r.one.users({
        from: r.user_titles.userId,
        to: r.users.id
      }),
      title: r.one.titles({
        from: r.user_titles.titleId,
        to: r.titles.id
      })
    },

    user_achievements: {
      user: r.one.users({
        from: r.user_achievements.userId,
        to: r.users.id,
        optional: false,
      }),
      achievement: r.one.achievements({
        from: r.user_achievements.achievementId,
        to: r.achievements.id,
        optional: false,
      })
    },

    achievements: {
      user_achievements: r.many.user_achievements(),
      title: r.one.titles({
        from: r.achievements.titleId,
        to: r.titles.id,
      }),
      trophy: r.one.trophies({
        from: r.achievements.trophyId,
        to: r.trophies.id
      })
    },

    titles: {
      user_titles: r.many.user_titles()
    },

    trophies: {
      user_trophies: r.many.user_trophies()
    },

    chat_room_members: {
      user: r.one.users({
        from: r.chat_room_members.userId,
        to: r.users.id
      }),
      chat_room: r.one.chat_rooms({
        from: r.chat_room_members.chatRoomId,
        to: r.chat_rooms.id
      })

    },

    user_game_matches: {
      user: r.one.users({
        from: r.user_game_matches.userId,
        to: r.users.id
      }),
      game_match: r.one.game_matches({
        from: r.user_game_matches.gameMatchId,
        to: r.game_matches.id
      })
    },

    game_matches: {
      user_game_matches: r.many.user_game_matches(),
    },

    chat_rooms: {
      chat_room_members: r.many.chat_room_members(),
      chat_messages: r.many.chat_messages(),
    },

    friendships: {
      requester: r.one.users({
        from: r.friendships.requesterUserId,
        to: r.users.id,
        alias: "requester"
      }),
      addressee: r.one.users({
        from: r.friendships.addresseeUserId,
        to: r.users.id,
        alias: "addressee"
      })

    }

  })
)

export const dbSchema = {
  users,
  user_titles,
  user_profiles,
  user_api_keys,
  friendships,
  chat_rooms,
  chat_room_members,
  chat_messages,
  titles,
  trophies,
  achievements,
  user_achievements,
  user_trophies,
  game_matches,
  user_game_matches,
  user_game_statistics,
  tournaments,
  tournamentParticipants,
  tournamentRounds,
  tournamentGroups,
  tournamentGroupPlayers,
  dbRelations,
}
