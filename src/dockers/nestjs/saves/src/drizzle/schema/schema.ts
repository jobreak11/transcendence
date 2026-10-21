import { defineRelations } from 'drizzle-orm'
import { chat_messages } from './chat_messages/chat_messages.schema.js'
import { chat_rooms } from './chat_rooms/chat_rooms.schema.js'
import { friendships } from './friendships.schema.js'
import { titles } from './titles.schema.js'
import { user_titles } from './user_titles.schema.js'
import { users } from './users/users.schema.js'
import { user_profiles } from './user_profiles/user_profiles.schema.js'
import { chat_room_members } from './chat_room_members/chat_room_members.schema.js'

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
    user_profiles
  },
  (r) => ({
    users: {
      user_titles: r.many.user_titles(),
      chat_messages: r.many.chat_messages(),
      chat_room_members: r.many.chat_room_members(),
      user_profile: r.one.user_profiles({
        from: r.users.id,
        to: r.user_profiles.userId
      }),
      friendshipsRequested: r.many.friendships({
        alias: "requester"
      }),
      friendshipsReceived: r.many.friendships({
        alias: "addressee"
      })
    },

    user_profiles: {
      user: r.one.users({
        from: r.user_profiles.userId,
        to: r.users.id
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

    titles: {
      user_titles: r.many.user_titles()
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
  friendships,
  chat_rooms,
  chat_room_members,
  chat_messages,
  titles,
  dbRelations,
}